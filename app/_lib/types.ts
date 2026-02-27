export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "worker";
  avatar?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  unitCost: number;
  sellPrice: number;
  reorderPoint: number;
  location: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: "in" | "out";
  quantity: number;
  date: string;
  performedBy: string;
  notes?: string;
}

export interface FinancialSummary {
  month: string;
  revenue: number;
  costs: number;
  profit: number;
  itemsSold: number;
  itemsPurchased: number;
}

export interface CategorySpending {
  category: string;
  amount: number;
  budget: number;
}

export interface ReportConfig {
  id: string;
  title: string;
  description: string;
  type: "valuation" | "movement" | "financial";
}
