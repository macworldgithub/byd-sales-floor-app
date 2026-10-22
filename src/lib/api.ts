/**
 * api.ts – Mobile API Client
 * Wraps fetch to automatically include JWT and handle JSON/errors.
 * Token stored in expo-secure-store for security.
 */

import { Lead, Delivery, Appointment, ConversationThread } from './types';
import * as SecureStore from 'expo-secure-store';

export const BASE_URL = 'https://byd-sales-floor-backend.vercel.app/api';
const TOKEN_KEY = 'byd_auth_token';

// ─── Token Helpers ────────────────────────────────────────────────────────────

export const setToken = async (token: string) => {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
};

export const getToken = async (): Promise<string> => {
  return (await SecureStore.getItemAsync(TOKEN_KEY)) || '';
};

export const clearToken = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
};

// ─── Core Fetch Wrapper ───────────────────────────────────────────────────────

export async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; pagination?: any }> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });

  if (response.status === 401) {
    await clearToken();
    throw new Error('Session expired. Please log in again.');
  }

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.message || json.error || `API Error: ${response.status}`);
  }
  return json;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Invalid credentials');
    }
    if (data.token) {
      await setToken(data.token);
    }
    return data;
  },
  logout: async () => {
    await clearToken();
  },
};

// ─── Leads ────────────────────────────────────────────────────────────────────

export const leadApi = {
  getLeads: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Lead[]>(`/leads${qs}`);
  },
  createLead: (lead: Partial<Lead>) =>
    fetchApi<Lead>('/leads', { method: 'POST', body: JSON.stringify(lead) }),
  updateLead: (id: string, data: Partial<Lead>) =>
    fetchApi<Lead>(`/leads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  addNote: (id: string, note: string) =>
    fetchApi(`/leads/${id}/notes`, { method: 'POST', body: JSON.stringify({ note }) }),
};

// ─── Deliveries ───────────────────────────────────────────────────────────────

export const deliveryApi = {
  getClients: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Delivery[]>(`/clients${qs}`);
  },
  updateClient: (id: string, data: Partial<Delivery>) =>
    fetchApi<Delivery>(`/clients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
};

// ─── Conversations ────────────────────────────────────────────────────────────

export const conversationApi = {
  getConversations: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<ConversationThread[]>(`/conversations${qs}`);
  },
};

// ─── Stats ────────────────────────────────────────────────────────────────────

export const statsApi = {
  getFloorStats: () => fetchApi<any>('/stats/floor'),
};

// ─── Appointments ─────────────────────────────────────────────────────────────

export const appointmentApi = {
  getAppointments: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return fetchApi<Appointment[]>(`/appointments${qs}`);
  },
  createAppointment: (data: Record<string, any>) =>
    fetchApi<Appointment>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  updateAppointment: (id: string, data: Partial<Appointment>) =>
    fetchApi<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Messages ─────────────────────────────────────────────────────────────────

export const messageApi = {
  sendMessage: (data: {
    to?: string;
    phone?: string;
    body: string;
    client_name?: string;
    lead_id?: string;
    leadId?: string;
    client_id?: string;
    site?: string;
  }) => fetchApi<any>('/messages/send', { method: 'POST', body: JSON.stringify(data) }),
  bulkSend: (recipients: Array<{ phone?: string; name?: string; model?: string; leadId?: string; body: string }>) =>
    fetchApi<any>('/messages/bulk-send', {
      method: 'POST',
      body: JSON.stringify({ recipients }),
    }),
};

// ─── CRM & Scoreboard ─────────────────────────────────────────────────────────

export const crmApi = {
  getCustomerTimeline: (customerId: string) =>
    fetchApi<any[]>(`/crm/customers/${customerId}/timeline`),
  logPhoneCall: (
    customerId: string,
    data: {
      direction?: 'Inbound' | 'Outbound';
      outcome: string;
      notes?: string;
      durationSeconds?: number;
      consultantName?: string;
    }
  ) =>
    fetchApi<any>(`/crm/customers/${customerId}/calls`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getBoardTeam: () => fetchApi<any>('/crm/boards/team'),
};

// ─── Staff ────────────────────────────────────────────────────────────────────

export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  site?: string;
  locked_site?: string;
  position?: string;
  phone?: string;
  active: boolean;
}

export const staffApi = {
  getStaff: async (site?: string, search?: string) => {
    const params = new URLSearchParams();
    if (site && site !== 'All' && site !== 'All Sites') {
      params.set('site', site);
    }
    if (search) {
      params.set('q', search);
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return fetchApi<any>(`/staff${query}`);
  },
};

// ─── Global Search ────────────────────────────────────────────────────────────

export const searchApi = {
  search: (q: string) =>
    fetchApi<{ leads: Lead[]; clients: Delivery[]; appointments: Appointment[] }>(
      `/search?q=${encodeURIComponent(q)}`
    ),
  checkDuplicate: (phone?: string, email?: string) => {
    const params = new URLSearchParams();
    if (phone) params.set('phone', phone);
    if (email) params.set('email', email);
    return fetchApi<any>(`/search/check-duplicate?${params.toString()}`);
  },
};

// ─── Inventory ────────────────────────────────────────────────────────────────

export const inventoryApi = {
  softHold: (id: string, payload: { prospectName: string; notes?: string }) =>
    fetchApi<any>(`/inventory/${id}/soft-hold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  releaseHold: (id: string) =>
    fetchApi<any>(`/inventory/${id}/release-hold`, { method: 'POST' }),
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templateApi = {
  getTemplates: () => fetchApi<any[]>('/templates'),
  createTemplate: (data: Record<string, any>) =>
    fetchApi<any>('/templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    fetchApi<void>(`/templates/${id}`, { method: 'DELETE' }),
};

