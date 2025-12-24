import os
from datetime import timedelta


class Config:
    # Flask secret key (sessions, CSRF, etc.)
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")

    # Database
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///boycott.db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Config
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "jwt-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_HEADER_NAME = "Authorization"
    JWT_HEADER_TYPE = "Bearer"

    
    # API / OpenAPI
    API_TITLE = "Boycott Decision API"
    API_VERSION = "v1"
    OPENAPI_VERSION = "3.0.3"
    OPENAPI_URL_PREFIX = "/"
    OPENAPI_SWAGGER_UI_PATH = "/swagger-ui"
    OPENAPI_SWAGGER_UI_URL = "https://cdn.jsdelivr.net/npm/swagger-ui-dist/"

    API_SPEC_OPTIONS = {
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                }
            }
        },
        "security": [{"BearerAuth": []}],
    }


class DevelopmentConfig(Config):
    DEBUG = True
    USE_MOCK_LOGIN = True  # allow /auth/login in dev


class ProductionConfig(Config):
    DEBUG = False
    USE_MOCK_LOGIN = False  # force Google + 2FA in prod


config = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
}
