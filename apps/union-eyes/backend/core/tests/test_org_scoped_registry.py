"""
Contract tests: every model that stores org-scoped data must derive from
OrganizationModel (or carry an explicit `organization` FK to OrganizationModel).

Run with: pytest backend/core/tests/test_org_scoped_registry.py -v
"""

import django
import pytest
from django.apps import apps

django.setup()

from core.models import OrganizationModel  # noqa: E402


def _get_org_scoped_apps() -> list[str]:
    return ["compliance", "hris", "accounting", "documents"]


def _is_org_scoped(model_class) -> bool:
    if issubclass(model_class, OrganizationModel):
        return True
    for field in model_class._meta.get_fields():
        if (
            field.name == "organization"
            and hasattr(field, "related_model")
            and field.related_model is OrganizationModel
        ):
            return True
    return False


def _get_concrete_models(app_label: str):
    try:
        app_config = apps.get_app_config(app_label)
    except LookupError:
        return []
    return [
        m for m in app_config.get_models() if not m._meta.abstract and not m._meta.proxy
    ]


@pytest.mark.parametrize("app_label", _get_org_scoped_apps())
def test_all_models_are_org_scoped(app_label: str) -> None:
    models = _get_concrete_models(app_label)
    if not models:
        pytest.skip(f"No concrete models found in app '{app_label}' (not installed?)")

    violations = [m.__name__ for m in models if not _is_org_scoped(m)]
    assert (
        violations == []
    ), f"[{app_label}] The following models are NOT org-scoped:\n" + "\n".join(
        f"  - {v}" for v in violations
    )


def test_organization_model_has_required_fields() -> None:
    field_names = {f.name for f in OrganizationModel._meta.get_fields()}
    for required in ("id", "organization"):
        assert (
            required in field_names
        ), f"OrganizationModel is missing required field: {required!r}"
