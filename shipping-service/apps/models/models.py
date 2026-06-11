from django.db import models

class Shipment(models.Model):
    SHIPPING_STATUS = (
        ('PROCESSING', 'Processing'),
        ('SHIPPING', 'Shipping'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )
    order_id = models.BigIntegerField(unique=True)
    tracking_number = models.CharField(max_length=100, unique=True)
    carrier = models.CharField(max_length=100)
    shipping_address = models.TextField()
    recipient_name = models.CharField(max_length=100)
    recipient_phone = models.CharField(max_length=20)
    status = models.CharField(max_length=50, choices=SHIPPING_STATUS, default='PROCESSING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'shipments'

    def __str__(self):
        return f"Shipment {self.tracking_number} for Order {self.order_id} - {self.status}"

class ShipmentTracking(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='tracking_updates')
    location = models.CharField(max_length=255)
    status = models.CharField(max_length=50)
    description = models.CharField(max_length=255, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'shipment_tracking'

    def __str__(self):
        return f"{self.shipment.tracking_number} at {self.location} - Status {self.status}"

class DeliveryLog(models.Model):
    shipment = models.ForeignKey(Shipment, on_delete=models.CASCADE, related_name='logs')
    log_content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'delivery_logs'

    def __str__(self):
        return f"Shipment {self.shipment.tracking_number} Log at {self.created_at}"
