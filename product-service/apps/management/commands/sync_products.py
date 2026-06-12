from django.core.management.base import BaseCommand
from ...models import Product
import requests
import os

class Command(BaseCommand):
    help = 'Sync all products to AI Service for vector FAISS indexing'

    def handle(self, *args, **options):
        products = Product.objects.all()
        products_to_index = []
        for p in products:
            products_to_index.append({
                "id": p.id,
                "name": p.name,
                "description": p.description
            })
        
        AI_SERVICE_URL = os.getenv('AI_SERVICE_URL', 'http://ai-service:8000')
        url = f"{AI_SERVICE_URL}/api/v1/ai/index-products"
        self.stdout.write(f"Syncing {len(products)} products to AI Service at {url}...")
        try:
            resp = requests.post(url, json=products_to_index, timeout=30)
            if resp.status_code == 200:
                self.stdout.write(self.style.SUCCESS(f"Successfully synced: {resp.json().get('message')}"))
            else:
                self.stdout.write(self.style.ERROR(f"Failed to sync: Status {resp.status_code} - {resp.text}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Connection failed: {e}"))
