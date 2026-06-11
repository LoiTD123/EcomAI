from django.db import models

class Payment(models.Model):
    PAYMENT_STATUS = (
        ('PENDING', 'Pending'),
        ('SUCCESS', 'Success'),
        ('FAILED', 'Failed'),
        ('REFUNDED', 'Refunded'),
    )
    order_id = models.BigIntegerField(unique=True)
    payment_method = models.CharField(max_length=50, default='COD')
    amount = models.DecimalField(decimal_places=2, max_digits=12)
    status = models.CharField(max_length=50, choices=PAYMENT_STATUS, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'

    def __str__(self):
        return f"Payment {self.id} for Order {self.order_id} - {self.status}"

class PaymentTransaction(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='transactions')
    transaction_code = models.CharField(max_length=100, unique=True)
    amount = models.DecimalField(decimal_places=2, max_digits=12)
    status = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_transactions'

    def __str__(self):
        return f"Tx {self.transaction_code} - Status {self.status}"

class PaymentLog(models.Model):
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='logs')
    event_type = models.CharField(max_length=100)
    payload = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payment_logs'

    def __str__(self):
        return f"Log {self.event_type} at {self.created_at}"
