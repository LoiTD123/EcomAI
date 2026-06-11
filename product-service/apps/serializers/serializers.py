from rest_framework import serializers

class ProductCreateSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    name = serializers.CharField(max_length=255)
    slug = serializers.CharField(max_length=255)
    price = serializers.DecimalField(decimal_places=2, max_digits=12)
    stock = serializers.IntegerField(default=0)
    description = serializers.CharField(required=False, allow_blank=True)
    product_type = serializers.ChoiceField(choices=['BOOK', 'ELECTRONICS', 'FASHION'])
    details = serializers.JSONField()
    images = serializers.ListField(
        child=serializers.JSONField(),
        required=False
    )

class StockUpdateSerializer(serializers.Serializer):
    quantity_change = serializers.IntegerField()
