/**
 * templateEngine.ts – Dynamic token replacement and pre-configured template packs
 * Strictly adheres to BYD Sales Floor Compliance and Merge Token specifications
 */

export interface TemplatePack {
  id?: string;
  name: string;
  channel: 'sms' | 'email' | 'both';
  trigger: string;
  subject?: string;
  body: string;
  active?: boolean;
}

export interface MergeContext {
  first_name?: string;
  last_name?: string;
  name?: string;
  consultant?: string;
  consultant_mobile?: string;
  site?: string;
  model?: string;
  variant?: string;
  appointment_date?: string;
  appointment_time?: string;
  delivery_date?: string;
  rego?: string;
  vin_last6?: string;
  address_short?: string;
}

export const DEFAULT_TEMPLATE_PACKS: TemplatePack[] = [
  {
    name: 'New allocation — first touch',
    channel: 'sms',
    trigger: 'Lead assigned to consultant; unsent after 10 min',
    subject: 'Your enquiry with BYD {{site}}',
    body: 'Hi {{first_name}}, {{consultant}} here from BYD {{site}}. Thank you for your enquiry on the {{model}}. When would be a good time for a brief chat or a test drive? Reply STOP to opt out.',
  },
  {
    name: 'Walk-in thank you',
    channel: 'sms',
    trigger: 'Manual, from Add Prospect',
    subject: 'Thanks for visiting BYD {{site}}',
    body: 'Hi {{first_name}}, thanks for coming into BYD {{site}} today to look at the {{model}}. Here is my direct contact if any questions come up. {{consultant}} — {{consultant_mobile}}.',
  },
  {
    name: 'Test drive booked',
    channel: 'both',
    trigger: 'On appointment create',
    subject: 'BYD {{model}} Test Drive Confirmed',
    body: "Hi {{first_name}}, your BYD {{model}} test drive is confirmed for {{appointment_date}} at {{appointment_time}} at BYD {{site}}. Please bring your valid driver's licence. See you soon!",
  },
  {
    name: 'Test drive reminder',
    channel: 'sms',
    trigger: 'T-24h and T-2h before appointment',
    subject: 'Test Drive Reminder: BYD {{model}}',
    body: 'Hi {{first_name}}, quick reminder of your BYD {{model}} test drive at {{appointment_time}} (BYD {{site}}). Let us know if you need to adjust time: {{consultant_mobile}}.',
  },
  {
    name: 'No-show / reschedule',
    channel: 'sms',
    trigger: 'Consultant marks no-show',
    subject: 'Reschedule your BYD test drive',
    body: 'Hi {{first_name}}, sorry we missed you for your BYD {{model}} test drive today. Would you like to reschedule for later this week? Let me know what suits: {{consultant_mobile}}.',
  },
  {
    name: 'Needs analysis follow-up',
    channel: 'both',
    trigger: 'Manual or sequence day +2 / +5',
    subject: 'Following up on your BYD {{model}} enquiry',
    body: "Hi {{first_name}}, following up on our conversation regarding the {{model}} {{variant}}. Happy to assist with range specs, trade-in valuation, or finance options whenever you're ready.",
  },
  {
    name: 'Commitment / order received',
    channel: 'both',
    trigger: 'Stage > Committed',
    subject: 'Order Confirmed: BYD {{model}}',
    body: 'Hi {{first_name}}, congratulations on reserving your BYD {{model}}! We have logged your order and our delivery team will keep you updated as vehicle preparation advances.',
  },
  {
    name: 'Delivery date set',
    channel: 'sms',
    trigger: 'When Delivery Centre date lands',
    subject: 'Delivery Date Confirmed: BYD {{model}}',
    body: 'Hi {{first_name}}, great news! Handover for your BYD {{model}} (Rego: {{rego}}) is scheduled for {{delivery_date}} at BYD {{site}}. We look forward to welcoming you.',
  },
  {
    name: 'Delivery reminder',
    channel: 'sms',
    trigger: 'T-24h before handover',
    subject: 'Handover Tomorrow: BYD {{model}}',
    body: "Hi {{first_name}}, your BYD {{model}} handover is tomorrow at {{delivery_date}}. Please ensure your primary driver's licence and funds are ready. See you at {{site}}!",
  },
  {
    name: 'After handover referral ask',
    channel: 'sms',
    trigger: 'T+3 days post Delivered',
    subject: 'How is your new BYD {{model}}?',
    body: "Hi {{first_name}}, hope you are loving your new BYD {{model}}! If any family or friends are considering an EV, let us know — we'd love to look after them. Safe travels!",
  },
];

export function interpolateTemplate(templateText: string, context: MergeContext): string {
  if (!templateText) return '';

  const firstName =
    context.first_name ||
    (context.name ? context.name.trim().split(' ')[0] : '') ||
    'there';

  const mergedData: Record<string, string> = {
    first_name: firstName,
    last_name: context.last_name || (context.name ? context.name.trim().split(' ').slice(1).join(' ') : ''),
    name: context.name || firstName,
    consultant: context.consultant || 'Alex Rivers',
    consultant_mobile: context.consultant_mobile || '+61 412 890 234',
    site: context.site || 'Melbourne CBD',
    model: context.model || 'SEALION 7',
    variant: context.variant || 'Premium',
    appointment_date: context.appointment_date || 'Saturday, 13 Sep',
    appointment_time: context.appointment_time || '09:00 AM',
    delivery_date: context.delivery_date || 'Thursday, 18 Sep',
    rego: context.rego || '1BY-8DQ',
    vin_last6: context.vin_last6 || '092144',
    address_short: context.address_short || '360 Elizabeth St',
  };

  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return mergedData[key] !== undefined ? mergedData[key] : '';
  });
}
