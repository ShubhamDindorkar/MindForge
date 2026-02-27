import cv2
from ultralytics import YOLO

def main():
    # 1. Load the YOLOv8 nano model
    print("Loading YOLOv8n model...")
    model = YOLO("yolov8n.pt")

    # 2. Open the webcam (0 is usually the default camera)
    cap = cv2.VideoCapture(0)

    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    print("Camera started. Press 'q' to quit.")

    while True:
        # Capture frame-by-frame
        ret, frame = cap.read()
        if not ret:
            print("Error: Failed to grab frame.")
            break

        # 3. Perform inference on the current frame
        # stream=True is more memory-efficient for real-time video
        results = model.predict(source=frame, stream=True, imgsz=640, verbose=False)

        # 4. Process and show results
        for r in results:
            # Draw the boxes and labels on the frame automatically
            annotated_frame = r.plot()

            # Print detected objects to terminal
            detected_classes = [model.names[int(box.cls[0])] for box in r.boxes]
            if detected_classes:
                print(f"Detected: {', '.join(set(detected_classes))}")

            # Display the resulting frame
            cv2.imshow("YOLOv8 Real-Time Detection", annotated_frame)

        # 5. Break the loop if 'q' is pressed
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    # 6. Release resources
    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    main()
