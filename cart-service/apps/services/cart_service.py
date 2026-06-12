from ..repositories import CartRepository
import requests
import os

PRODUCT_SERVICE_URL = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8000')

class CartService:
    @staticmethod
    def get_cart_by_user(user_id):
        cart = CartRepository.get_by_user_id(user_id)
        return {
            "cart_id": cart.id,
            "items": [
                {
                    "id": item.id,
                    "product_id": item.product_id,
                    "quantity": item.quantity
                } for item in cart.items.all()
            ]
        }

    @staticmethod
    def add_to_cart(user_id, product_id, quantity, token=None):
        # Verify product availability from Product Service
        headers = {}
        if token:
            headers['Authorization'] = token
            
        try:
            url = f"{PRODUCT_SERVICE_URL}/api/v1/products/{product_id}"
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code != 200:
                raise ValueError("Product does not exist")
                
            product_data = response.json()
            stock = product_data.get('stock', 0)
            
            # Check current total quantity in cart
            cart = CartRepository.get_by_user_id(user_id)
            existing_item = cart.items.filter(product_id=product_id).first()
            current_qty = existing_item.quantity if existing_item else 0
            
            if current_qty + quantity > stock:
                raise ValueError(f"Insufficient stock. Only {stock} items available.")
                
            item = CartRepository.add_item(cart, product_id, quantity)
            return {
                "id": item.id,
                "product_id": item.product_id,
                "quantity": item.quantity
            }
        except requests.exceptions.RequestException:
            # Fallback or error if product service is offline
            raise RuntimeError("Product service is temporarily unavailable")

    @staticmethod
    def update_item(user_id, item_id, quantity, token=None):
        item = CartRepository.get_item_by_id(item_id)
        if not item or item.cart.user_id != user_id:
            raise ValueError("Item not found in user's cart")
            
        # Verify stock from Product Service
        headers = {}
        if token:
            headers['Authorization'] = token
            
        try:
            url = f"{PRODUCT_SERVICE_URL}/api/v1/products/{item.product_id}"
            response = requests.get(url, headers=headers, timeout=5)
            if response.status_code == 200:
                product_data = response.json()
                stock = product_data.get('stock', 0)
                if quantity > stock:
                    raise ValueError(f"Insufficient stock. Only {stock} items available.")
            else:
                raise ValueError("Product does not exist")
        except requests.exceptions.RequestException:
            # In case product-service is down, we allow editing quantity at client's risk, or fail.
            # We prefer to fail for strict correctness.
            raise RuntimeError("Product service is temporarily unavailable")

        updated_item = CartRepository.update_item_quantity(item_id, quantity)
        return {
            "id": updated_item.id,
            "product_id": updated_item.product_id,
            "quantity": updated_item.quantity
        }

    @staticmethod
    def remove_item(user_id, item_id):
        item = CartRepository.get_item_by_id(item_id)
        if not item or item.cart.user_id != user_id:
            raise ValueError("Item not found in user's cart")
        CartRepository.remove_item(item_id)
        return True

    @staticmethod
    def clear_cart(user_id):
        cart = CartRepository.get_by_user_id(user_id)
        CartRepository.clear_cart(cart)
        return True
