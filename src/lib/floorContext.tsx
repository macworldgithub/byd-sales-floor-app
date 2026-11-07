import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from './auth';
import { setApiSite } from './api';
import { mobileApi, Row } from './mobileApi';

type FloorState = { site: string; setSite: (site: string) => void; bootstrap: Row; leads: Row[]; notifications: Row[]; loading: boolean;
  error: string; refresh: () => Promise<void>; loadMore: () => Promise<void>; hasMore: boolean; revision: number; isManager: boolean };
const Context = createContext<FloorState | null>(null);
export function FloorProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <FloorStateProvider key={`${user?.email || 'signed-out'}:${user?.location || ''}`}>{children}</FloorStateProvider>;
}
function FloorStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [site, changeSite] = useState(user?.location || '');
  const [bootstrap, setBootstrap] = useState<Row>({});
  const [leads, setLeads] = useState<Row[]>([]), [notifications, setNotifications] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false), [error, setError] = useState(''), [revision, setRevision] = useState(0);
  const [page, setPage] = useState(1), [hasMore, setHasMore] = useState(false);
  const generation = useRef(0), inFlight = useRef<number | null>(null);
  const isManager = ['sales_manager', 'manager', 'site_admin', 'super_admin', 'admin', 'principal', 'bdc'].includes(user?.role || '');
  const setSite = useCallback((value: string) => { generation.current++; setApiSite(value); changeSite(value); setLeads([]); setNotifications([]); setBootstrap({}); }, []);
  const refresh = useCallback(async () => {
    if (!user || !site || inFlight.current === generation.current) return;
    const current = generation.current;
    setApiSite(site); inFlight.current = current; setLoading(true);
    try {
      const results = await Promise.allSettled([mobileApi.bootstrap(), user.role === 'contractor' ? Promise.resolve({ rows: [], pagination: { pages: 1 } }) : mobileApi.leads(), mobileApi.notifications()]);
      if (current !== generation.current) return;
      const [boot, customers, alerts] = results;
      if (boot.status === 'fulfilled') setBootstrap(boot.value);
      if (customers.status === 'fulfilled') { setLeads(customers.value.rows); setPage(1); setHasMore(customers.value.pagination?.pages > 1); }
      if (alerts.status === 'fulfilled') setNotifications(alerts.value);
      const failures = results.filter((result): result is PromiseRejectedResult => result.status === 'rejected');
      setError(failures.map(result => result.reason?.message || 'Unable to refresh.').join('\n'));
      setRevision(value => value + 1);
    } finally { if (inFlight.current === current) { inFlight.current = null; setLoading(false); } }
  }, [user, site]);
  useEffect(() => {
    void refresh();
    const timer = setInterval(() => { if (AppState.currentState === 'active') void refresh(); }, 30000);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => { clearInterval(timer); subscription.remove(); };
  }, [refresh]);
  const loadMore = async () => {
    if (!hasMore || loading) return;
    const current = generation.current;
    setLoading(true);
    try { const result = await mobileApi.leads(page + 1); if (current !== generation.current) return;
      setLeads(previous => [...previous, ...result.rows.filter(row => !previous.some(old => String(old._id) === String(row._id)))]);
      setPage(page + 1); setHasMore(page + 1 < result.pagination.pages);
    } catch (cause) { setError((cause as Error).message); } finally { setLoading(false); }
  };
  return <Context.Provider value={{ site, setSite, bootstrap, leads, notifications, loading, error, refresh, loadMore, hasMore, revision, isManager }}>{children}</Context.Provider>;
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
    loader.current().then(data => { if (active) setSnapshot({ key, fullKey, data, error: '' }); }).catch(cause => { if (active) setSnapshot(previous => ({ key, fullKey, data: previous.key === key ? previous.data : initial, error: cause.message })); });
    return () => { active = false; };
    // The key is the caller's explicit dependency list; inline initial values and
    // callbacks must not restart a request on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fullKey]);
  return { data: snapshot.key === key ? snapshot.data : initial, loading: snapshot.fullKey !== fullKey,
    error: snapshot.key === key ? snapshot.error : '', reload: () => setRefreshKey(value => value + 1) };
}
