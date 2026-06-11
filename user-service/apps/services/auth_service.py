from apps.repositories import UserRepository
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken as JWTRefreshToken
from django.utils import timezone
import datetime

class AuthService:
    @staticmethod
    def register(username, email, password, first_name=None, last_name=None):
        if UserRepository.get_by_username(username):
            raise ValueError("Username already exists")
        if UserRepository.get_by_email(email):
            raise ValueError("Email already exists")
        
        user = UserRepository.create_user(
            username=username,
            email=email,
            password=password,
            role_name='customer',
            first_name=first_name,
            last_name=last_name
        )
        return user

    @staticmethod
    def login(username, password):
        user = authenticate(username=username, password=password)
        if not user or not user.is_active:
            raise ValueError("Invalid username or password")

        # Generate JWT Tokens
        jwt_token = JWTRefreshToken.for_user(user)
        
        # Add custom claims to tokens
        role_name = user.role.name if user.role else 'customer'
        jwt_token['role'] = role_name
        jwt_token['username'] = user.username
        jwt_token.access_token['role'] = role_name
        jwt_token.access_token['username'] = user.username

        access_token = str(jwt_token.access_token)
        refresh_token = str(jwt_token)

        # Decode refresh token to get expiration time
        expires_in_seconds = jwt_token['exp']
        expires_at = timezone.make_aware(datetime.datetime.fromtimestamp(expires_in_seconds))

        # Save RefreshToken to Database
        UserRepository.add_refresh_token(user, refresh_token, expires_at)

        return {
            "access": access_token,
            "refresh": refresh_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "role": role_name
            }
        }

    @staticmethod
    def refresh(refresh_token_str):
        # Validate refresh token from database
        db_token = UserRepository.get_refresh_token(refresh_token_str)
        if not db_token or db_token.expires_at < timezone.now():
            if db_token:
                UserRepository.delete_refresh_token(refresh_token_str)
            raise ValueError("Invalid or expired refresh token")

        try:
            # Decode using SimpleJWT to verify signature and expiry
            jwt_token = JWTRefreshToken(refresh_token_str)
            
            user = db_token.user
            role_name = user.role.name if user.role else 'customer'
            
            access_token = jwt_token.access_token
            access_token['role'] = role_name
            access_token['username'] = user.username
            
            return {"access": str(access_token)}
        except Exception:
            UserRepository.delete_refresh_token(refresh_token_str)
            raise ValueError("Invalid refresh token signature")

    @staticmethod
    def logout(refresh_token_str):
        UserRepository.delete_refresh_token(refresh_token_str)
        return True
