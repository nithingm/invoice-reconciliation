import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime
import os
from dotenv import load_dotenv
from invoice_processor import InvoiceProcessor
from credit_memo_processor import CreditMemoProcessor
from reconciliation_agent import ReconciliationAgent
from utils import create_download_link
from ai_config import get_available_providers, get_default_provider, create_ai_client

# Load environment variables
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="AI Invoice Reconciliation Agent",
    page_icon="📊",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .main-header {
        font-size: 2.5rem;
        font-weight: bold;
        color: #1f77b4;
        text-align: center;
        margin-bottom: 2rem;
    }
    .metric-card {
        background-color: #f0f2f6;
        padding: 1rem;
        border-radius: 0.5rem;
        border-left: 4px solid #1f77b4;
    }
    .success-message {
        background-color: #d4edda;
        color: #155724;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #c3e6cb;
    }
    .warning-message {
        background-color: #fff3cd;
        color: #856404;
        padding: 1rem;
        border-radius: 0.5rem;
        border: 1px solid #ffeaa7;
    }
    .upload-section {
        background-color: #f8f9fa;
        padding: 2rem;
        border-radius: 1rem;
        margin: 1rem 0;
    }
    .results-section {
        background-color: #ffffff;
        padding: 2rem;
        border-radius: 1rem;
        border: 2px solid #e9ecef;
        margin: 1rem 0;
    }
</style>
""", unsafe_allow_html=True)

def initialize_session_state():
    """Initialize session state variables."""
    if 'processed_invoices' not in st.session_state:
        st.session_state.processed_invoices = []
    if 'processed_credit_memos' not in st.session_state:
        st.session_state.processed_credit_memos = []
    if 'reconciliation_results' not in st.session_state:
        st.session_state.reconciliation_results = None
    if 'show_results' not in st.session_state:
        st.session_state.show_results = False

def reset_session_state():
    """Reset session state to initial state."""
    st.session_state.processed_invoices = []
    st.session_state.processed_credit_memos = []
    st.session_state.reconciliation_results = None
    st.session_state.show_results = False

def process_documents(invoices, credit_memos, ai_provider, ai_model):
    """Process uploaded documents and perform reconciliation."""
    try:
        # Initialize processors
        invoice_processor = InvoiceProcessor()
        credit_memo_processor = CreditMemoProcessor()
        
        # Process invoices
        processed_invoices = []
        for file in invoices:
            try:
                invoice_data = invoice_processor.process_pdf(file)
                processed_invoices.append(invoice_data)
            except Exception as e:
                st.error(f"Error processing invoice {file.name}: {str(e)}")
        
        # Process credit memos
        processed_credit_memos = []
        for file in credit_memos:
            try:
                credit_memo_data = credit_memo_processor.process_pdf(file)
                processed_credit_memos.append(credit_memo_data)
            except Exception as e:
                st.error(f"Error processing credit memo {file.name}: {str(e)}")
        
        # Perform reconciliation
        if processed_invoices and processed_credit_memos:
            reconciliation_agent = ReconciliationAgent(
                model=ai_model,
                provider=ai_provider
            )
            
            results = reconciliation_agent.reconcile_documents(processed_invoices, processed_credit_memos)
            return processed_invoices, processed_credit_memos, results
        else:
            st.error("No valid documents were processed. Please check your PDF files.")
            return [], [], None
            
    except Exception as e:
        st.error(f"Error during processing: {str(e)}")
        return [], [], None

def display_upload_section():
    """Display the document upload section."""
    st.markdown('<div class="upload-section">', unsafe_allow_html=True)
    st.header("📄 Upload Documents")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.subheader("📋 Invoices")
        uploaded_invoices = st.file_uploader(
            "Upload Invoice PDFs",
            type=['pdf'],
            accept_multiple_files=True,
            help="Upload multiple invoice PDF files"
        )
        
        if uploaded_invoices:
            st.success(f"✅ {len(uploaded_invoices)} invoice(s) uploaded")
            for i, file in enumerate(uploaded_invoices):
                st.write(f"📄 {file.name}")
    
    with col2:
        st.subheader("📝 Credit Memos")
        uploaded_credit_memos = st.file_uploader(
            "Upload Credit Memo PDFs",
            type=['pdf'],
            accept_multiple_files=True,
            help="Upload multiple credit memo PDF files"
        )
        
        if uploaded_credit_memos:
            st.success(f"✅ {len(uploaded_credit_memos)} credit memo(s) uploaded")
            for i, file in enumerate(uploaded_credit_memos):
                st.write(f"📝 {file.name}")
    
    st.markdown('</div>', unsafe_allow_html=True)
    
    return uploaded_invoices, uploaded_credit_memos

def display_ai_configuration():
    """Display AI configuration in sidebar."""
    st.sidebar.title("🤖 AI Configuration")
    
    # Provider selection
    available_providers = get_available_providers()
    default_provider = get_default_provider()
    
    selected_provider = st.sidebar.selectbox(
        "AI Provider",
        options=available_providers,
        index=available_providers.index(default_provider) if default_provider in available_providers else 0,
        help="Select the AI provider to use"
    )
    
    # Model selection based on provider
    if selected_provider == "ollama":
        # For Ollama, allow custom URL and model
        ollama_url = st.sidebar.text_input(
            "Ollama Server URL",
            value="http://localhost:11434",
            help="URL of your Ollama server"
        )
        
        # Try to get available models from Ollama
        try:
            import requests
            response = requests.get(f"{ollama_url}/api/tags", timeout=5)
            if response.status_code == 200:
                models = [model['name'] for model in response.json().get('models', [])]
                default_model = models[0] if models else "llama2"
            else:
                models = ["llama2", "llama2:13b", "mistral", "codellama"]
                default_model = "llama2"
        except:
            models = ["llama2", "llama2:13b", "mistral", "codellama"]
            default_model = "llama2"
    else:
        # For other providers, use predefined models
        from ai_config import AI_CONFIGS
        models = AI_CONFIGS[selected_provider]["model"].split(",") if "," in AI_CONFIGS[selected_provider]["model"] else [AI_CONFIGS[selected_provider]["model"]]
        default_model = models[0]
        ollama_url = None
    
    selected_model = st.sidebar.selectbox(
        "AI Model",
        options=models,
        index=0,
        help=f"Select the {selected_provider} model to use"
    )
    
    # Test AI connection
    if st.sidebar.button("🔗 Test AI Connection"):
        try:
            ai_client = create_ai_client(
                provider=selected_provider,
                model=selected_model,
                base_url=ollama_url if selected_provider == "ollama" else None
            )
            if ai_client.is_server_available():
                st.sidebar.success(f"✅ {selected_provider.upper()} connection successful")
            else:
                st.sidebar.error(f"❌ Cannot connect to {selected_provider}")
        except Exception as e:
            st.sidebar.error(f"❌ Connection failed: {str(e)}")
    
    return selected_provider, selected_model

def display_reconciliation_results(results):
    """Display reconciliation results."""
    st.markdown('<div class="results-section">', unsafe_allow_html=True)
    st.header("📊 Reconciliation Results")
    
    if not results:
        st.warning("No reconciliation results to display.")
        st.markdown('</div>', unsafe_allow_html=True)
        return
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        matched_pairs = results.get('matched_pairs', [])
        st.metric("Matched Pairs", len(matched_pairs))
    
    with col2:
        unmatched_invoices = results.get('unmatched_invoices', [])
        st.metric("Unmatched Invoices", len(unmatched_invoices))
    
    with col3:
        unmatched_credit_memos = results.get('unmatched_credit_memos', [])
        st.metric("Unmatched Credit Memos", len(unmatched_credit_memos))
    
    with col4:
        discrepancies = results.get('discrepancies', [])
        st.metric("Discrepancies", len(discrepancies))
    
    # Matched pairs
    if matched_pairs:
        st.subheader("✅ Matched Pairs")
        matched_df = pd.DataFrame(matched_pairs)
        st.dataframe(matched_df, use_container_width=True)
        
        # Download matched pairs
        csv = matched_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Matched Pairs (CSV)",
            data=csv,
            file_name="matched_pairs.csv",
            mime="text/csv"
        )
    
    # Unmatched invoices
    if unmatched_invoices:
        st.subheader("⚠️ Unmatched Invoices")
        unmatched_inv_df = pd.DataFrame(unmatched_invoices)
        st.dataframe(unmatched_inv_df, use_container_width=True)
    
    # Unmatched credit memos
    if unmatched_credit_memos:
        st.subheader("⚠️ Unmatched Credit Memos")
        unmatched_cm_df = pd.DataFrame(unmatched_credit_memos)
        st.dataframe(unmatched_cm_df, use_container_width=True)
    
    # Discrepancies
    if discrepancies:
        st.subheader("🚨 Discrepancies")
        for disc in discrepancies:
            st.warning(f"**{disc.get('type', 'Unknown')}**: {disc.get('description', 'No description')}")
    
    # AI Analysis
    ai_analysis = results.get('ai_analysis', {})
    if ai_analysis and 'error' not in ai_analysis:
        st.subheader("🤖 AI Analysis")
        
        if 'summary' in ai_analysis:
            st.info(f"**Summary**: {ai_analysis['summary']}")
        
        if 'key_insights' in ai_analysis:
            st.write("**Key Insights:**")
            for insight in ai_analysis['key_insights']:
                st.write(f"• {insight}")
        
        if 'potential_issues' in ai_analysis:
            st.write("**Potential Issues:**")
            for issue in ai_analysis['potential_issues']:
                st.write(f"• {issue}")
        
        if 'recommendations' in ai_analysis:
            st.write("**Recommendations:**")
            for rec in ai_analysis['recommendations']:
                st.write(f"• {rec}")
    
    # Analytics
    analytics = results.get('analytics', {})
    if analytics:
        st.subheader("📈 Analytics")
        
        # Create charts
        if 'total_amounts' in analytics:
            fig = px.bar(
                x=['Invoices', 'Credit Memos'],
                y=[analytics['total_amounts']['invoices'], analytics['total_amounts']['credit_memos']],
                title="Total Amounts Comparison",
                labels={'x': 'Document Type', 'y': 'Amount ($)'}
            )
            st.plotly_chart(fig, use_container_width=True)
        
        if 'match_confidence_distribution' in analytics:
            confidences = analytics['match_confidence_distribution']
            fig = px.histogram(
                x=confidences,
                title="Match Confidence Distribution",
                labels={'x': 'Confidence Score (%)', 'y': 'Count'}
            )
            st.plotly_chart(fig, use_container_width=True)
    
    st.markdown('</div>', unsafe_allow_html=True)

def main():
    # Initialize session state
    initialize_session_state()
    
    # Header
    st.markdown('<h1 class="main-header">🤖 AI Invoice Reconciliation Agent</h1>', unsafe_allow_html=True)
    
    # Display AI configuration in sidebar
    ai_provider, ai_model = display_ai_configuration()
    
    # Refresh button
    if st.button("🔄 Refresh", type="secondary"):
        reset_session_state()
        st.rerun()
    
    # Main content
    if not st.session_state.show_results:
        # Upload section
        uploaded_invoices, uploaded_credit_memos = display_upload_section()
        
        # Start reconciliation button
        if uploaded_invoices and uploaded_credit_memos:
            if st.button("🚀 Start Reconciliation", type="primary", use_container_width=True):
                with st.spinner("Processing documents and performing reconciliation..."):
                    # Process documents
                    processed_invoices, processed_credit_memos, results = process_documents(
                        uploaded_invoices, uploaded_credit_memos, ai_provider, ai_model
                    )
                    
                    if results:
                        # Store results in session state
                        st.session_state.processed_invoices = processed_invoices
                        st.session_state.processed_credit_memos = processed_credit_memos
                        st.session_state.reconciliation_results = results
                        st.session_state.show_results = True
                        st.rerun()
                    else:
                        st.error("Reconciliation failed. Please check your documents and try again.")
        else:
            st.info("Please upload both invoices and credit memos to start reconciliation.")
    
    else:
        # Display results
        display_reconciliation_results(st.session_state.reconciliation_results)
        
        # Back to upload button
        if st.button("📄 Upload New Documents", type="primary", use_container_width=True):
            reset_session_state()
            st.rerun()

if __name__ == "__main__":
    main() 