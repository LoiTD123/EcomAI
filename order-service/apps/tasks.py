from celery import shared_task
import requests
import logging
from .breakers import payment_breaker, shipping_breaker, cart_breaker

logger = logging.getLogger(__name__)

@shared_task(name="apps.tasks.post_order_creation_tasks")
def post_order_creation_tasks(order_id, total_amount, shipping_address, recipient_name, recipient_phone, user_id, token):
    """
    Asynchronous task running after order database creation.
    Performs background HTTP integrations wrapped in Circuit Breakers: Payment creation, Shipping registration, and Cart clearing.
    """
    headers = {"Authorization": token}
    
    PAYMENT_SERVICE_URL = "http://payment-service:8000"
    SHIPPING_SERVICE_URL = "http://shipping-service:8000"
    CART_SERVICE_URL = "http://cart-service:8000"

    logger.info(f"Starting post-order tasks for Order ID: {order_id}")

    # 1. Create Payment record (COD)
    try:
        logger.info(f"Calling Payment Service to create payment for order {order_id}")
        pay_resp = payment_breaker.call(
            requests.post,
            f"{PAYMENT_SERVICE_URL}/api/v1/payments/create",
            json={
                "order_id": order_id,
                "amount": total_amount,
                "payment_method": "COD"
            },
            headers=headers,
            timeout=10
        )
        if pay_resp.status_code == 201:
            logger.info(f"Payment record created successfully for order {order_id}")
        else:
            logger.warning(f"Payment service returned status code {pay_resp.status_code} for order {order_id}")
    except Exception as pay_err:
        logger.error(f"Error calling Payment Service for order {order_id} (or breaker open): {pay_err}")

    # 2. Create Shipping record (Vận đơn)
    try:
        logger.info(f"Calling Shipping Service to create shipment for order {order_id}")
        ship_resp = shipping_breaker.call(
            requests.post,
            f"{SHIPPING_SERVICE_URL}/api/v1/shipping/create",
            json={
                "order_id": order_id,
                "shipping_address": shipping_address,
                "recipient_name": recipient_name,
                "recipient_phone": recipient_phone,
                "carrier": "Giao Hàng Tiết Kiệm"
            },
            headers=headers,
            timeout=10
        )
        if ship_resp.status_code == 201:
            logger.info(f"Shipping record created successfully for order {order_id}")
        else:
            logger.warning(f"Shipping service returned status code {ship_resp.status_code} for order {order_id}")
    except Exception as ship_err:
        logger.error(f"Error calling Shipping Service for order {order_id} (or breaker open): {ship_err}")

    # 3. Clear Cart
    try:
        logger.info(f"Calling Cart Service to clear cart for user {user_id}")
        cart_resp = cart_breaker.call(
            requests.post,
            f"{CART_SERVICE_URL}/api/v1/cart/clear",
            headers=headers,
            timeout=10
        )
        if cart_resp.status_code == 200:
            logger.info(f"Cart cleared successfully for user {user_id}")
        else:
            logger.warning(f"Cart service returned status code {cart_resp.status_code} for user {user_id}")
    except Exception as cart_err:
        logger.error(f"Failed to clear cart for user {user_id} (or breaker open): {cart_err}")

    logger.info(f"Completed post-order tasks for Order ID: {order_id}")
