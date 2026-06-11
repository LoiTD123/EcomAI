from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.CharField(max_length=100, unique=True)
    description = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'categories'

    def __str__(self):
        return self.name

class Product(models.Model):
    PRODUCT_TYPES = (
        ('BOOK', 'Book'),
        ('ELECTRONICS', 'Electronics'),
        ('FASHION', 'Fashion'),
    )
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    name = models.CharField(max_length=255)
    slug = models.CharField(max_length=255, unique=True)
    price = models.DecimalField(decimal_places=2, max_digits=12)
    stock = models.IntegerField(default=0)
    description = models.TextField(null=True, blank=True)
    product_type = models.CharField(max_length=50, choices=PRODUCT_TYPES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'products'

    def __str__(self):
        return self.name

class BookProduct(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, primary_key=True, related_name='book_details')
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=255, null=True, blank=True)
    publication_year = models.IntegerField(null=True, blank=True)
    isbn = models.CharField(max_length=20, unique=True, null=True, blank=True)
    pages = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = 'book_products'

class ElectronicsProduct(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, primary_key=True, related_name='electronics_details')
    brand = models.CharField(max_length=100)
    model = models.CharField(max_length=100, null=True, blank=True)
    warranty_months = models.IntegerField(default=0)
    specifications = models.JSONField(null=True, blank=True)

    class Meta:
        db_table = 'electronics_products'

class FashionProduct(models.Model):
    product = models.OneToOneField(Product, on_delete=models.CASCADE, primary_key=True, related_name='fashion_details')
    brand = models.CharField(max_length=100, null=True, blank=True)
    material = models.CharField(max_length=100, null=True, blank=True)
    size = models.CharField(max_length=20, null=True, blank=True)
    color = models.CharField(max_length=50, null=True, blank=True)

    class Meta:
        db_table = 'fashion_products'

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.CharField(max_length=512)
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'product_images'
