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

The AI chat system processes customer inquiries about:

- **Invoice Validation**: Check invoice status and details
- **Credit Validation**: Validate available credits and expiry dates
- **Account Information**: Customer account details and history
- **General Support**: Transmission service questions

### Chat Message Format

To validate credits, customers should provide:
- Invoice ID (e.g., "INV001")
- Customer ID (e.g., "CUST001") 
- Credit amount to apply (e.g., "$150")

Example: "Validate $150 credit for invoice INV001, customer CUST001"

## Mock Data

The system includes mock data for testing:

### Customers
- CUST001: John Smith (Credits: $150 active, $75 expired)
- CUST002: Sarah Johnson (Credits: $200 active)

### Invoices
- INV001: $2500 for 4L60E Remanufactured (CUST001)
- INV002: $3200 for 4L80E Remanufactured (CUST002)

## API Endpoints

### Chat Routes
- `POST /api/chat/message` - Send chat message
- `GET /api/chat/history/:customerId` - Get chat history

### Customer Routes
- `GET /api/customers/:id` - Get customer details
- `GET /api/customers/:id/credits` - Get customer credits
- `GET /api/customers/:id/invoices` - Get customer invoices

## Deployment

### Production Build
```bash
npm run build
```

### Start Production Server
```bash
npm start
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
