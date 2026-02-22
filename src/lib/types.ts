export type Role = 'OWNER' | 'ESTIMATOR' | 'CREW_MANAGER' | 'CREW_MEMBER';

export interface Tenant {
  id: string;
  name: string;
  settings: {
    pricingMethod: 'margin' | 'markup';
    defaultMargin: number;
    defaultMarkup: number;
    depositPct: number;
    currency: string;
  };
}

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: Role;
  active: boolean;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  pipelineStage: 'LEAD' | 'QUOTE_SENT' | 'ACCEPTED' | 'LOST';
  createdAt: string;
}

export interface Material {
  id: string;
  tenantId: string;
  name: string;
  unit: 'linear_foot' | 'each' | 'section';
  unitCost: number;
  category: string;
  vendor?: string;
}

export interface BOMItem {
  materialId: string;
  materialName: string;
  qtyPerUnit: number;
  wastePct?: number;
}

export interface Style {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'fence' | 'post' | 'gate';
  measurementBasis: 'foot' | 'section';
  bom: BOMItem[];
  costPerUnit: number;
}

export interface EstimateLineItem {
  id: string;
  styleId: string;
  styleName: string;
  quantity: number;
  unitCostSnapshot: number;
  totalCost: number;
  sellPrice: number;
}

export interface Estimate {
  id: string;
  tenantId: string;
  customerId: string;
  customerSnapshot: Partial<Customer>;
  jobAddress: string;
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'deposit_paid' | 'scheduled' | 'completed';
  pricingMethod: 'margin' | 'markup';
  pricingValue: number;
  lineItems: EstimateLineItem[];
  totals: {
    materials: number;
    labor: number;
    subtotal: number;
    tax: number;
    total: number;
    depositRequired: number;
  };
  clientAccessToken: string;
  createdAt: string;
}

export interface CrewMember {
  id: string;
  tenantId: string;
  name: string;
  hourlyRate: number;
  laborRate?: number; // e.g. per section
  productionRate?: number; // e.g. feet/day
}