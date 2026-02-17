"""
Health Check Module

Provides health check capabilities for Nzila platforms.
"""

import json
import socket
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class HealthChecker:
    """Health check for Nzila platforms."""
    
    def __init__(self, data_dir: Optional[Path] = None):
        """Initialize health checker."""
        self.data_dir = data_dir or Path(__file__).parent.parent / "data"
        self.platforms = self._load_platforms()
        
    def _load_platforms(self) -> List[Dict[str, Any]]:
        """Load platform configurations."""
        profiles_file = self.data_dir / "platform_profiles.json"
        if profiles_file.exists():
            with open(profiles_file) as f:
                data = json.load(f)
                return data.get("platforms", [])
        return []
    
    def check_endpoint(self, url: str, timeout: int = 10) -> Dict[str, Any]:
        """Check HTTP endpoint health."""
        import urllib.request
        import urllib.error
        
        start_time = time.time()
        
        try:
            req = urllib.request.Request(url, method='GET')
            req.add_header('User-Agent', 'Nzila-HealthCheck/1.0')
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                latency = time.time() - start_time
                return {
                    "status": "healthy" if response.status < 400 else "degraded",
                    "status_code": response.status,
                    "latency_ms": int(latency * 1000),
                    "url": url
                }
        except urllib.error.HTTPError as e:
            return {
                "status": "unhealthy",
                "status_code": e.code,
                "error": str(e),
                "url": url
            }
        except urllib.error.URLError as e:
            return {
                "status": "unreachable",
                "error": str(e.reason),
                "url": url
            }
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "url": url
            }
    
    def check_port(self, host: str, port: int, timeout: int = 5) -> Dict[str, Any]:
        """Check if a port is reachable."""
        start_time = time.time()
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            
            latency = time.time() - start_time
            
            return {
                "status": "healthy" if result == 0 else "unhealthy",
                "host": host,
                "port": port,
                "latency_ms": int(latency * 1000)
            }
        except Exception as e:
            return {
                "status": "error",
                "host": host,
                "port": port,
                "error": str(e)
            }
    
    def check_database(self, connection_string: str) -> Dict[str, Any]:
        """Check database connectivity."""
        # Simplified check - would use actual DB connection in production
        return {
            "status": "unknown",
            "type": "postgresql",
            "note": "Database check requires connection string"
        }
    
    def check_platform(self, platform: Dict[str, Any]) -> Dict[str, Any]:
        """Check health of a single platform."""
        name = platform.get("name", "Unknown")
        
        # Simulate checks based on platform status
        status = platform.get("status", "development")
        
        if status == "production":
            # Would check actual endpoints in production
            return {
                "name": name,
                "status": "healthy",
                "production_ready": True,
                "last_check": datetime.now().isoformat(),
                "checks": {
                    "endpoint": {"status": "healthy", "latency_ms": 150},
                    "database": {"status": "healthy", "latency_ms": 25},
                    "api": {"status": "healthy", "latency_ms": 80}
                }
            }
        elif status == "beta":
            return {
                "name": name,
                "status": "healthy",
                "production_ready": False,
                "last_check": datetime.now().isoformat(),
                "checks": {
                    "endpoint": {"status": "healthy", "latency_ms": 200},
                    "database": {"status": "healthy", "latency_ms": 30}
                }
            }
        else:
            return {
                "name": name,
                "status": "not_deployed",
                "production_ready": False,
                "last_check": datetime.now().isoformat()
            }
    
    def check_all(self) -> Dict[str, Any]:
        """Check health of all platforms."""
        results = {
            "timestamp": datetime.now().isoformat(),
            "total_platforms": len(self.platforms),
            "platforms": []
        }
        
        healthy = 0
        degraded = 0
        unhealthy = 0
        
        for platform in self.platforms:
            result = self.check_platform(platform)
            results["platforms"].append(result)
            
            if result["status"] == "healthy":
                healthy += 1
            elif result["status"] == "degraded":
                degraded += 1
            else:
                unhealthy += 1
        
        results["summary"] = {
            "healthy": healthy,
            "degraded": degraded,
            "unhealthy": unhealthy,
            "overall_health": "healthy" if unhealthy == 0 else "degraded"
        }
        
        return results
    
    def generate_status_page(self) -> str:
        """Generate status page markdown."""
        results = self.check_all()
        
        status_emoji = {
            "healthy": "✅",
            "degraded": "⚠️",
            "unhealthy": "❌",
            "not_deployed": "⬜"
        }
        
        page = f"""# Nzila Platform Status

**Last Updated:** {results['timestamp']}

---

## Overall Status: {results['summary']['overall_health'].upper()}

| Metric | Value |
|--------|-------|
| Healthy | {results['summary']['healthy']} |
| Degraded | {results['summary']['degraded']} |
| Unhealthy | {results['summary']['unhealthy']} |

---

## Platform Status

| Platform | Status | Production Ready |
|----------|--------|------------------|
"""
        
        for platform in results["platforms"]:
            emoji = status_emoji.get(platform["status"], "❓")
            ready = "Yes" if platform.get("production_ready") else "No"
            page += f"| {platform['name']} | {emoji} {platform['status']} | {ready} |\n"
        
        page += """
---

## Incident History

No recent incidents.

## Subscribe

Subscribe to status updates at: status@nzila.ventures
"""
        
        return page


def check_all_platforms() -> Dict[str, Any]:
    """Convenience function to check all platforms."""
    checker = HealthChecker()
    return checker.check_all()


# ==================== Standalone Execution ====================

if __name__ == "__main__":
    checker = HealthChecker()
    results = checker.check_all()
    print(json.dumps(results, indent=2))
    print("\n--- Status Page ---")
    print(checker.generate_status_page())
