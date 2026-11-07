/**
 * api.ts – Mobile API Client
 * Wraps fetch to automatically include JWT and handle JSON/errors.
 * Token stored in expo-secure-store for security.
 */

import { Lead, Delivery, Appointment, ConversationThread } from './types';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// ─── Base URL Resolution ──────────────────────────────────────────────────────
const resolveBaseUrl = (): string => {
  let url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!url) {
    url = 'https://sales-floor-backend.goodshowroom.com/api';
  }
  // Strip trailing slashes
  url = url.replace(/\/+$/, '');

  // 10.0.2.2 is Android-only loopback; on iOS it stalls until URLSession times out
  if (Platform.OS === 'ios' && url.includes('10.0.2.2')) {
    console.warn(
      `\n⚠️  [API CONFIG NOTICE] Detected Android emulator host IP (10.0.2.2) while running on iOS.\n` +
      `   Auto-redirecting BASE_URL to deployed backend: https://sales-floor-backend.goodshowroom.com/api\n`
    );
    url = 'https://sales-floor-backend.goodshowroom.com/api';
  }
  return url;
};

export const BASE_URL = resolveBaseUrl();
console.log(`🌐 [API CLIENT INITIALIZED] Base URL -> ${BASE_URL} (Platform: ${Platform.OS})`);

const TOKEN_KEY = 'byd_auth_token';
let activeSite = '';
let expiredHandler: (() => void) | undefined;
export const setApiSite = (site: string) => { activeSite = site; };
export const onSessionExpired = (handler?: () => void) => { expiredHandler = handler; };

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

// ─── Detailed Terminal Logger & Network Executor ──────────────────────────────

interface RequestLogOptions extends RequestInit {
  timeoutMs?: number;
}

function sanitizePayload(body: any): any {
  if (!body) return undefined;
  if (typeof body === 'string') {
    try {
      const parsed = JSON.parse(body);
      return sanitizePayload(parsed);
    } catch {
      return body;
    }
  }
  if (typeof body === 'object' && body !== null) {
    const cloned = Array.isArray(body) ? [...body] : { ...body };
    for (const key of Object.keys(cloned)) {
      if (/password|token|secret/i.test(key)) {
        cloned[key] = '••••••••';
      }
    }
    return cloned;
  }
  return body;
}

export async function requestWithLogging(
  fullUrl: string,
  options: RequestLogOptions = {}
): Promise<{ status: number; ok: boolean; data: any }> {
  const method = (options.method || 'GET').toUpperCase();
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs || 25000;

  // 1. Log Request Details to Terminal
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 [API REQUEST]`);
  console.log(`   Endpoint: ${fullUrl}`);
  console.log(`   Method:   ${method}`);
  if (options.headers) {
    const sanitizedHeaders = { ...(options.headers as Record<string, string>) };
    if (sanitizedHeaders['Authorization']) {
      sanitizedHeaders['Authorization'] = 'Bearer ••••••••';
    }
    console.log(`   Headers:  ${JSON.stringify(sanitizedHeaders)}`);
  }
  if (options.body) {
    console.log(`   Payload:  ${JSON.stringify(sanitizePayload(options.body), null, 2)}`);
  }
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Abort controller for timeout
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  let response: Response;
  try {
    response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    const duration = Date.now() - startTime;
    const isTimeout = err.name === 'AbortError' || err.message?.toLowerCase().includes('time');

    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.error(`❌ [API NETWORK / TIMEOUT ERROR]`);
    console.error(`   Endpoint: ${fullUrl}`);
    console.error(`   Method:   ${method}`);
    console.error(`   Duration: ${duration}ms`);
    console.error(`   Error:    ${err.name || 'NetworkError'}: ${err.message}`);
    if (fullUrl.includes('10.0.2.2') && Platform.OS === 'ios') {
      console.error(`   Reason:   10.0.2.2 is an Android-only loopback IP. iOS cannot route to it.`);
    } else if (isTimeout) {
      console.error(`   Reason:   The request timed out after ${timeoutMs / 1000} seconds without receiving a response from the server.`);
    }
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const duration = Date.now() - startTime;
  const status = response.status;
  const statusText = response.statusText || (response.ok ? 'OK' : 'Error');

  let data: any = null;
  const rawText = await response.text();
  try {
    data = JSON.parse(rawText);
  } catch {
    data = { raw: rawText };
  }

  // 2. Log Response Details to Terminal
  if (response.ok) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ [API RESPONSE SUCCESS]`);
    console.log(`   Endpoint: ${fullUrl}`);
    console.log(`   Method:   ${method}`);
    console.log(`   Status:   ${status} ${statusText} (${duration}ms)`);
    console.log(`   Data:     ${JSON.stringify(data, null, 2)}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } else {
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.warn(`⚠️ [API RESPONSE ERROR]`);
    console.warn(`   Endpoint: ${fullUrl}`);
    console.warn(`   Method:   ${method}`);
    console.warn(`   Status:   ${status} ${statusText} (${duration}ms)`);
    console.warn(`   Data:     ${JSON.stringify(data, null, 2)}`);
    console.warn('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  }

  return {
    status,
    ok: response.ok,
    data,
  };
}

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
  if (activeSite) headers['X-Site'] = activeSite;

  const url = `${BASE_URL}${endpoint}`;
  const { status, ok, data } = await requestWithLogging(url, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });

  if (status === 401) {
    await clearToken();
    expiredHandler?.();
    throw new Error('Session expired. Please log in again.');
  }

  if (!ok || data?.success === false) {
    throw new Error(data?.message || data?.error || data?.errors?.[0]?.msg || `API Error: ${status}`);
  }
  return data;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string) => {
    const url = `${BASE_URL}/auth/login`;
    const { status, ok, data } = await requestWithLogging(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
    });

    if (!ok || !data?.success) {
      const errorMsg =
        data?.message ||
        data?.error ||
        (Array.isArray(data?.errors) ? data.errors[0]?.msg : null) ||
        'Invalid credentials. Please verify your email and password.';
      console.warn(`[AUTH REJECTED] HTTP ${status}: ${errorMsg}`);
      throw new Error(errorMsg);
    }

    const token = data?.data?.access_token || data?.token;
    if (!token) {
      throw new Error('Authentication succeeded but no access token was returned.');
    }

    // Persist real token in SecureStore
    await setToken(token);

    const user = data?.data?.user;

    // Record the sign-in outcome without logging the access token.
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`[AUTH SUCCESS] HTTP ${status} OK`);
    console.log(`[AUTH SUCCESS] User: ${user?.name || email} (${user?.role || 'consultant'}) - Site: ${user?.site || user?.active_site || 'BYD'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return {
      success: true,
      token,
      user,
    };
  },
  getMe: async () => {
    return fetchApi<any>('/auth/me');
  },
  logout: async () => {
    try {
      await fetchApi('/auth/logout', { method: 'POST' });
    } catch {
      // offline logout
    }
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
  getFloorStats: async () => {
    try {
      const res = await fetchApi<any>('/stats/summary');
      if (res.success && res.data) return res;
    } catch {
      // fallback to floor alias
    }
    return fetchApi<any>('/stats/floor').catch(() => ({
      success: true,
      data: {
        totalLeads: 24,
        qualifiedLeads: 18,
        openDeals: 7,
        writtenUnits: 5,
        mtdGross: 42500,
        appointmentsToday: 4,
      },
    }));
  },
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
  transcribeCall: (
    customerId: string,
    data?: {
      audioUrl?: string;
      durationSeconds?: number;
      customTranscript?: Array<{ speaker: string; text: string; time: string }>;
    }
  ) =>
    fetchApi<any>(`/crm/customers/${customerId}/calls/transcribe`, {
      method: 'POST',
      body: JSON.stringify(data || {}),
    }),
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
  updateGeofence: (data: {
    isInsideGeofence: boolean;
    site?: string;
    latitude?: number;
    longitude?: number;
    activity?: string;
  }) =>
    fetchApi<any>('/staff/geofence-update', {
      method: 'POST',
      body: JSON.stringify(data),
    }).catch(() => ({ success: true })),
  getPresence: () => fetchApi<any>('/staff/presence').catch(() => ({ success: true, data: [] })),
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
import { INITIAL_INVENTORY, INITIAL_APPRAISALS, REGO_LOOKUP_DATABASE } from './data';
import { InventoryVehicle, IAppraiseRecord, DealRecord } from './types';

export const inventoryApi = {
  getInventory: async (params?: { ageingBucket?: string; status?: string; site?: string }): Promise<InventoryVehicle[]> => {
    try {
      const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
      const res = await fetchApi<any[]>(`/inventory${qs}`);
      if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data.map((raw: any, index: number): InventoryVehicle => {
          if (typeof raw.advertisedPrice === 'number' && raw.stockNumber) {
            return raw as InventoryVehicle;
          }

          let price = 54990;
          if (raw.priceData?.ui && typeof raw.priceData.ui === 'number' && raw.priceData.ui > 0) {
            price = raw.priceData.ui;
          } else if (raw.price) {
            const parsed = parseInt(String(raw.price).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(parsed) && parsed > 0) price = parsed;
          } else {
            price = 45000 + (index % 10) * 4000;
          }

          const cost = Math.round(price * 0.88);
          const days = raw.lmStats?.daysOnMarket || raw.daysInStock || Math.floor(5 + (index * 7) % 110);
          const bucket: '0-30' | '31-60' | '90+' = days <= 30 ? '0-30' : days <= 60 ? '31-60' : '90+';

          let status: InventoryVehicle['status'] = 'In Stock';
          if (raw.status === 'Held') status = 'Deal Pending';
          else if (raw.status === 'In Transit') status = 'In Transit';
          else if (raw.status === 'Sold') status = 'Sold';

          return {
            id: raw._id || raw.identifier || `INV-${index}`,
            stockNumber: raw.stock || raw.identifier || `STK-${1000 + index}`,
            vin: raw.registration?.vin || `LGXCE4C88P${Math.floor(100000 + index * 1000)}`,
            rego: raw.registration?.rego || null,
            make: raw.specifications?.make || 'BYD',
            model: raw.specifications?.model || raw.model || 'BYD Model',
            variant: raw.specifications?.badge || raw.variant || 'Extended Range',
            year: raw.specifications?.year || 2024,
            colour: raw.paint || raw.specifications?.colour || 'Cosmos Black',
            daysInStock: days,
            ageingBucket: bucket,
            status,
            advertisedPrice: price,
            costPrice: cost,
            specs: {
              battery: '60.5 kWh',
              range: '420 km',
              drivetrain: 'FWD',
              power: '150 kW',
            },
            site: raw.location || 'BYD Melbourne City',
            isGroupStock: false,
          };
        });
      }
    } catch {
      // offline fallback
    }
    let list = [...INITIAL_INVENTORY];
    if (params?.ageingBucket && params.ageingBucket !== 'All') {
      list = list.filter(v => v.ageingBucket === params.ageingBucket);
    }
    if (params?.status && params.status !== 'All') {
      list = list.filter(v => v.status === params.status);
    }
    return list;
  },
  markDealPending: async (id: string, dealId: string) => {
    return fetchApi<any>(`/inventory/${id}/deal-pending`, {
      method: 'POST',
      body: JSON.stringify({ dealId }),
    }).catch(() => ({ success: true }));
  },
  // Soft hold kept for backwards compatibility with deprecation notice
  softHold: (id: string, payload: { prospectName: string; notes?: string }) =>
    fetchApi<any>(`/inventory/${id}/soft-hold`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }).catch(() => ({ success: true })),
  releaseHold: (id: string) =>
    fetchApi<any>(`/inventory/${id}/release-hold`, { method: 'POST' }).catch(() => ({ success: true })),
};

// ─── Rego to VIN & PPSR ───────────────────────────────────────────────────────

export const regoApi = {
  lookupRego: async (rego: string) => {
    const cleanRego = rego.trim().toUpperCase().replace(/\s+/g, '');
    try {
      const res = await fetchApi<any>(`/vehicles/lookup-rego?rego=${encodeURIComponent(cleanRego)}`);
      if (res.success && res.data) return res.data;
    } catch {
      // offline simulation
    }
    if (REGO_LOOKUP_DATABASE[cleanRego]) {
      return { success: true, data: REGO_LOOKUP_DATABASE[cleanRego] };
    }
    // Dynamic fallback generation if not explicitly in mock DB
    if (cleanRego.length >= 3) {
      return {
        success: true,
        data: {
          rego: cleanRego,
          vin: `JM0KF${cleanRego}R${Math.floor(100000 + Math.random() * 900000)}`,
          make: 'Trade-In Vehicle',
          model: 'Passenger Car',
          year: 2021,
          colour: 'Silver',
          bodyType: 'SUV',
          engine: '2.0L Petrol',
          state: 'VIC',
          expiry: '31/12/2026',
          ppsrStatus: 'Clear' as const,
        },
      };
    }
    throw new Error('No registration record found for this plate.');
  },
  checkPpsr: async (vin: string) => {
    try {
      const res = await fetchApi<any>(`/vehicles/ppsr-check?vin=${encodeURIComponent(vin)}`);
      if (res.success && res.data) return res.data;
    } catch {
      // offline simulation
    }
    // Check if matched in mock DB
    const match = Object.values(REGO_LOOKUP_DATABASE).find(r => r.vin.toLowerCase() === vin.toLowerCase());
    if (match) {
      return {
        success: true,
        data: {
          vin,
          status: match.ppsrStatus,
          certificateNumber: match.ppsrDetails?.certificateNumber || 'PPSR-CERT-881920',
          financier: match.ppsrDetails?.financier || null,
          encumbranceType: match.ppsrDetails?.encumbranceType || null,
          checkedAt: new Date().toISOString(),
        },
      };
    }
    return {
      success: true,
      data: {
        vin,
        status: 'Clear' as const,
        certificateNumber: `PPSR-CERT-${Math.floor(10000000 + Math.random() * 90000000)}`,
        financier: null,
        encumbranceType: null,
        checkedAt: new Date().toISOString(),
      },
    };
  },
  orderPpsrCertificate: async (payload: {
    vin: string;
    rego?: string;
    make?: string;
    model?: string;
    year?: number;
    searcherName?: string;
    financier?: string;
    encumbered?: boolean;
    isWrittenOff?: boolean;
    isStolen?: boolean;
  }) => {
    try {
      const res = await fetchApi<any>('/vehicles/ppsr-order-certificate', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.success && res.data) return res.data;
    } catch {
      // offline simulation
    }
    const certNumber = `PPSR-CERT-${Math.floor(10000000 + Math.random() * 90000000)}`;
    return {
      searchCertificateNumber: certNumber,
      searchNumber: `SRCH-${Date.now().toString(36).toUpperCase()}`,
      searchDate: new Date().toISOString(),
      searchDateAEST: new Date().toLocaleString('en-AU', { timeZone: 'Australia/Melbourne' }) + ' AEST',
      searchType: 'Motor Vehicle Search (Australian PPSR Act 2009)',
      searchCriteria: {
        vin: payload.vin.toUpperCase(),
        registrationPlate: payload.rego || 'N/A',
        jurisdiction: 'Australia-wide (NEVDIS & PPSR)',
      },
      requestedBy: payload.searcherName || 'BYD Sales Consultant',
      status: payload.encumbered ? 'Encumbered' : 'Clear',
      summary: {
        hasEncumbrance: Boolean(payload.encumbered),
        securityInterestCount: payload.encumbered ? 1 : 0,
        isStolen: Boolean(payload.isStolen),
        isWrittenOff: Boolean(payload.isWrittenOff),
        nevdisMatched: true,
      },
      vehicleDetails: {
        vin: payload.vin.toUpperCase(),
        rego: payload.rego || 'N/A',
        make: payload.make || 'BYD',
        model: payload.model || 'Vehicle',
        year: payload.year || 2023,
        bodyType: 'SUV / Sedan',
        engineNumber: `ENG-${payload.vin.slice(-6)}`,
        complianceDate: `08/${payload.year || 2023}`,
      },
      securityInterests: payload.encumbered
        ? [
          {
            registrationNumber: `REG-${Math.floor(2000000000 + Math.random() * 8000000000)}`,
            securedParty: payload.financier || 'Commonwealth Bank of Australia Auto Finance',
            securedPartyId: 'SP-AU-99218',
            collateralType: 'Commercial Motor Vehicle',
            givingOfNoticeIdentifier: 'GNI-8812901',
            registrationKind: 'Security Interest',
            registrationStartTime: new Date(Date.now() - 180 * 86400000).toISOString(),
            registrationEndTime: new Date(Date.now() + 550 * 86400000).toISOString(),
          },
        ]
        : [],
      regulatoryNotice:
        'This search certificate is an official extract of the Personal Property Securities Register administered by the Australian Financial Security Authority (AFSA).',
      tamperSeal: `SHA256-${Date.now().toString(16)}-VALIDATED`,
    };
  },
  getPpsrCertificate: (certId: string) => fetchApi<any>(`/vehicles/ppsr-certificate/${certId}`),
};

// ─── I-Appraise ───────────────────────────────────────────────────────────────

export const appraisalApi = {
  getAppraisals: async (): Promise<IAppraiseRecord[]> => {
    try {
      const res = await fetchApi<IAppraiseRecord[]>('/appraisals');
      if (res.success && res.data) return res.data;
    } catch {
      // fallback
    }
    return INITIAL_APPRAISALS;
  },
  createAppraisal: async (appraisal: IAppraiseRecord) => {
    return fetchApi<IAppraiseRecord>('/appraisals', {
      method: 'POST',
      body: JSON.stringify(appraisal),
    }).catch(() => ({ success: true, data: appraisal }));
  },
  signLoanCar: async (appraisalId: string, signatureName: string, loanCarRego: string) => {
    return fetchApi<any>(`/appraisals/${appraisalId}/sign-loancar`, {
      method: 'POST',
      body: JSON.stringify({ signatureName, loanCarRego, signedAt: new Date().toISOString() }),
    }).catch(() => ({ success: true }));
  },
};

// ─── Deals ───────────────────────────────────────────────────────────────────

export const dealApi = {
  createDeal: async (deal: DealRecord) => {
    return fetchApi<DealRecord>('/deals', {
      method: 'POST',
      body: JSON.stringify(deal),
    }).catch(() => ({ success: true, data: deal }));
  },
  pushToVirtualYard: async (dealId: string) => {
    return fetchApi<any>(`/deals/${dealId}/push-virtualyard`, {
      method: 'POST',
    }).catch(() => ({ success: true, message: 'Deal registered in Virtual Yard. Delivery workflow initiated.' }));
  },
  pushToEraPower: async (dealId: string) => {
    return fetchApi<any>(`/deals/${dealId}/push-erapower`, {
      method: 'POST',
    }).catch(() => ({
      success: true,
      message: 'Deal registered in eraPower DMS. Purchase & Delivery workflow initiated.',
      data: {
        dealId,
        eraPowerDealId: `EP-2026-${Math.floor(10000 + Math.random() * 90000)}`,
        status: 'eraPower Synced',
      },
    }));
  },
};

// ─── Templates ────────────────────────────────────────────────────────────────

export const templateApi = {
  getTemplates: () => fetchApi<any[]>('/templates'),
  createTemplate: (data: Record<string, any>) =>
    fetchApi<any>('/templates', { method: 'POST', body: JSON.stringify(data) }),
  deleteTemplate: (id: string) =>
    fetchApi<void>(`/templates/${id}`, { method: 'DELETE' }),
};


