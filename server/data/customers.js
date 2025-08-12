/**
 * Customers Mock Data
 * Contains detailed customer information with relationships to credits and invoices
 */

const customers = [
  {
    id: "CUST001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1-555-0101",
    joinDate: "2023-01-15",
    address: {
      street: "123 Main Street",
      city: "Houston",
      state: "TX",
      zipCode: "77001",
      country: "USA"
    },
    company: "Smith Auto Repair",
    businessType: "Auto Repair Shop",
    creditIds: ["CREDIT001", "CREDIT002", "CREDIT007"],
    invoiceIds: ["INV001", "INV005", "INV009"],
    status: "active",
    creditLimit: 10000,
    paymentTerms: "Net 30",
    preferredContact: "email",
    notes: "Long-term customer, always pays on time"
  },
  {
    id: "CUST002",
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    phone: "+1-555-0102",
    joinDate: "2023-03-22",
    address: {
      street: "456 Oak Avenue",
      city: "Dallas",
      state: "TX",
      zipCode: "75201",
      country: "USA"
    },
    company: "Johnson Transmission Services",
    businessType: "Transmission Specialist",
    creditIds: ["CREDIT003", "CREDIT008"],
    invoiceIds: ["INV002", "INV006", "INV010"],
    status: "active",
    creditLimit: 15000,
    paymentTerms: "Net 15",
    preferredContact: "phone",
    notes: "High-volume customer, bulk discounts applied"
  },
  {
    id: "CUST003",
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    phone: "+1-555-0103",
    joinDate: "2023-02-10",
    address: {
      street: "789 Pine Road",
      city: "Austin",
      state: "TX",
      zipCode: "73301",
      country: "USA"
    },
    company: "Wilson Fleet Services",
    businessType: "Fleet Maintenance",
    creditIds: ["CREDIT004", "CREDIT005", "CREDIT009"],
    invoiceIds: ["INV003", "INV007", "INV011"],
    status: "active",
    creditLimit: 25000,
    paymentTerms: "Net 45",
    preferredContact: "email",
    notes: "Fleet customer, requires detailed invoicing"
  },
  {
    id: "CUST004",
    name: "Lisa Chen",
    email: "lisa.chen@email.com",
    phone: "+1-555-0104",
    joinDate: "2023-04-05",
    address: {
      street: "321 Elm Street",
      city: "San Antonio",
      state: "TX",
      zipCode: "78201",
      country: "USA"
    },
    company: "Chen Automotive",
    businessType: "Independent Mechanic",
    creditIds: ["CREDIT006", "CREDIT010"],
    invoiceIds: ["INV004", "INV008", "INV012"],
    status: "active",
    creditLimit: 8000,
    paymentTerms: "Net 30",
    preferredContact: "email",
    notes: "New customer, building relationship"
  },
  {
    id: "CUST005",
    name: "Robert Davis",
    email: "robert.davis@email.com",
    phone: "+1-555-0105",
    joinDate: "2022-11-18",
    address: {
      street: "654 Maple Drive",
      city: "Fort Worth",
      state: "TX",
      zipCode: "76101",
      country: "USA"
    },
    company: "Davis Truck Repair",
    businessType: "Heavy Duty Repair",
    creditIds: ["CREDIT011", "CREDIT012"],
    invoiceIds: ["INV013", "INV014"],
    status: "active",
    creditLimit: 20000,
    paymentTerms: "Net 30",
    preferredContact: "phone",
    notes: "Specializes in heavy-duty transmissions"
  }
];

module.exports = customers;
