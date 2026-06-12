from ..models import Payment, PaymentTransaction, PaymentLog
from django.db import transaction

class PaymentRepository:
    @staticmethod
    def create_payment(order_id, amount, payment_method='COD'):
        with transaction.atomic():
            payment = Payment.objects.create(
                order_id=order_id,
                amount=amount,
                payment_method=payment_method,
                status='PENDING'
            )
            PaymentLog.objects.create(
                payment=payment,
                event_type='PAYMENT_CREATED',
                payload=f"Created payment of {amount} with method {payment_method}"
            )
            return payment

    @staticmethod
    def get_by_order_id(order_id):
        try:
            return Payment.objects.prefetch_related('transactions', 'logs').get(order_id=order_id)
        except Payment.DoesNotExist:
            return None

    @staticmethod
    def update_payment_success(payment, transaction_code):
        with transaction.atomic():
            payment.status = 'SUCCESS'
            payment.save()
            
            # Create transaction
            tx = PaymentTransaction.objects.create(
                payment=payment,
                transaction_code=transaction_code,
                amount=payment.amount,
                status='SUCCESS'
            )
            
            # Create log
            PaymentLog.objects.create(
                payment=payment,
                event_type='PAYMENT_SUCCESS',
                payload=f"Payment succeeded with transaction code {transaction_code}"
            )
            return payment, tx

    @staticmethod
    def update_payment_failed(payment, error_message):
        with transaction.atomic():
            payment.status = 'FAILED'
            payment.save()
            
            # Create log
            PaymentLog.objects.create(
                payment=payment,
                event_type='PAYMENT_FAILED',
                payload=f"Payment failed: {error_message}"
            )
            return payment

    @staticmethod
    def add_log(payment, event_type, payload):
        return PaymentLog.objects.create(
            payment=payment,
            event_type=event_type,
            payload=payload
        )
