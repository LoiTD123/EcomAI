from django.urls import path
from .views import CreateShippingView, ShippingTrackingUpdateView, ShippingCompleteView, ListShippingView, GetShippingByOrderView

urlpatterns = [
    path('', ListShippingView.as_view(), name='shipping-list'),
    path('create', CreateShippingView.as_view(), name='shipping-create'),
    path('tracking', ShippingTrackingUpdateView.as_view(), name='shipping-tracking'),
    path('complete', ShippingCompleteView.as_view(), name='shipping-complete'),
    path('order/<int:order_id>', GetShippingByOrderView.as_view(), name='shipping-by-order'),
]

