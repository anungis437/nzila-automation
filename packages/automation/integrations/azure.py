"""
Azure DevOps Integration Module

Provides integration with Azure DevOps for:
- Pipeline management
- Work item tracking
- Release management
- Test management
- Artifact management
"""

import os
import json
import base64
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class AzureDevOpsIntegration:
    """Azure DevOps integration for Nzila platform management."""
    
    def __init__(self, token: Optional[str] = None, 
                 organization: str = "nzila-ventures",
                 project: str = "nzila-platform"):
        """
        Initialize Azure DevOps integration.
        
        Args:
            token: Azure DevOps personal access token (or AZURE_DEVOPS_TOKEN env var)
            organization: Azure DevOps organization name
            project: Azure DevOps project name
        """
        self.token = token or os.environ.get("AZURE_DEVOPS_TOKEN")
        self.organization = organization
        self.project = project
        self.api_base = f"https://dev.azure.com/{organization}/{project}/_apis"
        
    def _make_request(self, endpoint: str, method: str = "GET",
                     data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make authenticated Azure DevOps API request."""
        import urllib.request
        import urllib.error
        
        # Check if running locally (no token)
        if not self.token:
            return self._local_mode_response(endpoint)
        
        url = f"{self.api_base}{endpoint}"
        auth = base64.b64encode(f":{self.token}".encode('utf-8')).decode('utf-8')
        
        headers = {
            "Authorization": f"Basic {auth}",
            "Content-Type": "application/json"
        }
        
        req = urllib.request.Request(url, headers=headers, method=method)
        if data:
            req.data = json.dumps(data).encode('utf-8')
            
        try:
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            return {"error": f"HTTP {e.code}: {e.reason}"}
    
    def _local_mode_response(self, endpoint: str) -> Dict[str, Any]:
        """Return mock data for local development."""
        if "pipelines" in endpoint:
            return {"value": []}
        elif "wit/workitems" in endpoint:
            return {"value": []}
        elif "releases" in endpoint:
            return {"value": []}
        return {"value": []}
    
    # ==================== Pipeline Management ====================
    
    def list_pipelines(self) -> List[Dict[str, Any]]:
        """List all pipelines."""
        result = self._make_request("/pipelines?api-version=7.0")
        return result.get("value", [])
    
    def get_pipeline(self, pipeline_id: int) -> Dict[str, Any]:
        """Get pipeline details."""
        return self._make_request(f"/pipelines/{pipeline_id}?api-version=7.0")
    
    def run_pipeline(self, pipeline_id: int, branch: str = "main",
                    variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Trigger a pipeline run."""
        data = {
            "resources": {
                "repositories": {
                    "self": {
                        "ref": f"refs/heads/{branch}",
                        "type": "branch"
                    }
                }
            }
        }
        if variables:
            data["variables"] = variables
            
        return self._make_request(
            f"/pipelines/{pipeline_id}/runs?api-version=7.0",
            "POST", data
        )
    
    def get_pipeline_runs(self, pipeline_id: int, 
                         status: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get pipeline run history."""
        endpoint = f"/pipelines/{pipeline_id}/runs?api-version=7.0"
        if status:
            endpoint += f"&statusFilter={status}"
            
        result = self._make_request(endpoint)
        return result.get("value", [])
    
    def get_pipeline_run_logs(self, pipeline_id: int, run_id: int) -> str:
        """Get pipeline run logs."""
        result = self._make_request(
            f"/pipelines/{pipeline_id}/runs/{run_id}/logs?api-version=7.0"
        )
        return json.dumps(result, indent=2)
    
    # ==================== Work Item Management ====================
    
    def create_work_item(self, title: str, work_item_type: str = "User Story",
                        description: str = "", 
                        assigned_to: Optional[str] = None,
                        tags: Optional[List[str]] = None) -> Dict[str, Any]:
        """Create a work item."""
        data = [
            {"op": "add", "path": "/fields/System.Title", "value": title},
            {"op": "add", "path": "/fields/System.Description", "value": description},
            {"op": "add", "path": "/fields/System.WorkItemType", "value": work_item_type}
        ]
        
        if assigned_to:
            data.append({"op": "add", "path": "/fields/System.AssignedTo", "value": assigned_to})
        if tags:
            data.append({"op": "add", "path": "/fields/System.Tags", "value": ",".join(tags)})
        
        return self._make_request(
            f"/wit/workitems/${work_item_type}?api-version=7.0",
            "PATCH", data
        )
    
    def list_work_items(self, query: Optional[str] = None) -> List[Dict[str, Any]]:
        """List work items using WiQL query."""
        if query:
            data = {"query": query}
            result = self._make_request("/wit/wiql?api-version=7.0", "POST", data)
            ids = [int(wi["id"]) for wi in result.get("workItems", [])]
            
            if ids:
                ids_str = ",".join(map(str, ids))
                return self._make_request(
                    f"/wit/workitems?ids={ids_str}&api-version=7.0"
                ).get("value", [])
        else:
            # Default: get all active items
            default_query = "SELECT [System.Id], [System.Title], [System.State] \
FROM WorkItems WHERE [System.State] <> 'Closed'"
            return self.list_work_items(default_query)
        
        return []
    
    def update_work_item(self, work_item_id: int, 
                        updates: Dict[str, Any]) -> Dict[str, Any]:
        """Update a work item."""
        data = []
        for field, value in updates.items():
            data.append({
                "op": "add",
                "path": f"/fields/{field}",
                "value": value
            })
        
        return self._make_request(
            f"/wit/workitems/{work_item_id}?api-version=7.0",
            "PATCH", data
        )
    
    def link_work_items(self, source_id: int, target_id: int,
                       link_type: str = "System.LinkTypes.Related") -> Dict[str, Any]:
        """Link two work items."""
        data = [
            {
                "op": "add",
                "path": "/relations/-",
                "value": {
                    "rel": link_type,
                    "url": f"{self.api_base}/wit/workitems/{target_id}"
                }
            }
        ]
        
        return self._make_request(
            f"/wit/workitems/{source_id}?api-version=7.0",
            "PATCH", data
        )
    
    # ==================== Release Management ====================
    
    def list_releases(self, definition_id: Optional[int] = None) -> List[Dict[str, Any]]:
        """List releases."""
        endpoint = "/release/releases?api-version=7.0"
        if definition_id:
            endpoint += f"&definitionId={definition_id}"
            
        result = self._make_request(endpoint)
        return result.get("value", [])
    
    def create_release(self, definition_id: int, artifact_version: str,
                      environment_variables: Optional[Dict] = None) -> Dict[str, Any]:
        """Create a new release."""
        data = {
            "definitionId": definition_id,
            "artifacts": [
                {
                    "alias": "primary",
                    "version": artifact_version,
                    "type": "Build"
                }
            ]
        }
        
        if environment_variables:
            data["variables"] = environment_variables
            
        return self._make_request("/release/releases?api-version=7.0", "POST", data)
    
    def get_release_status(self, release_id: int) -> Dict[str, Any]:
        """Get release status and details."""
        return self._make_request(f"/release/releases/{release_id}?api-version=7.0")
    
    # ==================== Repository Management ====================
    
    def list_repos(self) -> List[Dict[str, Any]]:
        """List Git repositories."""
        result = self._make_request("/git/repositories?api-version=7.0")
        return result.get("value", [])
    
    def get_repo_commits(self, repo_id: str, branch: str = "main",
                        top: int = 100) -> List[Dict[str, Any]]:
        """Get commits for a repository."""
        result = self._make_request(
            f"/git/repositories/{repo_id}/commits?branch={branch}&$top={top}&api-version=7.0"
        )
        return result.get("value", [])
    
    # ==================== Project Management ====================
    
    def get_project_info(self) -> Dict[str, Any]:
        """Get project information."""
        return self._make_request(f"/projects?api-version=7.0")
    
    def list_teams(self) -> List[Dict[str, Any]]:
        """List teams in the project."""
        result = self._make_request("/teams?api-version=7.0")
        return result.get("value", [])


def generate_azure_pipeline(platform_name: str, framework: str = "node") -> str:
    """
    Generate an Azure Pipelines YAML file.
    
    Args:
        platform_name: Name of the platform
        framework: Framework type (node, python, dotnet)
        
    Returns:
        YAML pipeline content
    """
    pipelines = {
        "node": f"""# Azure Pipeline for {platform_name}

trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

variables:
  nodeVersion: '18.x'
  npmCacheFolder: $(Pipeline.Workspace)/.npm

stages:
  - stage: Build
    displayName: Build and Test
    jobs:
      - job: BuildJob
        displayName: Build {platform_name}
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '$(nodeVersion)'
            displayName: 'Install Node.js'
          
          - script: |
              npm ci
              npm run build
            displayName: 'Build application'
            workingDirectory: $(System.DefaultWorkingDirectory)
          
          - task: PublishBuildArtifacts@1
            displayName: 'Publish artifacts'
            inputs:
              pathToPublish: '$(System.DefaultWorkingDirectory)/build'
              artifactName: '{platform_name}-build'

  - stage: Deploy
    displayName: Deploy
    dependsOn: Build
    condition: succeeded()
    jobs:
      - deployment: DeployWebApp
        displayName: 'Deploy to Azure Web App'
        pool:
          vmImage: 'ubuntu-latest'
        environment: '{platform_name}'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Nzila-Production'
                    appType: 'webApp'
                    appName: '{platform_name}-$(Environment)'
                    package: '$(Pipeline.Workspace)/**/*{platform_name}*.zip'
""",
        "python": f"""# Azure Pipeline for {platform_name}

trigger:
  branches:
    include:
      - main
      - develop

pr:
  branches:
    include:
      - main

variables:
  pythonVersion: '3.11'

stages:
  - stage: Test
    displayName: Run Tests
    jobs:
      - job: TestJob
        pool:
          vmImage: 'ubuntu-latest'
        steps:
          - task: UsePythonVersion@0
            inputs:
              versionSpec: '$(pythonVersion)'
          
          - script: |
              pip install -r requirements.txt
              pytest --cov=. --cov-report=xml
            displayName: 'Run tests'
          
          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'Cobertura'
              summaryFileLocation: '$(Pipeline.Workspace)/**/coverage.xml'

  - stage: Deploy
    displayName: Deploy
    dependsOn: Test
    condition: succeeded()
    jobs:
      - deployment: DeployWebApp
        pool:
          vmImage: 'ubuntu-latest'
        environment: '{platform_name}'
"""
    }
    
    return pipelines.get(framework, pipelines["node"])
