import { Tenant, Material, Style, Customer, CrewMember, ScheduleEvent } from './types';

export const SAMPLE_TENANT: Tenant = {
  id: 'tenant_1',
  name: 'Evergreen Fencing Co.',
  settings: {
    pricingMethod: 'margin',
    biddingMethod: 'footage',
    defaultMargin: 0.3,
    defaultMarkup: 0.45,
    depositPct: 0.5,
    currency: 'USD'
  }
};

export const SAMPLE_MATERIALS: Material[] = [
  { id: 'mat_1', tenantId: 'tenant_1', name: 'Cedar Picket 6ft', unit: 'board', unitCost: 4.5, category: 'Wood' },
  { id: 'mat_2', tenantId: 'tenant_1', name: '2x4x8 Treated Rail', unit: 'board', unitCost: 8.2, category: 'Wood' },
  { id: 'mat_3', tenantId: 'tenant_1', name: '4x4x8 Treated Post', unit: 'psc', unitCost: 12.5, category: 'Wood' },
  { id: 'mat_4', tenantId: 'tenant_1', name: 'Concrete Bag 80lb', unit: 'bag', unitCost: 6.5, category: 'Other' },
  { id: 'mat_5', tenantId: 'tenant_1', name: 'Vinyl Privacy Panel 6x8', unit: 'psc', unitCost: 85.0, category: 'Vinyl' },
  { id: 'mat_6', tenantId: 'tenant_1', name: 'Aluminum Picket 5ft', unit: 'psc', unitCost: 12.0, category: 'Aluminum' },
  { id: 'mat_7', tenantId: 'tenant_1', name: '9ga Chain Link Fabric 4ft', unit: 'ft', unitCost: 3.2, category: 'Chain Link' },
  { id: 'mat_8', tenantId: 'tenant_1', name: 'Post Cap - Pyramid', unit: 'psc', unitCost: 2.5, category: 'Other' }
];

export const SAMPLE_STYLES: Style[] = [
  {
    id: 'style_1',
    tenantId: 'tenant_1',
    name: '6ft Privacy Cedar',
    description: 'Classic vertical cedar privacy fence.',
    type: 'fence',
    category: 'Wood',
    measurementBasis: 'foot',
    sectionLength: 8,
    bom: [
      { materialId: 'mat_1', materialName: 'Cedar Picket 6ft', qtyPerUnit: 2.2, wastePct: 0.05 },
      { materialId: 'mat_2', materialName: '2x4x8 Treated Rail', qtyPerUnit: 0.3, wastePct: 0.05 }
    ],
    costPerUnit: 14.50
  },
  {
    id: 'style_2',
    tenantId: 'tenant_1',
    name: '6ft White Vinyl Privacy',
    description: 'Maintenance-free vinyl privacy fence.',
    type: 'fence',
    category: 'Vinyl',
    measurementBasis: 'section',
    sectionLength: 8,
    bom: [
      { materialId: 'mat_5', materialName: 'Vinyl Privacy Panel 6x8', qtyPerUnit: 1, wastePct: 0 }
    ],
    costPerUnit: 115.00
  },
  {
    id: 'style_3',
    tenantId: 'tenant_1',
    name: '4ft Chain Link',
    description: 'Standard residential chain link fence.',
    type: 'fence',
    category: 'Chain Link',
    measurementBasis: 'foot',
    sectionLength: 8,
    bom: [
      { materialId: 'mat_7', materialName: '9ga Chain Link Fabric 4ft', qtyPerUnit: 1, wastePct: 0.05 }
    ],
    costPerUnit: 8.50
  },
  {
    id: 'style_4',
    tenantId: 'tenant_1',
    name: '5ft Black Aluminum',
    description: 'Elegant black aluminum ornamental fence.',
    type: 'fence',
    category: 'Aluminum',
    measurementBasis: 'foot',
    sectionLength: 6,
    bom: [
      { materialId: 'mat_6', materialName: 'Aluminum Picket 5ft', qtyPerUnit: 4, wastePct: 0 }
    ],
    costPerUnit: 28.00
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

export const SAMPLE_EVENTS: ScheduleEvent[] = [
  {
    id: 'event_1',
    title: 'Estimate: 123 Oak Lane',
    type: 'estimate',
    date: new Date().toISOString(),
    customerId: 'cust_1',
    customerName: 'John Doe',
    notes: 'Residential privacy fence'
  },
  {
    id: 'event_2',
    title: 'Install: 456 Pine St',
    type: 'install',
    date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
    customerId: 'cust_2',
    customerName: 'Jane Smith',
    notes: '6ft Cedar Privacy, 120ft'
  }
];
