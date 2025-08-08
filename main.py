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
from ai_config import get_available_providers, get_default_provider, create_ai_client, print_available_configs

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
    
    # AI Configuration
    st.sidebar.subheader("🤖 AI Configuration")
    
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
    
    # Initialize processors
    invoice_processor = InvoiceProcessor()
    credit_memo_processor = CreditMemoProcessor()
    reconciliation_agent = ReconciliationAgent(
        model=selected_model,
        base_url=ollama_url if selected_provider == "ollama" else None,
        provider=selected_provider
    )
    
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
        
        # Check AI availability
        ai_status = "🟢 Available" if reconciliation_agent.ai_client.is_server_available() else "🔴 Not Available"
        st.info(f"AI Model Status: {ai_status}")
        
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
        st.metric("Matched Pairs", len(results.get('matched_pairs', [])))
    
    with col2:
        st.metric("Discrepancies", len(results.get('discrepancies', [])))
    
    with col3:
        st.metric("Unmatched Invoices", len(results.get('unmatched_invoices', [])))
    
    with col4:
        st.metric("Unmatched Credit Memos", len(results.get('unmatched_credit_memos', [])))
    
    # AI Analysis if available
    if 'ai_analysis' in results:
        ai_analysis = results['ai_analysis']
        st.subheader("🤖 AI Analysis")
        
        if 'error' not in ai_analysis:
            # Display AI insights
            if 'key_insights' in ai_analysis:
                st.write("**🔍 Key Insights:**")
                for insight in ai_analysis['key_insights']:
                    st.write(f"• {insight}")
            
            if 'potential_issues' in ai_analysis:
                st.write("**⚠️ Potential Issues:**")
                for issue in ai_analysis['potential_issues']:
                    st.write(f"• {issue}")
            
            if 'recommendations' in ai_analysis:
                st.write("**💡 Recommendations:**")
                for rec in ai_analysis['recommendations']:
                    st.write(f"• {rec}")
            
            if 'summary' in ai_analysis:
                st.write(f"**📝 Summary:** {ai_analysis['summary']}")
            
            if 'confidence_score' in ai_analysis:
                st.metric("AI Confidence", f"{ai_analysis['confidence_score']*100:.1f}%")
        else:
            st.warning(f"AI Analysis Error: {ai_analysis['error']}")
    
    # Analytics if available
    if 'analytics' in results:
        analytics = results['analytics']
        st.subheader("📈 Analytics")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Match Rate", f"{analytics.get('match_rate', 0):.1f}%")
        with col2:
            st.metric("Average Confidence", f"{analytics.get('average_confidence', 0):.1f}%")
        with col3:
            st.metric("Total Amount Reconciled", f"${analytics.get('total_invoice_amount', 0):,.2f}")
    
    # Matched pairs
    if results.get('matched_pairs'):
        st.subheader("✅ Valid Matches")
        
        # Create a summary table for matched pairs
        matched_summary = []
        for pair in results['matched_pairs']:
            invoice = pair['invoice']
            credit_memo = pair['credit_memo']
            matched_summary.append({
                'Invoice Number': invoice.get('invoice_number', ''),
                'Credit Memo Number': credit_memo.get('credit_memo_number', ''),
                'Customer': invoice.get('customer_name', ''),
                'Invoice Amount': f"${invoice.get('total_amount', 0):,.2f}",
                'Credit Amount': f"${credit_memo.get('credit_amount', 0):,.2f}",
                'Confidence': f"{pair.get('match_confidence', 0):.1f}%",
                'Match Reason': pair.get('match_reason', '')
            })
        
        matched_df = pd.DataFrame(matched_summary)
        st.dataframe(matched_df)
        
        # Download button
        csv = matched_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Matched Pairs CSV",
            data=csv,
            file_name="matched_pairs.csv",
            mime="text/csv"
        )
    
    # Discrepancies
    if results.get('discrepancies'):
        st.subheader("⚠️ Discrepancies Found")
        
        # Create a summary table for discrepancies
        discrepancy_summary = []
        for disc in results['discrepancies']:
            discrepancy_summary.append({
                'Type': disc.get('type', ''),
                'Severity': disc.get('severity', ''),
                'Description': disc.get('description', ''),
                'Invoice Number': disc.get('invoice_number', ''),
                'Credit Memo Number': disc.get('credit_memo_number', '')
            })
        
        discrepancies_df = pd.DataFrame(discrepancy_summary)
        st.dataframe(discrepancies_df)
        
        # Download button
        csv = discrepancies_df.to_csv(index=False)
        st.download_button(
            label="📥 Download Discrepancies CSV",
            data=csv,
            file_name="discrepancies.csv",
            mime="text/csv"
        )
    
    # Unmatched invoices
    if results.get('unmatched_invoices'):
        st.subheader("❌ Unmatched Invoices")
        unmatched_inv_summary = []
        for inv in results['unmatched_invoices']:
            unmatched_inv_summary.append({
                'Invoice Number': inv.get('invoice_number', ''),
                'Customer': inv.get('customer_name', ''),
                'Amount': f"${inv.get('total_amount', 0):,.2f}",
                'Date': inv.get('invoice_date', '')
            })
        
        unmatched_inv_df = pd.DataFrame(unmatched_inv_summary)
        st.dataframe(unmatched_inv_df)
    
    # Unmatched credit memos
    if results.get('unmatched_credit_memos'):
        st.subheader("❌ Unmatched Credit Memos")
        unmatched_cm_summary = []
        for cm in results['unmatched_credit_memos']:
            unmatched_cm_summary.append({
                'Credit Memo Number': cm.get('credit_memo_number', ''),
                'Customer': cm.get('customer_name', ''),
                'Amount': f"${cm.get('credit_amount', 0):,.2f}",
                'Original Invoice': cm.get('original_invoice_number', ''),
                'Date': cm.get('credit_memo_date', '')
            })
        
        unmatched_cm_df = pd.DataFrame(unmatched_cm_summary)
        st.dataframe(unmatched_cm_df)

def display_analytics(results):
    st.subheader("📊 Analytics Dashboard")
    
    # Check if analytics are available
    if 'analytics' not in results:
        st.info("ℹ️ No analytics data available. Complete reconciliation to view analytics.")
        return
    
    analytics = results['analytics']
    
    # Create visualizations
    col1, col2 = st.columns(2)
    
    with col1:
        # Match rate and confidence
        st.subheader("📈 Performance Metrics")
        
        # Match rate gauge
        match_rate = analytics.get('match_rate', 0)
        st.metric("Match Rate", f"{match_rate:.1f}%")
        
        # Confidence gauge
        avg_confidence = analytics.get('average_confidence', 0)
        st.metric("Average Confidence", f"{avg_confidence:.1f}%")
        
        # Amount metrics
        total_invoice_amount = analytics.get('total_invoice_amount', 0)
        total_credit_amount = analytics.get('total_credit_amount', 0)
        amount_difference = analytics.get('amount_difference', 0)
        
        st.metric("Total Invoice Amount", f"${total_invoice_amount:,.2f}")
        st.metric("Total Credit Amount", f"${total_credit_amount:,.2f}")
        st.metric("Amount Difference", f"${amount_difference:,.2f}")
    
    with col2:
        # Discrepancy breakdown
        st.subheader("⚠️ Discrepancy Analysis")
        
        discrepancy_breakdown = analytics.get('discrepancy_breakdown', {})
        high_severity = discrepancy_breakdown.get('high_severity', 0)
        medium_severity = discrepancy_breakdown.get('medium_severity', 0)
        low_severity = discrepancy_breakdown.get('low_severity', 0)
        total_discrepancies = discrepancy_breakdown.get('total', 0)
        
        st.metric("High Severity", high_severity)
        st.metric("Medium Severity", medium_severity)
        st.metric("Low Severity", low_severity)
        st.metric("Total Discrepancies", total_discrepancies)
    
    # Create charts
    if total_discrepancies > 0:
        st.subheader("📊 Discrepancy Distribution")
        
        # Create pie chart for discrepancy severity
        severity_data = {
            'High Severity': high_severity,
            'Medium Severity': medium_severity,
            'Low Severity': low_severity
        }
        
        fig = px.pie(
            values=list(severity_data.values()),
            names=list(severity_data.keys()),
            title="Discrepancy Severity Distribution",
            color_discrete_sequence=['#ff4444', '#ffaa00', '#44aa44']
        )
        st.plotly_chart(fig, use_container_width=True)
    
    # Reconciliation summary
    st.subheader("📋 Reconciliation Summary")
    
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Matched Pairs", len(results.get('matched_pairs', [])))
    
    with col2:
        st.metric("Unmatched Invoices", len(results.get('unmatched_invoices', [])))
    
    with col3:
        st.metric("Unmatched Credit Memos", len(results.get('unmatched_credit_memos', [])))
    
    with col4:
        st.metric("Total Discrepancies", total_discrepancies)

if __name__ == "__main__":
    main() 