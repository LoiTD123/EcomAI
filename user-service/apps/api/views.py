from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from apps.serializers import (
    RegisterRequestSerializer,
    LoginRequestSerializer,
    RefreshRequestSerializer,
    UserResponseSerializer,
    ProfileUpdateRequestSerializer
)
from apps.services import AuthService
from apps.repositories import UserRepository

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = AuthService.register(
                username=serializer.validated_data['username'],
                email=serializer.validated_data['email'],
                password=serializer.validated_data['password'],
                first_name=serializer.validated_data.get('first_name'),
                last_name=serializer.validated_data.get('last_name')
            )
            return Response({
                "message": "User registered successfully",
                "user_id": user.id,
                "username": user.username
            }, status=status.HTTP_201_CREATED)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = AuthService.login(
                username=serializer.validated_data['username'],
                password=serializer.validated_data['password']
            )
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RefreshRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            result = AuthService.refresh(serializer.validated_data['refresh'])
            return Response(result, status=status.HTTP_200_OK)
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RefreshRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            AuthService.logout(serializer.validated_data['refresh'])
            return Response({"message": "Logged out successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Internal server error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserResponseSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request):
        serializer = ProfileUpdateRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        email = serializer.validated_data['email']
        existing_user = UserRepository.get_by_email(email)
        if existing_user and existing_user.id != request.user.id:
            return Response({"error": "Email is already taken by another user"}, status=status.HTTP_400_BAD_REQUEST)
            
        updated_user = UserRepository.update_profile(
            user=request.user,
            email=email,
            first_name=serializer.validated_data.get('first_name'),
            last_name=serializer.validated_data.get('last_name'),
            password=serializer.validated_data.get('password')
        )
        
        response_serializer = UserResponseSerializer(updated_user)
        return Response(response_serializer.data, status=status.HTTP_200_OK)

class VerifyTokenView(APIView):
    """
    Internal API endpoint used by Nginx or other microservices to verify an access token.
    Reads Authorization header, validates JWT and returns user details.
    """
    permission_classes = [AllowAny]  # Let JWTAuthentication handle validation manually

    def get(self, request):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return Response({"error": "Missing or invalid authorization header"}, status=status.HTTP_401_UNAUTHORIZED)
        
        token = auth_header.split(' ')[1]
        try:
            authenticator = JWTAuthentication()
            validated_token = authenticator.get_validated_token(token)
            user = authenticator.get_user(validated_token)
            
            if not user or not user.is_active:
                return Response({"error": "User is inactive or deleted"}, status=status.HTTP_401_UNAUTHORIZED)
                
            return Response({
                "valid": True,
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.role.name if user.role else 'customer'
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": "Invalid or expired token"}, status=status.HTTP_401_UNAUTHORIZED)

class UserManagementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        role = request.auth.get('role') if request.auth else (request.user.role.name if (hasattr(request.user, 'role') and request.user.role) else 'customer')
        if role != 'admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)
            
        users = UserRepository.get_all_users()
        data = [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role.name if u.role else 'customer',
                "is_active": u.is_active
            } for u in users
        ]
        return Response(data, status=status.HTTP_200_OK)

    def put(self, request):
        role = request.auth.get('role') if request.auth else (request.user.role.name if (hasattr(request.user, 'role') and request.user.role) else 'customer')
        if role != 'admin':
            return Response({"error": "Forbidden"}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        if not user_id or not new_role:
            return Response({"error": "user_id and role are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        if new_role not in ['admin', 'staff', 'customer']:
            return Response({"error": "Invalid role"}, status=status.HTTP_400_BAD_REQUEST)

        if int(user_id) == request.user.id and new_role != 'admin':
            return Response({"error": "You cannot change your own admin role"}, status=status.HTTP_400_BAD_REQUEST)

        updated_user = UserRepository.update_user_role(user_id, new_role)
        if not updated_user:
            return Response({"error": "User or Role not found"}, status=status.HTTP_404_NOT_FOUND)

        UserRepository.delete_all_user_refresh_tokens(user_id)

        return Response({
            "message": "User role updated successfully",
            "user_id": updated_user.id,
            "username": updated_user.username,
            "role": updated_user.role.name if updated_user.role else 'customer'
        }, status=status.HTTP_200_OK)

