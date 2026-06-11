from django.urls import path
from .views import CartView, CartItemDetailView, CartClearView

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail-add'),
    path('items/<int:pk>', CartItemDetailView.as_view(), name='cart-item-detail'),
    path('clear', CartClearView.as_view(), name='cart-clear'),
]
