from apps.models import Shipment, ShipmentTracking, DeliveryLog
from django.db import transaction
import random
import string

class ShippingRepository:
    @staticmethod
    def generate_tracking_number(carrier):
        prefix = ''.join(random.choices(string.ascii_uppercase, k=3))
        suffix = ''.join(random.choices(string.digits, k=8))
        return f"{prefix}-{suffix}"

    @classmethod
    def create_shipment(cls, order_id, shipping_address, recipient_name, recipient_phone, carrier):
        tracking_number = cls.generate_tracking_number(carrier)
        with transaction.atomic():
            shipment = Shipment.objects.create(
                order_id=order_id,
                tracking_number=tracking_number,
                carrier=carrier,
                shipping_address=shipping_address,
                recipient_name=recipient_name,
                recipient_phone=recipient_phone,
                status='PROCESSING'
            )
            ShipmentTracking.objects.create(
                shipment=shipment,
                location='WareHouse',
                status='PROCESSING',
                description='Shipment initialized and packaged.'
            )
            DeliveryLog.objects.create(
                shipment=shipment,
                log_content='Shipment created.'
            )
            return shipment

    @staticmethod
    def get_by_tracking_number(tracking_number):
        try:
            return Shipment.objects.prefetch_related('tracking_updates', 'logs').get(tracking_number=tracking_number)
        except Shipment.DoesNotExist:
            return None

    @staticmethod
    def get_by_order_id(order_id):
        try:
            return Shipment.objects.prefetch_related('tracking_updates', 'logs').get(order_id=order_id)
        except Shipment.DoesNotExist:
            return None

    @staticmethod
    def add_tracking_update(shipment, location, status, description=None):
        with transaction.atomic():
            shipment.status = status
            shipment.save()
            
            update = ShipmentTracking.objects.create(
                shipment=shipment,
                location=location,
                status=status,
                description=description
            )
            DeliveryLog.objects.create(
                shipment=shipment,
                log_content=f"Location: {location} - Status: {status} - Description: {description}"
            )
            return update

    @staticmethod
    def get_all_shipments():
        return Shipment.objects.prefetch_related('tracking_updates', 'logs').all().order_by('-created_at')

