

// --- 1. Wizard Intake Data ---
export interface WizardData {
  location: string;
  plotArea: number;
  floors: number;
  isDuplex: boolean;
  bedrooms: number;
  bathrooms: number;
  additionalRooms: string[];
  constructionQuality: 'Basic' | 'Standard' | 'Premium' | 'Eco-Friendly' | 'Luxury';
  foundationType: string;
  wallType: string;
  flooringType: string;
  hasFalseCeiling: boolean;
  kitchenType: 'Standard' | 'Modular';
  doorWindowMaterial: string;
  electricalSpec: string;
  hasSump: boolean;
  hasSolar: boolean;
  hasCompoundWall: boolean;
  additionalNotes: string;
}

// --- 2. Budget & Negotiation ---
export interface BudgetItem {
  item: string;
  cost: number;
  details?: string;
  floorBreakdown?: {
    floor: string; // e.g., "Foundation", "Ground Floor", "First Floor"
    cost: number;
  }[];
}

export interface BudgetSection {
  sectionName: 'Structure' | 'Materials' | 'Labour' | 'Electrical' | 'Plumbing' | 'Finishing' | 'Miscellaneous';
  totalCost: number;
  items: BudgetItem[];
}

export interface ChatMessage {
  sender: 'user' | 'advisor';
  text: string;
  timestamp: string;
}

// --- 3. Material Quantities ---
export interface MaterialQuantity {
  material: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  floor: number; // 0 for Foundation/Common, 1 for Ground Floor, etc.
  originalQuantity?: number; // Snapshot of the initial quantity for baseline comparison
}

// --- 4. Deal Closure & Tracking ---
export interface PaymentMilestone {
  milestone: string;
  percentage: number;
  amount: number;
  status: 'Completed' | 'Due' | 'Pending';
}

export interface TimelineEvent {
  stage: string;
  expectedDate: string;
  actualDate?: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Delayed';
}

export interface WeeklyUpdate {
  date: string;
  engineerNotes: string;
  photos: string[]; // URLs
  videos?: string[]; // URLs
  materialLogs: string;
  userNotes?: string;
}

// --- 6. Support & Issues ---
export interface SupportTicket {
  id: string;
  subject: string;
  category: 'Material' | 'Work Quality' | 'Delay' | 'Safety' | 'Other';
  status: 'Open' | 'Assigned' | 'In Progress' | 'Resolved';
  assignedTo: string;
  expectedResolution: string;
  activity: { update: string; timestamp: string }[];
}

// --- 7. Handover ---
export interface SnagListItem {
  description: string;
  status: 'Reported' | 'Fixed' | 'Verified';
}

// --- MASTER PROJECT PLAN ---
export interface ProjectPlan {
  id: string;
  wizardData: Partial<WizardData>;
  totalCost: number;
  costPerSqFt: number;
  budgetBreakdown: BudgetSection[];
  chatHistory: ChatMessage[];
  paymentSchedule: PaymentMilestone[];
  paymentStatus: 'Pending Booking' | 'Booking Paid' | 'Fully Paid';
  timeline: TimelineEvent[];
  weeklyUpdates: WeeklyUpdate[];
  supportTickets: SupportTicket[];
  materialQuantities: MaterialQuantity[];
  snagList: SnagListItem[];
}