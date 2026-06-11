from django.urls import path
from .views import CreateShippingView, ShippingTrackingUpdateView, ShippingCompleteView

urlpatterns = [
    path('create', CreateShippingView.as_view(), name='shipping-create'),
    path('tracking', ShippingTrackingUpdateView.as_view(), name='shipping-tracking'),
    path('complete', ShippingCompleteView.as_view(), name='shipping-complete'),
]
