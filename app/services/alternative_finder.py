import os
import requests
from sqlalchemy import and_, case

from app.models.product import Product, BoycottStatus
from app.models.company import Company


class AlternativeFinder:
    """Service to find non-boycotted alternatives for products"""

    MAX_ALTERNATIVE_SCORE = 30.0
    MAX_ALTERNATIVES = 5

    @classmethod
    def find_alternatives(cls, product, limit=None, prefer_same_country=False):
        """
        Find alternative products in the same category with low boycott scores.
        First tries local DB, then falls back to an external API.
        """
        if limit is None:
            limit = cls.MAX_ALTERNATIVES
            
        print(f"[AlternativeFinder] Finding alternatives for: {product.name} / {product.category}")

        # 1) LOCAL ALTERNATIVES FROM OUR DB
        query = (
            Product.query
            .join(Product.company)
            .filter(
                and_(
                    Product.category == product.category,
                    Product.id != product.id,
                    Product.boycott_status == BoycottStatus.NO_TANGIBLE_PROOF,
                    Product.boycott_score <= cls.MAX_ALTERNATIVE_SCORE,
                )
            )
        )
        

        if prefer_same_country and product.company.country:
            country_match = case(
                (Company.country == product.company.country, 0),
                else_=1,
            )
            query = query.order_by(country_match, Product.boycott_score.asc())
        else:
            query = query.order_by(Product.boycott_score.asc())

        local_alts = query.limit(limit).all()

        if local_alts:
            print(f"[AlternativeFinder] Found {len(local_alts)} local alternatives")
            return {"local": local_alts, "external": []}
        
        print("[AlternativeFinder] No local alternatives, calling RapidAPI")


        # 2) RapidAPI fallback
        external = cls._fetch_external_alternatives(product, limit)
        print(f"[AlternativeFinder] Got {len(external)} external alternatives")
        return {"local": [], "external": external}

    @classmethod
    def _fetch_external_alternatives(cls, product, limit):
        """
        Fetch alternatives from the Real-Time Amazon Data API (RapidAPI).
        Returns a list of dicts with keys: name, brand, category, url, image.
        """
        # These env vars should be set for your RapidAPI configuration
        api_url = os.getenv("ALT_SEARCH_API_URL") or "https://real-time-amazon-data.p.rapidapi.com/search"
        api_key = os.getenv("ALT_SEARCH_API_KEY")
        api_host = os.getenv("ALT_SEARCH_API_HOST") or "real-time-amazon-data.p.rapidapi.com"
        
        print(f"[AlternativeFinder] RapidAPI config: url={api_url}, key_set={bool(api_key)}, host={api_host}")


        if not api_key or not api_host:
            print("[AlternativeFinder] Missing API key or host, skipping RapidAPI call")
            return []

        query_text = f"{product.name} {product.category}".strip()
        print(f"[AlternativeFinder] Calling RapidAPI with query: {query_text}")


        params = {
            "query": query_text,
            "page": 1,
            "country": "US",
            "sort_by": "RELEVANCE",
            "product_condition": "ALL",
            "is_prime": "false",
            "deals_and_discounts": "NONE",
        }

        headers = {
            "x-rapidapi-key": api_key,
            "x-rapidapi-host": api_host,
        }

        try:
            resp = requests.get(api_url, headers=headers, params=params, timeout=10)
            print(f"[AlternativeFinder] RapidAPI status: {resp.status_code}")
            resp.raise_for_status()
            print(f"Calling RapidAPI with query: {product.name} {product.category}")

        except Exception as exc:
            print(f"[AlternativeFinder] RapidAPI error: {exc}")
            return []


        data = resp.json()
        print(f"[AlternativeFinder] RapidAPI raw response keys: {list(data.keys())}")


        # Real-Time Amazon Data usually wraps results in a "data" object, with a
        # "products" or "search_results" array inside.[web:1][web:2]
        container = data.get("data") or data
        products = (
            container.get("products")
            or container.get("search_results")
            or container.get("results")
            or []
        )
        print(f"[AlternativeFinder] RapidAPI products count: {len(products)}")
        if products:
            print("[AlternativeFinder] Example product keys:", list(products[0].keys()))
            print("[AlternativeFinder] Example product:", products[0])


        alternatives = []

        for item in products:
            title = item.get("product_title") or ""

            # Map from the actual fields returned by Real-Time Amazon Data.[web:2]
            name = title or None
            # No explicit brand field; fall back to something neutral
            first_word = title.split()[0] if title else ""
            brand = first_word if first_word.lower().startswith(product.name.split()[0].lower()) else "Unknown"
            url = item.get("product_url")
            image = item.get("product_photo")

            if not (name and brand and url and image):
                continue

            alternatives.append(
                {
                    "name": name,
                    "brand": brand,
                    "category": product.category,
                    "url": url,
                    "image": image.split("?")[0],
                }
            )

            if len(alternatives) >= limit:
                break

        print(f"[AlternativeFinder] Got {len(alternatives)} external alternatives")
        return alternatives


    @classmethod
    def find_alternatives_by_category(cls, category, limit=None):
        """Find all non-boycotted products in a specific category (local DB only)."""
        if limit is None:
            limit = cls.MAX_ALTERNATIVES

        return (
            Product.query.filter(
                and_(
                    Product.category == category,
                    Product.boycott_status == BoycottStatus.NO_TANGIBLE_PROOF,
                    Product.boycott_score <= cls.MAX_ALTERNATIVE_SCORE,
                )
            )
            .order_by(Product.boycott_score.asc())
            .limit(limit)
            .all()
        )

    @classmethod
    def get_best_alternative(cls, product):
        """Get the single best alternative (local or external)."""
        alts = cls.find_alternatives(product, limit=1)
        # alts is {"local": [...], "external": [...]}
        if alts["local"]:
            return alts["local"][0]
        if alts["external"]:
            return alts["external"][0]
        return None

    @classmethod
    def count_alternatives(cls, product):
        """Count how many local alternatives exist for a product."""
        return (
            Product.query.filter(
                and_(
                    Product.category == product.category,
                    Product.id != product.id,
                    Product.boycott_status == BoycottStatus.NO_TANGIBLE_PROOF,
                    Product.boycott_score <= cls.MAX_ALTERNATIVE_SCORE,
                )
            ).count()
        )

    @classmethod
    def get_category_statistics(cls, category):
        """Get statistics about products in a category."""
        total = Product.query.filter_by(category=category).count()
        boycotted = Product.query.filter_by(
            category=category,
            boycott_status=BoycottStatus.BOYCOTT,
        ).count()
        safe = (
            Product.query.filter(
                and_(
                    Product.category == category,
                    Product.boycott_status == BoycottStatus.NO_TANGIBLE_PROOF,
                    Product.boycott_score <= cls.MAX_ALTERNATIVE_SCORE,
                )
            ).count()
        )

        return {
            "category": category,
            "total_products": total,
            "boycotted_products": boycotted,
            "safe_alternatives": safe,
            "boycott_rate": (boycotted / total * 100) if total > 0 else 0,
        }
