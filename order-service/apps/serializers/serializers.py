from rest_framework import serializers

class OrderCreateSerializer(serializers.Serializer):
    shipping_address = serializers.CharField(max_length=500)
    recipient_name = serializers.CharField(max_length=255)
    recipient_phone = serializers.CharField(max_length=20)

class OrderStatusUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'])
    comment = serializers.CharField(max_length=255, required=False, allow_blank=True)
