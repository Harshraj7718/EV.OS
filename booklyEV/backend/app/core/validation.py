"""Shared Pydantic field validators.

Lives in `core/` (not `modules/auth/`) so both `auth` and `users` schemas
can import it without one module depending on the other.
"""
import re

PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")  # E.164: +<country code><number>


def validate_phone_format(value: str) -> str:
    if not PHONE_PATTERN.match(value):
        raise ValueError(
            "Phone must be in E.164 format, e.g. +919876543210 (a leading '+' and 8-15 digits)."
        )
    return value


def validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if not re.search(r"[A-Za-z]", password):
        raise ValueError("Password must contain at least one letter.")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit.")
    return password
