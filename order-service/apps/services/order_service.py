from ..repositories import OrderRepository
import requests
import os
import logging

logger = logging.getLogger(__name__)

CART_SERVICE_URL = os.getenv('CART_SERVICE_URL', 'http://cart-service:8000')
PRODUCT_SERVICE_URL = os.getenv('PRODUCT_SERVICE_URL', 'http://product-service:8000')
PAYMENT_SERVICE_URL = os.getenv('PAYMENT_SERVICE_URL', 'http://payment-service:8000')
SHIPPING_SERVICE_URL = os.getenv('SHIPPING_SERVICE_URL', 'http://shipping-service:8000')

class OrderService:
    @staticmethod
    def get_order_details(order_id, token=None):
        order = OrderRepository.get_by_id(order_id)
        if not order:
            return None
            
        shipping_data = None
        if token:
            try:
                headers = {"Authorization": token}
                ship_resp = requests.get(f"{SHIPPING_SERVICE_URL}/api/v1/shipping/order/{order_id}", headers=headers, timeout=3)
                if ship_resp.status_code == 200:
                    shipping_data = ship_resp.json()
            except Exception as e:
                logger.error(f"Failed to fetch shipping info for order {order_id}: {e}")
                
        return {
            "order_id": order.id,
            "user_id": order.user_id,
            "total_amount": order.total_amount,
            "status": order.status,
            "created_at": order.created_at,
            "items": [
                {
                    "product_id": item.product_id,
                    "quantity": item.quantity,
                    "price": item.price
                } for item in order.items.all()
            ],
            "history": [
                {
                    "status": hist.status,
                    "comment": hist.comment,
                    "changed_at": hist.changed_at
                } for hist in order.status_history.all()
            ],
            "shipping": shipping_data
        }

    @staticmethod
    def list_orders(user_id):
        orders = OrderRepository.get_by_user_id(user_id)
        return [
            {
                "order_id": o.id,
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at
            } for o in orders
        ]

    @staticmethod
    def create_order(user_id, shipping_address, recipient_name, recipient_phone, token):
        headers = {"Authorization": token}
        
        # 1. Fetch Cart Items
        try:
            cart_resp = requests.get(f"{CART_SERVICE_URL}/api/v1/cart/", headers=headers, timeout=5)
            if cart_resp.status_code != 200:
                raise ValueError("Could not retrieve cart items")
            cart_data = cart_resp.json()
            cart_items = cart_data.get('items', [])
            if not cart_items:
                raise ValueError("Cart is empty")
        except requests.exceptions.RequestException:
            raise RuntimeError("Cart service is unavailable")

        # 2. Fetch Product prices and check stock, prepare order details
        items_to_create = []
        reserved_stocks = [] # Keep track of reserved products for rollback
        total_amount = 0
        
        try:
            for item in cart_items:
                product_id = item['product_id']
                quantity = item['quantity']
                
                # Fetch product details
                prod_resp = requests.get(f"{PRODUCT_SERVICE_URL}/api/v1/products/{product_id}", headers=headers, timeout=5)
                if prod_resp.status_code != 200:
                    raise ValueError(f"Product ID {product_id} no longer exists")
                    
                prod_data = prod_resp.json()
                price = float(prod_data['price'])
                stock = int(prod_data['stock'])
                
                if quantity > stock:
                    raise ValueError(f"Product {prod_data['name']} does not have enough stock ({stock} available).")
                
                total_amount += price * quantity
                items_to_create.append({
                    "product_id": product_id,
                    "quantity": quantity,
                    "price": price
                })
                
            # 3. Reserve Stock in Product Service (Deduct stock)
            for item in items_to_create:
                pid = item['product_id']
                qty = item['quantity']
                
                stock_resp = requests.post(
                    f"{PRODUCT_SERVICE_URL}/api/v1/products/{pid}/stock",
                    json={"quantity_change": -qty},
                    headers=headers,
                    timeout=5
                )
                if stock_resp.status_code == 200:
                    reserved_stocks.append({"product_id": pid, "quantity": qty})
                else:
                    # Stock deduction failed, trigger rollback
                    raise ValueError(f"Failed to reserve stock for product {pid}")
                    
        except Exception as e:
            # Rollback reserved stocks
            for res in reserved_stocks:
                try:
                    requests.post(
                        f"{PRODUCT_SERVICE_URL}/api/v1/products/{res['product_id']}/stock",
                        json={"quantity_change": res['quantity']},
                        headers=headers,
                        timeout=5
                    )
                except Exception as rollback_err:
                    logger.error(f"Failed to rollback stock for product {res['product_id']}: {rollback_err}")
            raise e

        # 4. Create Order in DB
        order = OrderRepository.create_order(user_id, total_amount, items_to_create)
        
        # 5. Trigger Asynchronous Background Tasks via Celery (Payment, Shipping, Clear Cart)
        try:
            from ..tasks import post_order_creation_tasks
            post_order_creation_tasks.delay(
                order_id=order.id,
                total_amount=float(total_amount),
                shipping_address=shipping_address,
                recipient_name=recipient_name,
                recipient_phone=recipient_phone,
                user_id=user_id,
                token=token
            )
            logger.info(f"Delegated post-order tasks to Celery for Order ID: {order.id}")
        except Exception as celery_err:
            logger.error(f"Failed to delegate tasks to Celery for Order ID {order.id}: {celery_err}")
            # Fallback to sync calling if Celery fails to enqueue
            logger.info("Running post-order tasks synchronously as fallback...")
            try:
                requests.post(f"{PAYMENT_SERVICE_URL}/api/v1/payments/create", json={"order_id": order.id, "amount": float(total_amount), "payment_method": "COD"}, headers=headers, timeout=5)
                requests.post(f"{SHIPPING_SERVICE_URL}/api/v1/shipping/create", json={"order_id": order.id, "shipping_address": shipping_address, "recipient_name": recipient_name, "recipient_phone": recipient_phone, "carrier": "Giao Hàng Tiết Kiệm"}, headers=headers, timeout=5)
                requests.post(f"{CART_SERVICE_URL}/api/v1/cart/clear", headers=headers, timeout=5)
            except Exception as sync_err:
                logger.error(f"Fallback sync post-order tasks failed: {sync_err}")

        return order

    @staticmethod
    def update_order_status(order_id, status, comment=None):
        return OrderRepository.update_status(order_id, status, comment)

    @staticmethod
    def list_all_orders():
        orders = OrderRepository.get_all_orders()
        return [
            {
                "order_id": o.id,
                "user_id": o.user_id,
                "total_amount": o.total_amount,
                "status": o.status,
                "created_at": o.created_at
            } for o in orders
        ]

