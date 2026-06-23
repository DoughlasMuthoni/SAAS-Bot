import pytest
from jose import jwt

from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)


def test_password_hash_and_verify():
    plain = "mysecretpassword"
    hashed = hash_password(plain)
    assert verify_password(plain, hashed) is True
    assert verify_password("wrongpassword", hashed) is False


def test_access_token_has_correct_type():
    token = create_access_token({"sub": "user-123"})
    payload = decode_token(token)
    assert payload["type"] == "access"
    assert payload["sub"] == "user-123"


def test_refresh_token_has_correct_type():
    token = create_refresh_token({"sub": "user-123"})
    payload = decode_token(token)
    assert payload["type"] == "refresh"


def test_invalid_token_raises():
    with pytest.raises(ValueError):
        decode_token("not.a.valid.token")
