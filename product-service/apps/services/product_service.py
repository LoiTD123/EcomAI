from apps.repositories import ProductRepository

class ProductService:
    @staticmethod
    def get_product_detail(product_id):
        product = ProductRepository.get_by_id(product_id)
        if not product:
            return None
        
        details = ProductRepository.get_details(product)
        details_data = {}
        if details:
            if product.product_type == 'BOOK':
                details_data = {
                    "author": details.author,
                    "publisher": details.publisher,
                    "publication_year": details.publication_year,
                    "isbn": details.isbn,
                    "pages": details.pages
                }
            elif product.product_type == 'ELECTRONICS':
                details_data = {
                    "brand": details.brand,
                    "model": details.model,
                    "warranty_months": details.warranty_months,
                    "specifications": details.specifications
                }
            elif product.product_type == 'FASHION':
                details_data = {
                    "brand": details.brand,
                    "material": details.material,
                    "size": details.size,
                    "color": details.color
                }
                
        return {
            "id": product.id,
            "name": product.name,
            "slug": product.slug,
            "price": product.price,
            "stock": product.stock,
            "product_type": product.product_type,
            "category": product.category.name if product.category else None,
            "description": product.description,
            "images": [{"image_url": img.image_url, "is_primary": img.is_primary} for img in product.images.all()],
            "details": details_data
        }

    @staticmethod
    def list_products(category_id=None, product_type=None, search_query=None, limit=10, offset=0):
        products, total = ProductRepository.list_products(
            category_id=category_id,
            product_type=product_type,
            search_query=search_query,
            limit=limit,
            offset=offset
        )
        
        results = []
        for p in products:
            primary_img = p.images.filter(is_primary=True).first()
            img_url = primary_img.image_url if primary_img else (p.images.first().image_url if p.images.exists() else None)
            
            results.append({
                "id": p.id,
                "name": p.name,
                "price": p.price,
                "stock": p.stock,
                "product_type": p.product_type,
                "category": p.category.name if p.category else None,
                "image": img_url
            })
            
        return results, total

    @staticmethod
    def create_product(category_id, name, slug, price, stock, description, product_type, details, images=None):
        return ProductRepository.create_product(
            category_id=category_id,
            name=name,
            slug=slug,
            price=price,
            stock=stock,
            description=description,
            product_type=product_type,
            details=details,
            images=images
        )

    @staticmethod
    def update_stock(product_id, quantity_change):
        return ProductRepository.update_stock(product_id, quantity_change)

    @staticmethod
    def update_product(product_id, category_id, name, slug, price, stock, description, product_type, details, images=None):
        return ProductRepository.update_product(
            product_id=product_id,
            category_id=category_id,
            name=name,
            slug=slug,
            price=price,
            stock=stock,
            description=description,
            product_type=product_type,
            details=details,
            images=images
        )

    @staticmethod
    def delete_product(product_id):
        return ProductRepository.delete_product(product_id)
