import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth

from app.extensions import db, migrate, jwt, api
from app.config import config as app_config

load_dotenv()

oauth = OAuth()


def create_app(config_name: str = None) -> Flask:
    app = Flask(__name__)

    # Choose config: explicit argument > APP_ENV env var > development
    env_name = config_name or os.getenv("APP_ENV", "development")
    app.config.from_object(app_config.get(env_name, app_config["development"]))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    api.init_app(app)
    oauth.init_app(app)
    CORS(app)

    # Google OAuth client config
    app.config["GOOGLE_CLIENT_ID"] = os.environ.get("GOOGLE_CLIENT_ID")
    app.config["GOOGLE_CLIENT_SECRET"] = os.environ.get("GOOGLE_CLIENT_SECRET")
    app.config["GOOGLE_DISCOVERY_URL"] = (
        "https://accounts.google.com/.well-known/openid-configuration"
    )

    oauth.register(
        name="google",
        client_id=app.config["GOOGLE_CLIENT_ID"],
        client_secret=app.config["GOOGLE_CLIENT_SECRET"],
        server_metadata_url=app.config["GOOGLE_DISCOVERY_URL"],
        client_kwargs={"scope": "openid email profile"},
    )

    # Register blueprints
    from app.resources.auth import blp as auth_blp
    from app.resources.products import blp as products_blp
    from app.resources.companies import blp as companies_blp
    from app.resources.proofs import blp as proofs_blp
    from app.resources.scores import blp as scores_blp
    from app.resources.admin import blp as admin_blp

    api.register_blueprint(auth_blp)
    api.register_blueprint(admin_blp)
    api.register_blueprint(products_blp)
    api.register_blueprint(companies_blp)
    api.register_blueprint(proofs_blp)
    api.register_blueprint(scores_blp)

    # JWT user loader: attaches User object to the JWT
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        from app.models.user import User

        identity = jwt_data["sub"]
        return User.query.filter_by(id=int(identity)).first()

    # Optional: standard error messages for JWT issues
    @jwt.unauthorized_loader
    def unauthorized_callback(reason):
        return {"message": "Missing or invalid Authorization header"}, 401

    @jwt.invalid_token_loader
    def invalid_token_callback(reason):
        return {"message": "Invalid token"}, 422

    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_data):
        return {"message": "Token has expired"}, 401

    # ---- Security headers ----
    @app.after_request
    def set_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # When frontend domain is fixed, you can tighten CSP:
        # response.headers["Content-Security-Policy"] = "default-src 'self';"
        return response

    return app
