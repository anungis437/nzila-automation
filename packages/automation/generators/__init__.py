"""
Nzila Migration Generators
===========================
Code generation, dependency analysis, and progress tracking
for legacy codebase migration to Django backbone.
"""

from .code_generator import (
    CodeGenerator,
    SQLSchemaParser,
    DrizzleSchemaParser,
    DjangoCodeTemplates,
    ColumnDef,
    TableDef,
    run_abr_generation,
    run_ue_generation,
)

from .dependency_analyzer import (
    DependencyAnalyzer,
    DependencyCategory,
    MigrationTarget,
    PackageInfo,
    DependencyReport,
    analyze_abr_dependencies,
    analyze_ue_dependencies,
)

from .progress_tracker import (
    ProgressTracker,
    MigrationPhase,
    PhaseStatus,
    QualityGateStatus,
    PhaseProgress,
    PlatformProgress,
    init_tracking,
)

__all__ = [
    # Code Generator
    "CodeGenerator",
    "SQLSchemaParser",
    "DrizzleSchemaParser",
    "DjangoCodeTemplates",
    "ColumnDef",
    "TableDef",
    "run_abr_generation",
    "run_ue_generation",
    # Dependency Analyzer
    "DependencyAnalyzer",
    "DependencyCategory",
    "MigrationTarget",
    "PackageInfo",
    "DependencyReport",
    "analyze_abr_dependencies",
    "analyze_ue_dependencies",
    # Progress Tracker
    "ProgressTracker",
    "MigrationPhase",
    "PhaseStatus",
    "QualityGateStatus",
    "PhaseProgress",
    "PlatformProgress",
    "init_tracking",
]
