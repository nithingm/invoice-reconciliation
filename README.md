# TransMaster Pro - Transmission Remanufacturing Portal

A modern web portal for an automobile transmission remanufacturing company featuring AI-powered customer support for invoice management and credit validation.

## Features

- **Modern Web Portal**: Clean, responsive design with professional automotive industry theme
- **AI-Powered Chat Support**: Real-time chat system for customer inquiries
- **Credit Validation System**: Automated validation of customer credits and invoice processing
- **Invoice Management**: Track and manage transmission service invoices
- **Company Information**: Comprehensive about us, services, and contact sections
- **Mobile Responsive**: Optimized for all device sizes

## Technology Stack

### Frontend
- React 18 with functional components and hooks
- Tailwind CSS for modern styling
- React Router for navigation
- Socket.io client for real-time chat
- Heroicons for consistent iconography
- React Hot Toast for notifications
- Framer Motion for animations

### Backend
- Node.js with Express.js
- Socket.io for real-time communication
- RESTful API endpoints
- Mock database for development
- CORS enabled for cross-origin requests

### AI & Microservices
- **Ollama LLM Integration**: llama3.2:3b model for natural language processing
- **Python Microservice**: Precise financial calculations and credit validation
- **Intelligent Intent Recognition**: Automatic routing based on customer message analysis
- **Credit Memo Generation**: Automated draft creation with approval workflows
- **Multi-step Conversations**: Context-aware dialogue management

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd TestPortal
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Start the development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend development server on http://localhost:3000

### Alternative: Start servers separately

**Backend:**
```bash
npm run server
```

**Frontend:**
```bash
npm run client
```

## Project Structure

```
TestPortal/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── server/                # Node.js backend
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── package.json          # Root package.json
├── .env                  # Environment variables
└── README.md
```

## AI Chat System

The AI chat system uses **Ollama LLM (llama3.2:3b)** with **Python microservices** to process sophisticated customer inquiries about:

### Core Features
- **Invoice Validation**: Check invoice status and details
- **Credit Validation**: Validate available credits and expiry dates
- **Account Information**: Customer account details and history
- **General Support**: Transmission service questions

### Advanced Features (NEW)
- **Quantity Discrepancy Handling**: Process missing/incorrect quantities received
- **Damage Report Processing**: Handle damaged items and generate credit memos
- **Automated Credit Memo Generation**: Create draft credit memos with approval workflow
- **Flexible Credit Options**: Apply to current invoice, future account, or issue refunds
- **Payment Status Awareness**: Different options based on whether invoice is paid

### Supported Scenarios

#### A. Quantity Discrepancy (Common)
**Customer:** "Invoice INV-2025-001 billed 100 units but we received 95. Fix?"
**Bot:** "Got it — you received 95 instead of 100 on invoice INV-2025-001. I suggest issuing a credit memo for 5 units ($250.00 + tax). Approve draft credit memo?"
**Customer:** "Yes, draft it."
**Bot:** Generates draft credit memo, shows amounts & reason. "Approve to apply credit to the invoice or issue a refund?"
**Customer:** "Apply to invoice."
**Bot:** Applies credit in accounting, updates invoice balance, sends vendor notification, logs action.

#### B. Damage Reports
**Customer:** "We received a damaged 4L60E transmission on invoice INV-2025-002. The case is cracked."
**Bot:** Processes damage report, generates credit memo for full item value, offers refund or account credit options.

#### C. Already Paid Invoices
**Customer:** "We already paid INV-2025-001 in full, but need credit for returned goods."
**Bot:** "Options: (1) Apply credit to future invoice, (2) Issue refund. Which do you prefer?"
**Customer:** "Apply to future invoice."
**Bot:** Creates credit memo with status applied_to_account, notifies AP team and vendor.

### Chat Message Examples

#### Credit Applications
- "Apply $150 credit to invoice INV001 for customer CUST001"
- "I need to use my credits on invoice INV002"

#### Quantity Issues
- "Invoice INV-2025-001 billed 100 units but we received 95"
- "We're short 10 transmission filter kits on our last order"

#### Damage Reports
- "The 4L60E transmission arrived damaged with a cracked case"
- "Invoice INV002 transmission has oil leak damage"

#### Credit Memo Approvals
- "Yes, apply credit to my account for future purchases"
- "Apply credit to current invoice"
- "Issue refund please"

## Mock Data

The system includes comprehensive mock data for testing all scenarios:

### Customers
- **CUST001: John Smith** (Credits: $5,250 active, $300 expired)
  - Email: john.smith@email.com
  - Phone: (555) 123-4567
  - Active Credits: $5,000 + $250 (expires 2025-2026)
- **CUST002: Sarah Johnson** (Credits: $550 active)
  - Email: sarah.johnson@email.com
  - Phone: (555) 987-6543
  - Active Credits: $400 + $150 (expires 2025-2026)
- **CUST003: Mike Wilson** (Credits: $350 active, $100 expired)
  - Email: mike.wilson@email.com
  - Phone: (555) 456-7890

### Invoices
- **INV001**: $2,800 - 4L60E Remanufactured (CUST001) - Pending
- **INV002**: $3,500 - 4L80E Remanufactured (CUST002) - Pending
- **INV003**: $1,800 - Transmission Rebuild (CUST003) - Pending
- **INV004**: $950 - Maintenance Package (CUST001) - Pending

### Test Scenarios (Pre-loaded)
- **INV-2025-001**: $5,000 - Bulk Filter Kits (CUST001) - **PAID** *(Missing 5 units)*
- **INV-2025-002**: $3,200 - 4L60E Transmission (CUST002) - **PAID** *(Damaged on arrival)*

### Credit Memos & Damage Reports
- **CM001**: Draft credit memo for missing quantity (INV-2025-001)
- **DR001**: Damage report for cracked transmission (INV-2025-002)

## API Endpoints

### Chat Routes
- `POST /api/chat/message` - Send chat message (REST API - currently redirects to Socket.io)
- `GET /api/chat/history/:customerId` - Get chat history
- **Socket.io Events**:
  - `chat_message` - Send message to AI system
  - `ai_response` - Receive AI-generated response

### Customer Routes
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/:id/credits` - Get customer credits
- `GET /api/customers/:id/invoices` - Get customer invoices
- `GET /api/customers` - Get all customers with credit summary

### Python Microservice Actions
- `validate` - Validate credit application
- `apply` - Apply credits to invoice
- `balance` - Get credit balance
- `history` - Get purchase history
- `quantity_discrepancy` - Process missing quantity reports
- `damage_report` - Process damage claims
- `approve_credit_memo` - Approve and process credit memos

## Deployment

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

## Testing

### Prerequisites for AI Features
1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Pull the model**:
   ```bash
   ollama pull llama3.2:3b
   ```
3. **Start Ollama server**:
   ```bash
   ollama serve
   ```

### Run Tests
```bash
# Test all new features
node test_new_features.js

# Test Python microservice directly
node test_python_service.py

# Test specific message types
node test_messages.js
```

### Manual Testing via Chat Interface
1. Start the development servers: `npm run dev`
2. Open http://localhost:3000
3. Click the chat button (bottom right)
4. Try these test messages:

**Quantity Discrepancy:**
```
Invoice INV-2025-001 billed 100 units but we received 95. Fix?
```

**Damage Report:**
```
We received a damaged 4L60E transmission on invoice INV-2025-002. The case is cracked.
```

**Credit Memo Approval:**
```
Yes, apply credit to my account for future purchases
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-domain.com
JWT_SECRET=your-super-secret-jwt-key
```

## Future Enhancements

- Database integration (MongoDB/PostgreSQL)
- User authentication and authorization
- Real AI integration (OpenAI GPT)
- Payment processing integration
- Email notifications
- Advanced reporting and analytics
- Mobile app development

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Email: support@transmasterpro.com
- Phone: (555) 123-4567
- Use the AI chat system in the application
