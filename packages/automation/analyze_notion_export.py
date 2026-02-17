"""
Analyze Notion Export Content
Extracts and summarizes key information from the exported HTML files
"""

import os
import re
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict
import json

class NotionHTMLParser(HTMLParser):
    """Extract text content from Notion HTML exports"""
    
    def __init__(self):
        super().__init__()
        self.current_tag = None
        self.title = ""
        self.headers = []
        self.paragraphs = []
        self.tables = []
        self.in_table = False
        self.current_table_row = []
        self.current_cell = ""
        self.in_title = False
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        if tag == 'h1':
            attr_dict = dict(attrs)
            if 'class' in attr_dict and 'page-title' in attr_dict['class']:
                self.in_title = True
        elif tag in ['h2', 'h3']:
            self.current_cell = ""
        elif tag == 'table':
            self.in_table = True
            self.current_table = []
        elif tag == 'tr' and self.in_table:
            self.current_table_row = []
        elif tag in ['td', 'th'] and self.in_table:
            self.current_cell = ""
    
    def handle_endtag(self, tag):
        if tag == 'h1' and self.in_title:
            self.in_title = False
        elif tag in ['h2', 'h3']:
            if self.current_cell.strip():
                self.headers.append(self.current_cell.strip())
        elif tag == 'p':
            if self.current_cell.strip():
                self.paragraphs.append(self.current_cell.strip())
            self.current_cell = ""
        elif tag in ['td', 'th'] and self.in_table:
            self.current_table_row.append(self.current_cell.strip())
            self.current_cell = ""
        elif tag == 'tr' and self.in_table:
            if self.current_table_row:
                if not hasattr(self, 'current_table'):
                    self.current_table = []
                self.current_table.append(self.current_table_row)
            self.current_table_row = []
        elif tag == 'table':
            if hasattr(self, 'current_table') and self.current_table:
                self.tables.append(self.current_table)
            self.in_table = False
        self.current_tag = None
    
    def handle_data(self, data):
        text = data.strip()
        if text:
            if self.in_title:
                self.title += text + " "
            else:
                self.current_cell += text + " "

def extract_content(html_file):
    """Extract structured content from HTML file"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parser = NotionHTMLParser()
        parser.feed(content)
        
        return {
            'title': parser.title.strip(),
            'headers': parser.headers,
            'paragraphs': parser.paragraphs[:5],  # First 5 paragraphs
            'tables': parser.tables[:3] if parser.tables else [],  # First 3 tables
            'has_tables': len(parser.tables) > 0
        }
    except Exception as e:
        return {'error': str(e), 'title': Path(html_file).stem}

def categorize_files(directory):
    """Categorize files by emoji/icon prefix and topic"""
    categories = defaultdict(list)
    
    for file in Path(directory).glob('*.html'):
        name = file.stem
        
        # Extract emoji prefix if present
        emoji_match = re.match(r'^([^\w\s]+)\s*', name)
        emoji = emoji_match.group(1) if emoji_match else '📄'
        
        # Categorize by keywords
        name_lower = name.lower()
        if 'memora' in name_lower:
            category = 'Memora Product'
        elif 'companion' in name_lower:
            category = 'AI Companion'
        elif 'gamif' in name_lower or 'game' in name_lower:
            category = 'Gamification'
        elif 'clinic' in name_lower:
            category = 'Clinic Solutions'
        elif 'consent' in name_lower or 'privacy' in name_lower:
            category = 'Privacy & Consent'
        elif 'ux' in name_lower or 'ui' in name_lower or 'design' in name_lower:
            category = 'UX/UI Design'
        elif 'technical' in name_lower or 'architecture' in name_lower or 'sdk' in name_lower:
            category = 'Technical Architecture'
        elif 'prompt' in name_lower:
            category = 'Prompt Engineering'
        elif 'test' in name_lower or 'qa' in name_lower:
            category = 'Testing & QA'
        elif 'onboard' in name_lower:
            category = 'Onboarding'
        elif 'faq' in name_lower:
            category = 'FAQs'
        elif 'business' in name_lower or 'revenue' in name_lower or 'financial' in name_lower:
            category = 'Business & Finance'
        elif 'legal' in name_lower or 'compliance' in name_lower:
            category = 'Legal & Compliance'
        elif 'product' in name_lower and 'portfolio' in name_lower:
            category = 'Product Strategy'
        elif 'accessibility' in name_lower:
            category = 'Accessibility'
        elif 'okr' in name_lower or 'milestone' in name_lower:
            category = 'Goals & Milestones'
        else:
            category = 'Other'
        
        categories[category].append({
            'name': name,
            'emoji': emoji,
            'path': str(file)
        })
    
    return categories

def analyze_export(directory):
    """Main analysis function"""
    print("=" * 80)
    print("NZILA NOTION EXPORT ANALYSIS")
    print("=" * 80)
    
    # Get all HTML files
    html_files = list(Path(directory).glob('*.html'))
    csv_files = list(Path(directory).glob('*.csv'))
    
    print(f"\n📊 OVERVIEW:")
    print(f"   Total HTML files: {len(html_files)}")
    print(f"   Total CSV files: {len(csv_files)}")
    
    # Categorize files
    categories = categorize_files(directory)
    
    print(f"\n📁 CONTENT CATEGORIES:")
    for category, files in sorted(categories.items(), key=lambda x: len(x[1]), reverse=True):
        print(f"\n   {category} ({len(files)} files):")
        for file in files[:5]:  # Show first 5 in each category
            print(f"      {file['emoji']} {file['name'][:70]}")
        if len(files) > 5:
            print(f"      ... and {len(files) - 5} more")
    
    # Analyze key documents
    print(f"\n\n{'=' * 80}")
    print("KEY DOCUMENTS ANALYSIS")
    print("=" * 80)
    
    key_patterns = [
        'Portfolio Overview',
        'Product Summary',
        'Experience Pillars',
        'Companion Manifesto',
        'Gamification',
        'Technical Architecture'
    ]
    
    for pattern in key_patterns:
        matching_files = [f for f in html_files if pattern.lower() in f.stem.lower()]
        if matching_files:
            print(f"\n\n📌 {pattern.upper()} DOCUMENTS:")
            for file in matching_files[:3]:  # Analyze first 3
                content = extract_content(file)
                print(f"\n   File: {file.name}")
                print(f"   Title: {content.get('title', 'N/A')}")
                
                if content.get('headers'):
                    print(f"   Headers: {', '.join(content['headers'][:5])}")
                
                if content.get('tables'):
                    print(f"   Tables: {len(content['tables'])} table(s) found")
                    # Show first table if available
                    if content['tables']:
                        table = content['tables'][0]
                        if table and len(table) > 0:
                            print(f"   First table has {len(table)} rows")
                            if len(table[0]) > 0:
                                print(f"   Columns: {', '.join([str(c)[:30] for c in table[0][:5]])}")
    
    # CSV analysis
    if csv_files:
        print(f"\n\n{'=' * 80}")
        print("CSV DATA FILES")
        print("=" * 80)
        
        for csv_file in csv_files:
            print(f"\n   📊 {csv_file.name}")
            try:
                with open(csv_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if lines:
                        headers = lines[0].strip().split(',')
                        print(f"      Columns: {', '.join(headers[:10])}")
                        print(f"      Rows: {len(lines) - 1}")
            except Exception as e:
                print(f"      Error reading: {e}")
    
    # Generate summary stats
    print(f"\n\n{'=' * 80}")
    print("SUMMARY STATISTICS")
    print("=" * 80)
    
    total_categories = len(categories)
    top_categories = sorted(categories.items(), key=lambda x: len(x[1]), reverse=True)[:5]
    
    print(f"\n   Total Categories: {total_categories}")
    print(f"\n   Top 5 Categories by File Count:")
    for i, (cat, files) in enumerate(top_categories, 1):
        print(f"      {i}. {cat}: {len(files)} files")
    
    print("\n" + "=" * 80)
    print("ANALYSIS COMPLETE")
    print("=" * 80)
    
    return {
        'total_html': len(html_files),
        'total_csv': len(csv_files),
        'categories': {k: len(v) for k, v in categories.items()},
        'top_categories': [(cat, len(files)) for cat, files in top_categories]
    }

if __name__ == "__main__":
    export_dir = r"d:\APPS\nzila-automation\notion_export\part1"
    
    if os.path.exists(export_dir):
        results = analyze_export(export_dir)
        
        # Save results to JSON
        output_file = r"d:\APPS\nzila-automation\notion_analysis_results.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2)
        
        print(f"\n📁 Results saved to: {output_file}")
    else:
        print(f"❌ Directory not found: {export_dir}")
