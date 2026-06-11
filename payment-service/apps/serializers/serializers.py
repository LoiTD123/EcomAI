from rest_framework import serializers

class PaymentCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    amount = serializers.DecimalField(decimal_places=2, max_digits=12)
    payment_method = serializers.CharField(max_length=50, default='COD')

class PaymentPaySerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    transaction_code = serializers.CharField(max_length=100)
