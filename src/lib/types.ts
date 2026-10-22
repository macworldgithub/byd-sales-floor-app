export interface Lead {
  _id?: string;
  client_id?: string;
  id?: number | string;
  name: string;
  initials?: string;
  vehicle?: string;
  model?: string;
  score?: number;
  stage?: string;
  status?: string;
  source?: string;
  platform?: string;
  lastTouch?: string;
  action?: string;
  priority?: string | boolean;
  assignedTo?: string;
  allocatedPersonFullName?: string;
  consultant?: string;
  phone?: string;
  email?: string;
  notes?: string;
  leadIdShort?: string;
  dealer?: string;
  dealerName?: string;
  tag?: string;
  tags?: string[];
  testDrive?: {
    testDriveDate?: string | null;
    location?: string;
    status?: string;
    confirmed?: boolean;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Delivery {
  _id?: string;
  site?: string;
  site_location?: string;
  id?: number | string;
  name: string;
  vehicle?: string;
  delivery_date?: string;
  date?: string;
  stage?: string;
  contact_status?: string;
  status?: string;
  rego?: string;
  vin?: string;
  salesperson?: string;
  agent?: string;
  phone?: string;
  email?: string;
  vy_order_id?: string;
  comments?: {
    _id?: string;
    author_name: string;
    body: string;
    created_at: string;
  }[];
  accessories?: {
    _id?: string;
    name: string;
    status: string;
    note?: string;
  }[];
  documents?: {
    _id?: string;
    title: string;
    document_type: string;
    status: string;
  }[];
}

export interface Appointment {
  _id?: string;
  leadId?: string;
  prospectName: string;
  consultantName?: string;
  vehicle?: string;
  type: 'Test Drive' | 'Callback' | 'Showroom Visit';
  when: string;
  duration?: number;
  notes?: string;
  status: 'Booked' | 'Completed' | 'No Show' | 'Cancelled';
  createdAt?: string;
}

export interface TimelineEvent {
  time: string;
  end: string;
  title: string;
  detail: string;
  type: 'drive' | 'delivery' | 'hold' | 'followup';
}

export interface ConversationThread {
  _id?: string;
  leadId?: string;
  client_id?: string;
  phone?: string;
  dealer?: string;
  id: number | string;
  prospectName?: string;
  name?: string;
  initials?: string;
  lastMessage: string;
  time?: string;
  lastMessageAt?: string;
  unreadCount?: number;
  msgCount?: number;
  model?: string;
  optOutSuppressed?: boolean;
  messages?: {
    id: string;
    sender: 'ai' | 'user' | 'agent' | 'system';
    text: string;
    time: string;
    status?: string;
  }[];
}

export interface TeamMember {
  name: string;
  role: string;
  avatar: string;
  load: number;
  events: {
    start: number;
    width: number;
    title: string;
    type: 'drive' | 'delivery' | 'hold' | 'followup';
  }[];
}

export interface ConsultantCapacity {
  id: string;
  name: string;
  initials: string;
  leadsCount: number;
  capacityPct: number;
  status: string;
  warning?: string;
}

export type UserRole = 'consultant' | 'manager' | 'principal' | 'super_admin';
