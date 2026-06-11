from django.urls import path
from .views import ProductListCreateView, ProductDetailView, ProductStockUpdateView, ProductImageUploadView

urlpatterns = [
    path('', ProductListCreateView.as_view(), name='product-list-create'),
    path('upload-image', ProductImageUploadView.as_view(), name='product-image-upload'),
    path('<int:pk>', ProductDetailView.as_view(), name='product-detail'),
    path('<int:pk>/stock', ProductStockUpdateView.as_view(), name='product-stock-update'),
]
