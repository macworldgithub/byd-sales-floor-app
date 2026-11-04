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
  businessName?: string;
  abn?: string;
  companyContacts?: {
    name: string;
    role?: string;
    phone?: string;
    email?: string;
  }[];
  tradeInRego?: string;
  tradeInVin?: string;
  tradeInModel?: string;
  ppsrStatus?: 'Clear' | 'Encumbered' | 'Error' | 'Pending';
  dealRecord?: DealRecord;
  appraisalRecord?: IAppraiseRecord;
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

export interface InventoryVehicle {
  id: string;
  stockNumber: string;
  vin: string;
  rego?: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  colour: string;
  daysInStock: number;
  ageingBucket: '0-30' | '31-60' | '90+';
  status: 'In Stock' | 'Deal Pending' | 'In Transit' | 'Sold';
  advertisedPrice: number;
  costPrice: number;
  specs?: {
    battery?: string;
    range?: string;
    drivetrain?: string;
    power?: string;
  };
  site: string;
  isGroupStock?: boolean;
}

export interface IAppraiseRecord {
  id: string;
  leadId?: string;
  customerName: string;
  rego: string;
  vin: string;
  make: string;
  model: string;
  year: number;
  odometer: number;
  transmission: string;
  ppsrStatus: 'Clear' | 'Encumbered' | 'Error' | 'Pending';
  ppsrDetails?: {
    encumbranceType?: string;
    financier?: string;
    certificateNumber?: string;
  };
  photos: {
    angle: string;
    label: string;
    captured: boolean;
    uri?: string;
  }[];
  damages: {
    id: string;
    location: string;
    type: string;
    severity: 'Minor' | 'Moderate' | 'Severe';
    notes?: string;
  }[];
  appraisedValue: number;
  status: 'Draft' | 'Completed' | 'Sent to DMS';
  loanCarSigned?: boolean;
  loanCarRego?: string;
  createdAt: string;
}

export interface DealRecord {
  id: string;
  leadId: string;
  customerName: string;
  vehicleName: string;
  vin: string;
  rego?: string;
  salePrice: number;
  tradeInValue?: number;
  tradeInPpsr?: 'Clear' | 'Encumbered' | 'Error';
  financeType: 'Cash' | 'Financed' | 'Novated Lease';
  status: 'Pending Approval' | 'Pushed to Virtual Yard' | 'Pushed to eraPower' | 'eraPower Synced' | 'Contract Signed' | 'Delivery Scheduled';
  consultant: string;
  createdAt: string;
}

export interface PulseMetrics {
  activeLeads: number;
  unactionedLeads: number;
  appointmentsBooked: number;
  overdueSla: number;
  dealsCompleted: number;
  conversionRate: number;
  videosSent: number;
  monthlyTarget: number;
  trafficLight: 'green' | 'amber' | 'red';
}

