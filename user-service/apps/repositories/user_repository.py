from apps.models import User, Role, Permission, RefreshToken
from django.db import transaction

class UserRepository:
    @staticmethod
    def get_by_id(user_id):
        try:
            return User.objects.get(id=user_id)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_by_username(username):
        try:
            return User.objects.get(username=username)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_by_email(email):
        try:
            return User.objects.get(email=email)
        except User.DoesNotExist:
            return None

    @staticmethod
    def create_user(username, email, password, role_name='customer', first_name=None, last_name=None):
        try:
            role = Role.objects.get(name=role_name)
        except Role.DoesNotExist:
            # Fallback if roles aren't seeded yet
            role, _ = Role.objects.get_or_create(name=role_name)
            
        with transaction.atomic():
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name
            )
            return user

    @staticmethod
    def add_refresh_token(user, token, expires_at):
        return RefreshToken.objects.create(
            user=user,
            token=token,
            expires_at=expires_at
        )

    @staticmethod
    def get_refresh_token(token):
        try:
            return RefreshToken.objects.get(token=token)
        except RefreshToken.DoesNotExist:
            return None

    @staticmethod
    def delete_refresh_token(token):
        RefreshToken.objects.filter(token=token).delete()

    @staticmethod
    def delete_all_user_refresh_tokens(user_id):
        RefreshToken.objects.filter(user_id=user_id).delete()

    @staticmethod
    def get_all_users():
        return User.objects.all().order_by('id')

    @staticmethod
    def update_user_role(user_id, role_name):
        try:
            user = User.objects.get(id=user_id)
            role = Role.objects.get(name=role_name)
            user.role = role
            user.save()
            return user
        except (User.DoesNotExist, Role.DoesNotExist):
            return None

    @staticmethod
    def update_profile(user, email, first_name=None, last_name=None, password=None):
        user.email = email
        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if password:
            user.set_password(password)
        user.save()
        return user

