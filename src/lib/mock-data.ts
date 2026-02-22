import { Tenant, Material, Style, Customer, CrewMember } from './types';

export const SAMPLE_TENANT: Tenant = {
  id: 'tenant_1',
  name: 'Evergreen Fencing Co.',
  settings: {
    pricingMethod: 'margin',
    defaultMargin: 0.3,
    defaultMarkup: 0.45,
    depositPct: 0.5,
    currency: 'USD'
  }
};

export const SAMPLE_MATERIALS: Material[] = [
  { id: 'mat_1', tenantId: 'tenant_1', name: 'Cedar Picket 6ft', unit: 'each', unitCost: 4.5, category: 'Wood' },
  { id: 'mat_2', tenantId: 'tenant_1', name: '2x4x8 Treated Rail', unit: 'each', unitCost: 8.2, category: 'Wood' },
  { id: 'mat_3', tenantId: 'tenant_1', name: '4x4x8 Treated Post', unit: 'each', unitCost: 12.5, category: 'Post' },
  { id: 'mat_4', tenantId: 'tenant_1', name: 'Concrete Bag 80lb', unit: 'each', unitCost: 6.5, category: 'Supplies' }
];

export const SAMPLE_STYLES: Style[] = [
  {
    id: 'style_1',
    tenantId: 'tenant_1',
    name: '6ft Privacy Cedar',
    description: 'Classic vertical cedar privacy fence.',
    type: 'fence',
    measurementBasis: 'foot',
    bom: [
      { materialId: 'mat_1', materialName: 'Cedar Picket 6ft', qtyPerUnit: 2.2, wastePct: 0.05 },
      { materialId: 'mat_2', materialName: '2x4x8 Treated Rail', qtyPerUnit: 0.3, wastePct: 0.05 }
    ],
    costPerUnit: 14.50
  }
];

export const SAMPLE_CUSTOMERS: Customer[] = [
  { id: 'cust_1', tenantId: 'tenant_1', name: 'John Doe', email: 'john@example.com', phone: '555-0199', address: '123 Oak Lane', pipelineStage: 'LEAD', createdAt: new Date().toISOString() },
  { id: 'cust_2', tenantId: 'tenant_1', name: 'Jane Smith', email: 'jane@example.com', phone: '555-0288', address: '456 Pine St', pipelineStage: 'QUOTE_SENT', createdAt: new Date().toISOString() }
];

export const SAMPLE_CREW: CrewMember[] = [
  { id: 'crew_1', tenantId: 'tenant_1', name: 'Mike Foreman', hourlyRate: 45 },
  { id: 'crew_2', tenantId: 'tenant_1', name: 'Steve Laborer', hourlyRate: 25 }
];