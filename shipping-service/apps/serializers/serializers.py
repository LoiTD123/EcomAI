from rest_framework import serializers
from apps.models import Shipment, ShipmentTracking

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

class ShipmentTrackingSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShipmentTracking
        fields = ['id', 'location', 'status', 'description', 'updated_at']

class ShipmentSerializer(serializers.ModelSerializer):
    tracking_updates = ShipmentTrackingSerializer(many=True, read_only=True)

    class Meta:
        model = Shipment
        fields = [
            'id', 'order_id', 'tracking_number', 'carrier', 
            'shipping_address', 'recipient_name', 'recipient_phone', 
            'status', 'created_at', 'updated_at', 'tracking_updates'
        ]

