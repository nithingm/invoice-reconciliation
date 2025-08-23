# Comptivia Invoice Reconciliation Chatbot

A modern web portal for an automobile transmission remanufacturing company, featuring an AI-powered chatbot for customer support, invoice management, and credit validation.

This project was analyzed, and a detailed code review report is available in `CODE_REVIEW_REPORT.md`.

## Features

- **Modern Web Portal**: A clean and responsive user interface with a professional design.
- **AI-Powered Chat Support**: A real-time chat system that uses a large language model to understand and respond to customer inquiries.
- **Credit Validation System**: Automated validation of customer credits and invoice processing.
- **Invoice Management**: Tools to track and manage transmission service invoices.
- **Comprehensive Customer Data**: A dedicated page to view customer information, credits, and invoices, which also serves as a testing ground for the chatbot.

## Technology Stack

### Frontend

- React 18 with functional components and hooks
- Tailwind CSS for modern styling
- React Router for navigation
- Socket.io client for real-time chat
- Heroicons for consistent iconography
- Chart.js and Recharts for data visualization

### Backend

- Node.js with Express.js
- Socket.io for real-time communication
- RESTful API for customer data
- MongoDB for data persistence with Mongoose for object data modeling

### AI & Microservices

- **Hybrid LLM Architecture**: Supports multiple AI providers through intelligent routing
  - **Ollama LLM Integration**: Utilizes local large language models for natural language processing
  - **Google Gemini Integration**: Cloud-based AI processing via Python microservice
  - **Other LLMs**: Support for OpenAI, Anthropic, and other providers
- **Python AI Microservice**: Handles Gemini model processing and precise financial calculations
- **Intelligent Intent Recognition**: Automatically routes user messages to the appropriate handler based on intent analysis
- **Smart Model Routing**: Automatically selects the best processing path based on selected AI model

## Architecture Overview

The application is divided into three main parts:

1.  **Frontend**: A React single-page application that provides the user interface.
2.  **Backend**: A Node.js server that handles API requests, manages the real-time chat, and communicates with the Python microservice.
3.  **Python Microservice**: A Python script that performs complex business logic calculations.

For a more detailed explanation of the architecture, please refer to the `server/README_ARCHITECTURE.md` file.

## AI Configuration

The system supports multiple AI providers through a hybrid architecture:

### Available AI Providers

- **Ollama (Local)**: Free, local LLM processing (handled by Node.js)
- **Google Gemini**: Latest 2.0/2.5 models via Python LiteLLM service
- **OpenAI**: GPT models for enterprise use (handled by Node.js)
- **Anthropic**: Claude models for specialized tasks (handled by Node.js)

### AI Model Selection

1. Go to **Settings → AI Settings** in the application
2. Select your preferred AI provider
3. Choose a specific model
4. Click **Save Changes**

### Gemini Setup

For Gemini models, you'll need:
1. A Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. The key configured in your `.env` file as `GEMINI_API_KEY`
3. The Python AI service running on port 5001

**Supported Gemini Models:**
- `gemini-2.5-flash-lite` (most cost-efficient, default)
- `gemini-2.0-flash` (balanced performance)
- `gemini-2.0-flash-lite` (low latency)

For detailed Gemini setup instructions, see `GEMINI_INTEGRATION.md`.

## Troubleshooting

### Common Issues

#### Python AI Service Won't Start
- Ensure Python 3.7+ is installed and in PATH
- Check that all dependencies are installed: `npm run install:python`
- Verify your `.env` file contains `GEMINI_API_KEY`

#### Gemini Models Not Working
- Check if the Python AI service is running on port 5001
- Verify your Gemini API key is valid
- Test the service: `curl http://localhost:5001/health`

#### Port Conflicts
- Change the Python service port in `.env`: `PYTHON_AI_PORT=5002`
- Stop conflicting services using the same ports
- Default ports: Node.js (5000), Python AI (5001), React (3000)

### Getting Help

- Check the logs in all terminal windows
- Review `GEMINI_INTEGRATION.md` for detailed setup
- Test individual components separately
- Verify network connectivity for cloud AI services
- Run test scripts: `npm run test:gemini` or `npm run test:gemini-litellm`

## 🧹 **Optimized Dependencies**

This project has been optimized to remove unused dependencies:

**Removed (not needed):**
- `@google/generative-ai` - Using Python LiteLLM instead
- `bcryptjs` - No authentication implemented yet
- `jsonwebtoken` - No JWT authentication implemented yet

**Kept (actively used):**
- `mongoose` - For MongoDB object data modeling
- `litellm` - For Node.js non-Gemini models (Ollama, etc.)
- `axios` - For Python service communication
- `express`, `socket.io` - Core server functionality
- `body-parser`, `cors`, `dotenv` - Essential middleware

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm
- Python 3.7 or higher
- MongoDB
- Gemini API key (for Gemini models)

### Installation

1.  **Clone the repository**

    ```bash
    git clone <repository-url>
    cd invoice-reconciliation
    ```

2.  **Install dependencies**

    This command will install the dependencies for both the root project and the client.

    ```bash
    npm run install-all
    ```

3.  **Configure environment variables**

    Create a `.env` file in the root directory:
    ```bash
    GEMINI_API_KEY=your_gemini_api_key_here
    ```

4.  **Start the development servers**

    ```bash
    npm run dev
    ```

    This will concurrently start:
    - The backend server on `http://localhost:5000`
    - The frontend development server on `http://localhost:3000`
    - The Python AI service on `http://localhost:5001`

    **Alternative startup options:**
    ```bash
    # Start only backend + AI service (no frontend)
    npm run dev:ai-only
    
    # Start backend + AI service in production mode
    npm run start:with-ai
    
    # Start services individually
    npm run server          # Backend only
    npm run client          # Frontend only
    npm run python-ai       # AI service only
    ```

## Project Structure

```
invoice-reconciliation/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   ├── package.json
│   └── tailwind.config.js
├── python_microservice/    # Python AI microservice
│   ├── ai_service.py       # AI service for Gemini models
│   ├── credit_validator.py # Credit validation logic
│   ├── start_ai_service.py # AI service startup script
│   ├── start_ai_service.bat # Windows startup script
│   ├── start_ai_service.sh # Unix/Linux startup script
│   └── requirements.txt    # Python dependencies
├── server/                 # Node.js backend
│   ├── config/
│   ├── data/
│   ├── handlers/
│   ├── routes/
│   ├── services/
│   └── index.js           # Server entry point
├── tests/                  # Test files (optional)
│   ├── test-gemini.js      # Node.js LiteLLM tests
│   ├── test-gemini-litellm.js # LiteLLM configuration tests
│   ├── test-gemini-google.js # Google AI SDK tests (requires reinstall)
│   └── README.md           # Test documentation
├── package.json            # Root package.json (cleaned up)
├── .env                    # Environment variables
└── README.md
```

## API Endpoints

### Customer Routes

-   `GET /api/customers`: Get all customers with a summary of their credits and invoices.
-   `GET /api/customers/:id`: Get detailed information for a specific customer, including their credits and purchase history.

### Chat (via Socket.IO)

The chat functionality is handled in real-time using Socket.IO. The main events are:

-   `chat_message`: Sent from the client to the server with the user's message.
-   `ai_response`: Sent from the server to the client with the AI's response.

## Chatbot Usage

The chatbot is designed to understand a variety of requests related to invoices, credits, and customer information. Here are some examples of messages you can use to test the chatbot:

-   "What is the credit balance for CUST001?"
-   "Apply $500 credit to invoice INV001"
-   "Show me the purchase history for John Smith"
-   "What is the status of invoice INV002?"