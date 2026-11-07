import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { setApiSite } from './api';
import { mobileApi, Row } from './mobileApi';

type FloorState = { site: string; setSite: (site: string) => void; bootstrap: Row; leads: Row[];
  pagination: { page: number; limit: number; total: number; pages: number };
  notifications: Row[]; loading: boolean; error: string; refresh: () => Promise<void>;
  loadMore: () => Promise<void>; goToPage: (targetPage: number) => Promise<void>; hasMore: boolean; revision: number; isManager: boolean };
const Context = createContext<FloorState | null>(null);
export function FloorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <FloorStateProvider key={`${user?.email || 'signed-out'}:${user?.location || ''}`}>{children}</FloorStateProvider>;
}
function FloorStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const initialSite = user?.location && user.location !== 'BYD Dealership'
    ? user.location
    : (user?.allSites ? 'All Sites' : (user?.allowedSites?.[0] || 'BYD Melbourne City'));
  const [site, changeSite] = useState(initialSite);
  const [bootstrap, setBootstrap] = useState<Row>({});
  const [leads, setLeads] = useState<Row[]>([]), [notifications, setNotifications] = useState<Row[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const generation = useRef(0), inFlight = useRef<number | null>(null);
  const isManager = ['sales_manager', 'manager', 'site_admin', 'super_admin', 'admin', 'principal', 'bdc'].includes(user?.role || '');
  const setSite = useCallback((value: string) => {
    const validSite = value && value !== 'BYD Dealership' ? value : 'BYD Melbourne City';
    generation.current++; setApiSite(validSite); changeSite(validSite); setLeads([]); setNotifications([]); setBootstrap({});
  }, []);
  const refresh = useCallback(async () => {
    const effectiveSite = site && site !== 'BYD Dealership' ? site : initialSite;
    if (!user || !effectiveSite || inFlight.current === generation.current) return;
    const current = generation.current;
    setApiSite(effectiveSite); inFlight.current = current; setLoading(true);
    try {
      const results = await Promise.allSettled([mobileApi.bootstrap(), user.role === 'contractor' ? Promise.resolve({ rows: [], pagination: { pages: 1, total: 0, limit: 10 } }) : mobileApi.leads(1, '', 10), mobileApi.notifications()]);
      if (current !== generation.current) return;
      const [boot, customers, alerts] = results;
      if (boot.status === 'fulfilled') setBootstrap(boot.value);
      if (customers.status === 'fulfilled') {
        const rows = customers.value.rows || [];
        setLeads(rows);
        const p = customers.value.pagination || { page: 1, limit: 10, total: rows.length, pages: 1 };
        setPagination({ page: p.page || 1, limit: p.limit || 10, total: p.total || rows.length, pages: p.pages || 1 });
        setPage(p.page || 1);
        setHasMore((p.page || 1) < (p.pages || 1));
      }
      if (alerts.status === 'fulfilled') setNotifications(alerts.value);
      const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
      const cleanErrors = failures
        .map(result => result.reason?.message || '')
        .filter(msg => msg && !msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort'));
      setError(Array.from(new Set(cleanErrors)).join('\n'));
      setRevision(value => value + 1);
    } finally { if (inFlight.current === current) { inFlight.current = null; setLoading(false); } }
  }, [user, site, initialSite]);
  useEffect(() => {
    // Only refresh on mount and when app transitions back to active; no aggressive background polling timer
    void refresh();
  }, [refresh]);
  const loadMore = async () => {
    if (!hasMore || loading) return;
    const current = generation.current;
    setLoading(true);
    try { const result = await mobileApi.leads(page + 1, '', 10); if (current !== generation.current) return;
      const newRows = [...leads, ...result.rows.filter((row: Row) => !leads.some(old => String(old._id) === String(row._id)))];
      setLeads(newRows);
      const p = result.pagination || { page: page + 1, limit: 10, total: newRows.length, pages: page + 1 };
      setPagination(p);
      setPage(page + 1); setHasMore(page + 1 < (p.pages || 1));
    } catch (cause: any) {
      const msg = cause?.message || '';
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) setError(msg);
    } finally { setLoading(false); }
  };
  const goToPage = async (targetPage: number) => {
    if (loading || targetPage < 1) return;
    const current = generation.current;
    setLoading(true);
    try {
      const result = await mobileApi.leads(targetPage, '', 10);
      if (current !== generation.current) return;
      const rows = result.rows || [];
      setLeads(rows);
      const p = result.pagination || { page: targetPage, limit: 10, total: rows.length, pages: targetPage };
      setPagination({ page: targetPage, limit: p.limit || 10, total: p.total || rows.length, pages: p.pages || 1 });
      setPage(targetPage);
      setHasMore(targetPage < (p.pages || 1));
    } catch (cause: any) {
      const msg = cause?.message || '';
      if (!msg.toLowerCase().includes('cancel') && !msg.toLowerCase().includes('abort')) setError(msg);
    } finally {
      setLoading(false);
    }
  };
  return <Context.Provider value={{ site, setSite, bootstrap, leads, pagination, notifications, loading, error, refresh, loadMore, goToPage, hasMore, revision, isManager }}>{children}</Context.Provider>;
}
export function useFloor() { const value = useContext(Context); if (!value) throw new Error('Floor context unavailable.'); return value; }
export function useResource<T>(load: () => Promise<T>, key: string, initial: T) {
  const { revision } = useFloor();
  const loader = useRef(load);
  useEffect(() => { loader.current = load; });
  const [refreshKey, setRefreshKey] = useState(0);
  const fullKey = `${key}:${revision}:${refreshKey}`;
  const [snapshot, setSnapshot] = useState({ key, fullKey: '', data: initial, error: '' });
  useEffect(() => {
    let active = true;
    loader.current()
      .then(data => { if (active) setSnapshot({ key, fullKey, data, error: '' }); })
      .catch(cause => {
        if (active) {
          const msg = cause?.message || '';
          if (msg.toLowerCase().includes('cancel') || cause?.name === 'AbortError') return;
          setSnapshot(previous => ({ key, fullKey, data: previous.key === key ? previous.data : initial, error: msg }));
        }
      });
    return () => { active = false; };
  }, [fullKey]);
  return { data: snapshot.key === key ? snapshot.data : initial, loading: snapshot.fullKey !== fullKey,
    error: snapshot.key === key ? snapshot.error : '', reload: () => setRefreshKey(value => value + 1) };
}
