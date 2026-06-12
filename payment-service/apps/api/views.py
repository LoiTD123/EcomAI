from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from ..serializers import PaymentCreateSerializer, PaymentPaySerializer
from ..services import PaymentService

class CreatePaymentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            payment = PaymentService.create_payment(
                order_id=serializer.validated_data['order_id'],
                amount=serializer.validated_data['amount'],
                payment_method=serializer.validated_data.get('payment_method', 'COD')
            )
            return Response({
                "message": "Payment record created successfully",
                "payment_id": payment.id,
                "status": payment.status
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

class PayView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = PaymentPaySerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        token = request.headers.get('Authorization')
        
        try:
            payment = PaymentService.process_cod_payment(
                order_id=serializer.validated_data['order_id'],
                transaction_code=serializer.validated_data['transaction_code'],
                token=token
            )
            return Response({
                "message": "Payment processed successfully",
                "payment_id": payment.id,
                "status": payment.status
            }, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
