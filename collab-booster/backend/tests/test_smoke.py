"""Smoke tests — verify project structure loads correctly."""


def test_import_main():
    from src.main import app
    assert app is not None


def test_config_loads():
    from src.config import settings
    assert settings is not None
    assert settings.jwt_algorithm == "HS256"


def test_config_has_model_names():
    from src.config import settings
    assert settings.fast_model == "gpt-4o-mini"
    assert settings.smart_model == "gpt-4o"
