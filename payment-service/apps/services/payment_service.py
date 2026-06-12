from ..repositories import PaymentRepository
import requests
import os
import logging

logger = logging.getLogger(__name__)

ORDER_SERVICE_URL = os.getenv('ORDER_SERVICE_URL', 'http://order-service:8000')

class PaymentService:
    @staticmethod
    def create_payment(order_id, amount, payment_method='COD'):
        return PaymentRepository.create_payment(order_id, amount, payment_method)

    @staticmethod
    def process_cod_payment(order_id, transaction_code, token=None):
        payment = PaymentRepository.get_by_order_id(order_id)
        if not payment:
            raise ValueError("Payment record not found")
            
        if payment.status == 'SUCCESS':
            return payment
            
        payment, tx = PaymentRepository.update_payment_success(payment, transaction_code)
        
        # Call Order Service to update order status to CONFIRMED or DELIVERED
        # Since it is COD, payment success usually happens at the end (DELIVERED).
        headers = {}
        if token:
            headers['Authorization'] = token
            
        try:
            url = f"{ORDER_SERVICE_URL}/api/v1/orders/{order_id}/status"
            # COD delivery logic updates order status to DELIVERED when paid.
            requests.post(url, json={"status": "DELIVERED", "comment": "COD payment collected."}, headers=headers, timeout=5)
        except Exception as e:
            logger.error(f"Failed to notify Order Service of payment success for order {order_id}: {e}")
            
        return payment
