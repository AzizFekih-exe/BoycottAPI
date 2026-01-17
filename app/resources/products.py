from flask.views import MethodView
from flask_smorest import Blueprint, abort
from flask_jwt_extended import jwt_required, get_jwt_identity

from app.extensions import db
from app.models.product import Product
from app.models.scan_history import ScanHistory
from app.schemas.product import (
    ProductSchema,
    ProductWithCompanySchema,
    ProductScanRequestSchema,
    ProductScanResponseSchema,
)
from app.services.alternative_finder import AlternativeFinder
from app.services.proof_search import ProofSearchService
from app.utils.decorators import role_required
from app.models.user import UserRole
from app.models.enums import ModerationStatus
# Backward compatibility if needed, but we should use ModerationStatus
ProofStatus = ModerationStatus


blp = Blueprint(
    "Products",
    __name__,
    url_prefix="/products",
    description="Product operations",
)


@blp.route("/scan")
class ProductScan(MethodView):
    @blp.arguments(ProductScanRequestSchema)
    @blp.response(200, ProductScanResponseSchema)
    def post(self, scan_data):  # sourcery skip: use-contextlib-suppress
        """Scan a product by serial number"""
        serial_number = scan_data["serial_number"]

        product = Product.query.filter_by(serial_number=serial_number).first()
        if not product:
            abort(
                404,
                message=(
                    f"Product with serial {serial_number} not found. "
                    "Please create it first."
                ),
            )

        # Get approved proofs for the company (limit to top 5)
        key_proofs = (
            product.company.proofs.filter_by(status=ProofStatus.APPROVED)
            .order_by(db.desc("weight"))
            .limit(5)
            .all()
        )

        # Find alternatives only if product is boycotted
        local_alternatives = []
        external_alternatives = []
        if product.boycott_status.value == "BOYCOTT":
            alt_result = AlternativeFinder.find_alternatives(product)
            # alt_result is {"local": [...], "external": [...]}
            local_alternatives = alt_result.get("local", [])
            external_alternatives = alt_result.get("external", [])

        # Log scan (handle both authenticated and anonymous users)
        user_id = None
        try:
            user_id = get_jwt_identity()
        except Exception:
            # Anonymous scan, keep user_id as None
            pass

        scan_log = ScanHistory(
            product_id=product.id,
            user_id=user_id,
            returned_score=product.boycott_score,
            returned_status=product.boycott_status.value,
        )
        db.session.add(scan_log)
        db.session.commit()

        return {
            "product": product,
            "company": product.company,
            "key_proofs": key_proofs,
            "local_alternatives": local_alternatives,
            "external_alternatives": external_alternatives,
        }


@blp.route("/")
class ProductList(MethodView):
    @blp.response(200, ProductSchema(many=True))
    def get(self):
        """List all products (APPROVED only)"""
        return Product.query.filter_by(status=ModerationStatus.APPROVED).all()

    @jwt_required()
    @role_required(UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(ProductSchema)
    @blp.response(201, ProductSchema)
    def post(self, product_data):
        """Create a new product"""
        # Determine status based on role
        user_id = get_jwt_identity()
        from app.models.user import User
        user = User.query.get(user_id)
        
        status = ModerationStatus.APPROVED
        if user.role == UserRole.CONTRIBUTOR:
            status = ModerationStatus.PENDING
            
        product = Product(**product_data, status=status)
        db.session.add(product)
        db.session.commit()

        # trigger background search for the product's company
        ProofSearchService.search_async(product.company_id)

        return product


@blp.route("/pending")
class PendingProducts(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.response(200, ProductSchema(many=True))
    def get(self):
        """List pending products for review."""
        return Product.query.filter_by(status=ModerationStatus.PENDING).all()


@blp.route("/<int:product_id>/approve")
class ProductApproval(MethodView):
    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.response(200, ProductSchema)
    def patch(self, product_id):
        """Approve a product."""
        product = Product.query.get_or_404(product_id)
        product.status = ModerationStatus.APPROVED
        db.session.commit()
        return product

    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    def delete(self, product_id):
        """Reject (delete) a product."""
        product = Product.query.get_or_404(product_id)
        db.session.delete(product)
        db.session.commit()
        return {"message": "Product rejected and deleted"}, 200


@blp.route("/<int:product_id>")
class ProductDetail(MethodView):
    @blp.response(200, ProductWithCompanySchema)
    def get(self, product_id):
        """Get product by ID with company info"""
        return Product.query.get_or_404(product_id)

    @jwt_required()
    @role_required(UserRole.MODERATOR, UserRole.ADMIN)
    @blp.arguments(ProductSchema)
    @blp.response(200, ProductSchema)
    def put(self, product_data, product_id):
        """Update a product"""
        product = Product.query.get_or_404(product_id)
        for key, value in product_data.items():
            setattr(product, key, value)
        db.session.commit()
        return product

    @jwt_required()
    @role_required(UserRole.ADMIN)
    def delete(self, product_id):
        """Delete a product"""
        product = Product.query.get_or_404(product_id)
        db.session.delete(product)
        db.session.commit()
        return "", 204


@blp.route("/<int:product_id>/alternatives")
class ProductAlternatives(MethodView):
    @blp.response(200, ProductScanResponseSchema(only=("local_alternatives", "external_alternatives")))
    def get(self, product_id):
        """Get alternatives for a product"""
        product = Product.query.get_or_404(product_id)
        
        local_alternatives = []
        external_alternatives = []
        
        # Only find alternatives if product is boycotted
        if product.boycott_status.value == "BOYCOTT":
            alt_result = AlternativeFinder.find_alternatives(product)
            local_alternatives = alt_result.get("local", [])
            external_alternatives = alt_result.get("external", [])
        
        return {
            "local_alternatives": local_alternatives,
            "external_alternatives": external_alternatives,
        }
