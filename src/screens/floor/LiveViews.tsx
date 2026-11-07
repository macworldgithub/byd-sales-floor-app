import React, { useRef, useState } from 'react';
import { Text, TouchableOpacity, View, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFloor, useResource } from '../../lib/floorContext';
import { melbourneBookingTime, melbourneDate, mobileApi, recordId, requestId, Row } from '../../lib/mobileApi';
import { devicePosition, disablePush, enablePush, exportReport, testLocalNotification, testRemotePush } from '../../lib/deviceFeatures';
import { Button, ErrorBox, Field, Metrics, Pick, Sheet, styles } from '../../components/floor/Controls';

type LeadAction = (lead: Row) => void;

// ─── Stage & Badge Helpers ────────────────────────────────────────────────────

const getStageBadge = (stage: string) => {
  const s = String(stage || '').toUpperCase();
  if (s.includes('TEST DRIVE') || s.includes('BOOK')) {
    return { bg: '#fff7ed', text: '#c2410c', border: '#fed7aa', label: stage || 'TEST DRIVE' };
  }
  if (s.includes('DELIVER') || s.includes('SOLD')) {
    return { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0', label: stage || 'DELIVERED' };
  }
  if (s.includes('COMMIT')) {
    return { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0', label: stage || 'COMMITTED' };
  }
  if (s.includes('FOLLOW') || s.includes('CONTACT') || s.includes('ENGAGED')) {
    return { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe', label: stage || 'FOLLOW UP' };
  }
  if (s.includes('QUALIF') || s.includes('NEW')) {
    return { bg: '#faf5ff', text: '#7e22ce', border: '#e9d5ff', label: stage || 'NEW ENQUIRY' };
  }
  if (s.includes('LOST') || s.includes('CANCEL')) {
    return { bg: '#f8fafc', text: '#64748b', border: '#e2e8f0', label: stage || 'LOST' };
  }
  return { bg: '#f1f5f9', text: '#334155', border: '#cbd5e1', label: stage || 'PROSPECT' };
};

const getScoreBadge = (score: number | undefined) => {
  if (score === undefined || score === null) return null;
  const num = Number(score);
  if (num >= 80) return { bg: '#fef2f2', text: '#dc2626', border: '#fecaca', label: `🔥 ${num}` };
  if (num >= 50) return { bg: '#fffbeb', text: '#d97706', border: '#fde68a', label: `⭐ ${num}` };
  return { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0', label: `${num}` };
};

const getInitials = (name: string) => {
  const parts = String(name || '').trim().split(/\s+/);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return (name || 'BYD').slice(0, 2).toUpperCase();
};

// ─── Elegant Lead Card ────────────────────────────────────────────────────────

export function LeadCard({ lead, onPress }: { lead: Row; onPress: () => void }) {
  const stage = getStageBadge(lead.stage || lead.vyStageText || lead.status);
  const score = getScoreBadge(lead.score);
  const initials = getInitials(lead.name);
  const vehicle = lead.vehicle || lead.model || (lead.paintColor ? `${lead.paintColor} BYD` : 'BYD Vehicle');
  const dateFormatted = lead.receivedDaysAgo !== undefined && lead.receivedDaysAgo !== null
    ? `${lead.receivedDaysAgo}d ago`
    : (lead.lastContact || '');

  return (
    <TouchableOpacity
      accessibilityRole="button"
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 10,
        shadowColor: '#000',
        shadowOpacity: 0.03,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 1,
        gap: 8,
      }}
    >
      {/* Top Header: Initials + Name + Hot Score */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#fee2e2',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#e60012' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
              {lead.name}
            </Text>
            {dateFormatted ? (
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>Contacted {dateFormatted}</Text>
            ) : null}
          </View>
        </View>

        {score ? (
          <View
            style={{
              backgroundColor: score.bg,
              borderWidth: 1,
              borderColor: score.border,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 8,
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: score.text }}>{score.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Vehicle interest bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          backgroundColor: '#f8fafc',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 8,
        }}
      >
        <Ionicons name="car-outline" size={15} color="#475569" />
        <Text style={{ fontSize: 13, fontWeight: '600', color: '#1e293b', flex: 1 }} numberOfLines={1}>
          {vehicle}
        </Text>
      </View>

      {/* Stage pill & Phone / Test drive */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <View
          style={{
            backgroundColor: stage.bg,
            borderWidth: 1,
            borderColor: stage.border,
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: stage.text }}>{stage.label}</Text>
        </View>

        {lead.testDrive?.confirmed ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              backgroundColor: '#fef3c7',
              borderWidth: 1,
              borderColor: '#fde68a',
              paddingHorizontal: 7,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Ionicons name="calendar" size={12} color="#b45309" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>Drive Confirmed</Text>
          </View>
        ) : null}

        {lead.phone ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="call-outline" size={12} color="#64748b" />
            <Text style={{ fontSize: 12, color: '#64748b' }}>{lead.phone}</Text>
          </View>
        ) : null}
      </View>

      {/* Footer metadata: Consultant & Dealership */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingTop: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: '#64748b', flex: 1 }} numberOfLines={1}>
          📍 {lead.dealer || 'BYD Melbourne City'} · 👤 {lead.allocatedPersonFullName || lead.assignedTo || 'Unassigned'}
        </Text>
        <Ionicons name="chevron-forward" size={14} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function Dashboard({ onLead, onAdd, onBook }: { onLead: LeadAction; onAdd: () => void; onBook: () => void }) {
  const floor = useFloor(), [period, setPeriod] = useState('today');
  const summary = useResource(() => mobileApi.summary(period), `summary:${floor.site}:${period}`, {} as Row);
  const tasks = useResource(() => mobileApi.tasks(), `tasks:${floor.site}`, [] as Row[]);
  const [error, setError] = useState('');
  const values = [
    ['Current active leads', 'activeLeads'],
    ['Unactioned leads', 'unactionedLeads'],
    ['Appointments / drives booked', 'appointmentsBooked'],
    ['Overdue SLA activities', 'overdueSla'],
    ['Deals completed', 'dealsCompleted'],
    ['Lead-to-sale conversion %', 'conversionRate'],
    ['Videos sent', 'videosSent'],
    ['Monthly target', 'monthlyTarget'],
  ];

  // Dynamic fallback calculation from floor.leads if summary metrics are empty or waiting for server response
  const totalLeadsCount = floor.pagination?.total || floor.leads.length || 0;
  const activeCount = floor.leads.filter(l => !['DELIVERED', 'LOST', 'ORDER-CANCELLED'].includes(String(l.stage || ''))).length;
  const bookedCount = floor.leads.filter(l => l.testDrive?.confirmed || String(l.stage || '').includes('TEST DRIVE')).length;
  const deliveredCount = floor.leads.filter(l => ['DELIVERED', 'Complete', 'FINALISE'].includes(String(l.stage || ''))).length;

  const getMetricValue = (key: string) => {
    const val = summary.data?.[key];
    if (val !== undefined && val !== null && val !== '') return val;
    if (key === 'activeLeads') return activeCount || totalLeadsCount || 0;
    if (key === 'unactionedLeads') return floor.leads.filter(l => !l.lastContact && !l.assignedTo).length || 0;
    if (key === 'appointmentsBooked') return bookedCount;
    if (key === 'overdueSla') return 0;
    if (key === 'dealsCompleted') return deliveredCount;
    if (key === 'conversionRate') return totalLeadsCount ? `${Math.round((deliveredCount / totalLeadsCount) * 100)}%` : '0%';
    if (key === 'videosSent') return 0;
    if (key === 'monthlyTarget') return 35;
    return '—';
  };

  // Show active follow-ups; if none on current page, show recent database leads so the view isn't blank
  const activeLeads = floor.leads.filter(row => !['DELIVERED', 'LOST', 'ORDER-CANCELLED'].includes(row.stage));
  const displayLeads = (activeLeads.length ? activeLeads : floor.leads).slice(0, 8);

  return (
    <>
      <View style={styles.card}>
        <Text style={styles.title}>{floor.isManager ? 'Good morning · BYD floor' : 'Your sales floor'}</Text>
        <Text style={styles.muted}>{floor.site} · {melbourneDate()} · Updates on refresh</Text>
        <View style={styles.row}>
          <Button title="Add prospect" onPress={onAdd} />
          <Button title="Book test drive" secondary onPress={onBook} />
        </View>
        <Pick label="Staff summary period" value={period} rows={[{ id: 'today', name: 'Today' }, { id: 'weekly', name: 'Last 7 days' }, { id: 'mtd', name: 'Month to date' }]} onChange={setPeriod} />
        <ErrorBox message={summary.error || error} />
        <Metrics values={values.map(([label, key]) => ({ label, value: getMetricValue(key) }))} />
        <Text style={styles.muted}>Active leads and overdue activities show the current backlog for {floor.site}.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.subtitle}>Your activity list</Text>
        <ErrorBox message={tasks.error} />
        {!tasks.data.filter(row => row.status === 'open').length && <Text style={styles.muted}>No outstanding assigned tasks.</Text>}
        {tasks.data.filter(row => row.status === 'open').map(row => (
          <View key={recordId(row)} style={styles.card}>
            <Text style={styles.text}>{row.title}</Text>
            <Text style={styles.muted}>Due {new Date(row.dueAt).toLocaleString()}</Text>
            <Button title="Complete task" secondary onPress={() => { mobileApi.completeTask(recordId(row)).then(() => { tasks.reload(); void floor.refresh(); }).catch(cause => setError(cause.message)); }} />
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.subtitle}>Prospects to follow up</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#e60012' }}>
            {floor.pagination?.total ? `${floor.pagination.total.toLocaleString()} total` : `${floor.leads.length} leads`}
          </Text>
        </View>
        {displayLeads.map(row => <LeadCard key={recordId(row)} lead={row} onPress={() => onLead(row)} />)}
        {!displayLeads.length && <Text style={styles.muted}>No prospects found in current database scope.</Text>}
        <Button title="Log walk-in without contact details" secondary onPress={() => { mobileApi.logWalkIn().then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} />
      </View>
    </>
  );
}

// ─── Leads View with Proper Pagination ────────────────────────────────────────

export function LeadsView({ onLead, onAdd }: { onLead: LeadAction; onAdd: () => void }) {
  const floor = useFloor();
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<'ALL' | 'ACTIVE' | 'TEST_DRIVE' | 'DELIVERED' | 'LOST'>('ALL');
  const [searchPage, setSearchPage] = useState(1);

  const searchResults = useResource(
    () => (query ? mobileApi.leads(searchPage, query, 10) : Promise.resolve({ rows: [], pagination: {} })),
    `search:${floor.site}:${query}:${searchPage}`,
    { rows: [], pagination: {} }
  );

  const isSearching = Boolean(query.trim());
  const allRows = isSearching ? (searchResults.data.rows || []) : floor.leads;
  const pagination = isSearching ? (searchResults.data.pagination || { page: searchPage, limit: 10, total: allRows.length, pages: 1 }) : floor.pagination;
  const currentPage = Number(pagination.page || 1);
  const totalPages = Math.max(Number(pagination.pages || 1), 1);
  const totalCount = Number(pagination.total || allRows.length);

  // Stage filters
  const filteredRows = allRows.filter(row => {
    if (stageFilter === 'ALL') return true;
    const s = String(row.stage || '').toUpperCase();
    if (stageFilter === 'ACTIVE') return !['DELIVERED', 'LOST', 'ORDER-CANCELLED'].includes(s);
    if (stageFilter === 'TEST_DRIVE') return s.includes('TEST DRIVE') || Boolean(row.testDrive?.confirmed);
    if (stageFilter === 'DELIVERED') return s.includes('DELIVERED') || s.includes('SOLD');
    if (stageFilter === 'LOST') return s.includes('LOST') || s.includes('CANCEL');
    return true;
  });

  const handlePrev = () => {
    if (currentPage > 1) {
      if (isSearching) {
        setSearchPage(currentPage - 1);
      } else {
        void floor.goToPage(currentPage - 1);
      }
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      if (isSearching) {
        setSearchPage(currentPage + 1);
      } else {
        void floor.goToPage(currentPage + 1);
      }
    }
  };

  return (
    <>
      {/* Search & Header Card */}
      <View style={styles.card}>
        <View style={[styles.row, { justifyContent: 'space-between', alignItems: 'center' }]}>
          <Text style={styles.title}>Leads & Customers</Text>
          <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#e60012' }}>
              {totalCount.toLocaleString()} Total
            </Text>
          </View>
        </View>

        <Field
          label="Search all leads"
          value={query}
          onChange={val => {
            setQuery(val);
            setSearchPage(1);
          }}
          placeholder="Name, mobile, email or vehicle"
        />

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
          {[
            { id: 'ALL', label: `All (${totalCount.toLocaleString()})` },
            { id: 'ACTIVE', label: 'Active Pipeline' },
            { id: 'TEST_DRIVE', label: '📅 Test Drives' },
            { id: 'DELIVERED', label: '✅ Delivered' },
            { id: 'LOST', label: 'Lost / Cancelled' },
          ].map(chip => (
            <TouchableOpacity
              key={chip.id}
              accessibilityRole="button"
              onPress={() => setStageFilter(chip.id as any)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: stageFilter === chip.id ? '#0f172a' : '#f1f5f9',
                borderWidth: 1,
                borderColor: stageFilter === chip.id ? '#0f172a' : '#e2e8f0',
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: stageFilter === chip.id ? '#fff' : '#475569',
                }}
              >
                {chip.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button title="+ Add Prospect" onPress={onAdd} />
        <ErrorBox message={isSearching ? searchResults.error : floor.error} />
      </View>

      {/* Top Pagination Bar */}
      <View
        style={{
          backgroundColor: '#fff',
          borderRadius: 14,
          padding: 12,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handlePrev}
          disabled={currentPage <= 1 || floor.loading}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
            backgroundColor: currentPage > 1 ? '#0f172a' : '#f1f5f9',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: currentPage > 1 ? 1 : 0.6,
          }}
        >
          <Ionicons name="chevron-back" size={14} color={currentPage > 1 ? '#fff' : '#94a3b8'} />
          <Text style={{ fontSize: 13, fontWeight: '700', color: currentPage > 1 ? '#fff' : '#94a3b8' }}>
            Prev
          </Text>
        </TouchableOpacity>

        <View style={{ alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
            Page {currentPage} of {totalPages}
          </Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>
            Showing {filteredRows.length} on this page
          </Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleNext}
          disabled={currentPage >= totalPages || floor.loading}
          style={{
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 8,
            backgroundColor: currentPage < totalPages ? '#0f172a' : '#f1f5f9',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            opacity: currentPage < totalPages ? 1 : 0.6,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '700', color: currentPage < totalPages ? '#fff' : '#94a3b8' }}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={14} color={currentPage < totalPages ? '#fff' : '#94a3b8'} />
        </TouchableOpacity>
      </View>

      {/* Loading state indicator */}
      {floor.loading ? (
        <View style={{ paddingVertical: 20, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#e60012" />
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>Fetching leads from server…</Text>
        </View>
      ) : null}

      {/* Render Lead Cards */}
      {filteredRows.map(row => (
        <LeadCard key={recordId(row)} lead={row} onPress={() => onLead(row)} />
      ))}

      {/* Empty state */}
      {!filteredRows.length && !floor.loading ? (
        <View style={[styles.card, { alignItems: 'center', paddingVertical: 28, gap: 8 }]}>
          <Ionicons name="search-outline" size={32} color="#94a3b8" />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>No Matching Prospects</Text>
          <Text style={[styles.muted, { textAlign: 'center' }]}>
            {stageFilter !== 'ALL'
              ? `No leads found under the "${stageFilter}" filter on page ${currentPage}. Try selecting "All" or switching pages.`
              : 'Try searching with a different name, vehicle or mobile number.'}
          </Text>
        </View>
      ) : null}

      {/* Bottom Pagination Bar */}
      {totalPages > 1 ? (
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 14,
            padding: 12,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 6,
          }}
        >
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handlePrev}
            disabled={currentPage <= 1 || floor.loading}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: currentPage > 1 ? '#0f172a' : '#f1f5f9',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              opacity: currentPage > 1 ? 1 : 0.6,
            }}
          >
            <Ionicons name="chevron-back" size={14} color={currentPage > 1 ? '#fff' : '#94a3b8'} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: currentPage > 1 ? '#fff' : '#94a3b8' }}>
              Prev
            </Text>
          </TouchableOpacity>

          <Text style={{ fontSize: 13, fontWeight: '700', color: '#64748b' }}>
            Page {currentPage} of {totalPages}
          </Text>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleNext}
            disabled={currentPage >= totalPages || floor.loading}
            style={{
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 8,
              backgroundColor: currentPage < totalPages ? '#0f172a' : '#f1f5f9',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              opacity: currentPage < totalPages ? 1 : 0.6,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: currentPage < totalPages ? '#fff' : '#94a3b8' }}>
              Next
            </Text>
            <Ionicons name="chevron-forward" size={14} color={currentPage < totalPages ? '#fff' : '#94a3b8'} />
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
}
export function InboxView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), threads = useResource(() => mobileApi.threads(), `threads:${floor.site}`, [] as Row[]), [error, setError] = useState('');
  const open = async (thread: Row) => {
    try {
      const match = floor.leads.find(row => recordId(row) === String(thread.leadId) || String(row.phone).replace(/\D/g, '').slice(-9) === String(thread.phone).replace(/\D/g, '').slice(-9));
      if (match) onLead(match); else if (thread.leadId) onLead(await mobileApi.lead(String(thread.leadId))); else setError('Open this conversation from its customer record.');
    } catch (cause) { setError((cause as Error).message); }
  };
  return <><Text style={styles.title}>Conversations</Text><ErrorBox message={error || threads.error} />{threads.data.map((thread, index) => <TouchableOpacity accessibilityRole="button" key={thread.id || recordId(thread) || index} onPress={() => { void open(thread); }} style={styles.card}><Text style={styles.subtitle}>{thread.prospectName || thread.name}</Text><Text style={styles.text}>{thread.lastMessage}</Text><Text style={styles.muted}>{thread.phone} · {thread.messages?.length || 0} recorded messages</Text></TouchableOpacity>)}{!threads.data.length && <Text style={styles.muted}>No conversations in your current scope.</Text>}</>;
}
export function PulseView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), resource = useResource(() => mobileApi.pulse(), `pulse:${floor.site}`, {} as Row), [owner, setOwner] = useState('All'), [error, setError] = useState('');
  const rows: Row[] = resource.data.consultants || [];
  return <><View style={styles.card}><Text style={styles.title}>PULSE · morning briefing</Text><ErrorBox message={resource.error || error} /><Pick label="Consultant" value={owner} rows={[{ id: 'All', name: 'Whole team' }, ...rows.map(row => ({ id: row.name, name: row.name }))]} onChange={setOwner} /></View>
    {rows.filter(row => owner === 'All' || row.name === owner).map(row => <View key={row.name} style={styles.card}><View style={styles.row}><Text style={styles.subtitle}>{row.name}</Text><Text style={[styles.pill, { color: row.trafficLight === 'red' ? '#b91c1c' : row.trafficLight === 'amber' ? '#92400e' : '#166534' }]}>{row.trafficLight.toUpperCase()}</Text></View>
      <Metrics values={[{ label: 'Active leads', value: row.activeLeads }, { label: 'Overdue follow-ups', value: row.overdueSla }, { label: 'Close ratio %', value: row.conversionRate }, { label: 'Oldest follow-up (hours)', value: Math.round(row.maxFollowupHours) }]} />
      {row.flaggedLeads.map((lead: Row) => <View key={lead.id} style={styles.card}><Text style={styles.text}>{lead.name} · {lead.age} · {lead.reason}</Text><View style={styles.row}><Button title="Open customer" secondary onPress={() => { mobileApi.lead(lead.id).then(onLead).catch(cause => setError(cause.message)); }} /><Button title="Ping consultant" secondary onPress={() => { mobileApi.task(lead.id, 'PULSE: contact this customer', new Date().toISOString()).then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} /></View></View>)}
    </View>)}{!rows.length && !resource.loading && <Text style={styles.muted}>No PULSE records for this site.</Text>}
  </>;
}
export function CalendarView({ onBook }: { onBook: () => void }) {
  const floor = useFloor(), [date, setDate] = useState(melbourneDate()), [owner, setOwner] = useState(''), [error, setError] = useState('');
  const [add, setAdd] = useState(false);
  const resource = useResource(() => mobileApi.calendar(date, owner || undefined), `calendar:${floor.site}:${date}:${owner}`, [] as Row[]);
  const staff = useResource(() => mobileApi.staff(), `calendar-staff:${floor.site}`, [] as Row[]);
  const action = (work: Promise<unknown>) => { work.then(() => resource.reload()).catch(cause => setError(cause.message)); };
  return <><View style={styles.card}><Text style={styles.title}>Calendar</Text><Field label="Date (YYYY-MM-DD, Melbourne)" value={date} onChange={setDate} />
    {floor.isManager && <Pick label="Salesperson's day" value={owner} rows={[{ id: '', name: 'Whole team' }, ...staff.data.map(row => ({ id: row.name, name: row.name }))]} onChange={setOwner} />}
    <View style={styles.row}><Button title="Book test drive" onPress={onBook} /><Button title="Add appointment / event" secondary onPress={() => setAdd(true)} /></View><ErrorBox message={error || resource.error} /></View>
    {resource.data.map(row => <View key={`${row.category}:${row.id}`} style={styles.card}><Text style={styles.subtitle}>{row.title}</Text><Text style={styles.text}>{new Date(row.date).toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' })}</Text><Text style={styles.muted}>{row.owner} · {row.status}</Text>
      {row.category === 'appointment' && <><Text style={styles.text}>Virtual Yard: {row.virtualyardSync?.state || 'Not applicable'}{row.virtualyardSync?.externalId ? ` · #${row.virtualyardSync.externalId}` : ''}</Text>{row.virtualyardSync?.message && <Text style={styles.muted}>{row.virtualyardSync.message}</Text>}
        <View style={styles.row}>{['Completed', 'No Show', 'Cancelled'].map(status => <Button key={status} title={status} secondary onPress={() => action(mobileApi.outcome(row.id, status))} />)}
          {['failed', 'pending'].includes(row.virtualyardSync?.state) && <Button title="Retry Virtual Yard sync" secondary onPress={() => action(mobileApi.retryBooking(row.id))} />}</View></>}
    </View>)}{!resource.data.length && <Text style={styles.muted}>No events on this date.</Text>}
    {add && <CalendarEventForm date={date} staff={staff.data} onClose={() => { setAdd(false); resource.reload(); }} />}
  </>;
}
function CalendarEventForm({ date: initialDate, staff, onClose }: { date: string; staff: Row[]; onClose: () => void }) {
  const floor = useFloor(), [date, setDate] = useState(initialDate), [time, setTime] = useState('09:00'), [duration, setDuration] = useState('30');
  const [category, setCategory] = useState('appointment'), [type, setType] = useState('Showroom Visit'), [title, setTitle] = useState(''), [owner, setOwner] = useState(''), [leadId, setLeadId] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [saved, setSaved] = useState('');
  const key = useRef(requestId());
  return <Sheet title="Add calendar event" onClose={onClose}><View style={styles.card}><ErrorBox message={error} />
    {saved ? <><Text style={styles.text}>{saved}</Text><Button title="Done" onPress={onClose} /></> : <>
      <Pick label="Event category" value={category} rows={[{ id: 'appointment', name: 'Customer appointment' }, { id: 'walkin', name: 'Walk-in' }, { id: 'lunch', name: 'Lunch / break' }, { id: 'personal', name: 'Other scheduled activity' }]} onChange={setCategory} />
      {category === 'appointment' ? <><Pick label="Customer" value={leadId} rows={floor.leads.map(row => ({ id: recordId(row), name: row.name }))} onChange={setLeadId} />
        <Pick label="Appointment type" value={type} rows={['Showroom Visit', 'Callback'].map(id => ({ id, name: id }))} onChange={setType} /></> : <Field label="Activity title" value={title} onChange={setTitle} />}
      {floor.isManager && <Pick label="Team member" value={owner} rows={[{ id: '', name: 'My calendar' }, ...staff.map(row => ({ id: row.email, name: row.name }))]} onChange={setOwner} />}
      <Field label="Date (YYYY-MM-DD)" value={date} onChange={setDate} /><Field label="Time in Melbourne (HH:MM)" value={time} onChange={setTime} /><Field label="Duration (minutes)" value={duration} onChange={setDuration} keyboard="decimal-pad" />
      <Button title="Save event" busy={busy} disabled={category === 'appointment' ? !leadId : !title.trim()} onPress={() => {
        setBusy(true); setError('');
        const submit = async () => {
          const when = melbourneBookingTime(date, time);
          if (category === 'appointment') { const result = await mobileApi.book({ bookingRequestId: key.current, leadId, type, when, durationMinutes: Number(duration), consultantName: staff.find(row => row.email === owner)?.name }); setSaved(result.virtualyardSync?.state === 'synced' ? `Saved and confirmed in Virtual Yard · ${result.virtualyardSync.externalId}` : `Appointment saved. ${result.virtualyardSync?.message || 'Virtual Yard confirmation pending.'} Review its Calendar sync status before retrying.`); }
          else { await mobileApi.addCalendarBlock({ title, date: when, durationMinutes: Number(duration), category, ownerEmail: owner || undefined }); setSaved('Calendar activity saved.'); }
          await floor.refresh();
        };
        submit().catch(cause => setError(cause.message)).finally(() => setBusy(false));
      }} />
    </>}
  </View></Sheet>;
}
export function StaffView() {
  const floor = useFloor(), resource = useResource(() => mobileApi.staff(), `staff:${floor.site}`, [] as Row[]), [busy, setBusy] = useState(false), [error, setError] = useState('');
  return <><View style={styles.card}><Text style={styles.title}>Team and presence</Text><Text style={styles.muted}>Presence uses device GPS and the configured site boundary. Readings older than ten minutes are marked stale.</Text><ErrorBox message={error || resource.error} />
    <Button title="Update my GPS presence" busy={busy} onPress={() => { setBusy(true); devicePosition().then(position => mobileApi.updatePresence({ ...position, site: floor.site })).then(() => { resource.reload(); void floor.refresh(); }).catch(cause => setError(cause.message)).finally(() => setBusy(false)); }} /></View>
    {resource.data.map(person => { const presence = person.presence; return <View key={recordId(person)} style={styles.card}><Text style={styles.subtitle}>{person.name}</Text><Text style={styles.text}>{person.role} · {person.site}</Text><Text style={styles.text}>{presence?.fresh ? presence.isInsideGeofence ? 'On-site' : 'Off-site' : 'Presence unavailable / stale'}</Text>{presence?.updatedAt && <Text style={styles.muted}>Last GPS reading {new Date(presence.updatedAt).toLocaleString()} · {presence.distanceMeters}m from site centre</Text>}</View>; })}
  </>;
}
export function AlertsView({ onLead }: { onLead: LeadAction }) {
  const floor = useFloor(), [filter, setFilter] = useState('all'), [error, setError] = useState(''), [notice, setNotice] = useState('');
  const [pushTest, setPushTest] = useState<Row | null>(null), [busy, setBusy] = useState(false), pushRequest = useRef(requestId());
  const run = async (work: () => Promise<void>) => { setBusy(true); setError(''); try { await work(); } catch (cause) { setError((cause as Error).message); } finally { setBusy(false); } };
  return <><View style={styles.card}><Text style={styles.title}>Activity and high-signal alerts</Text><ErrorBox message={error} />{notice && <Text style={styles.text}>{notice}</Text>}
    <Pick label="Category" value={filter} rows={[{ id: 'all', name: 'All activity' }, { id: 'high_buyer', name: 'High Buyer' }, { id: 'price_objection', name: 'Price Objection' }, { id: 'high_risk', name: 'High Risk' }]} onChange={setFilter} />
    <View style={styles.row}><Button title="Enable device push" secondary busy={busy} onPress={() => { void run(async () => { await enablePush(); setNotice('High-signal push enabled on this device.'); }); }} /><Button title="Disable device push" secondary busy={busy} onPress={() => { void run(async () => { await disablePush(); setNotice('Push disabled.'); }); }} /></View>
    <Button title="Test local notification / emulator" secondary busy={busy} onPress={() => { void run(async () => { await testLocalNotification(); setNotice('A local test notification is scheduled in two seconds. This does not test remote delivery.'); }); }} />
    <Button title="Send remote push to this device" secondary busy={busy} disabled={Boolean(pushTest)} onPress={() => { void run(async () => { setPushTest(await testRemotePush(pushRequest.current)); }); }} />
    {pushTest && <><Text style={styles.text}>Remote push: {pushTest.state}</Text><Text style={styles.muted}>Submitted means Expo accepted the request. Provider accepted means APNs/FCM accepted it. Received confirms the app acknowledged it.</Text>
      {pushTest.deliveries?.map((row: Row) => <Text key={row.id} style={styles.muted}>{row.state}{row.error ? ` · ${row.error}` : ''}</Text>)}
      <Button title="Check push delivery" secondary busy={busy} onPress={() => { void run(async () => { setPushTest(await mobileApi.pushTestStatus(pushTest.notificationId)); }); }} />
      <Button title="Prepare another push test" secondary disabled={busy} onPress={() => { pushRequest.current = requestId(); setPushTest(null); }} />
    </>}
  </View>{floor.notifications.filter(row => filter === 'all' || row.type === filter).map(row => <View key={recordId(row)} style={styles.card}><Text style={styles.pill}>{row.type.replaceAll('_', ' ').toUpperCase()}{row.read ? ' · READ' : ''}</Text><Text style={styles.subtitle}>{row.title}</Text><Text style={styles.text}>{row.body}</Text><Text style={styles.muted}>{new Date(row.createdAt).toLocaleString()}</Text>
    <View style={styles.row}><Button title="Mark read" secondary onPress={() => { mobileApi.readNotification(recordId(row)).then(() => { void floor.refresh(); }).catch(cause => setError(cause.message)); }} />
      {row.leadId && <Button title="Open customer" secondary onPress={() => { mobileApi.lead(row.leadId).then(onLead).catch(cause => setError(cause.message)); }} />}</View>
  </View>)}</>;
}
export function ReportsView() {
  const floor = useFloor(), [period, setPeriod] = useState('mtd'), [error, setError] = useState('');
  const resource = useResource(() => mobileApi.reports(period), `reports:${floor.site}:${period}`, {} as Row);
  return <><View style={styles.card}><Text style={styles.title}>Management reporting</Text><Pick label="Period" value={period} rows={[{ id: 'today', name: 'Today' }, { id: 'weekly', name: 'Last 7 days' }, { id: 'mtd', name: 'Month to date' }]} onChange={setPeriod} /><ErrorBox message={resource.error || error} />
    <Metrics values={[['Leads captured', 'dailyLeads'], ['Walk-ins', 'walkIns'], ['Videos sent', 'videosSent'], ['Sold units', 'soldUnits'], ['Capture rate %', 'captureRate'], ['Lead-to-sale %', 'conversionRate']].map(([label, key]) => ({ label, value: resource.data[key] }))} />
    <Button title="Export selected period CSV" secondary onPress={() => { exportReport(floor.site, period).catch(cause => setError(cause.message)); }} />
    <Button title="Export consultant PULSE CSV" secondary onPress={() => { exportReport(floor.site, period, 'consultants').catch(cause => setError(cause.message)); }} />
  </View><View style={styles.card}><Text style={styles.subtitle}>Sold model mix</Text>{resource.data.modelMix?.map((row: Row) => <Text key={row.model} style={styles.text}>{row.model}: {row.units}</Text>)}</View><View style={styles.card}><Text style={styles.subtitle}>Site comparison</Text>{resource.data.sites?.map((row: Row) => <Text key={row.site} style={styles.text}>{row.site}: {row.leads} leads · {row.sold} sold</Text>)}</View></>;
}
