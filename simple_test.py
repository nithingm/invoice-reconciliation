#!/usr/bin/env python3
"""
Simple Test for Sample Documents

This script verifies that the sample PDF files were created successfully
and can be opened and read.
"""

import os
from pathlib import Path

def test_sample_files():
    """Test that sample PDF files exist and can be opened."""
    print("🧪 Simple Test for Sample Documents")
    print("=" * 50)
    
    # Sample documents directory
    samples_dir = "sample_documents"
    
    if not os.path.exists(samples_dir):
        print(f"❌ Error: Sample documents directory '{samples_dir}' not found!")
        print("Please run 'python create_sample_documents.py' first.")
        return
    
    # Get all PDF files
    pdf_files = list(Path(samples_dir).glob("*.pdf"))
    
    if not pdf_files:
        print(f"❌ Error: No PDF files found in '{samples_dir}' directory!")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files in '{samples_dir}' directory")
    
    # Separate invoice and credit memo files
    invoice_files = [f for f in pdf_files if "invoice" in f.name.lower()]
    credit_memo_files = [f for f in pdf_files if "credit_memo" in f.name.lower()]
    
    print(f"📄 Invoice files: {len(invoice_files)}")
    print(f"📄 Credit memo files: {len(credit_memo_files)}")
    print()
    
    # Test file accessibility
    print("🔍 Testing file accessibility...")
    
    all_files_ok = True
    
    for pdf_file in pdf_files:
        try:
            # Try to open and read the file
            with open(pdf_file, 'rb') as f:
                content = f.read(1024)  # Read first 1KB
                file_size = len(content)
                print(f"  ✅ {pdf_file.name}: {file_size} bytes (readable)")
        except Exception as e:
            print(f"  ❌ {pdf_file.name}: Error - {str(e)}")
            all_files_ok = False
    
    print()
    
    if all_files_ok:
        print("🎉 All sample PDF files are accessible and readable!")
        print()
        print("📋 Summary:")
        print(f"  - Total PDF files: {len(pdf_files)}")
        print(f"  - Invoice files: {len(invoice_files)}")
        print(f"  - Credit memo files: {len(credit_memo_files)}")
        print()
        print("✅ Sample documents are ready for testing!")
        print()
        print("Next steps:")
        print("1. Run 'streamlit run main.py' to launch the web interface")
        print("2. Upload the sample PDF files through the web interface")
        print("3. Or run 'python demo.py' to see the demo with sample data")
    else:
        print("❌ Some files have issues. Please check the errors above.")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    test_sample_files() 