"""
Alerting Module

Provides alerting capabilities for Nzila platforms.
"""

import json
import os
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class AlertManager:
    """Manage alerts for Nzila platforms."""
    
    def __init__(self, slack_token: Optional[str] = None):
        """Initialize alert manager."""
        self.slack_token = slack_token or os.environ.get("SLACK_TOKEN")
        self.alert_history: List[Dict[str, Any]] = []
        
    def create_alert(self, title: str, message: str, 
                    severity: str = "info",
                    platform: Optional[str] = None) -> Dict[str, Any]:
        """
        Create an alert.
        
        Args:
            title: Alert title
            message: Alert message
            severity: Severity level (info, warning, error, critical)
            platform: Platform name if applicable
            
        Returns:
            Created alert
        """
        alert = {
            "id": f"alert_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "title": title,
            "message": message,
            "severity": severity,
            "platform": platform,
            "timestamp": datetime.now().isoformat(),
            "status": "open",
            "acknowledged": False
        }
        
        self.alert_history.append(alert)
        
        # Send to Slack if configured
        if self.slack_token:
            self._send_slack_alert(alert)
        
        return alert
    
    def _send_slack_alert(self, alert: Dict[str, Any]) -> bool:
        """Send alert to Slack."""
        from automation.integrations.slack import SlackIntegration
        
        try:
            slack = SlackIntegration(token=self.slack_token)
            severity = alert["severity"]
            
            if severity in ["critical", "error"]:
                slack.send_alert(alert["title"], alert["message"], severity)
            
            return True
        except Exception as e:
            print(f"Failed to send Slack alert: {e}")
            return False
    
    def acknowledge_alert(self, alert_id: str, user: str) -> bool:
        """Acknowledge an alert."""
        for alert in self.alert_history:
            if alert["id"] == alert_id:
                alert["acknowledged"] = True
                alert["acknowledged_by"] = user
                alert["acknowledged_at"] = datetime.now().isoformat()
                return True
        return False
    
    def resolve_alert(self, alert_id: str, resolution: str) -> bool:
        """Resolve an alert."""
        for alert in self.alert_history:
            if alert["id"] == alert_id:
                alert["status"] = "resolved"
                alert["resolution"] = resolution
                alert["resolved_at"] = datetime.now().isoformat()
                return True
        return False
    
    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get all active (unresolved) alerts."""
        return [a for a in self.alert_history if a["status"] == "open"]
    
    def get_alerts_by_severity(self, severity: str) -> List[Dict[str, Any]]:
        """Get alerts by severity level."""
        return [a for a in self.alert_history if a["severity"] == severity]
    
    def get_alert_summary(self) -> Dict[str, Any]:
        """Get alert summary."""
        active = self.get_active_alerts()
        
        return {
            "total_alerts": len(self.alert_history),
            "active_alerts": len(active),
            "by_severity": {
                "critical": len([a for a in active if a["severity"] == "critical"]),
                "error": len([a for a in active if a["severity"] == "error"]),
                "warning": len([a for a in active if a["severity"] == "warning"]),
                "info": len([a for a in active if a["severity"] == "info"])
            },
            "last_alert": self.alert_history[-1] if self.alert_history else None
        }
    
    def save_alert_history(self, path: Optional[Path] = None) -> Path:
        """Save alert history to file."""
        if path is None:
            path = Path(__file__).parent.parent / "data" / "alert_history.json"
        
        path.parent.mkdir(exist_ok=True, parents=True)
        
        with open(path, 'w') as f:
            json.dump(self.alert_history, f, indent=2)
        
        return path


# ==================== Predefined Alert Types ====================

def send_critical_alert(title: str, message: str) -> Dict[str, Any]:
    """Send a critical alert."""
    manager = AlertManager()
    return manager.create_alert(title, message, "critical")


def send_deployment_alert(platform: str, status: str, 
                         version: Optional[str] = None) -> Dict[str, Any]:
    """Send a deployment alert."""
    version_str = f" v{version}" if version else ""
    title = f"Deployment {status.title()}: {platform}{version_str}"
    message = f"Platform {platform} deployment {status} at {datetime.now().strftime('%H:%M:%S')}"
    
    severity = "error" if status == "failed" else "info"
    
    manager = AlertManager()
    return manager.create_alert(title, message, severity, platform)


def send_migration_alert(platform: str, phase: str, 
                         issue: str) -> Dict[str, Any]:
    """Send a migration alert."""
    title = f"Migration Issue: {platform}"
    message = f"Phase: {phase}\nIssue: {issue}"
    
    manager = AlertManager()
    return manager.create_alert(title, message, "warning", platform)


def send_security_alert(alert_type: str, details: str) -> Dict[str, Any]:
    """Send a security alert."""
    title = f"Security Alert: {alert_type}"
    message = f"Type: {alert_type}\nDetails: {details}\nTime: {datetime.now().isoformat()}"
    
    manager = AlertManager()
    return manager.create_alert(title, message, "critical")


# ==================== Threshold-Based Alerts ====================

class ThresholdMonitor:
    """Monitor metrics against thresholds."""
    
    def __init__(self):
        """Initialize threshold monitor."""
        self.thresholds = {
            "error_rate": {"warning": 1.0, "critical": 5.0},
            "latency_ms": {"warning": 500, "critical": 2000},
            "cpu_usage": {"warning": 70, "critical": 90},
            "memory_usage": {"warning": 75, "critical": 90},
            "disk_usage": {"warning": 80, "critical": 95}
        }
    
    def check_metric(self, metric_name: str, value: float) -> Optional[Dict[str, Any]]:
        """Check if metric exceeds threshold."""
        if metric_name not in self.thresholds:
            return None
        
        threshold = self.thresholds[metric_name]
        
        if value >= threshold["critical"]:
            return {
                "severity": "critical",
                "message": f"{metric_name} is {value} (critical threshold: {threshold['critical']})"
            }
        elif value >= threshold["warning"]:
            return {
                "severity": "warning",
                "message": f"{metric_name} is {value} (warning threshold: {threshold['warning']})"
            }
        
        return None
    
    def check_all_metrics(self, metrics: Dict[str, float]) -> List[Dict[str, Any]]:
        """Check all metrics against thresholds."""
        alerts = []
        
        for metric_name, value in metrics.items():
            result = self.check_metric(metric_name, value)
            if result:
                alerts.append({
                    "metric": metric_name,
                    "value": value,
                    **result
                })
        
        return alerts


if __name__ == "__main__":
    # Example usage
    manager = AlertManager()
    
    # Create some test alerts
    manager.create_alert(
        "Test Critical Alert",
        "This is a test critical alert",
        "critical",
        "CongoWave"
    )
    
    manager.create_alert(
        "Test Warning",
        "This is a test warning",
        "warning"
    )
    
    print(json.dumps(manager.get_alert_summary(), indent=2))
