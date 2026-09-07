from pydantic import BaseModel


class SettingsPublic(BaseModel):
    """Non-secret config only — never SECRET_KEY, DATABASE_URL, or
    anything else that could be used to impersonate the platform.
    Read-only in this phase; there is no settings-editing endpoint.
    """

    app_name: str
    environment: str
    api_v1_prefix: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
