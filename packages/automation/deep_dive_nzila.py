"""
Deep Dive Analysis: Nzila Strategic Knowledge Validation
This script extracts and validates understanding of core Nzila concepts
"""

import os
import re
from pathlib import Path
from html.parser import HTMLParser
from collections import defaultdict

class DetailedContentExtractor(HTMLParser):
    """Extract detailed text content from HTML, preserving structure"""
    
    def __init__(self):
        super().__init__()
        self.content_blocks = []
        self.current_block = {'type': None, 'text': '', 'level': 0}
        self.in_body = False
        
    def handle_starttag(self, tag, attrs):
        if tag == 'article':
            self.in_body = True
        elif self.in_body:
            if tag == 'h1':
                self._save_block()
                self.current_block = {'type': 'h1', 'text': '', 'level': 1}
            elif tag == 'h2':
                self._save_block()
                self.current_block = {'type': 'h2', 'text': '', 'level': 2}
            elif tag == 'h3':
                self._save_block()
                self.current_block = {'type': 'h3', 'text': '', 'level': 3}
            elif tag == 'p':
                if self.current_block['type'] not in ['h1', 'h2', 'h3']:
                    self._save_block()
                    self.current_block = {'type': 'p', 'text': '', 'level': 0}
            elif tag == 'li':
                self._save_block()
                self.current_block = {'type': 'li', 'text': '', 'level': 1}
            elif tag in ['td', 'th']:
                self.current_block['text'] += ' | '
    
    def handle_endtag(self, tag):
        if tag == 'article':
            self._save_block()
            self.in_body = False
        elif tag in ['h1', 'h2', 'h3', 'p', 'li']:
            self._save_block()
            
    def handle_data(self, data):
        if self.in_body:
            text = data.strip()
            if text:
                self.current_block['text'] += text + ' '
    
    def _save_block(self):
        if self.current_block['text'].strip():
            self.content_blocks.append({
                'type': self.current_block['type'],
                'text': self.current_block['text'].strip(),
                'level': self.current_block['level']
            })
        self.current_block = {'type': None, 'text': '', 'level': 0}

def extract_detailed_content(html_file):
    """Extract detailed structured content"""
    try:
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()
        
        parser = DetailedContentExtractor()
        parser.feed(content)
        
        return parser.content_blocks
    except Exception as e:
        return []

def analyze_key_strategic_docs(export_dir):
    """Deep dive into key strategic documents"""
    
    print("=" * 100)
    print("NZILA STRATEGIC KNOWLEDGE VALIDATION")
    print("=" * 100)
    
    # Find and analyze the Product Portfolio Overview
    portfolio_file = None
    for file in Path(export_dir).glob('*Portfolio Overview*.html'):
        portfolio_file = file
        break
    
    if portfolio_file:
        print("\n\n📊 PRODUCT PORTFOLIO (2025-2028)")
        print("=" * 100)
        blocks = extract_detailed_content(portfolio_file)
        
        products_section = False
        for block in blocks:
            text = block['text']
            if 'Product' in text and 'Purpose' in text:
                products_section = True
            if products_section and '|' in text and len(text) > 50:
                print(f"   {text[:200]}")
                if 'Strategic' in text:
                    products_section = False
    
    # Analyze Memora Experience Pillars
    pillars_files = list(Path(export_dir).glob('*Experience Pillars*.html'))
    if pillars_files:
        print("\n\n🌱 MEMORA EXPERIENCE PILLARS")
        print("=" * 100)
        blocks = extract_detailed_content(pillars_files[0])
        
        for block in blocks:
            if block['type'] in ['h2', 'h3'] and any(word in block['text'] for word in ['Sustainable', 'Relational', 'Cognitive', 'Caregiver', 'Trust']):
                print(f"\n   {block['text']}")
            elif any(word in block['text'] for word in ['Engagement', 'Technology', 'Lightness', 'Empowerment', 'Design']):
                if len(block['text']) > 100 and len(block['text']) < 500:
                    print(f"      → {block['text'][:300]}")
    
    # Analyze AI Companion Manifesto
    manifesto_files = list(Path(export_dir).glob('*Companion Manifesto*.html'))
    if manifesto_files:
        print("\n\n🤖 AI COMPANION MANIFESTO")
        print("=" * 100)
        blocks = extract_detailed_content(manifesto_files[0])
        
        key_sections = ['Purpose', 'Role', 'Voice', 'Boundaries', 'Ethics', 'Behavioral']
        for block in blocks:
            if block['type'] in ['h2', 'h3'] and any(word in block['text'] for word in key_sections):
                print(f"\n   {block['text']}")
            elif block['type'] == 'p' and any(word in block['text'] for word in key_sections):
                if 50 < len(block['text']) < 400:
                    print(f"      → {block['text'][:300]}")
    
    # Analyze Gamification Ethics
    ethics_files = list(Path(export_dir).glob('*Gamification Ethics*.html'))
    if ethics_files:
        print("\n\n⚖️ GAMIFICATION ETHICS PROTOCOL")
        print("=" * 100)
        blocks = extract_detailed_content(ethics_files[0])
        
        for block in blocks:
            if block['type'] in ['h2', 'h3']:
                if any(word in block['text'] for word in ['Purpose', 'Principles', 'Prohibited', 'Consent', 'Safeguards']):
                    print(f"\n   {block['text']}")
            elif 'prohibited' in block['text'].lower() or 'never' in block['text'].lower():
                if 30 < len(block['text']) < 300:
                    print(f"      ❌ {block['text'][:250]}")
    
    # Analyze Technical Architecture
    arch_files = list(Path(export_dir).glob('*Technical Architecture Diagram*.html'))
    if arch_files:
        print("\n\n🏗️ TECHNICAL ARCHITECTURE")
        print("=" * 100)
        blocks = extract_detailed_content(arch_files[0])
        
        for block in blocks:
            if block['type'] in ['h2', 'h3']:
                print(f"\n   {block['text']}")
            elif any(word in block['text'] for word in ['layer', 'component', 'service', 'API']):
                if 50 < len(block['text']) < 400:
                    print(f"      → {block['text'][:300]}")
    
    print("\n\n" + "=" * 100)
    print("KEY STRATEGIC INSIGHTS")
    print("=" * 100)
    
    # Analyze OKRs from CSV
    okr_files = list(Path(export_dir).glob('*OKR*.csv'))
    if okr_files:
        print("\n📍 OBJECTIVES & KEY RESULTS:")
        for okr_file in okr_files:
            print(f"\n   {okr_file.stem}:")
            try:
                with open(okr_file, 'r', encoding='utf-8') as f:
                    lines = f.readlines()
                    if len(lines) > 1:
                        headers = lines[0].strip().split(',')
                        for i, line in enumerate(lines[1:6], 1):  # First 5 OKRs
                            fields = line.strip().split(',')
                            if len(fields) >= 2:
                                print(f"      {i}. {fields[0][:80]}")
            except Exception as e:
                print(f"      Error: {e}")
    
    # Analyze Projects from CSV
    project_files = list(Path(export_dir).glob('Projects*.csv'))
    if project_files:
        print("\n\n🚀 ACTIVE PROJECTS:")
        try:
            with open(project_files[0], 'r', encoding='utf-8') as f:
                lines = f.readlines()
                if len(lines) > 1:
                    for i, line in enumerate(lines[1:], 1):
                        fields = line.strip().split(',')
                        if len(fields) >= 1:
                            print(f"   {i}. {fields[0][:60]}")
        except Exception as e:
            print(f"      Error: {e}")
    
    print("\n\n" + "=" * 100)
    print("VALIDATION COMPLETE - DEMONSTRATE YOUR MASTERY!")
    print("=" * 100)

if __name__ == "__main__":
    export_dir = r"d:\APPS\nzila-automation\notion_export\part1"
    
    if os.path.exists(export_dir):
        analyze_key_strategic_docs(export_dir)
    else:
        print(f"❌ Directory not found: {export_dir}")
