FROM python:3.10-slim

WORKDIR /app

# Install system dependencies for build tools and FAISS
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN --mount=type=cache,target=/root/.cache/pip pip install -r requirements.txt

COPY . /app/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
