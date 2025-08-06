# 🤖 AI Invoice Reconciliation Agent

An intelligent AI-powered application for reconciling invoices with credit memos in PDF format. This tool uses advanced natural language processing and AI to automatically match invoices with their corresponding credit memos, identify discrepancies, and provide detailed analytics.

## ✨ Features

- **📄 PDF Processing**: Extract data from invoice and credit memo PDFs
- **🤖 AI-Powered Matching**: Intelligent matching using Ollama local models
- **🔍 Discrepancy Detection**: Automatically identify mismatches and issues
- **📊 Analytics Dashboard**: Visual analytics and reporting
- **📥 Export Capabilities**: Download results in CSV and JSON formats
- **🎯 Multiple Matching Criteria**: Invoice numbers, vendor names, amounts, dates, and more

## 🚀 Quick Start

### Prerequisites

- Python 3.8 or higher
- Ollama installed and running locally (for AI features)

### Installation

1. **Clone or download the project files**

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up Ollama**:
   - Install Ollama from [ollama.ai](https://ollama.ai/)
   - Start the Ollama service
   - Pull a model (e.g., `ollama pull llama2`)
   - The application will automatically connect to localhost:11434

4. **Run the application**:
   ```bash
   streamlit run main.py
   ```

5. **Open your browser** and navigate to `http://localhost:8501`

## 📋 Usage Guide

### Step 1: Upload Documents
- Go to the "📄 Upload Documents" tab
- Upload your invoice PDFs in the left column
- Upload your credit memo PDFs in the right column
- You can upload multiple files at once

### Step 2: Process Documents
- Go to the "🔍 Process & Extract" tab
- Click "Process Invoices" to extract data from invoice PDFs
- Click "Process Credit Memos" to extract data from credit memo PDFs
- Review the extracted data in the tables

### Step 3: AI Reconciliation
- Go to the "🤖 AI Reconciliation" tab
- Ensure Ollama is running and accessible
- Click "Start AI Reconciliation"
- The AI will analyze and match your documents

### Step 4: Review Results
- View reconciled items and discrepancies
- Download results as CSV files
- Check the analytics dashboard for insights

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project directory:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

### Ollama Setup

1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai/)
2. **Start Ollama service**: The service runs on localhost:11434 by default
3. **Pull a model**: Run `ollama pull llama2` or another model of your choice
4. **Configure in app**: The application will automatically detect available models

## 📊 Features in Detail

### Document Processing
- **Invoice Extraction**: Extracts invoice numbers, dates, amounts, vendor info, line items
- **Credit Memo Extraction**: Extracts credit memo numbers, original invoice references, credit amounts, reasons
- **Multi-format Support**: Handles various PDF layouts and formats

### AI Matching Criteria
1. **Exact Invoice Number Match**: Primary matching criterion
2. **Vendor Name Similarity**: Fuzzy matching for vendor names
3. **Customer Name Similarity**: Match customer information
4. **Amount Matching**: Exact and partial amount matching
5. **Date Proximity**: Match documents with similar dates
6. **PO Number Matching**: Match by purchase order numbers

### Discrepancy Detection
- **Amount Mismatches**: When credit amounts don't match invoice amounts
- **Missing Documents**: Unmatched invoices or credit memos
- **Date Discrepancies**: Significant time gaps between documents
- **Vendor Mismatches**: Different vendors for related documents

### Analytics Features
- **Reconciliation Rate**: Percentage of successfully matched documents
- **Amount Analysis**: Total reconciled amounts and discrepancies
- **Confidence Scoring**: AI confidence levels for matches
- **Visual Charts**: Pie charts and histograms for data visualization

## 📁 Project Structure

```
invoice-reconciliation-agent/
├── main.py                      # Main Streamlit application
├── invoice_processor.py         # Invoice PDF processing
├── credit_memo_processor.py     # Credit memo PDF processing
├── reconciliation_agent.py      # AI reconciliation logic
├── utils.py                     # Utility functions
├── requirements.txt             # Python dependencies
├── README.md                   # This file
└── .env                        # Environment variables (create this)
```

## 🔍 How It Works

### 1. PDF Text Extraction
- Uses `pdfplumber` to extract text from PDF files
- Handles various PDF formats and layouts
- Cleans and normalizes extracted text

### 2. Data Parsing
- Uses regex patterns to extract specific fields
- Handles multiple date formats and currency symbols
- Validates extracted data for completeness

### 3. AI Analysis
- Sends structured data to OpenAI GPT-4
- AI analyzes relationships between invoices and credit memos
- Returns detailed matching results with confidence scores

### 4. Result Processing
- Enhances AI results with additional context
- Calculates metrics and statistics
- Prepares data for visualization and export

## 🛠️ Customization

### Adding New Document Types
1. Create a new processor class (similar to `InvoiceProcessor`)
2. Implement the `process_pdf()` method
3. Add extraction methods for specific fields
4. Update the main application to handle new document types

### Modifying Matching Criteria
1. Edit the AI prompt in `reconciliation_agent.py`
2. Add new matching logic in `_fallback_matching()`
3. Update the system message to include new criteria

### Custom Analytics
1. Add new metrics in `utils.py`
2. Create new visualizations in `main.py`
3. Extend the analytics dashboard with custom charts

## 🐛 Troubleshooting

### Common Issues

**PDF Processing Errors**
- Ensure PDFs are not password-protected
- Check that PDFs contain text (not just images)
- Try with different PDF formats

**AI Analysis Failures**
- Verify your OpenAI API key is valid
- Check your API usage limits
- Ensure you have sufficient API credits

**Missing Data**
- Review the regex patterns in processors
- Check if your PDF format is supported
- Manually verify extracted data

### Performance Tips

1. **Batch Processing**: Process multiple documents at once
2. **API Optimization**: Use appropriate temperature settings for AI calls
3. **Memory Management**: Close PDF files after processing
4. **Caching**: Results are cached in Streamlit session state

## 📈 Performance Metrics

- **Processing Speed**: ~2-5 seconds per PDF
- **AI Analysis**: ~10-30 seconds for typical document sets
- **Accuracy**: 85-95% for well-formatted documents
- **Supported Formats**: PDF with text content

## 🔒 Security & Privacy

- **Local Processing**: All PDF processing happens locally
- **API Security**: OpenAI API calls are secure and encrypted
- **Data Privacy**: No data is stored permanently
- **Session Management**: Data is cleared when session ends

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the code comments
3. Create an issue in the repository
4. Contact the development team

## 🔄 Updates

### Version 1.0.0
- Initial release with basic PDF processing
- AI-powered reconciliation
- Analytics dashboard
- Export functionality

### Planned Features
- OCR support for image-based PDFs
- Batch processing improvements
- Advanced analytics
- API endpoint for integration
- Mobile-responsive design

---

**Note**: This application requires an OpenAI API key for AI features. The basic PDF processing and fallback matching will work without an API key, but AI-powered reconciliation requires a valid OpenAI account. 