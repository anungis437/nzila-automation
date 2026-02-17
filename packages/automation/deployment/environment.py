"""
Environment Manager Module

Provides environment configuration management for Nzila platforms.
"""

import json
import os
from pathlib import Path
from typing import Any, Dict, Optional


class EnvironmentManager:
    """Manage environment configurations."""
    
    ENVIRONMENTS = ["development", "staging", "production"]
    
    def __init__(self):
        """Initialize environment manager."""
        self.configs: Dict[str, Dict[str, Any]] = {}
        
    def get_config(self, environment: str) -> Dict[str, Any]:
        """Get configuration for an environment."""
        configs = {
            "development": {
                "name": "development",
                "debug": True,
                "log_level": "DEBUG",
                "api_url": "http://localhost:3000",
                "database_url": "postgresql://localhost:5432/nzila_dev",
                "features": {
                    "mocks": True,
                    "hot_reload": True
                }
            },
            "staging": {
                "name": "staging",
                "debug": False,
                "log_level": "INFO",
                "api_url": "https://staging.nzila.ventures",
                "database_url": "${STAGING_DB_URL}",
                "features": {
                    "mocks": False,
                    "hot_reload": False
                }
            },
            "production": {
                "name": "production",
                "debug": False,
                "log_level": "WARNING",
                "api_url": "https://nzila.ventures",
                "database_url": "${PROD_DB_URL}",
                "features": {
                    "mocks": False,
                    "hot_reload": False,
                    "cdn": True
                }
            }
        }
        
        return configs.get(environment, configs["development"])
    
    def validate_environment(self, environment: str) -> Dict[str, Any]:
        """Validate environment configuration."""
        config = self.get_config(environment)
        
        validation = {
            "valid": True,
            "environment": environment,
            "checks": []
        }
        
        # Check required variables
        required_vars = ["DATABASE_URL", "API_KEY"]
        for var in required_vars:
            value = os.environ.get(var)
            if not value and environment == "production":
                validation["checks"].append({
                    "check": f"env:{var}",
                    "status": "warning",
                    "message": f"Environment variable {var} not set"
                })
            else:
                validation["checks"].append({
                    "check": f"env:{var}",
                    "status": "pass",
                    "message": f"Environment variable {var} configured"
                })
        
        return validation
    
    def generate_env_file(self, environment: str) -> str:
        """Generate .env file content for environment."""
        config = self.get_config(environment)
        
        env_content = f"""# Nzila Environment: {environment}
# Generated: {config.get('name', 'unknown')}

# App Config
DEBUG={str(config.get('debug', False)).lower()}
LOG_LEVEL={config.get('log_level', 'INFO')}

# API
NEXT_PUBLIC_API_URL={config.get('api_url', '')}

# Database
DATABASE_URL={config.get('database_url', '')}

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${{CLERK_PUBLISHABLE_KEY}}
CLERK_SECRET_KEY=${{CLERK_SECRET_KEY}}

# Azure
AZURE_STORAGE_CONNECTION_STRING=${{AZURE_STORAGE_CONNECTION_STRING}}

# Feature Flags
ENABLE_ANALYTICS={str(environment != 'development').lower()}
"""
        
        return env_content


def get_environment_config(environment: str = "development") -> Dict[str, Any]:
    """Convenience function to get environment config."""
    manager = EnvironmentManager()
    return manager.get_config(environment)


if __name__ == "__main__":
    manager = EnvironmentManager()
    
    for env in ["development", "staging", "production"]:
        print(f"\n=== {env.upper()} ===")
        config = manager.get_config(env)
        print(json.dumps(config, indent=2))
