"""
Platform Validator Module

Provides validation for Nzila platforms.
"""

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional


class PlatformValidator:
    """Validate Nzila platforms."""
    
    def __init__(self, base_path: Optional[Path] = None):
        """Initialize platform validator."""
        self.base_path = base_path or Path.cwd()
        
    def validate_structure(self, platform_path: Path) -> Dict[str, Any]:
        """Validate platform directory structure."""
        required_files = [
            "package.json" if (platform_path / "package.json").exists() else "requirements.txt",
            "src" if (platform_path / "src").exists() else "app"
        ]
        
        structure = {
            "path": str(platform_path),
            "required_files": required_files,
            "found_files": [],
            "missing_files": [],
            "status": "pass"
        }
        
        # Check for package.json or requirements.txt
        if (platform_path / "package.json").exists():
            structure["found_files"].append("package.json")
        elif (platform_path / "requirements.txt").exists():
            structure["found_files"].append("requirements.txt")
        else:
            structure["missing_files"].append("package.json or requirements.txt")
            structure["status"] = "fail"
        
        # Check for src or app directory
        if (platform_path / "src").exists():
            structure["found_files"].append("src/")
        elif (platform_path / "app").exists():
            structure["found_files"].append("app/")
        else:
            structure["missing_files"].append("src/ or app/")
            structure["status"] = "fail"
        
        return structure
    
    def validate_dependencies(self, platform_path: Path) -> Dict[str, Any]:
        """Validate platform dependencies."""
        validation = {
            "vulnerable_packages": [],
            "outdated_packages": [],
            "status": "pass"
        }
        
        # Check package.json
        package_json = platform_path / "package.json"
        if package_json.exists():
            try:
                with open(package_json) as f:
                    pkg = json.load(f)
                    
                    # Check for security vulnerabilities (simplified)
                    dependencies = pkg.get("dependencies", {})
                    dev_deps = pkg.get("devDependencies", {})
                    
                    # Example: Check for known vulnerable packages
                    vulnerable = ["lodash", "request", "moment"]
                    for dep in vulnerable:
                        if dep in dependencies or dep in dev_deps:
                            validation["vulnerable_packages"].append(dep)
                            validation["status"] = "warning"
                            
            except json.JSONDecodeError:
                validation["status"] = "error"
                validation["error"] = "Invalid package.json"
        
        return validation
    
    def validate_config(self, platform_path: Path) -> Dict[str, Any]:
        """Validate platform configuration."""
        validation = {
            "config_files": [],
            "missing_configs": [],
            "status": "pass"
        }
        
        # Check for common config files
        config_files = [".env.example", "tsconfig.json", "next.config.js"]
        
        for config in config_files:
            if (platform_path / config).exists():
                validation["config_files"].append(config)
            elif config == ".env.example":
                validation["missing_configs"].append(config)
        
        return validation
    
    def validate_tests(self, platform_path: Path) -> Dict[str, Any]:
        """Validate test coverage."""
        validation = {
            "test_files": 0,
            "test_frameworks": [],
            "coverage": 0,
            "status": "warning"
        }
        
        # Count test files
        test_patterns = ["test", "spec", "__tests__"]
        
        for pattern in test_patterns:
            test_files = list(platform_path.rglob(f"*{pattern}*"))
            validation["test_files"] += len(test_files)
        
        if validation["test_files"] > 0:
            validation["status"] = "pass"
        
        # Check for test frameworks
        if (platform_path / "package.json").exists():
            try:
                with open(platform_path / "package.json") as f:
                    pkg = json.load(f)
                    deps = {**pkg.get("dependencies", {}), **pkg.get("devDependencies", {})}
                    
                    if "jest" in deps:
                        validation["test_frameworks"].append("jest")
                    if "@testing-library" in deps:
                        validation["test_frameworks"].append("testing-library")
                    if "pytest" in deps:
                        validation["test_frameworks"].append("pytest")
            except:
                pass
        
        return validation
    
    def validate_platform(self, platform_path: Path) -> Dict[str, Any]:
        """Run full platform validation."""
        return {
            "platform": platform_path.name,
            "validated_at": datetime.now().isoformat(),
            "structure": self.validate_structure(platform_path),
            "dependencies": self.validate_dependencies(platform_path),
            "config": self.validate_config(platform_path),
            "tests": self.validate_tests(platform_path)
        }


def validate_platform(platform_name: str, base_path: Optional[Path] = None) -> Dict[str, Any]:
    """Convenience function to validate a platform."""
    validator = PlatformValidator(base_path)
    
    # Try to find platform
    possible_paths = [
        base_path / "nzila-website" / platform_name if base_path else None,
        base_path / "platforms" / platform_name if base_path else None,
        base_path / platform_name if base_path else None
    ]
    
    for path in [p for p in possible_paths if p and p.exists()]:
        return validator.validate_platform(path)
    
    return {"error": f"Platform not found: {platform_name}"}


if __name__ == "__main__":
    import sys
    
    validator = PlatformValidator()
    
    if len(sys.argv) > 1:
        path = Path(sys.argv[1])
        result = validator.validate_platform(path)
    else:
        result = {"error": "No platform path provided"}
    
    print(json.dumps(result, indent=2))
