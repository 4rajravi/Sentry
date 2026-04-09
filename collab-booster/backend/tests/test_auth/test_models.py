from src.auth.models import User, UserRole


def test_user_role_enum():
    assert UserRole.BUSINESS_ANALYST.value == "business_analyst"
    assert UserRole.DEVELOPER.value == "developer"


def test_user_model_has_required_fields():
    fields = {c.name for c in User.__table__.columns}
    assert fields >= {"id", "username", "email", "full_name", "hashed_password", "role"}


def test_user_role_is_string_enum():
    assert isinstance(UserRole.DEVELOPER, str)
    assert UserRole.DEVELOPER == "developer"
