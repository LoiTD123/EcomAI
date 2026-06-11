from apps.models import Order, OrderItem, OrderStatusHistory
from django.db import transaction

class OrderRepository:
    @staticmethod
    def get_by_id(order_id):
        try:
            return Order.objects.prefetch_related('items', 'status_history').get(id=order_id)
        except Order.DoesNotExist:
            return None

    @staticmethod
    def get_by_user_id(user_id):
        return Order.objects.filter(user_id=user_id).order_by('-created_at')

    @staticmethod
    def create_order(user_id, total_amount, items_data):
        """
        Creates an order with items in a database transaction.
        items_data format: [{"product_id": 1, "quantity": 2, "price": 120000.00}]
        """
        with transaction.atomic():
            order = Order.objects.create(
                user_id=user_id,
                total_amount=total_amount,
                status='PENDING'
            )
            
            for item in items_data:
                OrderItem.objects.create(
                    order=order,
                    product_id=item['product_id'],
                    quantity=item['quantity'],
                    price=item['price']
                )
                
            # Record status history
            OrderStatusHistory.objects.create(
                order=order,
                status='PENDING',
                comment='Order initially created.'
            )
            return order

    @staticmethod
    def update_status(order_id, status, comment=None):
        with transaction.atomic():
            try:
                order = Order.objects.select_for_update().get(id=order_id)
                order.status = status
                order.save()
                
                OrderStatusHistory.objects.create(
                    order=order,
                    status=status,
                    comment=comment
                )
                return order
            except Order.DoesNotExist:
                return None
            except Exception:
                return None

    @staticmethod
    def get_all_orders():
        return Order.objects.all().order_by('-created_at')

