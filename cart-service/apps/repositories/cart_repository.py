from ..models import Cart, CartItem
from django.db import transaction

class CartRepository:
    @staticmethod
    def get_by_user_id(user_id):
        cart, _ = Cart.objects.prefetch_related('items').get_or_create(user_id=user_id)
        return cart

    @staticmethod
    def add_item(cart, product_id, quantity=1):
        with transaction.atomic():
            item, created = CartItem.objects.get_or_create(
                cart=cart,
                product_id=product_id,
                defaults={'quantity': quantity}
            )
            if not created:
                item.quantity += quantity
                item.save()
            return item

    @staticmethod
    def update_item_quantity(item_id, quantity):
        try:
            item = CartItem.objects.get(id=item_id)
            item.quantity = quantity
            item.save()
            return item
        except CartItem.DoesNotExist:
            return None

    @staticmethod
    def get_item_by_id(item_id):
        try:
            return CartItem.objects.get(id=item_id)
        except CartItem.DoesNotExist:
            return None

    @staticmethod
    def remove_item(item_id):
        CartItem.objects.filter(id=item_id).delete()

    @staticmethod
    def clear_cart(cart):
        CartItem.objects.filter(cart=cart).delete()
