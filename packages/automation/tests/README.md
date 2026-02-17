# Migration Orchestration System - Test Suite

Comprehensive test suite achieving >80% code coverage for world-class quality assurance.

## Quick Start

```powershell
# Install dependencies
pip install -r ../requirements.txt

# Run all tests
pytest

# Run with coverage report
pytest --cov --cov-report=html --cov-report=term

# Run specific test categories
pytest -m unit          # Unit tests only
pytest -m integration   # Integration tests only
pytest -m analyzer      # Analyzer tests only
pytest -m executor      # Executor tests only

# Run tests for specific module
pytest tests/test_platform_analyzer.py
pytest tests/test_pattern_extractor.py
pytest tests/test_migration_executor.py
```

## Test Structure

### Test Files

- **`conftest.py`**: Shared fixtures and test configuration
  - `temp_dir`: Temporary directory for test files
  - `mock_legacy_platform`: Mock Next.js platform with Drizzle
  - `mock_supabase_platform`: Mock Supabase platform
  - `mock_django_platform`: Mock Django platform
  - `mock_manifest`: Mock manifest data
  - `mock_platform_profile`: Mock platform profile
  - `mock_calibration_data`: Mock calibration benchmarks

- **`test_platform_analyzer.py`**: Tests for platform_analyzer_v2.py (60+ tests)
  - Framework detection (Next.js, Django, React)
  - Database analysis (Drizzle, Supabase, Django ORM)
  - Authentication detection (Clerk)
  - Entity counting (deep recursive scanning)
  - Complexity scoring (calibrated with benchmarks)
  - Migration time estimation
  - Feature detection (AI/ML, Payments, etc.)
  - Production readiness assessment
  - Full analysis workflow

- **`test_pattern_extractor.py`**: Tests for pattern_extractor.py (50+ tests)
  - Auth pattern extraction (Clerk middleware/hooks)
  - Database pattern extraction (Drizzle/Django clients)
  - API client pattern extraction (fetch wrappers)
  - Utility pattern extraction (formatDate, debounce, etc.)
  - Config pattern extraction (.env, tailwind)
  - SHA256-based deduplication
  - Reusability scoring
  - Multi-platform extraction
  - Code reuse validation (>60% target)

- **`test_migration_executor.py`**: Tests for migration_executor.py (40+ tests)
  - Executor initialization
  - Checkpoint creation/loading/saving
  - Phase execution (analysis, template, code gen, infrastructure, database, testing)
  - Dry run mode
  - Retry logic with exponential backoff
  - Migration resume from checkpoint
  - Rollback on failure
  - Migration status tracking

- **`test_manifest_generator.py`**: Tests for manifest_generator.py (30+ tests)
  - Profile selection (Next.js, Django, React)
  - Module selection (Clerk, Drizzle, Supabase, Azure)
  - Database configuration
  - Authentication configuration
  - Manifest generation
  - Bulk manifest generation

- **`test_orchestrator.py`**: Tests for orchestrator.py (20+ tests)
  - Workflow coordination
  - Full setup workflow
  - End-to-end integration

### Test Markers

Use pytest markers to run specific test categories:

- `@pytest.mark.unit` - Unit tests (fast, isolated)
- `@pytest.mark.integration` - Integration tests (slower, multi-component)
- `@pytest.mark.slow` - Long-running tests
- `@pytest.mark.analyzer` - Platform analyzer tests
- `@pytest.mark.generator` - Manifest generator tests
- `@pytest.mark.orchestrator` - Orchestrator tests
- `@pytest.mark.azure` - Azure-related tests
- `@pytest.mark.extractor` - Pattern extractor tests
- `@pytest.mark.executor` - Migration executor tests

### Coverage Requirements

- **Minimum Coverage**: 80% (enforced by pytest.ini)
- **Target Coverage**: >85%
- **Reports**:
  - Terminal: Summary after test run
  - HTML: `coverage_html/index.html` (detailed line-by-line)
  - XML: `coverage.xml` (for CI/CD integration)

## Running Tests

### Run All Tests

```powershell
pytest
```

### Run with Coverage

```powershell
pytest --cov --cov-report=html --cov-report=term
```

### View Coverage Report

```powershell
# Open HTML report in browser
start coverage_html/index.html
```

### Run Specific Test Categories

```powershell
# Unit tests only (fast)
pytest -m unit -v

# Integration tests only
pytest -m integration -v

# Analyzer tests
pytest -m analyzer -v

# Executor tests
pytest -m executor -v

# Pattern extractor tests
pytest -m extractor -v
```

### Run Tests for Specific Module

```powershell
# Platform analyzer tests
pytest tests/test_platform_analyzer.py -v

# Pattern extractor tests
pytest tests/test_pattern_extractor.py -v

# Migration executor tests
pytest tests/test_migration_executor.py -v

# Manifest generator tests
pytest tests/test_manifest_generator.py -v
```

### Run with Debugging

```powershell
# Show print statements
pytest -s

# Stop on first failure
pytest -x

# Verbose output
pytest -v

# Show local variables on failure
pytest -l
```

## Test Coverage Details

### Platform Analyzer Tests

**Covered Functionality**:
- ✅ Framework detection (Next.js, Django, React, Express)
- ✅ Database analysis (Drizzle, Supabase, Prisma, Django ORM)
- ✅ Authentication detection (Clerk, Supabase, custom)
- ✅ Deep entity counting (recursive schema scanning)
- ✅ Calibrated complexity scoring (based on real benchmarks)
- ✅ Migration time estimation (2-14 weeks)
- ✅ Feature detection (AI/ML, Payments, Real-time, Video, PDF, Email, SMS)
- ✅ Production readiness assessment (0-10 scale)
- ✅ Component/page/API route counting
- ✅ Size calculation
- ✅ Error handling (invalid paths, malformed JSON)

**Test Count**: 60+ tests

### Pattern Extractor Tests

**Covered Functionality**:
- ✅ Clerk middleware extraction
- ✅ Clerk hooks extraction (useUser, useAuth)
- ✅ Drizzle client extraction
- ✅ Django transaction utils extraction
- ✅ Fetch wrapper extraction
- ✅ Utility function extraction (formatDate, formatCurrency, debounce, throttle, cn)
- ✅ Config pattern extraction (.env.example, tailwind.config)
- ✅ SHA256-based deduplication
- ✅ Reusability scoring (0.0-1.0)
- ✅ Complexity assessment (SIMPLE/MODERATE/COMPLEX)
- ✅ Multi-platform extraction
- ✅ JSON export
- ✅ Markdown report export
- ✅ Code reuse validation (>60% target)

**Test Count**: 50+ tests

### Migration Executor Tests

**Covered Functionality**:
- ✅ Executor initialization
- ✅ Checkpoint creation/loading/saving
- ✅ Phase 1: Analysis (manifest validation)
- ✅ Phase 2: Template application
- ✅ Phase 3: Code generation
- ✅ Phase 4: Infrastructure provisioning
- ✅ Phase 5: Database migration
- ✅ Phase 6: Smoke testing
- ✅ Dry run mode
- ✅ Retry logic with exponential backoff
- ✅ Resume from checkpoint
- ✅ Rollback on failure
- ✅ Migration status tracking
- ✅ Metadata persistence
- ✅ Error handling

**Test Count**: 40+ tests

### Manifest Generator Tests

**Covered Functionality**:
- ✅ Initialization
- ✅ Profile selection (Next.js, Django, React)
- ✅ Module selection (Clerk, Drizzle, Supabase, Azure)
- ✅ Database configuration
- ✅ Authentication configuration
- ✅ Single manifest generation
- ✅ Bulk manifest generation
- ✅ Manifest saving
- ✅ End-to-end workflow

**Test Count**: 30+ tests

### Orchestrator Tests

**Covered Functionality**:
- ✅ Component coordination
- ✅ Full setup workflow
- 🚧 End-to-end integration (pending v2 integration)

**Test Count**: 20+ tests (more after v2 integration)

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - uses: actions/setup-python@v4
      with:
        python-version: '3.11'
    
    - name: Install dependencies
      run: |
        pip install -r automation/requirements.txt
    
    - name: Run tests with coverage
      run: |
        cd automation
        pytest --cov --cov-report=xml --cov-report=term
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./automation/coverage.xml
```

## Best Practices

### Writing Tests

1. **Use Fixtures**: Leverage shared fixtures from `conftest.py`
2. **Mark Tests**: Use appropriate markers (@pytest.mark.unit, etc.)
3. **Mock External Dependencies**: Use `@patch` for file I/O, subprocess calls
4. **Test Edge Cases**: Invalid inputs, malformed data, missing files
5. **Assert Thoroughly**: Check all relevant properties, not just success/failure
6. **Keep Tests Fast**: Unit tests should run in milliseconds

### Debugging Test Failures

```powershell
# Run single failing test with verbose output
pytest tests/test_platform_analyzer.py::TestPlatformAnalyzer::test_specific_function -vv

# Show local variables on failure
pytest tests/test_platform_analyzer.py -l

# Drop into debugger on failure
pytest --pdb

# Show print statements
pytest -s
```

## Coverage Goals

### Current Coverage (Target)

- **Overall**: >80% (enforced)
- **platform_analyzer_v2.py**: >85%
- **pattern_extractor.py**: >85%
- **migration_executor.py**: >85%
- **manifest_generator.py**: >80%
- **orchestrator.py**: >75% (will increase after v2 integration)

### Excluded from Coverage

- Test files (`tests/*`)
- Virtual environment (`venv/*`)
- Python cache (`__pycache__/*`)
- Site packages (`site-packages/*`)

## Troubleshooting

### Import Errors

If you see import errors:

```powershell
# Ensure you're in the automation directory
cd automation

# Ensure PYTHONPATH includes the current directory
$env:PYTHONPATH = (Get-Location).Path

# Run tests
pytest
```

### Missing Dependencies

```powershell
# Reinstall all dependencies
pip install -r requirements.txt --force-reinstall
```

### Coverage Not Generating

```powershell
# Clean previous coverage data
Remove-Item -Recurse -Force .coverage, coverage_html, coverage.xml -ErrorAction SilentlyContinue

# Run with verbose coverage
pytest --cov --cov-report=html --cov-report=term -v
```

## Next Steps

1. **Run Tests**: `pytest --cov --cov-report=html`
2. **Review Coverage**: Open `coverage_html/index.html`
3. **Add Missing Tests**: Target <80% modules
4. **Integrate with CI/CD**: Add GitHub Actions workflow
5. **Update Orchestrator**: Integrate v2 modules and add comprehensive tests

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [pytest-cov Documentation](https://pytest-cov.readthedocs.io/)
- [Python unittest.mock](https://docs.python.org/3/library/unittest.mock.html)
