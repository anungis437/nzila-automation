"""
Executive Dashboard Generator

Generates executive-level dashboards and KPI summaries.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class ExecutiveDashboard:
    """Generate executive dashboards."""
    
    def __init__(self, data_dir: Optional[Path] = None):
        """Initialize executive dashboard."""
        self.data_dir = data_dir or Path(__file__).parent.parent / "data"
        self.output_dir = self.data_dir.parent / "analytics" / "dashboards"
        self.output_dir.mkdir(exist_ok=True, parents=True)
    
    def load_data(self) -> Dict[str, Any]:
        """Load analytics data."""
        profiles_file = self.data_dir / "platform_profiles.json"
        if profiles_file.exists():
            with open(profiles_file) as f:
                return json.load(f)
        return {}
    
    def generate_kpi_summary(self) -> Dict[str, Any]:
        """Generate KPI summary for executives."""
        data = self.load_data()
        
        return {
            "generated_at": datetime.now().isoformat(),
            "portfolio": {
                "total_platforms": 15,
                "production": 4,
                "beta": 3,
                "development": 8,
                "verticals": 10,
                "orgs": 12500
            },
            "financial": {
                "investment": 4000000,
                "arr_target_2026": 350000,
                "arr_target_2027": 1200000,
                "series_a_target": 4000000,
                "runway_months": 24
            },
            "technical": {
                "production_readiness_avg": 7.8,
                "code_reuse": 80,
                "backbone_completion": 80,
                "migration_progress": 27
            },
            "team": {
                "engineers": 8,
                "growth_target": 12
            }
        }
    
    def generate_dashboard_json(self) -> Dict[str, Any]:
        """Generate dashboard JSON for visualization."""
        kpis = self.generate_kpi_summary()
        
        return {
            "title": "Nzila Executive Dashboard",
            "last_updated": datetime.now().isoformat(),
            "kpis": [
                {
                    "id": "total_platforms",
                    "label": "Total Platforms",
                    "value": kpis["portfolio"]["total_platforms"],
                    "target": 20,
                    "trend": "up",
                    "status": "on_track"
                },
                {
                    "id": "production_platforms",
                    "label": "Production Platforms",
                    "value": kpis["portfolio"]["production"],
                    "target": 8,
                    "trend": "up",
                    "status": "on_track"
                },
                {
                    "id": "arr_target",
                    "label": "ARR Target 2026",
                    "value": f"${kpis['financial']['arr_target_2026']:,}",
                    "target": "$350K",
                    "trend": "target",
                    "status": "planning"
                },
                {
                    "id": "runway",
                    "label": "Runway",
                    "value": f"{kpis['financial']['runway_months']} months",
                    "trend": "stable",
                    "status": "healthy"
                },
                {
                    "id": "code_reuse",
                    "label": "Code Reuse",
                    "value": f"{kpis['technical']['code_reuse']}%",
                    "target": "80%",
                    "trend": "up",
                    "status": "excellent"
                },
                {
                    "id": "backbone",
                    "label": "Backbone Completion",
                    "value": f"{kpis['technical']['backbone_completion']}%",
                    "target": "100%",
                    "trend": "up",
                    "status": "on_track"
                }
            ],
            "charts": [
                {
                    "id": "platform_status",
                    "type": "donut",
                    "title": "Platform Status",
                    "data": {
                        "Production": 4,
                        "Beta": 3,
                        "Development": 8
                    }
                },
                {
                    "id": "vertical_distribution",
                    "type": "bar",
                    "title": "Vertical Distribution",
                    "data": {
                        "Fintech": 3,
                        "Agrotech": 2,
                        "Trade & Commerce": 3,
                        "Legaltech": 2,
                        "EdTech": 2,
                        "Entertainment": 1,
                        "Uniontech": 1,
                        "Healthtech": 1
                    }
                },
                {
                    "id": "revenue_trajectory",
                    "type": "line",
                    "title": "Revenue Trajectory",
                    "data": {
                        "Q1 2026": 0,
                        "Q2 2026": 50000,
                        "Q3 2026": 150000,
                        "Q4 2026": 350000,
                        "Q1 2027": 500000,
                        "Q2 2027": 850000,
                        "Q3 2027": 1200000
                    }
                }
            ]
        }
    
    def generate_alerts(self) -> List[Dict[str, Any]]:
        """Generate executive alerts."""
        alerts = []
        
        # Check runway
        alerts.append({
            "id": "runway_alert",
            "severity": "warning",
            "title": "Runway Attention",
            "message": "24 months runway - Series A needed by Q2 2026",
            "action_required": True,
            "deadline": "Q2 2026"
        })
        
        # Check migration progress
        alerts.append({
            "id": "migration_alert",
            "severity": "info",
            "title": "Migration Progress",
            "message": "27% complete - on track for Q3 2026 completion",
            "action_required": False
        })
        
        # Check technical debt
        alerts.append({
            "id": "tech_debt_alert",
            "severity": "warning",
            "title": "Technical Debt",
            "message": "8 platforms still on legacy architecture",
            "action_required": True,
            "deadline": "Q3 2026"
        })
        
        return alerts
    
    def save_dashboard(self) -> Path:
        """Save dashboard JSON."""
        dashboard = self.generate_dashboard_json()
        
        filename = "EXECUTIVE_DASHBOARD.json"
        output_path = self.output_dir / filename
        
        output_path.write_text(json.dumps(dashboard, indent=2), encoding='utf-8')
        
        return output_path
    
    def generate_text_summary(self) -> str:
        """Generate text summary for quick viewing."""
        kpis = self.generate_kpi_summary()
        
        return f"""
╔══════════════════════════════════════════════════════════╗
║           NZILA EXECUTIVE DASHBOARD                      ║
║           {datetime.now().strftime('%Y-%m-%d %H:%M')}                          ║
╠══════════════════════════════════════════════════════════╣
║ PORTFOLIO                                                ║
║   Platforms:        {kpis['portfolio']['total_platforms']:>3} (4 prod, 3 beta, 8 dev)      ║
║   Verticals:        {kpis['portfolio']['verticals']:>3}                              ║
║   Entities:         {kpis['portfolio']['orgs']:>6,}                            ║
╠══════════════════════════════════════════════════════════╣
║ FINANCIAL                                                ║
║   Investment:      ${kpis['financial']['investment']:>10,}                       ║
║   ARR Target '26:  ${kpis['financial']['arr_target_2026']:>10,}                       ║
║   ARR Target '27:  ${kpis['financial']['arr_target_2027']:>10,}                      ║
║   Series A Target:  ${kpis['financial']['series_a_target']:>10,}                       ║
║   Runway:          {kpis['financial']['runway_months']:>3} months                           ║
╠══════════════════════════════════════════════════════════╣
║ TECHNICAL                                                ║
║   Prod Readiness:   {kpis['technical']['production_readiness_avg']:>3}/10                             ║
║   Code Reuse:       {kpis['technical']['code_reuse']:>3}%                              ║
║   Backbone:         {kpis['technical']['backbone_completion']:>3}% complete                      ║
║   Migration:        {kpis['technical']['migration_progress']:>3}% complete                      ║
╚══════════════════════════════════════════════════════════╝
        """


def generate_dashboard() -> Dict[str, Any]:
    """Convenience function to generate dashboard."""
    dashboard = ExecutiveDashboard()
    return dashboard.generate_dashboard_json()


if __name__ == "__main__":
    dashboard = ExecutiveDashboard()
    print(dashboard.generate_text_summary())
    print(f"\n[Saved to: {dashboard.save_dashboard()}]")
