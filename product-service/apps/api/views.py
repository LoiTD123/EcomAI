from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated, BasePermission
from ..serializers import ProductCreateSerializer, StockUpdateSerializer
from ..services import ProductService
import os
import uuid
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from rest_framework.parsers import MultiPartParser, FormParser

class IsManagementUser(BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Retrieve role from JWT token claims
        role = request.auth.get('role') if request.auth else None
        return role in ['admin', 'staff']

class ProductListCreateView(APIView):
    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsManagementUser()]
        return [AllowAny()]


    def get(self, request):
        category_id = request.query_params.get('category_id')
        product_type = request.query_params.get('product_type')
        search_query = request.query_params.get('search')
        
        try:
            limit = int(request.query_params.get('limit', 10))
            page = int(request.query_params.get('page', 1))
        except ValueError:
            limit = 10
            page = 1
            
        offset = (page - 1) * limit
        
        results, total = ProductService.list_products(
            category_id=category_id,
            product_type=product_type,
            search_query=search_query,
            limit=limit,
            offset=offset
        )
        
        next_page = f"/api/v1/products?page={page+1}" if offset + limit < total else None
        prev_page = f"/api/v1/products?page={page-1}" if page > 1 else None
        
        return Response({
            "count": total,
            "next": next_page,
            "previous": prev_page,
            "results": results
        }, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ProductCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = ProductService.create_product(
                category_id=serializer.validated_data['category_id'],
                name=serializer.validated_data['name'],
                slug=serializer.validated_data['slug'],
                price=serializer.validated_data['price'],
                stock=serializer.validated_data['stock'],
                description=serializer.validated_data.get('description', ''),
                product_type=serializer.validated_data['product_type'],
                details=serializer.validated_data['details'],
                images=serializer.validated_data.get('images', [])
            )
            return Response({
                "message": "Product created successfully",
                "product_id": product.id,
                "name": product.name
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ProductDetailView(APIView):
    def get_permissions(self):
        if self.request.method in ['PUT', 'DELETE']:
            return [IsAuthenticated(), IsManagementUser()]
        return [AllowAny()]

    def get(self, request, pk):
        product_detail = ProductService.get_product_detail(pk)
        if not product_detail:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        return Response(product_detail, status=status.HTTP_200_OK)

    def put(self, request, pk):
        serializer = ProductCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            product = ProductService.update_product(
                product_id=pk,
                category_id=serializer.validated_data['category_id'],
                name=serializer.validated_data['name'],
                slug=serializer.validated_data['slug'],
                price=serializer.validated_data['price'],
                stock=serializer.validated_data['stock'],
                description=serializer.validated_data.get('description', ''),
                product_type=serializer.validated_data['product_type'],
                details=serializer.validated_data['details'],
                images=serializer.validated_data.get('images', [])
            )
            return Response({
                "message": "Product updated successfully",
                "product_id": product.id,
                "name": product.name
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        success = ProductService.delete_product(pk)
        if success:
            return Response({"message": "Product deleted successfully"}, status=status.HTTP_200_OK)
        return Response({"error": "Product not found or delete failed"}, status=status.HTTP_400_BAD_REQUEST)

class ProductImageUploadView(APIView):
    permission_classes = [IsAuthenticated, IsManagementUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get('image')
        if not image_file:
            return Response({"error": "No image file provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        ext = os.path.splitext(image_file.name)[1].lower()
        if ext not in ['.jpg', '.jpeg', '.png', '.webp', '.gif']:
            return Response({"error": "Only images (jpg, png, webp, gif) are allowed"}, status=status.HTTP_400_BAD_REQUEST)
            
        filename = f"products/{uuid.uuid4()}{ext}"
        path = default_storage.save(filename, ContentFile(image_file.read()))
        
        image_url = f"/media/{path}"
        return Response({"image_url": image_url}, status=status.HTTP_201_CREATED)

class ProductStockUpdateView(APIView):
    """
    Internal endpoint called by Order Service to reserve/refund stock.
    Requires authentication, but we allow simple verification or internal network trust.
    For local development, we allow IsAuthenticated.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = StockUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        quantity_change = serializer.validated_data['quantity_change']
        success = ProductService.update_stock(pk, quantity_change)
        
        if success:
            return Response({"message": "Stock updated successfully"}, status=status.HTTP_200_OK)
        return Response({"error": "Failed to update stock. Insufficient quantity or product not found."}, status=status.HTTP_400_BAD_REQUEST)
