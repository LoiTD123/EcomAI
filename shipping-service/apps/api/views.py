from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from apps.serializers import (
    ShippingCreateSerializer, 
    ShippingTrackingUpdateSerializer, 
    ShippingCompleteSerializer,
    ShipmentSerializer
)
from apps.services import ShippingService

class CreateShippingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ShippingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            shipment = ShippingService.create_shipment(
                order_id=serializer.validated_data['order_id'],
                shipping_address=serializer.validated_data['shipping_address'],
                recipient_name=serializer.validated_data['recipient_name'],
                recipient_phone=serializer.validated_data['recipient_phone'],
                carrier=serializer.validated_data['carrier']
            )
            return Response({
                "message": "Shipping record created successfully",
                "shipment_id": shipment.id,
                "tracking_number": shipment.tracking_number,
                "status": shipment.status
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ShippingTrackingUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.auth.get('role') if request.auth else None
        if role not in ['admin', 'staff']:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ShippingTrackingUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            update = ShippingService.update_tracking(
                tracking_number=serializer.validated_data['tracking_number'],
                location=serializer.validated_data['location'],
                status=serializer.validated_data['status'],
                description=serializer.validated_data.get('description')
            )
            return Response({
                "message": "Shipping tracking updated successfully",
                "tracking_id": update.id,
                "status": update.status
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ShippingCompleteView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        role = request.auth.get('role') if request.auth else None
        if role not in ['admin', 'staff']:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        serializer = ShippingCompleteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = request.headers.get('Authorization')
        
        try:
            shipment = ShippingService.complete_delivery(
                tracking_number=serializer.validated_data['tracking_number'],
                token=token
            )
            return Response({
                "message": "Delivery completed successfully",
                "tracking_number": shipment.tracking_number,
                "status": shipment.status
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class ListShippingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.auth.get('role') if request.auth else None
        if role not in ['admin', 'staff']:
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        shipments = ShippingService.list_all_shipments()
        serializer = ShipmentSerializer(shipments, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class GetShippingByOrderView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, order_id):
        try:
            from apps.repositories import ShippingRepository
            shipment = ShippingRepository.get_by_order_id(order_id)
            serializer = ShipmentSerializer(shipment)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception:
            return Response({"error": "Shipment not found"}, status=status.HTTP_404_NOT_FOUND)


