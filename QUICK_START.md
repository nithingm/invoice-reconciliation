# 🚀 Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Set Up Ollama (Optional but Recommended)
Install Ollama from [ollama.ai](https://ollama.ai/) and pull a model:
```bash
# Install Ollama (follow instructions on ollama.ai)
# Then pull a model:
ollama pull llama2
```

The application will automatically connect to localhost:11434.

### 3. Run the Application
```bash
streamlit run main.py
```

Then open your browser to `http://localhost:8501`

## 🧪 Test Your Installation
```bash
python test_installation.py
python test_ollama_integration.py
```

## 🎯 Try the Demo
```bash
python demo.py
```

## 📋 What You Can Do

### Upload Documents
- Upload invoice PDFs
- Upload credit memo PDFs
- Process multiple files at once

### AI-Powered Reconciliation
- Automatic matching of invoices with credit memos
- Intelligent discrepancy detection
- Confidence scoring for matches

### Analytics & Reporting
- Visual analytics dashboard
- Export results to CSV/JSON
- Detailed reconciliation reports

## 🔧 Features

✅ **PDF Processing**: Extract data from invoice and credit memo PDFs  
✅ **AI Matching**: Intelligent matching using Ollama local models  
✅ **Discrepancy Detection**: Automatically identify mismatches  
✅ **Analytics Dashboard**: Visual charts and metrics  
✅ **Export Capabilities**: Download results in multiple formats  
✅ **Multiple Criteria**: Invoice numbers, vendors, amounts, dates  

## 🆘 Need Help?

- Check the full `README.md` for detailed documentation
- Run `python test_installation.py` to verify setup
- See `demo.py` for usage examples

## 📁 Project Structure

```
invoice-reconciliation-agent/
├── main.py                      # Main Streamlit app
├── invoice_processor.py         # Invoice PDF processing
├── credit_memo_processor.py     # Credit memo PDF processing
├── reconciliation_agent.py      # AI reconciliation logic
├── utils.py                     # Utility functions
├── demo.py                      # Demo script
├── test_installation.py         # Installation test
├── requirements.txt             # Dependencies
└── README.md                   # Full documentation
```

---

**Ready to reconcile your invoices? Start with `streamlit run main.py`!** 