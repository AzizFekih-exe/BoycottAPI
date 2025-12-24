from app import create_app
from app.extensions import db
from app.services.dataset_loader import DatasetLoader

app = create_app("development")

with app.app_context():
    db.create_all()
    DatasetLoader.import_companies_and_products()
    
