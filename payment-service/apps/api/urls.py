from django.urls import path
from .views import CreatePaymentView, PayView

urlpatterns = [
    path('create', CreatePaymentView.as_view(), name='payment-create'),
    path('pay', PayView.as_view(), name='payment-pay'),
]
