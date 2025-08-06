// Mock Database for TransMaster Pro Credit Management System
// This simulates a real database with customers, credits, and invoices

const mockDatabase = {
  customers: [
    {
      id: 'CUST001',
      name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '(555) 123-4567',
      joinDate: '2023-01-15',
      credits: [
        {
          id: 'CR001',
          amount: 500,
          earnedDate: '2023-06-15',
          expiryDate: '2025-12-31',
          status: 'active',
          sourceInvoice: 'INV-2023-001',
          description: 'Purchase credit from 4L60E transmission ($5000 purchase)'
        },
        {
          id: 'CR002',
          amount: 300,
          earnedDate: '2023-09-20',
          expiryDate: '2024-09-20',
          status: 'expired',
          sourceInvoice: 'INV-2023-002',
          description: 'Purchase credit from transmission rebuild ($3000 purchase)'
        },
        {
          id: 'CR003',
          amount: 250,
          earnedDate: '2024-02-10',
          expiryDate: '2026-02-10',
          status: 'active',
          sourceInvoice: 'INV-2024-001',
          description: 'Purchase credit from 4L80E transmission ($2500 purchase)'
        }
      ],
      purchaseHistory: [
        { invoiceId: 'INV-2023-001', amount: 5000, date: '2023-06-15', product: '4L60E Remanufactured', creditsEarned: 500 },
        { invoiceId: 'INV-2023-002', amount: 3000, date: '2023-09-20', product: 'Transmission Rebuild', creditsEarned: 300 },
        { invoiceId: 'INV-2024-001', amount: 2500, date: '2024-02-10', product: '4L80E Remanufactured', creditsEarned: 250 }
      ]
    },
    {
      id: 'CUST002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '(555) 987-6543',
      joinDate: '2023-03-20',
      credits: [
        { 
          id: 'CR004', 
          amount: 400, 
          earnedDate: '2023-08-15',
          expiryDate: '2025-08-15', 
          status: 'active',
          sourceInvoice: 'INV-2023-003',
          description: 'Purchase credit from fleet transmission service ($4000 purchase)'
        },
        {
          id: 'CR005',
          amount: 150,
          earnedDate: '2024-01-10',
          expiryDate: '2026-01-10',
          status: 'active',
          sourceInvoice: 'INV-2024-002',
          description: 'Purchase credit from transmission parts ($1500 purchase)'
        }
      ],
      purchaseHistory: [
        { invoiceId: 'INV-2023-003', amount: 4000, date: '2023-08-15', product: 'Fleet Transmission Service', creditsEarned: 400 },
        { invoiceId: 'INV-2024-002', amount: 1500, date: '2024-01-10', product: 'Transmission Parts', creditsEarned: 150 }
      ]
    },
    {
      id: 'CUST003',
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      phone: '(555) 456-7890',
      joinDate: '2024-01-05',
      credits: [
        { 
          id: 'CR006', 
          amount: 100, 
          earnedDate: '2024-01-05',
          expiryDate: '2024-07-05', 
          status: 'expired',
          sourceInvoice: 'INV-2024-003',
          description: 'Purchase credit from diagnostic service ($1000 purchase)'
        },
        {
          id: 'CR007',
          amount: 350,
          earnedDate: '2024-03-15',
          expiryDate: '2026-03-15',
          status: 'active',
          sourceInvoice: 'INV-2024-004',
          description: 'Purchase credit from 4L60E transmission ($3500 purchase)'
        }
      ],
      purchaseHistory: [
        { invoiceId: 'INV-2024-003', amount: 1000, date: '2024-01-05', product: 'Transmission Diagnostic', creditsEarned: 100 },
        { invoiceId: 'INV-2024-004', amount: 3500, date: '2024-03-15', product: '4L60E Remanufactured', creditsEarned: 350 }
      ]
    }
  ],
  invoices: [
    {
      id: 'INV001',
      customerId: 'CUST001',
      originalAmount: 2800,
      currentAmount: 2800,
      creditsApplied: 0,
      date: '2024-08-01',
      description: '4L60E Remanufactured Transmission - Premium Package',
      status: 'pending',
      items: [
        { description: '4L60E Remanufactured Transmission', price: 2500 },
        { description: 'Installation Service', price: 300 }
      ]
    },
    {
      id: 'INV002',
      customerId: 'CUST002',
      originalAmount: 3500,
      currentAmount: 3500,
      creditsApplied: 0,
      date: '2024-08-05',
      description: '4L80E Remanufactured Transmission - Commercial Grade',
      status: 'pending',
      items: [
        { description: '4L80E Remanufactured Transmission', price: 3200 },
        { description: 'Extended Warranty', price: 300 }
      ]
    },
    {
      id: 'INV003',
      customerId: 'CUST003',
      originalAmount: 1800,
      currentAmount: 1800,
      creditsApplied: 0,
      date: '2024-08-10',
      description: 'Transmission Rebuild Service',
      status: 'pending',
      items: [
        { description: 'Transmission Rebuild', price: 1500 },
        { description: 'Fluid Change', price: 150 },
        { description: 'Diagnostic Fee', price: 150 }
      ]
    },
    {
      id: 'INV004',
      customerId: 'CUST001',
      originalAmount: 950,
      currentAmount: 950,
      creditsApplied: 0,
      date: '2024-08-15',
      description: 'Transmission Maintenance Package',
      status: 'pending',
      items: [
        { description: 'Transmission Service', price: 400 },
        { description: 'Filter Replacement', price: 250 },
        { description: 'Fluid Premium Grade', price: 300 }
      ]
    }
  ]
};

module.exports = mockDatabase;
