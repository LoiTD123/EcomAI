from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.serializers import CartItemAddSerializer, CartItemUpdateSerializer
from apps.services import CartService

class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        cart_data = CartService.get_cart_by_user(user_id)
        return Response(cart_data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = CartItemAddSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.user.id
        token = request.headers.get('Authorization')
        
        try:
            item = CartService.add_to_cart(
                user_id=user_id,
                product_id=serializer.validated_data['product_id'],
                quantity=serializer.validated_data['quantity'],
                token=token
            )
            return Response({
                "message": "Product added to cart successfully",
                "item": item
            }, status=status.HTTP_200_OK)
        except (ValueError, RuntimeError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        serializer = CartItemUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.user.id
        token = request.headers.get('Authorization')
        
        try:
            item = CartService.update_item(
                user_id=user_id,
                item_id=pk,
                quantity=serializer.validated_data['quantity'],
                token=token
            )
            return Response({
                "message": "Cart item updated successfully",
                "item": item
            }, status=status.HTTP_200_OK)
        except (ValueError, RuntimeError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        user_id = request.user.id
        try:
            CartService.remove_item(user_id, pk)
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)

class CartClearView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user_id = request.user.id
        CartService.clear_cart(user_id)
        return Response({"message": "Cart cleared successfully"}, status=status.HTTP_200_OK)
