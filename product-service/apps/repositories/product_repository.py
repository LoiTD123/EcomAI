from apps.models import Category, Product, BookProduct, ElectronicsProduct, FashionProduct, ProductImage
from django.db import transaction
from django.db.models import Q

class ProductRepository:
    @staticmethod
    def get_by_id(product_id):
        try:
            return Product.objects.prefetch_related('images').get(id=product_id)
        except Product.DoesNotExist:
            return None

    @staticmethod
    def get_details(product):
        if product.product_type == 'BOOK':
            try:
                return BookProduct.objects.get(product=product)
            except BookProduct.DoesNotExist:
                return None
        elif product.product_type == 'ELECTRONICS':
            try:
                return ElectronicsProduct.objects.get(product=product)
            except ElectronicsProduct.DoesNotExist:
                return None
        elif product.product_type == 'FASHION':
            try:
                return FashionProduct.objects.get(product=product)
            except FashionProduct.DoesNotExist:
                return None
        return None

    @staticmethod
    def list_products(category_id=None, product_type=None, search_query=None, limit=10, offset=0):
        queryset = Product.objects.all().prefetch_related('images')
        
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        if search_query:
            queryset = queryset.filter(
                Q(name__icontains=search_query) | 
                Q(description__icontains=search_query)
            )
            
        total = queryset.count()
        results = queryset[offset:offset+limit]
        return results, total

    @staticmethod
    def create_product(category_id, name, slug, price, stock, description, product_type, details, images=None):
        category = Category.objects.get(id=category_id)
        
        with transaction.atomic():
            product = Product.objects.create(
                category=category,
                name=name,
                slug=slug,
                price=price,
                stock=stock,
                description=description,
                product_type=product_type
            )
            
            # Create specific details based on product type
            if product_type == 'BOOK':
                BookProduct.objects.create(
                    product=product,
                    author=details.get('author'),
                    publisher=details.get('publisher'),
                    publication_year=details.get('publication_year'),
                    isbn=details.get('isbn'),
                    pages=details.get('pages')
                )
            elif product_type == 'ELECTRONICS':
                ElectronicsProduct.objects.create(
                    product=product,
                    brand=details.get('brand'),
                    model=details.get('model'),
                    warranty_months=details.get('warranty_months', 0),
                    specifications=details.get('specifications')
                )
            elif product_type == 'FASHION':
                FashionProduct.objects.create(
                    product=product,
                    brand=details.get('brand'),
                    material=details.get('material'),
                    size=details.get('size'),
                    color=details.get('color')
                )

            # Add images
            if images:
                for img in images:
                    ProductImage.objects.create(
                        product=product,
                        image_url=img.get('image_url'),
                        is_primary=img.get('is_primary', False)
                    )
            return product

    @staticmethod
    def update_stock(product_id, quantity_change):
        """
        Updates product stock. quantity_change can be positive (refund) or negative (purchase).
        Returns True if successful, False if insufficient stock.
        """
        with transaction.atomic():
            try:
                # Use select_for_update to lock the row and prevent race conditions
                product = Product.objects.select_for_update().get(id=product_id)
                new_stock = product.stock + quantity_change
                if new_stock < 0:
                    return False
                product.stock = new_stock
                product.save()
                return True
            except Product.DoesNotExist:
                return False
