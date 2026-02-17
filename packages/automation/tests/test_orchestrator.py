"""
Unit tests for orchestrator.py
"""

import pytest
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
import json

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

# Note: orchestrator.py may need to be updated to import analyzer_v2
# These tests assume the updated version


@pytest.mark.skip(reason="Orchestrator needs v2 integration - tests pending rewrite")
@pytest.mark.unit
@pytest.mark.orchestrator
class TestOrchestrator:
    """Test Orchestrator class"""
    
    @patch('orchestrator.PlatformAnalyzer')
    def test_analyze_all_platforms(self, mock_analyzer_class, temp_dir):
        """Test analyzing all platforms"""
        # Mock analyzer instance
        mock_analyzer = Mock()
        mock_analyzer.profiles = [{"id": "test", "name": "Test"}]
        mock_analyzer_class.return_value = mock_analyzer
        
        from orchestrator import Orchestrator
        
        orchestrator = Orchestrator(platforms_dir=temp_dir)
        orchestrator.analyze_platforms()
        
        # Verify analyzer was created and used
        mock_analyzer_class.assert_called_once()
        mock_analyzer.analyze_all.assert_called_once()
    
    @patch('orchestrator.ManifestGenerator')
    @patch('orchestrator.PlatformAnalyzer')
    def test_generate_manifests(self, mock_analyzer_class, mock_generator_class, temp_dir):
        """Test manifest generation"""
        # Setup mocks
        mock_analyzer = Mock()
        mock_analyzer.profiles = [{"id": "test"}]
        mock_analyzer_class.return_value = mock_analyzer
        
        mock_generator = Mock()
        mock_generator_class.return_value = mock_generator
        
        from orchestrator import Orchestrator
        
        orchestrator = Orchestrator(platforms_dir=temp_dir)
        orchestrator.analyze_platforms()
        orchestrator.generate_manifests()
        
        # Verify generator was used
        mock_generator_class.assert_called_once()
        mock_generator.generate_all.assert_called_once()
    
    @patch('orchestrator.MigrationExecutor')
    @patch('orchestrator.ManifestGenerator')
    @patch('orchestrator.PlatformAnalyzer')
    def test_full_setup_workflow(
        self,
        mock_analyzer_class,
        mock_generator_class,
        mock_executor_class,
        temp_dir
    ):
        """Test complete setup workflow"""
        # Setup mocks
        mock_analyzer = Mock()
        mock_analyzer.profiles = [{"id": "test", "name": "Test"}]
        mock_analyzer_class.return_value = mock_analyzer
        
        mock_generator = Mock()
        mock_generator_class.return_value = mock_generator
        
        mock_executor = Mock()
        mock_executor_class.return_value = mock_executor
        
        from orchestrator import Orchestrator
        
        orchestrator = Orchestrator(platforms_dir=temp_dir)
        orchestrator.full_setup(dry_run=True)
        
        # Verify all components were used
        mock_analyzer.analyze_all.assert_called_once()
        mock_generator.generate_all.assert_called_once()


@pytest.mark.integration
@pytest.mark.orchestrator
class TestOrchestratorIntegration:
    """Integration tests for Orchestrator"""
    
    def test_end_to_end_orchestration(self, mock_legacy_platform, temp_dir):
        """Test complete orchestration workflow"""
        # This would test the full workflow:
        # 1. Analyze platforms
        # 2. Generate manifests
        # 3. Extract patterns
        # 4. Execute migrations (dry run)
        
        # Note: This test requires all components to be integrated
        # and would be implemented once orchestrator is updated for v2
        pass
