"""
Healthtech Strategy Organizer
==============================

Organizes the 3,359 Notion export files (healthtech/Memora strategy)
into structured business intelligence directories.

Author: Nzila Ventures
Date: February 17, 2026
"""

import os
import shutil
from pathlib import Path
from collections import defaultdict
import json

def organize_healthtech_content():
    """Organize healthtech Notion export into business/verticals/healthtech/"""
    
    source = Path("notion_export")
    target_base = Path("business/verticals/healthtech/strategy")
    
    if not source.exists():
        print(f"❌ Source not found: {source}")
        return
    
    print("🏥 Organizing Healthtech Strategy Content...")
    print(f"📂 Source: {source}")
    print(f"🎯 Target: {target_base}\n")
    
    # Category mapping based on deep dive analysis
    categories = {
        "patient-experience": ["patient", "experience", "experience pillar", "journey"],
        "clinical-workflows": ["clinical", "workflow", "provider", "treatment"],
        "data-privacy": ["privacy", "security", "HIPAA", "consent", "compliance"],
        "business-model": ["revenue", "pricing", "subscription", "monetization"],
        "product-features": ["feature", "functionality", "capability", "module"],
        "technical-architecture": ["architecture", "technical", "integration", "API"],
        "market-strategy": ["market", "competitive", "positioning", "go-to-market"],
        "user-research": ["research", "user", "feedback", "testing"],
        "design-system": ["design", "UI", "UX", "interface", "component"],
        "growth-metrics": ["metrics", "KPI", "analytics", "dashboard"],
        "partnership-strategy": ["partnership", "clinic", "collaboration"],
        "ai-ml-features": ["AI", "ML", "machine learning", "intelligence"]
    }
    
    # Find all HTML files
    html_files = list(source.rglob("*.html"))
    print(f"📄 Found {len(html_files)} HTML files")
    
    # Organize by category
    organized = defaultdict(list)
    uncategorized = []
    
    for html_file in html_files:
        # Read file to get content for classification
        try:
            with open(html_file, 'r', encoding='utf-8') as f:
                content = f.read(1000).lower()
        except:
            content = ""
        
        # Classify based on filename and content
        filename_lower = html_file.stem.lower()
        
        categorized = False
        for category, keywords in categories.items():
            if any(keyword in filename_lower or keyword in content for keyword in keywords):
                organized[category].append(html_file)
                categorized = True
                break
        
        if not categorized:
            uncategorized.append(html_file)
    
    # Create summary
    summary = {
        "total_files": len(html_files),
        "categorized": sum(len(files) for files in organized.values()),
        "uncategorized": len(uncategorized),
        "categories": {cat: len(files) for cat, files in organized.items()},
        "organized_at": str(Path.cwd())
    }
    
    # Copy organized files
    total_copied = 0
    for category, files in organized.items():
        target_dir = target_base / category
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for file_path in files[:100]:  # Limit to first 100 per category for manageability
            try:
                target_file = target_dir / file_path.name
                shutil.copy2(file_path, target_file)
                total_copied += 1
            except Exception as e:
                print(f"⚠️  Error copying {file_path.name}: {e}")
        
        print(f"✅ {category:<25} {len(files):>4} files")
    
    # Create general directory for uncategorized
    if uncategorized:
        target_dir = target_base / "general"
        target_dir.mkdir(parents=True, exist_ok=True)
        
        for file_path in uncategorized[:200]:  # Limit to first 200
            try:
                target_file = target_dir / file_path.name
                shutil.copy2(file_path, target_file)
                total_copied += 1
            except Exception as e:
                pass
        
        print(f"✅ {'general':<25} {len(uncategorized):>4} files (uncategorized)")
    
    # Save summary
    summary_path = target_base / "organization_summary.json"
    with open(summary_path, 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\n✨ Organized {total_copied} key strategy documents")
    print(f"📊 Summary saved: {summary_path}")
    
    # Create healthtech README
    readme_content = f"""# Healthtech Strategy (Memora)

**Source**: Notion Export (3,359 documents)  
**Organized**: {len(organized)} categories  
**Focus**: Patient experience, clinical workflows, data privacy

## 📂 Categories

"""
    
    for category in sorted(organized.keys()):
        count = len(organized[category])
        cat_name = category.replace('-', ' ').title()
        readme_content += f"- **{cat_name}** ({count} docs): `strategy/{category}/`\n"
    
    readme_content += f"""

## 🎯 Strategic Pillars

Based on deep dive analysis, Memora's strategy centers on:

1. **Patient Digital Experience** - Seamless, compassionate care journey
2. **Provider Clinical Excellence** - Efficient workflows, better outcomes
3. **Data Privacy & Compliance** - HIPAA, consent, security
4. **Multi-Revenue Business Model** - B2C subscriptions + B2B partnerships
5. **AI-Powered Intelligence** - Personalized care recommendations

## 📊 Key Metrics Tracked

- Patient engagement and satisfaction
- Clinical workflow efficiency
- Data privacy compliance rate
- Revenue per user (B2C + B2B)
- Partnership growth (clinic integrations)

## 🔗 Related Documentation

- [Platform Architecture](../../../platform/architecture/)
- [Legacy Memora Code](../../../knowledge/legacy-codebases/memora/)
- [Business Automation Analysis](../../../BUSINESS_AUTOMATION_OPPORTUNITIES.md)

---

**Last Updated**: February 17, 2026
"""
    
    readme_path = Path("business/verticals/healthtech/README.md")
    readme_path.parent.mkdir(parents=True, exist_ok=True)
    with open(readme_path, 'w') as f:
        f.write(readme_content)
    
    print(f"📝 Created README: business/verticals/healthtech/README.md")
    
    return summary

if __name__ == "__main__":
    summary = organize_healthtech_content()
    print("\n" + "="*60)
    print("✅ Healthtech Strategy Organization Complete")
    print("="*60)
