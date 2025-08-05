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
</style>
""", unsafe_allow_html=True)

def main():
    # Header
    st.markdown('<h1 class="main-header">🤖 AI Invoice Reconciliation Agent</h1>', unsafe_allow_html=True)
    
    # Sidebar
    st.sidebar.title("📋 Configuration")
    
    # API Key input
    api_key = st.sidebar.text_input(
        "OpenAI API Key",
        type="password",
        help="Enter your OpenAI API key to enable AI processing"
    )
    
    if not api_key:
        st.sidebar.warning("⚠️ Please enter your OpenAI API key to use AI features")
        api_key = os.getenv("OPENAI_API_KEY")
    
    # Initialize processors
    invoice_processor = InvoiceProcessor()
    credit_memo_processor = CreditMemoProcessor()
    reconciliation_agent = ReconciliationAgent(api_key) if api_key else None
    
    # Main content
    tab1, tab2, tab3, tab4 = st.tabs(["📄 Upload Documents", "🔍 Process & Extract", "🤖 AI Reconciliation", "📊 Analytics"])
    
    with tab1:
        st.header("📄 Document Upload")
        
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
    
    with tab2:
        st.header("🔍 Document Processing")
        
        if 'processed_invoices' not in st.session_state:
            st.session_state.processed_invoices = []
        if 'processed_credit_memos' not in st.session_state:
            st.session_state.processed_credit_memos = []
        
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("📋 Invoice Processing")
            if uploaded_invoices and st.button("Process Invoices", type="primary"):
                with st.spinner("Processing invoices..."):
                    for file in uploaded_invoices:
                        try:
                            invoice_data = invoice_processor.process_pdf(file)
                            st.session_state.processed_invoices.append(invoice_data)
                            st.success(f"✅ Processed: {file.name}")
                        except Exception as e:
                            st.error(f"❌ Error processing {file.name}: {str(e)}")
            
            if st.session_state.processed_invoices:
                st.write(f"📊 {len(st.session_state.processed_invoices)} invoices processed")
                invoice_df = pd.DataFrame(st.session_state.processed_invoices)
                st.dataframe(invoice_df.head())
        
        with col2:
            st.subheader("📝 Credit Memo Processing")
            if uploaded_credit_memos and st.button("Process Credit Memos", type="primary"):
                with st.spinner("Processing credit memos..."):
                    for file in uploaded_credit_memos:
                        try:
                            credit_memo_data = credit_memo_processor.process_pdf(file)
                            st.session_state.processed_credit_memos.append(credit_memo_data)
                            st.success(f"✅ Processed: {file.name}")
                        except Exception as e:
                            st.error(f"❌ Error processing {file.name}: {str(e)}")
            
            if st.session_state.processed_credit_memos:
                st.write(f"📊 {len(st.session_state.processed_credit_memos)} credit memos processed")
                credit_memo_df = pd.DataFrame(st.session_state.processed_credit_memos)
                st.dataframe(credit_memo_df.head())
    
    with tab3:
        st.header("🤖 AI Reconciliation")
        
        if not reconciliation_agent:
            st.warning("⚠️ Please enter your OpenAI API key to use AI reconciliation features")
            return
        
        if st.session_state.processed_invoices and st.session_state.processed_credit_memos:
            if st.button("Start AI Reconciliation", type="primary"):
                with st.spinner("AI is analyzing and reconciling documents..."):
                    try:
                        reconciliation_results = reconciliation_agent.reconcile_documents(
                            st.session_state.processed_invoices,
                            st.session_state.processed_credit_memos
                        )
                        
                        st.session_state.reconciliation_results = reconciliation_results
                        st.success("✅ AI reconciliation completed!")
                        
                        # Display results
                        display_reconciliation_results(reconciliation_results)
                        
                    except Exception as e:
                        st.error(f"❌ Error during AI reconciliation: {str(e)}")
        else:
            st.info("ℹ️ Please process both invoices and credit memos before starting AI reconciliation")
    
    with tab4:
        st.header("📊 Analytics Dashboard")
        
        if 'reconciliation_results' in st.session_state:
            display_analytics(st.session_state.reconciliation_results)
        else:
            st.info("ℹ️ Complete AI reconciliation to view analytics")

def display_reconciliation_results(results):
    st.subheader("📋 Reconciliation Results")
    
    # Summary metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Invoices", len(results.get('invoices', [])))
    
    with col2:
        st.metric("Total Credit Memos", len(results.get('credit_memos', [])))
    
    with col3:
        st.metric("Reconciled Items", len(results.get('reconciled_items', [])))
    
    with col4:
        st.metric("Discrepancies", len(results.get('discrepancies', [])))
    
    # Detailed results
    if results.get('reconciled_items'):
        st.subheader("✅ Reconciled Items")
        reconciled_df = pd.DataFrame(results['reconciled_items'])
        st.dataframe(reconciled_df)
        
        # Download button
        csv = reconciled_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Reconciled Items CSV",
            data=csv,
            file_name="reconciled_items.csv",
            mime="text/csv"
        )
    
    if results.get('discrepancies'):
        st.subheader("⚠️ Discrepancies Found")
        discrepancies_df = pd.DataFrame(results['discrepancies'])
        st.dataframe(discrepancies_df)
        
        # Download button
        csv = discrepancies_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Discrepancies CSV",
            data=csv,
            file_name="discrepancies.csv",
            mime="text/csv"
        )

def display_analytics(results):
    st.subheader("📊 Analytics Dashboard")
    
    # Create visualizations
    col1, col2 = st.columns(2)
    
    with col1:
        # Reconciliation status pie chart
        if results.get('reconciled_items') and results.get('discrepancies'):
            labels = ['Reconciled', 'Discrepancies']
            values = [len(results['reconciled_items']), len(results['discrepancies'])]
            
            fig = px.pie(
                values=values,
                names=labels,
                title="Reconciliation Status",
                color_discrete_sequence=['#2E8B57', '#FF6B6B']
            )
            st.plotly_chart(fig, use_container_width=True)
    
    with col2:
        # Amount distribution
        if results.get('reconciled_items'):
            reconciled_df = pd.DataFrame(results['reconciled_items'])
            if 'amount' in reconciled_df.columns:
                fig = px.histogram(
                    reconciled_df,
                    x='amount',
                    title="Amount Distribution",
                    nbins=20
                )
                st.plotly_chart(fig, use_container_width=True)
    
    # Summary statistics
    if results.get('reconciled_items'):
        reconciled_df = pd.DataFrame(results['reconciled_items'])
        st.subheader("📈 Summary Statistics")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            if 'amount' in reconciled_df.columns:
                st.metric("Total Reconciled Amount", f"${reconciled_df['amount'].sum():,.2f}")
        
        with col2:
            if 'amount' in reconciled_df.columns:
                st.metric("Average Amount", f"${reconciled_df['amount'].mean():,.2f}")
        
        with col3:
            st.metric("Total Items", len(reconciled_df))

if __name__ == "__main__":
    main() 