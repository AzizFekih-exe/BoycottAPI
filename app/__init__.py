from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

from app.extensions import db, migrate, jwt, api
from app.config import config

load_dotenv()


def create_app(config_name: str = "development") -> Flask:
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    api.init_app(app)
    CORS(app)
    
    

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

    return app
