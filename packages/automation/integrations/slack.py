"""
Slack Integration Module

Provides integration with Slack for:
- Notifications
- Alerting
- Status updates
- Report sharing
"""

import os
import json
from datetime import datetime
from typing import Any, Dict, List, Optional


class SlackIntegration:
    """Slack integration for Nzila notifications and alerts."""
    
    def __init__(self, token: Optional[str] = None, 
                 default_channel: str = "#nzila-alerts"):
        """
        Initialize Slack integration.
        
        Args:
            token: Slack bot token (or SLACK_TOKEN env var)
            default_channel: Default channel for notifications
        """
        self.token = token or os.environ.get("SLACK_TOKEN")
        self.default_channel = default_channel
        self.api_base = "https://slack.com/api"
        
    def _make_request(self, endpoint: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make authenticated Slack API request."""
        import urllib.request
        import urllib.error
        
        if not self.token:
            return {"ok": False, "error": "Slack token not configured"}
        
        url = f"{self.api_base}/{endpoint}"
        headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        req = urllib.request.Request(url, headers=headers, data=json.dumps(data).encode('utf-8'))
        
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return {"ok": False, "error": str(e)}
    
    # ==================== Message Operations ====================
    
    def send_message(self, channel: str, text: str, 
                    blocks: Optional[List[Dict]] = None) -> Dict[str, Any]:
        """Send a message to a channel."""
        data = {
            "channel": channel,
            "text": text
        }
        if blocks:
            data["blocks"] = blocks
            
        return self._make_request("chat.postMessage", data)
    
    def send_alert(self, title: str, message: str, 
                  severity: str = "info") -> Dict[str, Any]:
        """
        Send an alert message.
        
        Args:
            title: Alert title
            message: Alert message
            severity: Alert severity (info, warning, error, critical)
        """
        colors = {
            "info": "#3498db",
            "warning": "#f39c12", 
            "error": "#e74c3c",
            "critical": "#9b59b6"
        }
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f":warning: {title}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": message
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Severity:* {severity.upper()} | *Time:* {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    }
                ]
            }
        ]
        
        return self.send_message(self.default_channel, f"{severity.upper()}: {title}", blocks)
    
    def send_deployment_notification(self, platform: str, status: str,
                                    environment: str = "production",
                                    version: Optional[str] = None) -> Dict[str, Any]:
        """Send deployment notification."""
        status_emoji = {
            "started": ":rocket:",
            "success": ":white_check_mark:",
            "failed": ":x:",
            "rollback": ":arrows_counterclockwise:"
        }
        
        version_text = f" | *Version:* `{version}`" if version else ""
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{status_emoji.get(status, ':bell:')} Deployment {status.title()}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Platform:*\n{platform}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Environment:*\n{environment}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Status:*\n{status.title()}"
                    },
                    {
                        "type": "mrkdwn",
                        "text": f"*Time:*\n{datetime.now().strftime('%H:%M:%S')}"
                    }
                ]
            }
        ]
        
        return self.send_message(
            self.default_channel,
            f"Deployment {status} for {platform} in {environment}{version_text}",
            blocks
        )
    
    def send_migration_update(self, platform: str, phase: str,
                            progress: int, notes: str = "") -> Dict[str, Any]:
        """Send migration progress update."""
        progress_bar = "█" * (progress // 10) + "░" * (10 - progress // 10)
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": ":gear: Migration Update",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "fields": [
                    {
                        "type": "mrkdwn",
                        "text": f"*Platform:*\n{platform}"
                    },
                    {
                        "type": "mrkdwn", 
                        "text": f"*Phase:*\n{phase}"
                    }
                ]
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Progress:* `{progress}%`\n{progress_bar}"
                }
            }
        ]
        
        if notes:
            blocks.append({
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Notes:*\n{notes}"
                }
            })
        
        return self.send_message(self.default_channel, f"Migration: {platform} - {progress}%", blocks)
    
    # ==================== Report Sharing ====================
    
    def share_report(self, report_title: str, report_content: str,
                    report_type: str = "general") -> Dict[str, Any]:
        """Share a report in the designated channel."""
        emoji = {
            "financial": ":chart_with_upwards_trend:",
            "technical": ":computer:",
            "general": ":page_facing_up:",
            "board": ":executive_board:"
        }
        
        blocks = [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": f"{emoji.get(report_type, ':page_facing_up:')} {report_title}",
                    "emoji": True
                }
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": report_content[:3000]  # Slack limit
                }
            },
            {
                "type": "context",
                "elements": [
                    {
                        "type": "mrkdwn",
                        "text": f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
                    }
                ]
            }
        ]
        
        return self.send_message(self.default_channel, report_title, blocks)
    
    # ==================== Scheduled Reports ====================
    
    def schedule_daily_summary(self, platforms: List[str]) -> Dict[str, Any]:
        """Schedule a daily summary message."""
        platform_list = ", ".join(platforms)
        
        message = f"""
*Daily Platform Summary*
        
*Platforms:* {platform_list}
*Status:* All systems operational
*Last Updated:* {datetime.now().strftime('%H:%M')}
        """
        
        return self.send_message(self.default_channel, message)
    
    # ==================== Interactive Components ====================
    
    def create_deployment_buttons(self, platform: str, version: str) -> Dict[str, Any]:
        """Create interactive deployment buttons."""
        blocks = [
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*Deploy {platform} v{version}*"
                }
            },
            {
                "type": "actions",
                "block_id": f"deploy_{platform}",
                "elements": [
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Deploy to Staging"
                        },
                        "style": "primary",
                        "action_id": f"deploy_staging_{platform}",
                        "value": f"{platform}:{version}:staging"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Deploy to Production"
                        },
                        "style": "danger",
                        "action_id": f"deploy_production_{platform}",
                        "value": f"{platform}:{version}:production"
                    },
                    {
                        "type": "button",
                        "text": {
                            "type": "plain_text",
                            "text": "Cancel"
                        },
                        "action_id": "cancel_deploy"
                    }
                ]
            }
        ]
        
        return self.send_message(self.default_channel, "Deployment options:", blocks)


# ==================== Webhook Integration ====================

class SlackWebhook:
    """Simple Slack webhook integration for incoming notifications."""
    
    def __init__(self, webhook_url: Optional[str] = None):
        """Initialize webhook."""
        self.webhook_url = webhook_url or os.environ.get("SLACK_WEBHOOK_URL")
        
    def send(self, message: str, username: str = "Nzila Bot",
            icon_emoji: str = ":robot_face:") -> bool:
        """Send a simple webhook message."""
        import urllib.request
        import urllib.error
        
        if not self.webhook_url:
            print("WARNING: Slack webhook URL not configured")
            return False
        
        data = {
            "text": message,
            "username": username,
            "icon_emoji": icon_emoji
        }
        
        req = urllib.request.Request(
            self.webhook_url,
            data=json.dumps(data).encode('utf-8'),
            headers={"Content-Type": "application/json"}
        )
        
        try:
            with urllib.request.urlopen(req):
                return True
        except urllib.error.HTTPError as e:
            print(f"Error sending Slack webhook: {e}")
            return False


# ==================== Alert Helpers ====================

def send_critical_alert(title: str, message: str) -> Dict[str, Any]:
    """Send a critical alert to Slack."""
    slack = SlackIntegration()
    return slack.send_alert(title, message, "critical")


def send_deployment_success(platform: str, version: str) -> Dict[str, Any]:
    """Send deployment success notification."""
    slack = SlackIntegration()
    return slack.send_deployment_notification(platform, "success", version=version)


def send_deployment_failure(platform: str, error: str) -> Dict[str, Any]:
    """Send deployment failure notification."""
    slack = SlackIntegration()
    return slack.send_alert(f"Deployment Failed: {platform}", error, "error")
