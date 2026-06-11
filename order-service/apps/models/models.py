from django.db import models

class Order(models.Model):
    ORDER_STATUS = (
        ('PENDING', 'Pending'),
        ('CONFIRMED', 'Confirmed'),
        ('SHIPPING', 'Shipping'),
        ('DELIVERED', 'Delivered'),
        ('CANCELLED', 'Cancelled'),
    )
    user_id = models.BigIntegerField()
    total_amount = models.DecimalField(decimal_places=2, max_digits=12)
    status = models.CharField(max_length=50, choices=ORDER_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'orders'

    def __str__(self):
        return f"Order {self.id} - User {self.user_id} - {self.status}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product_id = models.BigIntegerField()
    quantity = models.IntegerField()
    price = models.DecimalField(decimal_places=2, max_digits=12)

    class Meta:
        db_table = 'order_items'

    def __str__(self):
        return f"Order {self.order.id} - Product {self.product_id} - Qty {self.quantity}"

class OrderStatusHistory(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='status_history')
    status = models.CharField(max_length=50)
    comment = models.CharField(max_length=255, null=True, blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'order_status_history'

    def __str__(self):
        return f"Order {self.order.id} status changed to {self.status}"
