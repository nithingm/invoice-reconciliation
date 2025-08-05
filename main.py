"""
Invoice Reconciliation System
Main entry point for the application
"""

from src.data_ingestion import DataIngestionPipeline
from src.credit_verifier import CreditVerifier
from src.logging_system import LoggingSystem
from src.output_handler import OutputHandler
from src.llm_analyzer import LLMAnalyzer
import pandas as pd
import argparse
import os

def main():
    parser = argparse.ArgumentParser(description='Invoice Reconciliation System')
    parser.add_argument('--invoices', default='test_data/sample_invoices.csv', help='Path to invoices CSV file')
    parser.add_argument('--credit_memos', default='test_data/sample_credit_memos.csv', help='Path to credit memos CSV file')
    parser.add_argument('--credit_usage', default='test_data/sample_credit_usage.csv', help='Path to credit usage CSV file')
    parser.add_argument('--output_dir', default='output', help='Output directory for results')
    
    args = parser.parse_args()
    
    # Initialize components
    logger = LoggingSystem()
    ingestion = DataIngestionPipeline(logger)
    credit_verifier = CreditVerifier(logger)
    output_handler = OutputHandler(logger)
    
    try:
        # Step 1: Data Ingestion
        print("Loading and normalizing data...")
        invoices_df, credit_memos_df, credit_usage_df = ingestion.load_csv_files(
            args.invoices, args.credit_memos, args.credit_usage
        )
        
        # Process invoices
        logger.log_info("Processing invoices...")
        results = []
        for _, invoice in invoices_df.iterrows():
            result = credit_verifier.verify_credit(invoice, credit_memos_df, credit_usage_df)
            logger.log_verification_attempt(invoice['invoice_id'], result)
            results.append(result)
        
        # Separate verified and manual review cases
        verified_results = [r for r in results if r['verified']]
        manual_review_cases = [r for r in results if not r['verified']]
        
        # LLM Analysis for manual review cases
        if manual_review_cases:
            logger.log_info(f"Running LLM analysis on {len(manual_review_cases)} manual review cases...")
            llm_analyzer = LLMAnalyzer(logger)
            
            # Test Ollama connection
            if llm_analyzer.test_connection():
                logger.log_info("Ollama connection successful")
                analyzed_cases = llm_analyzer.analyze_manual_review_cases(manual_review_cases, credit_memos_df)
                
                # Update results with LLM analysis
                all_results = verified_results + analyzed_cases
            else:
                logger.log_warning("Ollama not available - skipping LLM analysis")
                all_results = results
        else:
            all_results = results
        
        # Generate outputs
        logger.log_info("Generating outputs...")
        output_handler.generate_outputs(all_results, args.output_dir)
        
        print(f"Processing complete. Results saved to {args.output_dir}/")
        
    except Exception as e:
        logger.log_error(f"Application error: {str(e)}")
        raise

if __name__ == "__main__":
    main()
