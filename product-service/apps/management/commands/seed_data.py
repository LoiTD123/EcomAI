from django.core.management.base import BaseCommand
from apps.models import Category, Product, BookProduct, ElectronicsProduct, FashionProduct, ProductImage
from django.db import transaction
import requests
import os

AI_SERVICE_URL = os.getenv('AI_SERVICE_URL', 'http://ai-service:8000')

class Command(BaseCommand):
    help = 'Seeds initial categories and sample products, then indexes them into AI Service.'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding categories and products...')
        
        # 1. Create Categories
        cats_data = [
            ('Sách', 'sach', 'Sách khoa học, công nghệ, kỹ năng sống...'),
            ('Đồ Điện Tử', 'dien-tu', 'Điện thoại, tai nghe, laptop, phụ kiện công nghệ...'),
            ('Thời Trang', 'thoi-trang', 'Quần áo thời trang nam nữ, giày dép...'),
        ]
        
        categories = {}
        for name, slug, desc in cats_data:
            cat, created = Category.objects.get_or_create(slug=slug, defaults={'name': name, 'description': desc})
            categories[slug] = cat
            if created:
                self.stdout.write(f'Created category: {name}')

        # 2. Create Products
        products_to_index = []

        with transaction.atomic():
            # BOOK 1
            p1, created = Product.objects.get_or_create(
                slug='lap-trinh-python-oop',
                defaults={
                    'category': categories['sach'],
                    'name': 'Lập Trình Hướng Đối Tượng Python',
                    'price': 120000.00,
                    'stock': 50,
                    'description': 'Cuốn sách hướng dẫn chi tiết lập trình hướng đối tượng trong ngôn ngữ Python từ cơ bản đến nâng cao.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p1,
                    author='Nguyễn Văn A',
                    publisher='NXB Giáo Dục',
                    publication_year=2023,
                    isbn='978-604-0-12345-6',
                    pages=320
                )
                ProductImage.objects.create(product=p1, image_url='', is_primary=True)
                self.stdout.write('Created product: Lập Trình Hướng Đối Tượng Python')
            
            # BOOK 2
            p2, created = Product.objects.get_or_create(
                slug='thiet-ke-he-thong-microservices',
                defaults={
                    'category': categories['sach'],
                    'name': 'Thiết Kế Hệ Thống Microservices',
                    'price': 185000.00,
                    'stock': 30,
                    'description': 'Cẩm nang hướng dẫn xây dựng kiến trúc microservices thực tế, xử lý giao dịch phân tán và bảo mật.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p2,
                    author='Sam Newman',
                    publisher='NXB Trẻ',
                    publication_year=2021,
                    isbn='978-604-0-67890-1',
                    pages=480
                )
                ProductImage.objects.create(product=p2, image_url='', is_primary=True)
                self.stdout.write('Created product: Thiết Kế Hệ Thống Microservices')

            # ELECTRONICS 1
            p3, created = Product.objects.get_or_create(
                slug='iphone-15-pro-max',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'iPhone 15 Pro Max 256GB',
                    'price': 30000000.00,
                    'stock': 15,
                    'description': 'Điện thoại thông minh Apple iPhone 15 Pro Max phiên bản titan tự nhiên, bộ nhớ 256GB, chip A17 Pro siêu mạnh.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p3,
                    brand='Apple',
                    model='15 Pro Max',
                    warranty_months=12,
                    specifications={"screen": "6.7 inch", "chip": "A17 Pro", "ram": "8GB"}
                )
                ProductImage.objects.create(product=p3, image_url='', is_primary=True)
                self.stdout.write('Created product: iPhone 15 Pro Max')

            # ELECTRONICS 2
            p4, created = Product.objects.get_or_create(
                slug='tai-nghe-sony-wh-1000xm5',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'Tai Nghe Bluetooth Sony WH-1000XM5',
                    'price': 6500000.00,
                    'stock': 20,
                    'description': 'Tai nghe chụp tai chống ồn chủ động không dây đỉnh cao, âm thanh sắc nét, thời lượng pin 30 giờ.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p4,
                    brand='Sony',
                    model='WH-1000XM5',
                    warranty_months=12,
                    specifications={"type": "Over-ear", "anc": "Yes", "battery_life": "30h"}
                )
                ProductImage.objects.create(product=p4, image_url='', is_primary=True)
                self.stdout.write('Created product: Tai Nghe Sony WH-1000XM5')

            # FASHION 1
            p5, created = Product.objects.get_or_create(
                slug='ao-khoak-gio-nam-uniqlo',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': 'Áo Khoác Gió Nam Uniqlo',
                    'price': 450000.00,
                    'stock': 100,
                    'description': 'Áo gió thể thao nam cản gió cản nước nhẹ, chất liệu polyester siêu bền, thiết kế trẻ trung, phù hợp đi mưa nhẹ.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p5,
                    brand='Uniqlo',
                    material='Polyester',
                    size='L',
                    color='Đen'
                )
                ProductImage.objects.create(product=p5, image_url='', is_primary=True)
                self.stdout.write('Created product: Áo Khoác Gió Nam Uniqlo')

            # FASHION 2
            p6, created = Product.objects.get_or_create(
                slug='giay-the-thao-adidas',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': 'Giày Thể Thao Sneaker Adidas',
                    'price': 1800000.00,
                    'stock': 40,
                    'description': 'Giày chạy bộ thể thao Adidas siêu nhẹ, đế êm nâng đỡ bàn chân tốt, phong cách thời trang năng động.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p6,
                    brand='Adidas',
                    material='Mesh/Leather',
                    size='42',
                    color='Trắng'
                )
                ProductImage.objects.create(product=p6, image_url='', is_primary=True)
                self.stdout.write('Created product: Giày Thể Thao Sneaker Adidas')

        # Collect products to index
        for p in [p1, p2, p3, p4, p5, p6]:
            products_to_index.append({
                "id": p.id,
                "name": p.name,
                "description": p.description
            })

        # 3. Call AI Service to vector-index products into FAISS
        self.stdout.write('Syncing products to AI Service for vector FAISS indexing...')
        try:
            url = f"{AI_SERVICE_URL}/api/v1/ai/index-products"
            resp = requests.post(url, json=products_to_index, timeout=10)
            if resp.status_code == 200:
                self.stdout.write(self.style.SUCCESS(f'Successfully indexed products in FAISS index: {resp.json().get("message")}'))
            else:
                self.stdout.write(self.style.ERROR(f'Failed to index in AI Service: Status {resp.status_code} - {resp.text}'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'AI Service is offline or connection failed: {e}. Skipping indexing (will fallback to mock search).'))

        self.stdout.write(self.style.SUCCESS('Successfully seeded Product service database!'))
