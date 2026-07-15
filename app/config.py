from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 60
    refresh_token_expire_days: int = 7
    environment: str = "development"
    mail_username: str = ""
    mail_password: str = ""
    mail_from: str = ""
    first_admin_email: str = ""
    first_admin_password: str = ""
    first_admin_name: str = "Admin"
    r2_account_id: str = ""
    r2_access_key: str = ""
    r2_secret_key: str = ""
    r2_bucket_name: str = ""
    r2_public_url: str = ""
    mail_port: int = 587
    mail_server: str = "smtp.gmail.com"
    frontend_url: str = "http://localhost:5173"
    # first admin setup — set these in .env for each client
    # after first admin is created these are ignored
    first_admin_email: str = ""
    first_admin_password: str = ""
    first_admin_name: str = "Admin"

    model_config = {"env_file": ".env"}


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()