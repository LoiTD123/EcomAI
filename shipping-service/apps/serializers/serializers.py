from rest_framework import serializers

class ShippingCreateSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    shipping_address = serializers.CharField(max_length=500)
    recipient_name = serializers.CharField(max_length=255)
    recipient_phone = serializers.CharField(max_length=20)
    carrier = serializers.CharField(max_length=100)

class ShippingTrackingUpdateSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=100)
    location = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(choices=['PROCESSING', 'SHIPPING', 'DELIVERED', 'CANCELLED'])
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)

class ShippingCompleteSerializer(serializers.Serializer):
    tracking_number = serializers.CharField(max_length=100)
