from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.serializers import OrderCreateSerializer, OrderStatusUpdateSerializer
from apps.services import OrderService

class OrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_id = request.user.id
        orders = OrderService.list_orders(user_id)
        return Response(orders, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        user_id = request.user.id
        token = request.headers.get('Authorization')
        
        try:
            order = OrderService.create_order(
                user_id=user_id,
                shipping_address=serializer.validated_data['shipping_address'],
                recipient_name=serializer.validated_data['recipient_name'],
                recipient_phone=serializer.validated_data['recipient_phone'],
                token=token
            )
            return Response({
                "message": "Order created successfully",
                "order_id": order.id,
                "total_amount": order.total_amount,
                "status": order.status
            }, status=status.HTTP_210_CREATED)
        except (ValueError, RuntimeError) as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class OrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        order_details = OrderService.get_order_details(pk)
        if not order_details:
            return Response({"error": "Order not found"}, status=status.HTTP_404_NOT_FOUND)
            
        # Security check: Ensure user owns this order
        if order_details['user_id'] != request.user.id:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        return Response(order_details, status=status.HTTP_200_OK)

class OrderStatusUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        serializer = OrderStatusUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Check permissions - in production, only allow internal service call or admin.
        # For simple demo, we trust IsAuthenticated.
        order = OrderService.update_order_status(
            order_id=pk,
            status=serializer.validated_data['status'],
            comment=serializer.validated_data.get('comment')
        )
        if order:
            return Response({
                "message": f"Order status updated to {order.status}",
                "order_id": order.id,
                "status": order.status
            }, status=status.HTTP_200_OK)
        return Response({"error": "Order not found or update failed"}, status=status.HTTP_400_BAD_REQUEST)
