"""
Nzila Integrations Module

Provides integrations with external services:
- GitHub (repository management, PR automation)
- Azure DevOps (pipeline management, work items)
- Notion (documentation sync)
- Slack (notifications)
"""

from .github import GitHubIntegration
from .azure import AzureDevOpsIntegration
from .notion import NotionIntegration
from .slack import SlackIntegration

__all__ = [
    "GitHubIntegration",
    "AzureDevOpsIntegration", 
    "NotionIntegration",
    "SlackIntegration",
]
