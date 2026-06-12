from django.core.management.base import BaseCommand
from ...models import Category, Product, BookProduct, ElectronicsProduct, FashionProduct, ProductImage
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
                self.stdout.write('Created product: Lập Trình Hướng Đối Tượng Python')
            p1_img, _ = ProductImage.objects.get_or_create(product=p1, defaults={'is_primary': True})
            p1_img.image_url = 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=600'
            p1_img.save()
            
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
                self.stdout.write('Created product: Thiết Kế Hệ Thống Microservices')
            p2_img, _ = ProductImage.objects.get_or_create(product=p2, defaults={'is_primary': True})
            p2_img.image_url = 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=600'
            p2_img.save()

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
                self.stdout.write('Created product: iPhone 15 Pro Max')
            p3_img, _ = ProductImage.objects.get_or_create(product=p3, defaults={'is_primary': True})
            p3_img.image_url = 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600'
            p3_img.save()

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
                self.stdout.write('Created product: Tai Nghe Sony WH-1000XM5')
            p4_img, _ = ProductImage.objects.get_or_create(product=p4, defaults={'is_primary': True})
            p4_img.image_url = 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600'
            p4_img.save()

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
                self.stdout.write('Created product: Áo Khoác Gió Nam Uniqlo')
            p5_img, _ = ProductImage.objects.get_or_create(product=p5, defaults={'is_primary': True})
            p5_img.image_url = 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&q=80&w=600'
            p5_img.save()

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
                self.stdout.write('Created product: Giày Thể Thao Sneaker Adidas')
            p6_img, _ = ProductImage.objects.get_or_create(product=p6, defaults={'is_primary': True})
            p6_img.image_url = 'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&q=80&w=600'
            p6_img.save()

            # BOOK 3
            p7, created = Product.objects.get_or_create(
                slug='clean-code-robert-martin',
                defaults={
                    'category': categories['sach'],
                    'name': 'Clean Code: A Handbook of Agile Software Craftsmanship',
                    'price': 210000.00,
                    'stock': 40,
                    'description': 'Cuốn sách kinh điển của Robert C. Martin hướng dẫn cách viết mã sạch, dễ bảo trì và tối ưu cho lập trình viên.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p7,
                    author='Robert C. Martin',
                    publisher='Pearson',
                    publication_year=2020,
                    isbn='978-013-2-35088-4',
                    pages=464
                )
                self.stdout.write('Created product: Clean Code')
            p7_img, _ = ProductImage.objects.get_or_create(product=p7, defaults={'is_primary': True})
            p7_img.image_url = 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=600'
            p7_img.save()

            # BOOK 4
            p8, created = Product.objects.get_or_create(
                slug='dac-nhan-tam-dale-carnegie',
                defaults={
                    'category': categories['sach'],
                    'name': 'Đắc Nhân Tâm',
                    'price': 86000.00,
                    'stock': 60,
                    'description': 'Tác phẩm tự lực nổi tiếng nhất mọi thời đại của Dale Carnegie giúp cải thiện kỹ năng giao tiếp và nghệ thuật ứng xử.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p8,
                    author='Dale Carnegie',
                    publisher='NXB Tổng Hợp',
                    publication_year=2022,
                    isbn='978-604-5-88888-8',
                    pages=320
                )
                self.stdout.write('Created product: Đắc Nhân Tâm')
            p8_img, _ = ProductImage.objects.get_or_create(product=p8, defaults={'is_primary': True})
            p8_img.image_url = 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=600'
            p8_img.save()

            # ELECTRONICS 3
            p9, created = Product.objects.get_or_create(
                slug='dell-xps-13-plus',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'Laptop Dell XPS 13 Plus 9320',
                    'price': 35000000.00,
                    'stock': 10,
                    'description': 'Laptop cao cấp mỏng nhẹ Dell XPS 13 Plus với màn hình cảm ứng OLED 13.4 inch, CPU Intel Core i7 và thiết kế bàn phím vô cực siêu hiện đại.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p9,
                    brand='Dell',
                    model='XPS 13 Plus',
                    warranty_months=12,
                    specifications={"screen": "13.4 inch OLED", "cpu": "Intel Core i7", "ram": "16GB", "ssd": "512GB"}
                )
                self.stdout.write('Created product: Laptop Dell XPS 13 Plus')
            p9_img, _ = ProductImage.objects.get_or_create(product=p9, defaults={'is_primary': True})
            p9_img.image_url = 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&q=80&w=600'
            p9_img.save()

            # ELECTRONICS 4
            p10, created = Product.objects.get_or_create(
                slug='loa-jbl-charge-5',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'Loa Bluetooth JBL Charge 5',
                    'price': 3950000.00,
                    'stock': 25,
                    'description': 'Loa di động không dây chống nước IP67 thời thượng, âm thanh mạnh mẽ âm trầm sâu sắc, thời lượng pin 20 tiếng.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p10,
                    brand='JBL',
                    model='Charge 5',
                    warranty_months=12,
                    specifications={"power": "40W", "battery": "20 hours", "waterproof": "IP67"}
                )
                self.stdout.write('Created product: Loa JBL Charge 5')
            p10_img, _ = ProductImage.objects.get_or_create(product=p10, defaults={'is_primary': True})
            p10_img.image_url = 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?auto=format&fit=crop&q=80&w=600'
            p10_img.save()

            # FASHION 3
            p11, created = Product.objects.get_or_create(
                slug='quan-jean-levis-nam',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': "Quần Jeans Nam Levi's 501",
                    'price': 1200000.00,
                    'stock': 50,
                    'description': "Quần jean nam Levi's 501 dáng đứng cổ điển, chất liệu denim 100% cotton dày dặn co giãn nhẹ, giữ phom tốt.",
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p11,
                    brand="Levi's",
                    material='Denim',
                    size='32',
                    color='Xanh Denim'
                )
                self.stdout.write("Created product: Quần Jeans Nam Levi's")
            p11_img, _ = ProductImage.objects.get_or_create(product=p11, defaults={'is_primary': True})
            p11_img.image_url = 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=600'
            p11_img.save()

            # FASHION 4
            p12, created = Product.objects.get_or_create(
                slug='ao-thun-cotton-basic-unisex',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': 'Áo Thun Unisex Cotton Basic',
                    'price': 150000.00,
                    'stock': 150,
                    'description': 'Áo phông cộc tay cổ tròn chất liệu cotton 100% thoáng mát, thấm hút mồ hôi, thiết kế trơn basic mặc cực êm.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p12,
                    brand='Generic',
                    material='Cotton',
                    size='XL',
                    color='Trắng'
                )
                self.stdout.write('Created product: Áo Thun Unisex Cotton Basic')
            p12_img, _ = ProductImage.objects.get_or_create(product=p12, defaults={'is_primary': True})
            p12_img.image_url = 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=600'
            p12_img.save()

            # BOOK 5
            p13, created = Product.objects.get_or_create(
                slug='giai-thuat-va-lap-trinh-le-minh-hoang',
                defaults={
                    'category': categories['sach'],
                    'name': 'Giải Thuật Và Lập Trình',
                    'price': 150000.00,
                    'stock': 35,
                    'description': 'Cuốn sách giáo trình kinh điển về cấu trúc dữ liệu và giải thuật của tác giả Lê Minh Hoàng, định hướng tư duy thuật toán tối ưu cho lập trình viên.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p13,
                    author='Lê Minh Hoàng',
                    publisher='NXB Đại Học Quốc Gia',
                    publication_year=2019,
                    isbn='978-604-9-12345-9',
                    pages=380
                )
                self.stdout.write('Created product: Giải Thuật Và Lập Trình')
            p13_img, _ = ProductImage.objects.get_or_create(product=p13, defaults={'is_primary': True})
            p13_img.image_url = 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&q=80&w=600'
            p13_img.save()

            # BOOK 6
            p14, created = Product.objects.get_or_create(
                slug='nghi-giau-lam-giau-napoleon-hill',
                defaults={
                    'category': categories['sach'],
                    'name': 'Nghĩ Giàu Làm Giàu',
                    'price': 110000.00,
                    'stock': 45,
                    'description': 'Cuốn sách kỹ năng và làm giàu nổi tiếng nhất mọi thời đại của Napoleon Hill chỉ ra những nguyên tắc thành công bất biến.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p14,
                    author='Napoleon Hill',
                    publisher='NXB Trẻ',
                    publication_year=2021,
                    isbn='978-604-1-67890-2',
                    pages=400
                )
                self.stdout.write('Created product: Nghĩ Giàu Làm Giàu')
            p14_img, _ = ProductImage.objects.get_or_create(product=p14, defaults={'is_primary': True})
            p14_img.image_url = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600'
            p14_img.save()

            # BOOK 7
            p15, created = Product.objects.get_or_create(
                slug='hat-giong-tam-hon-nhieu-tac-gia',
                defaults={
                    'category': categories['sach'],
                    'name': 'Hạt Giống Tâm Hồn',
                    'price': 75000.00,
                    'stock': 80,
                    'description': 'Tập hợp những câu chuyện ý nghĩa, cảm động về tình yêu thương, lòng nhân ái và khát vọng vươn lên trong cuộc sống.',
                    'product_type': 'BOOK'
                }
            )
            if created:
                BookProduct.objects.create(
                    product=p15,
                    author='Nhiều Tác Giả',
                    publisher='NXB Tổng hợp TP.HCM',
                    publication_year=2023,
                    isbn='978-604-5-99999-9',
                    pages=220
                )
                self.stdout.write('Created product: Hạt Giống Tâm Hồn')
            p15_img, _ = ProductImage.objects.get_or_create(product=p15, defaults={'is_primary': True})
            p15_img.image_url = 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=600'
            p15_img.save()

            # ELECTRONICS 5
            p16, created = Product.objects.get_or_create(
                slug='ipad-pro-m4',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'iPad Pro M4 11-inch Wifi 256GB',
                    'price': 26000000.00,
                    'stock': 12,
                    'description': 'Máy tính bảng Apple iPad Pro trang bị màn hình Tandem OLED siêu nét, vi xử lý M4 đột phá cho hiệu năng đỉnh cao.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p16,
                    brand='Apple',
                    model='iPad Pro M4',
                    warranty_months=12,
                    specifications={"screen": "11 inch Tandem OLED", "chip": "Apple M4", "ram": "8GB", "storage": "256GB"}
                )
                self.stdout.write('Created product: iPad Pro M4')
            p16_img, _ = ProductImage.objects.get_or_create(product=p16, defaults={'is_primary': True})
            p16_img.image_url = 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&q=80&w=600'
            p16_img.save()

            # ELECTRONICS 6
            p17, created = Product.objects.get_or_create(
                slug='chuot-logitech-mx-master-3s',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'Chuột Không Dây Logitech MX Master 3S',
                    'price': 2350000.00,
                    'stock': 35,
                    'description': 'Chuột công thái học cao cấp dành cho lập trình viên và nhà thiết kế, mắt đọc 8000 DPI hoạt động trên mọi bề mặt.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p17,
                    brand='Logitech',
                    model='MX Master 3S',
                    warranty_months=12,
                    specifications={"type": "Ergonomic Mouse", "sensor": "Darkfield 8000 DPI", "battery_life": "70 days"}
                )
                self.stdout.write('Created product: Chuột Logitech MX Master 3S')
            p17_img, _ = ProductImage.objects.get_or_create(product=p17, defaults={'is_primary': True})
            p17_img.image_url = 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&q=80&w=600'
            p17_img.save()

            # ELECTRONICS 7
            p18, created = Product.objects.get_or_create(
                slug='ban-phim-keychron-k2',
                defaults={
                    'category': categories['dien-tu'],
                    'name': 'Bàn Phím Cơ Keychron K2 V2',
                    'price': 1950000.00,
                    'stock': 40,
                    'description': 'Bàn phím cơ không dây layout 84 phím nhỏ gọn, kết nối đa thiết bị Bluetooth, switch cơ học gõ êm ái.',
                    'product_type': 'ELECTRONICS'
                }
            )
            if created:
                ElectronicsProduct.objects.create(
                    product=p18,
                    brand='Keychron',
                    model='K2 V2',
                    warranty_months=12,
                    specifications={"layout": "75% (84 keys)", "connectivity": "Bluetooth / Wired", "backlight": "RGB"}
                )
                self.stdout.write('Created product: Bàn Phím Keychron K2')
            p18_img, _ = ProductImage.objects.get_or_create(product=p18, defaults={'is_primary': True})
            p18_img.image_url = 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&q=80&w=600'
            p18_img.save()

            # FASHION 5
            p19, created = Product.objects.get_or_create(
                slug='giay-sneaker-nike-air-force-1',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': "Giày Sneaker Nike Air Force 1 '07",
                    'price': 2900000.00,
                    'stock': 25,
                    'description': 'Đôi giày thể thao huyền thoại với thiết kế toàn trắng tinh tế, chất liệu da cao cấp và đế đệm Air êm ái.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p19,
                    brand='Nike',
                    material='Leather',
                    size='41',
                    color='Trắng'
                )
                self.stdout.write("Created product: Giày Nike Air Force 1")
            p19_img, _ = ProductImage.objects.get_or_create(product=p19, defaults={'is_primary': True})
            p19_img.image_url = 'https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&q=80&w=600'
            p19_img.save()

            # FASHION 6
            p20, created = Product.objects.get_or_create(
                slug='ao-so-mi-nam-oxford-routine',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': 'Áo Sơ Mi Nam Oxford Routine Dài Tay',
                    'price': 380000.00,
                    'stock': 60,
                    'description': 'Áo sơ mi nam chất liệu vải Oxford dệt cao cấp, dáng vừa thoải mái thanh lịch, phù hợp đi làm hay đi chơi.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p20,
                    brand='Routine',
                    material='Cotton Oxford',
                    size='M',
                    color='Xanh Nhạt'
                )
                self.stdout.write('Created product: Áo Sơ Mi Oxford Routine')
            p20_img, _ = ProductImage.objects.get_or_create(product=p20, defaults={'is_primary': True})
            p20_img.image_url = 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&q=80&w=600'
            p20_img.save()

            # FASHION 7
            p21, created = Product.objects.get_or_create(
                slug='balo-thoi-trang-local-brand',
                defaults={
                    'category': categories['thoi-trang'],
                    'name': 'Balo Thời Trang Local Brand Camelia',
                    'price': 420000.00,
                    'stock': 50,
                    'description': 'Balo unisex thiết kế tối giản thanh lịch từ thương hiệu Camelia, vải canvas chống thấm nước nhẹ, có ngăn đựng laptop 15.6 inch.',
                    'product_type': 'FASHION'
                }
            )
            if created:
                FashionProduct.objects.create(
                    product=p21,
                    brand='Camelia',
                    material='Canvas/Polyester',
                    size='One Size',
                    color='Đen'
                )
                self.stdout.write('Created product: Balo Camelia Local Brand')
            p21_img, _ = ProductImage.objects.get_or_create(product=p21, defaults={'is_primary': True})
            p21_img.image_url = 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'
            p21_img.save()

        # Collect products to index
        for p in [p1, p2, p3, p4, p5, p6, p7, p8, p9, p10, p11, p12, p13, p14, p15, p16, p17, p18, p19, p20, p21]:
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
