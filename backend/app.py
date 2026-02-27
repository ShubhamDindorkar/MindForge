import io
import torch
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
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

@app.get("/", response_class=HTMLResponse)
async def index():
    """Serves a simple UI to capture a photo from the camera."""
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <title>YOLOv8 Camera Detection</title>
        <style>
            body { font-family: sans-serif; text-align: center; padding: 20px; background: #f4f4f9; }
            #container { max-width: 640px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            video, canvas { width: 100%; border-radius: 5px; margin-bottom: 10px; }
            button { padding: 12px 24px; font-size: 16px; cursor: pointer; background: #007bff; color: white; border: none; border-radius: 5px; }
            button:disabled { background: #ccc; }
            #results { text-align: left; margin-top: 20px; padding: 10px; background: #eee; border-radius: 5px; font-family: monospace; white-space: pre-wrap; word-wrap: break-word; }
            .preview-container { position: relative; }
        </style>
    </head>
    <body>
        <div id="container">
            <h1>YOLOv8 Nano Detector</h1>
            <div class="preview-container">
                <video id="video" autoplay playsinline></video>
                <canvas id="canvas" style="display:none;"></canvas>
            </div>
            <button id="capture">Capture & Detect</button>
            <h3>Results:</h3>
            <div id="results">Waiting for capture...</div>
        </div>

        <script>
            const video = document.getElementById('video');
            const canvas = document.getElementById('canvas');
            const captureButton = document.getElementById('capture');
            const resultsDiv = document.getElementById('results');

            // Request camera access
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => { video.srcObject = stream; })
                .catch(err => { 
                    resultsDiv.innerText = "Error accessing camera: " + err;
                    captureButton.disabled = true;
                });

            captureButton.onclick = async () => {
                const context = canvas.getContext('2d');
                // Use original video dimensions
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                context.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Convert canvas to blob
                canvas.toBlob(async (blob) => {
                    const formData = new FormData();
                    formData.append('file', blob, 'capture.jpg');

                    resultsDiv.innerText = "Detecting...";
                    
                    try {
                        const response = await fetch('/predict', {
                            method: 'POST',
                            body: formData
                        });
                        const data = await response.json();
                        resultsDiv.innerText = JSON.stringify(data, null, 2);
                    } catch (err) {
                        resultsDiv.innerText = "Error: " + err;
                    }
                }, 'image/jpeg');
            };
        </script>
    </body>
    </html>
    """

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
