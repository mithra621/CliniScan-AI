FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for OpenCV headless and PyTorch runtime
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ backend/
COPY data/ data/
COPY models/ models/
COPY run.py .

EXPOSE 8000

ENV MODEL_PATH=backend/models/best.pt
ENV PORT=8000

CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
