from django.core.management.base import BaseCommand
from ...models import Role, Permission, User

class Command(BaseCommand):
    help = 'Seeds initial roles, permissions and sample users.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding roles and permissions...')
        
        # 1. Create Permissions
        perms = [
            ('view_product', 'Can view products'),
            ('create_product', 'Can create products'),
            ('add_to_cart', 'Can add products to cart'),
            ('create_order', 'Can create orders'),
            ('update_shipping', 'Can update shipping status'),
            ('admin_all', 'Full administrative permissions'),
        ]
        
        db_perms = {}
        for code, desc in perms:
            perm, created = Permission.objects.get_or_create(name=code, defaults={'description': desc})
            db_perms[code] = perm
            if created:
                self.stdout.write(f'Created permission: {code}')
                
        # 2. Create Roles and assign permissions
        # Admin Role
        admin_role, created = Role.objects.get_or_create(name='admin', defaults={'description': 'Administrator'})
        if created:
            admin_role.permissions.set(list(db_perms.values()))
            self.stdout.write('Created role: admin')
            
        # Customer Role
        customer_role, created = Role.objects.get_or_create(name='customer', defaults={'description': 'Standard Customer'})
        if created:
            customer_role.permissions.set([
                db_perms['view_product'],
                db_perms['add_to_cart'],
                db_perms['create_order']
            ])
            self.stdout.write('Created role: customer')

        # Staff Role
        staff_role, created = Role.objects.get_or_create(name='staff', defaults={'description': 'Shop Staff'})
        if created:
            staff_role.permissions.set([
                db_perms['view_product'],
                db_perms['create_product'],
                db_perms['update_shipping']
            ])
            self.stdout.write('Created role: staff')

        # 3. Create Sample Users
        self.stdout.write('Creating sample users...')
        
        # Admin User
        if not User.objects.filter(username='admin').exists():
            admin_user = User.objects.create_user(
                username='admin',
                email='admin@ecom.com',
                password='AdminPassword123!',
                role=admin_role,
                first_name='System',
                last_name='Admin'
            )
            self.stdout.write('Created user: admin (password: AdminPassword123!)')
            
        # Customer 1 User
        if not User.objects.filter(username='customer1').exists():
            cust1 = User.objects.create_user(
                username='customer1',
                email='customer1@ecom.com',
                password='CustomerPassword123!',
                role=customer_role,
                first_name='An',
                last_name='Nguyen'
            )
            self.stdout.write('Created user: customer1 (password: CustomerPassword123!)')

        # Customer 2 User
        if not User.objects.filter(username='customer2').exists():
            cust2 = User.objects.create_user(
                username='customer2',
                email='customer2@ecom.com',
                password='CustomerPassword123!',
                role=customer_role,
                first_name='Binh',
                last_name='Tran'
            )
            self.stdout.write('Created user: customer2 (password: CustomerPassword123!)')

        # Customer 3 User
        if not User.objects.filter(username='customer3').exists():
            cust3 = User.objects.create_user(
                username='customer3',
                email='customer3@ecom.com',
                password='CustomerPassword123!',
                role=customer_role,
                first_name='Minh',
                last_name='Le'
            )
            self.stdout.write('Created user: customer3 (password: CustomerPassword123!)')

        # Customer 4 User
        if not User.objects.filter(username='customer4').exists():
            cust4 = User.objects.create_user(
                username='customer4',
                email='customer4@ecom.com',
                password='CustomerPassword123!',
                role=customer_role,
                first_name='Dung',
                last_name='Vu'
            )
            self.stdout.write('Created user: customer4 (password: CustomerPassword123!)')

        # Customer 5 User
        if not User.objects.filter(username='customer5').exists():
            cust5 = User.objects.create_user(
                username='customer5',
                email='customer5@ecom.com',
                password='CustomerPassword123!',
                role=customer_role,
                first_name='Vy',
                last_name='Pham'
            )
            self.stdout.write('Created user: customer5 (password: CustomerPassword123!)')

        # Staff 1 User
        if not User.objects.filter(username='staff1').exists():
            staff1 = User.objects.create_user(
                username='staff1',
                email='staff1@ecom.com',
                password='StaffPassword123!',
                role=staff_role,
                first_name='Shop',
                last_name='Staff'
            )
            self.stdout.write('Created user: staff1 (password: StaffPassword123!)')

        # Staff 2 User
        if not User.objects.filter(username='staff2').exists():
            staff2 = User.objects.create_user(
                username='staff2',
                email='staff2@ecom.com',
                password='StaffPassword123!',
                role=staff_role,
                first_name='Hao',
                last_name='Nguyen'
            )
            self.stdout.write('Created user: staff2 (password: StaffPassword123!)')

        # Staff 3 User
        if not User.objects.filter(username='staff3').exists():
            staff3 = User.objects.create_user(
                username='staff3',
                email='staff3@ecom.com',
                password='StaffPassword123!',
                role=staff_role,
                first_name='Kiet',
                last_name='Lam'
            )
            self.stdout.write('Created user: staff3 (password: StaffPassword123!)')
            
        self.stdout.write(self.style.SUCCESS('Successfully seeded User service database!'))
