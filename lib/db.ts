export interface DailySummary {
  date: string;
  revenue: number;
  orders: number;
  fuelCost: number;
  foodCost: number;
  otherCost: number;
  targetRevenue: number;
}

export interface WorkSession {
  id?: string;
  date: string;
  startTime: string;
  endTime: string;
  targetRevenue?: number; // mục tiêu riêng của ca
}

export interface Trip {
  id?: string;
  date: string;
  revenue: number;
  sessionId?: string | null;
  timestamp: string; // "HH:mm" giờ nhập đơn
}

export interface Calculated {
  totalCost: number;
  profit: number;
  totalHours: number;
  revenuePerHour: number;
  profitPerHour: number;
  completionPercent: number;
  currentSessionPercent: number;
  currentSessionRevenue: number;
  currentSessionTarget: number;
}

export interface AppSettings {
  discordWebhook: string;
}
