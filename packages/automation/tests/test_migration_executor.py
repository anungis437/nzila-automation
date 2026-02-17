"""
Unit tests for migration_executor.py
"""

import pytest
import json
import time
from pathlib import Path
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime

import sys
sys.path.insert(0, str(Path(__file__).parent.parent / "generators"))

from migration_executor import (
    MigrationExecutor,
    MigrationPhase,
    MigrationCheckpoint,
    MigrationResult
)


@pytest.mark.unit
@pytest.mark.executor
class TestMigrationExecutor:
    """Test MigrationExecutor class"""
    
    def test_initialization(self, temp_dir):
        """Test executor initialization"""
        executor = MigrationExecutor(
            template_dir=temp_dir / "template",
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        assert executor.template_dir == temp_dir / "template"
        assert executor.output_dir == temp_dir / "output"
        assert executor.checkpoint_dir == temp_dir / "checkpoints"
        assert executor.dry_run is False
        
        # Directories should be created
        assert executor.output_dir.exists()
        assert executor.checkpoint_dir.exists()
    
    def test_create_checkpoint(self, temp_dir, mock_manifest):
        """Test checkpoint creation"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = executor._create_checkpoint("test-platform", manifest_path)
        
        assert checkpoint.platform_id == "test-platform"
        assert checkpoint.platform_name == "Mock Platform"
        assert checkpoint.phase == MigrationPhase.NOT_STARTED.value
        assert len(checkpoint.completed_phases) == 0
        assert len(checkpoint.failed_phases) == 0
    
    def test_save_and_load_checkpoint(self, temp_dir):
        """Test checkpoint persistence"""
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = MigrationCheckpoint(
            platform_id="test-platform",
            platform_name="Test Platform",
            phase=MigrationPhase.ANALYSIS.value,
            started_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            completed_phases=[],
            failed_phases=[]
        )
        
        # Save checkpoint
        executor._save_checkpoint(checkpoint)
        
        # Load checkpoint
        loaded = executor._load_checkpoint("test-platform")
        
        assert loaded is not None
        assert loaded.platform_id == "test-platform"
        assert loaded.phase == MigrationPhase.ANALYSIS.value
    
    def test_phase_analysis_success(self, temp_dir, mock_manifest):
        """Test successful analysis phase"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = executor._create_checkpoint("test-platform", manifest_path)
        result = executor._phase_analysis("test-platform", manifest_path, checkpoint)
        
        assert "manifest" in result
        assert checkpoint.metadata["manifest_validated"] is True
        assert checkpoint.metadata["profile"] == "nextjs-app-router"
    
    def test_phase_analysis_missing_manifest(self, temp_dir):
        """Test analysis phase with missing manifest"""
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        manifest_path = temp_dir / "nonexistent.json"
        checkpoint = MigrationCheckpoint(
            platform_id="test",
            platform_name="Test",
            phase=MigrationPhase.NOT_STARTED.value,
            started_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            completed_phases=[],
            failed_phases=[]
        )
        
        with pytest.raises(FileNotFoundError):
            executor._phase_analysis("test", manifest_path, checkpoint)
    
    def test_phase_analysis_invalid_manifest(self, temp_dir):
        """Test analysis phase with invalid manifest"""
        manifest_path = temp_dir / "invalid.json"
        with open(manifest_path, "w") as f:
            json.dump({"invalid": "manifest"}, f)  # Missing required fields
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = executor._create_checkpoint("test", manifest_path)
        
        with pytest.raises(ValueError):
            executor._phase_analysis("test", manifest_path, checkpoint)
    
    def test_dry_run_mode(self, temp_dir, mock_manifest):
        """Test dry run mode"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        checkpoint = executor._create_checkpoint("test-platform", manifest_path)
        
        # All phases should succeed without actual execution
        result = executor._phase_apply_template("test", manifest_path, checkpoint)
        assert result == {}  # Dry run returns empty dict
        
        result = executor._phase_generate_code("test", manifest_path, checkpoint)
        assert result == {}
        
        result = executor._phase_provision_infrastructure("test", manifest_path, checkpoint)
        assert result == {}
    
    def test_get_next_phase(self, temp_dir):
        """Test determining next phase from checkpoint"""
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = MigrationCheckpoint(
            platform_id="test",
            platform_name="Test",
            phase=MigrationPhase.TEMPLATE_APPLIED.value,
            started_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            completed_phases=[
                MigrationPhase.ANALYSIS.value,
                MigrationPhase.TEMPLATE_APPLIED.value
            ],
            failed_phases=[]
        )
        
        next_phase = executor._get_next_phase(checkpoint)
        assert next_phase == MigrationPhase.CODE_GENERATED
    
    def test_execute_phase_with_retry_success(self, temp_dir, mock_manifest):
        """Test phase execution with retry on success"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        checkpoint = executor._create_checkpoint("test", manifest_path)
        
        # Mock phase function that succeeds
        def mock_phase_func(platform_id, manifest_path, checkpoint):
            return {"data": "success"}
        
        result = executor._execute_phase_with_retry(
            mock_phase_func,
            "test",
            manifest_path,
            checkpoint
        )
        
        assert result["success"] is True
        assert result["data"] == "success"
    
    def test_execute_phase_with_retry_failure(self, temp_dir, mock_manifest):
        """Test phase execution with retry on failure"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        executor.MAX_RETRIES = 2  # Reduce retries for faster test
        executor.RETRY_DELAY = 0.1  # Reduce delay for faster test
        
        checkpoint = executor._create_checkpoint("test", manifest_path)
        
        # Mock phase function that always fails
        def mock_phase_func(platform_id, manifest_path, checkpoint):
            raise Exception("Simulated failure")
        
        result = executor._execute_phase_with_retry(
            mock_phase_func,
            "test",
            manifest_path,
            checkpoint
        )
        
        assert result["success"] is False
        assert "error" in result
        assert checkpoint.retry_count == 2  # Should have retried
    
    def test_execute_migration_success(self, temp_dir, mock_manifest):
        """Test successful migration execution"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True  # Use dry run to skip actual execution
        )
        
        result = executor.execute_migration("test-platform", manifest_path)
        
        assert result.success is True
        assert result.platform_id == "test-platform"
        assert result.phase_reached == MigrationPhase.COMPLETED.value
        assert result.duration_seconds > 0
        assert len(result.errors) == 0
    
    def test_execute_migration_with_failure(self, temp_dir, mock_manifest):
        """Test migration execution with failure"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump({"name": "Test"}, f)  # Invalid, missing required fields
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints"
        )
        
        result = executor.execute_migration("test-platform", manifest_path)
        
        assert result.success is False
        assert result.phase_reached == MigrationPhase.ANALYSIS.value
        assert len(result.errors) > 0
    
    def test_resume_migration(self, temp_dir, mock_manifest):
        """Test resuming migration from checkpoint"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        # Create checkpoint at TEMPLATE_APPLIED phase
        checkpoint = MigrationCheckpoint(
            platform_id="test-platform",
            platform_name="Test Platform",
            phase=MigrationPhase.TEMPLATE_APPLIED.value,
            started_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            completed_phases=[
                MigrationPhase.ANALYSIS.value,
                MigrationPhase.TEMPLATE_APPLIED.value
            ],
            failed_phases=[]
        )
        executor._save_checkpoint(checkpoint)
        
        # Resume migration
        result = executor.execute_migration("test-platform", manifest_path, resume=True)
        
        assert result.success is True
        # Should have skipped completed phases
        assert MigrationPhase.ANALYSIS.value in result.checkpoint.completed_phases
    
    def test_rollback_migration(self, temp_dir, mock_manifest):
        """Test rolling back failed migration"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        # Execute migration
        result = executor.execute_migration("test-platform", manifest_path)
        
        # Create some output files
        platform_output = executor.output_dir / "test-platform"
        platform_output.mkdir(parents=True, exist_ok=True)
        (platform_output / "file.txt").write_text("test")
        
        # Rollback
        success = executor.rollback_migration("test-platform")
        
        assert success is True
        assert not platform_output.exists()  # Output should be deleted
        
        # Checkpoint should reflect rollback
        checkpoint = executor._load_checkpoint("test-platform")
        assert checkpoint.phase == MigrationPhase.ROLLED_BACK.value
    
    def test_get_migration_status(self, temp_dir, mock_manifest):
        """Test getting migration status"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        # Execute migration
        executor.execute_migration("test-platform", manifest_path)
        
        # Get status
        status = executor.get_migration_status("test-platform")
        
        assert status is not None
        assert status["platform_id"] == "test-platform"
        assert status["phase"] == MigrationPhase.COMPLETED.value
        assert len(status["completed_phases"]) > 0
    
    def test_checkpoint_metadata_persistence(self, temp_dir, mock_manifest):
        """Test checkpoint metadata is preserved"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        # Execute migration
        executor.execute_migration("test-platform", manifest_path)
        
        # Load checkpoint
        checkpoint = executor._load_checkpoint("test-platform")
        
        # Verify metadata from analysis phase
        assert checkpoint.metadata["manifest_validated"] is True
        assert checkpoint.metadata["profile"] == "nextjs-app-router"
        assert checkpoint.metadata["modules_count"] == 3


@pytest.mark.integration
@pytest.mark.executor
class TestMigrationExecutorIntegration:
    """Integration tests for Migration Executor"""
    
    def test_full_migration_workflow(self, temp_dir, mock_manifest):
        """Test complete migration workflow"""
        # Setup
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        template_dir = temp_dir / "template"
        template_dir.mkdir()
        
        executor = MigrationExecutor(
            template_dir=template_dir,
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True  # Dry run for integration test
        )
        
        # Execute migration
        result = executor.execute_migration("integration-platform", manifest_path)
        
        # Verify result
        assert result.success is True
        assert result.phase_reached == MigrationPhase.COMPLETED.value
        
        # Verify checkpoint exists
        status = executor.get_migration_status("integration-platform")
        assert status is not None
        assert status["phase"] == MigrationPhase.COMPLETED.value
        
        # Verify all phases completed
        expected_phases = [
            MigrationPhase.ANALYSIS.value,
            MigrationPhase.TEMPLATE_APPLIED.value,
            MigrationPhase.CODE_GENERATED.value,
            MigrationPhase.INFRASTRUCTURE_PROVISIONED.value,
            MigrationPhase.DATABASE_MIGRATED.value,
            MigrationPhase.TESTED.value
        ]
        
        for phase in expected_phases:
            assert phase in status["completed_phases"]
    
    def test_failure_and_retry_workflow(self, temp_dir, mock_manifest):
        """Test failure recovery and retry workflow"""
        manifest_path = temp_dir / "manifest.json"
        with open(manifest_path, "w") as f:
            json.dump(mock_manifest, f)
        
        executor = MigrationExecutor(
            template_dir=temp_dir / "template",
            output_dir=temp_dir / "output",
            checkpoint_dir=temp_dir / "checkpoints",
            dry_run=True
        )
        
        # Execute first migration (success)
        result1 = executor.execute_migration("retry-platform", manifest_path)
        assert result1.success is True
        
        # Simulate partial failure by creating checkpoint at intermediate phase
        checkpoint = MigrationCheckpoint(
            platform_id="retry-platform-2",
            platform_name="Retry Platform 2",
            phase=MigrationPhase.CODE_GENERATED.value,
            started_at=datetime.now().isoformat(),
            last_updated=datetime.now().isoformat(),
            completed_phases=[
                MigrationPhase.ANALYSIS.value,
                MigrationPhase.TEMPLATE_APPLIED.value,
                MigrationPhase.CODE_GENERATED.value
            ],
            failed_phases=[]
        )
        executor._save_checkpoint(checkpoint)
        
        # Resume from checkpoint
        result2 = executor.execute_migration("retry-platform-2", manifest_path, resume=True)
        assert result2.success is True
        
        # Should have skipped completed phases
        assert MigrationPhase.ANALYSIS.value in result2.checkpoint.completed_phases
