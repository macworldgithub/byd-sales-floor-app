import { fetchApi } from './api';

export type Row = Record<string, any>;
export const recordId = (row: Row | null | undefined) => String(row?._id || row?.id || '');
export const requestId = () => `${Date.now()}-${Array.from({ length: 4 }, () => Math.random().toString(36).slice(2)).join('-')}`;
const qs = (params: Record<string, string | number | boolean | undefined> = {}) => '?' + new URLSearchParams(Object.entries(params).filter(([, v]) => v !== undefined && v !== '').map(([k, v]) => [k, String(v)])).toString();
export async function request<T = Row>(path: string, body?: unknown, method = 'POST'): Promise<T> {
  const result = await fetchApi<T>(path, body === undefined ? {} : { method, body: JSON.stringify(body) });
  if (!result.success) throw new Error(result.message || 'Request failed.');
  return result.data as T;
}
export const mobileApi = {
  bootstrap: () => request('/mobile/bootstrap'),
  leads: async (page = 1, query = '', limit = 10) => {
    const result = await fetchApi<Row[]>(`/mobile/leads${qs({ page, limit, q: query })}`);
    return { rows: result.data || [], pagination: result.pagination };
  },
  createLead: (data: Row) => request('/mobile/leads', data),
  lead: (id: string) => request(`/mobile/leads/${id}`),
  updateLead: (id: string, data: Row) => request(`/mobile/leads/${id}`, data, 'PATCH'),
  mergeLeads: (targetId: string, sourceLeadId: string) => request(`/mobile/leads/${targetId}/merge`, { sourceLeadId }),
  timeline: (id: string) => request<Row[]>(`/mobile/leads/${id}/timeline`),
  note: (id: string, body: string) => request(`/mobile/leads/${id}/notes`, { body }),
  task: (id: string, title: string, dueAt: string) => request(`/mobile/leads/${id}/tasks`, { title, dueAt }),
  call: (id: string, data: Row) => request(`/mobile/leads/${id}/calls`, data),
  send: (id: string, data: Row) => request(`/mobile/leads/${id}/messages`, data),
  threads: () => request<Row[]>('/mobile/threads'),
  summary: (period: string) => request(`/mobile/summary${qs({ period })}`),
  pulse: () => request('/mobile/pulse'),
  reports: (period: string) => request(`/mobile/reports${qs({ period })}`),
  logWalkIn: () => request('/mobile/traffic', {}),
  inventory: (params: Row = {}) => request<{ data: Row[]; counts: Record<string, number>; total: number }>(`/mobile/inventory${qs(params)}`),
  notifications: () => request<Row[]>('/mobile/notifications'),
  readNotification: (id: string) => request(`/mobile/notifications/${id}/read`, {}, 'PATCH'),
  calendar: (date: string, owner?: string) => request<Row[]>(`/mobile/calendar${qs({ date, owner })}`),
  addCalendarBlock: (data: Row) => request('/mobile/calendar-blocks', data),
  book: (input: Row) => request('/mobile/appointments', input),
  outcome: (id: string, status: string) => request(`/mobile/appointments/${id}`, { status }, 'PATCH'),
  retryBooking: (id: string) => request(`/mobile/appointments/${id}/retry`, {}),
  staff: () => request<Row[]>('/mobile/staff'),
  presence: () => request<Row[]>('/mobile/presence'),
  updatePresence: (data: Row) => request('/mobile/presence', data),
  settings: () => request('/mobile/settings'),
  saveSettings: (site: string, settings: Row) => request('/mobile/settings', { site, settings }, 'PUT'),
  saveTarget: (data: Row) => request('/mobile/targets', data),
  reviewLicence: (leadId: string, data: Row) => request(`/mobile/leads/${leadId}/licence`, data),
  rego: (data: Row) => request('/mobile/vehicle/rego', data),
  ppsr: (data: Row) => request('/mobile/vehicle/ppsr', data),
  vehicleStatus: () => request('/mobile/vehicle/status'),
  vehicleChecks: (leadId: string) => request<Row[]>(`/mobile/vehicle/checks${qs({ leadId })}`),
  deals: () => request<Row[]>('/mobile/deals'),
  createDeal: (data: Row) => request('/mobile/deals', data),
  pushDeal: (id: string) => request(`/mobile/deals/${id}/push-virtualyard`, {}),
  deliveries: () => request<Row[]>('/mobile/deliveries'),
  updateDelivery: (id: string, data: Row) => request(`/mobile/deliveries/${id}`, data, 'PATCH'),
  handover: (id: string) => request(`/mobile/deliveries/${id}/handover`, {}),
  followups: () => request<Row[]>('/mobile/followups'),
  approveFollowup: (id: string, reviewToken: string) => request(`/mobile/followups/${id}/approve`, { reviewToken }),
  followupReceipt: (id: string) => request(`/mobile/followups/${id}/receipt`, {}),
  cancelFollowup: (id: string, reason: string) => request(`/mobile/followups/${id}/cancel`, { reason }),
  journeyPreview: (data: Row) => request('/mobile/journey/preview', data),
  communications: () => request('/mobile/communications'),
  approvedSenders: () => request<Row[]>('/mobile/communications/senders'),
  testSms: (data: Row) => request('/mobile/communications/test-sms', data),
  smsTestReceipt: (id: string) => request(`/mobile/communications/test-sms/${id}`),
  pushTestStatus: (id: string) => request(`/mobile/push-test/${id}`),
  tasks: () => request<Row[]>('/mobile/tasks'),
  completeTask: (id: string) => request(`/mobile/tasks/${id}/complete`, {}, 'PATCH'),
  draft: (id: string, question: string) => request(`/mobile/leads/${id}/ai-draft`, { question }),
  knowledge: () => request<Row[]>('/mobile/knowledge'),
  saveKnowledge: (data: Row) => request('/mobile/knowledge', data),
  virtualyardOptions: () => request('/virtualyard/options'),
  virtualyardSession: () => request('/virtualyard/session'),
  connectVirtualyard: (cookie: string) => request('/virtualyard/session', { cookie }),
  virtualyardLookup: async (kind: string, query = '', limit = 1000, signal?: AbortSignal) => {
    const result = await fetchApi<Row[]>(`/virtualyard/lookup/${kind}${qs({ q: query, limit })}`, { signal });
    return { rows: result.data || [], hasMore: Boolean((result as Row).hasMore) };
  },
};

// Melbourne wall-clock conversion matches byd-sales-crm-layer and rejects DST gaps/ambiguity.
export function melbourneBookingTime(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('Enter date YYYY-MM-DD and time HH:MM.');
  const wall = `${date}T${time}:00`, naive = Date.parse(`${wall}Z`);
  const format = (stamp: number) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(stamp).map(part => [part.type, part.value]));
    return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  };
  const candidates = [10, 11].map(offset => naive - offset * 3600000).filter(stamp => format(stamp) === wall);
  if (candidates.length !== 1) throw new Error('This Melbourne time is unavailable or ambiguous due to daylight saving. Choose another time.');
  return new Date(candidates[0]).toISOString();
}
export const melbourneDate = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Australia/Melbourne', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
