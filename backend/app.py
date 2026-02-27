import io
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from PIL import Image
from ultralytics import YOLO

# Initialize FastAPI app
app = FastAPI(title="YOLOv8 Nano Object Detection API")

# Load YOLOv8n model globally at startup
# Optimization: Pre-loading ensures fast response times and predictable memory usage
try:
    model = YOLO("yolov8n.pt")
except Exception as e:
    print(f"Critical Error: Could not load model: {e}")
    model = None

@app.get("/health")
async def health_check():
    """Health check endpoint for Render monitoring."""
    if model is not None:
        return {"status": "healthy", "model_loaded": True}
    return JSONResponse(
        status_code=503, 
        content={"status": "unhealthy", "model_loaded": False}
    )

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    """
    Object detection endpoint.
    - Resizes to 640x640
    - Uses torch.no_grad()
    - Returns JSON detections
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded on server")

    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image")

    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        
        # Requirement: Resize image to 640x640 before inference
        image = image.resize((640, 640))

        # Perform inference with optimizations
        # torch.no_grad() is handled by model.predict() internally,
        # but we use device="cpu" to ensure it stays off any accidental GPU resources
        with torch.no_grad():
            results = model.predict(source=image, imgsz=640, device="cpu", verbose=False)
        
        detections = []
        for result in results:
            for box in result.boxes:
                # Extract coordinates, confidence, and class
                x1, y1, x2, y2 = box.xyxy[0].tolist()
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                name = model.names[cls]

                detections.append({
                    "class": name,
                    "confidence": round(conf, 4),
                    "bbox": {
                        "x1": round(x1, 2),
                        "y1": round(y1, 2),
                        "x2": round(x2, 2),
                        "y2": round(y2, 2)
                    }
                })

        return {"detections": detections, "count": len(detections)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")
    finally:
        await file.close()

if __name__ == "__main__":
    import uvicorn
    # Port 10000 is standard for Render web services
    uvicorn.run(app, host="0.0.0.0", port=10000)
