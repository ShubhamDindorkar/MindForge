# Use official lightweight Python image (Linux-based)
FROM python:3.11-slim

# Set optimization environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    TORCH_HOME=/app/models \
    ULTRALYTICS_CONFIG_DIR=/app/config

# Set working directory
WORKDIR /app

# Install system dependencies for OpenCV (OpenCV is used by Ultralytics internally)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# For Render (Linux): Install CPU-only torch first to save RAM and disk space
# This avoids installing NVIDIA CUDA drivers which are heavy (2GB+)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Install the rest of the requirements from the standard PyPI
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download YOLOv8 nano model (yolov8n.pt) during build
# This saves time and avoids runtime downloads on Render's free tier
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Copy application code
COPY . .

# Expose the port used by Render (Internal Port 10000)
EXPOSE 10000

# Run the application with uvicorn (single worker for 512MB RAM stability)
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "10000"]
