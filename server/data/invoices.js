/**
 * Invoices Mock Data
 * Contains detailed invoice information linked to customers and credits
 */

const invoices = [
  {
    id: "INV001",
    customerId: "CUST001",
    customerName: "John Smith",
    date: "2024-01-15",
    dueDate: "2024-02-14",
    originalAmount: 2500.00,
    currentAmount: 2500.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "paid",
    paymentStatus: "paid",
    paymentDate: "2024-01-28",
    description: "Transmission Rebuild Kit - Model TR-450",
    items: [
      {
        id: "ITEM001",
        description: "Transmission Rebuild Kit TR-450",
        partNumber: "TRK-450-2024",
        quantity: 1,
        unitPrice: 2200.00,
        totalPrice: 2200.00,
        category: "rebuild_kit"
      },
      {
        id: "ITEM002",
        description: "Labor - Transmission Rebuild",
        partNumber: "LAB-TR-001",
        quantity: 8,
        unitPrice: 37.50,
        totalPrice: 300.00,
        category: "labor"
      }
    ],
    taxes: {
      salesTax: 200.00,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 0.00,
      method: "pickup",
      trackingNumber: null
    },
    notes: "Customer pickup - rebuild kit for 2018 Ford F-150",
    earnedCreditIds: ["CREDIT001"],
    relatedCreditMemos: []
  },
  {
    id: "INV002",
    customerId: "CUST002",
    customerName: "Sarah Johnson",
    date: "2024-01-10",
    dueDate: "2024-01-25",
    originalAmount: 4500.00,
    currentAmount: 4500.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "paid",
    paymentStatus: "paid",
    paymentDate: "2024-01-20",
    description: "Bulk Transmission Parts Order",
    items: [
      {
        id: "ITEM003",
        description: "Torque Converter - TC-300",
        partNumber: "TC-300-HD",
        quantity: 5,
        unitPrice: 450.00,
        totalPrice: 2250.00,
        category: "torque_converter"
      },
      {
        id: "ITEM004",
        description: "Filter Kit - FK-200",
        partNumber: "FK-200-STD",
        quantity: 10,
        unitPrice: 85.00,
        totalPrice: 850.00,
        category: "filter_kit"
      },
      {
        id: "ITEM005",
        description: "Transmission Fluid - 5 Gallon",
        partNumber: "TF-5GAL-SYN",
        quantity: 8,
        unitPrice: 120.00,
        totalPrice: 960.00,
        category: "fluid"
      }
    ],
    taxes: {
      salesTax: 371.25,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 68.75,
      method: "freight",
      trackingNumber: "FRT123456789"
    },
    notes: "Bulk order with freight shipping",
    earnedCreditIds: ["CREDIT003"],
    relatedCreditMemos: []
  },
  {
    id: "INV003",
    customerId: "CUST003",
    customerName: "Mike Wilson",
    date: "2024-01-25",
    dueDate: "2024-03-10",
    originalAmount: 8200.00,
    currentAmount: 7000.00,
    creditsApplied: 1200.00,
    appliedCreditIds: ["CREDIT004"],
    status: "paid",
    paymentStatus: "paid",
    paymentDate: "2024-02-15",
    description: "Fleet Transmission Service Parts",
    items: [
      {
        id: "ITEM006",
        description: "Heavy Duty Transmission - HD-750",
        partNumber: "HD-750-FLEET",
        quantity: 3,
        unitPrice: 2200.00,
        totalPrice: 6600.00,
        category: "transmission"
      },
      {
        id: "ITEM007",
        description: "Installation Hardware Kit",
        partNumber: "IHK-HD-001",
        quantity: 3,
        unitPrice: 150.00,
        totalPrice: 450.00,
        category: "hardware"
      }
    ],
    taxes: {
      salesTax: 676.50,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 473.50,
      method: "freight",
      trackingNumber: "FRT987654321"
    },
    notes: "Fleet order - quantity discrepancy resolved with credit",
    earnedCreditIds: ["CREDIT004"],
    relatedCreditMemos: ["CM001"]
  },
  {
    id: "INV004",
    customerId: "CUST004",
    customerName: "Lisa Chen",
    date: "2024-03-01",
    dueDate: "2024-03-31",
    originalAmount: 1800.00,
    currentAmount: 1800.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "pending",
    paymentStatus: "pending",
    paymentDate: null,
    description: "Transmission Service Package",
    items: [
      {
        id: "ITEM008",
        description: "Transmission Service Kit - TSK-100",
        partNumber: "TSK-100-STD",
        quantity: 2,
        unitPrice: 650.00,
        totalPrice: 1300.00,
        category: "service_kit"
      },
      {
        id: "ITEM009",
        description: "Premium Transmission Fluid",
        partNumber: "PTF-4QT-SYN",
        quantity: 6,
        unitPrice: 45.00,
        totalPrice: 270.00,
        category: "fluid"
      }
    ],
    taxes: {
      salesTax: 148.50,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 81.50,
      method: "standard",
      trackingNumber: "STD456789123"
    },
    notes: "New customer first order",
    earnedCreditIds: ["CREDIT006"],
    relatedCreditMemos: []
  },
  {
    id: "INV005",
    customerId: "CUST001",
    customerName: "John Smith",
    date: "2024-02-20",
    dueDate: "2024-03-21",
    originalAmount: 1200.00,
    currentAmount: 1200.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "paid",
    paymentStatus: "paid",
    paymentDate: "2024-03-05",
    description: "Filter Kit Replacement Order",
    items: [
      {
        id: "ITEM010",
        description: "Premium Filter Kit - PFK-300",
        partNumber: "PFK-300-PREM",
        quantity: 4,
        unitPrice: 125.00,
        totalPrice: 500.00,
        category: "filter_kit"
      },
      {
        id: "ITEM011",
        description: "Gasket Set - GS-200",
        partNumber: "GS-200-COMP",
        quantity: 2,
        unitPrice: 85.00,
        totalPrice: 170.00,
        category: "gasket"
      }
    ],
    taxes: {
      salesTax: 99.00,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 431.00,
      method: "express",
      trackingNumber: "EXP789123456"
    },
    notes: "Rush order - damaged parts replacement",
    earnedCreditIds: ["CREDIT002"],
    relatedCreditMemos: ["CM002"]
  },
  {
    id: "INV006",
    customerId: "CUST002",
    customerName: "Sarah Johnson",
    date: "2024-02-28",
    dueDate: "2024-03-14",
    originalAmount: 3200.00,
    currentAmount: 3200.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "paid",
    paymentStatus: "paid",
    paymentDate: "2024-03-10",
    description: "Torque Converter Replacement",
    items: [
      {
        id: "ITEM012",
        description: "High Performance Torque Converter",
        partNumber: "HPTC-500-PERF",
        quantity: 2,
        unitPrice: 1400.00,
        totalPrice: 2800.00,
        category: "torque_converter"
      }
    ],
    taxes: {
      salesTax: 264.00,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 136.00,
      method: "freight",
      trackingNumber: "FRT555666777"
    },
    notes: "Defective unit replacement - credit issued",
    earnedCreditIds: ["CREDIT008"],
    relatedCreditMemos: ["CM003"]
  },
  {
    id: "INV007",
    customerId: "CUST003",
    customerName: "Mike Wilson",
    date: "2024-02-15",
    dueDate: "2024-04-01",
    originalAmount: 5500.00,
    currentAmount: 5500.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "pending",
    paymentStatus: "pending",
    paymentDate: "2024-02-20",
    description: "Fleet Maintenance Package",
    items: [
      {
        id: "ITEM013",
        description: "Fleet Service Kit - FSK-1000",
        partNumber: "FSK-1000-FLEET",
        quantity: 10,
        unitPrice: 450.00,
        totalPrice: 4500.00,
        category: "service_kit"
      }
    ],
    taxes: {
      salesTax: 371.25,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 628.75,
      method: "freight",
      trackingNumber: "FRT111222333"
    },
    notes: "Early payment - bonus credit earned",
    earnedCreditIds: ["CREDIT005"],
    relatedCreditMemos: []
  },
  {
    id: "INV008",
    customerId: "CUST001",
    customerName: "John Smith",
    date: "2024-03-20",
    dueDate: "2024-04-19",
    originalAmount: 5000.00,
    currentAmount: 5000.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "pending",
    paymentStatus: "partial",
    paymentDate: null,
    paidAmount: 4000.00,
    remainingAmount: 1000.00,
    description: "Transmission Overhaul Package",
    items: [
      {
        id: "ITEM016",
        description: "Complete Transmission Overhaul Kit",
        partNumber: "TOK-2000-COMP",
        quantity: 1,
        unitPrice: 4200.00,
        totalPrice: 4200.00,
        category: "overhaul_kit"
      },
      {
        id: "ITEM017",
        description: "Professional Installation Service",
        partNumber: "PIS-8HR-OVHL",
        quantity: 8,
        unitPrice: 75.00,
        totalPrice: 600.00,
        category: "labor"
      }
    ],
    taxes: {
      salesTax: 148.50,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 51.50,
      method: "freight",
      trackingNumber: "FRT444555666"
    },
    notes: "Customer paid $4000 of $5000 total - partial payment received",
    earnedCreditIds: [],
    relatedCreditMemos: []
  },
  {
    id: "INV009",
    customerId: "CUST004",
    customerName: "Lisa Chen",
    date: "2024-03-25",
    dueDate: "2024-04-24",
    originalAmount: 950.00,
    currentAmount: 950.00,
    creditsApplied: 0.00,
    appliedCreditIds: [],
    status: "pending",
    paymentStatus: "pending",
    paymentDate: null,
    description: "Referral Order Bonus",
    items: [
      {
        id: "ITEM014",
        description: "Standard Filter Kit",
        partNumber: "SFK-150-STD",
        quantity: 5,
        unitPrice: 75.00,
        totalPrice: 375.00,
        category: "filter_kit"
      },
      {
        id: "ITEM015",
        description: "Transmission Additive",
        partNumber: "TA-16OZ-SEAL",
        quantity: 12,
        unitPrice: 25.00,
        totalPrice: 300.00,
        category: "additive"
      }
    ],
    taxes: {
      salesTax: 78.38,
      taxRate: 8.25,
      taxExempt: false
    },
    shipping: {
      cost: 196.62,
      method: "standard",
      trackingNumber: "STD999888777"
    },
    notes: "Order placed after customer referral",
    earnedCreditIds: ["CREDIT010"],
    relatedCreditMemos: []
  }
];

module.exports = invoices;
