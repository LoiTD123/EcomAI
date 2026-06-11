from apps.repositories import ShippingRepository
import requests
import os
import logging

logger = logging.getLogger(__name__)

PAYMENT_SERVICE_URL = os.getenv('PAYMENT_SERVICE_URL', 'http://payment-service:8000')
ORDER_SERVICE_URL = os.getenv('ORDER_SERVICE_URL', 'http://order-service:8000')

class ShippingService:
    @staticmethod
    def create_shipment(order_id, shipping_address, recipient_name, recipient_phone, carrier):
        return ShippingRepository.create_shipment(
            order_id=order_id,
            shipping_address=shipping_address,
            recipient_name=recipient_name,
            recipient_phone=recipient_phone,
            carrier=carrier
        )

    @staticmethod
    def update_tracking(tracking_number, location, status, description=None):
        shipment = ShippingRepository.get_by_tracking_number(tracking_number)
        if not shipment:
            raise ValueError("Shipment not found")
        return ShippingRepository.add_tracking_update(shipment, location, status, description)

    @classmethod
    def complete_delivery(cls, tracking_number, token=None):
        shipment = ShippingRepository.get_by_tracking_number(tracking_number)
        if not shipment:
            raise ValueError("Shipment not found")
            
        if shipment.status == 'DELIVERED':
            return shipment
            
        # 1. Update shipping status to DELIVERED
        ShippingRepository.add_tracking_update(
            shipment=shipment,
            location=shipment.shipping_address,
            status='DELIVERED',
            description='Package delivered to recipient and COD payment collected.'
        )
        
        headers = {}
        if token:
            headers['Authorization'] = token
            
        # 2. Notify Payment Service to update payment status to SUCCESS (since COD payment is collected on delivery)
        try:
            tx_code = f"TX-COD-{shipment.order_id}"
            pay_url = f"{PAYMENT_SERVICE_URL}/api/v1/payments/pay"
            pay_resp = requests.post(
                pay_url,
                json={"order_id": shipment.order_id, "transaction_code": tx_code},
                headers=headers,
                timeout=5
            )
            if pay_resp.status_code != 200:
                logger.error(f"Failed to update payment status for order {shipment.order_id}: {pay_resp.text}")
        except Exception as pay_err:
            logger.error(f"Error calling Payment Service for order {shipment.order_id}: {pay_err}")

        # 3. Notify Order Service to update order status to DELIVERED
        try:
            order_url = f"{ORDER_SERVICE_URL}/api/v1/orders/{shipment.order_id}/status"
            order_resp = requests.post(
                order_url,
                json={"status": "DELIVERED", "comment": "Order delivered successfully."},
                headers=headers,
                timeout=5
            )
            if order_resp.status_code != 200:
                logger.error(f"Failed to update order status for order {shipment.order_id}: {order_resp.text}")
        except Exception as order_err:
            logger.error(f"Error calling Order Service for order {shipment.order_id}: {order_err}")

        return shipment
