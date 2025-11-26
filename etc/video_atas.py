import cv2

# Path to your video file
video_path = "/home/raisa/ui_assets/robot.mp4"

cap = cv2.VideoCapture(video_path)

if not cap.isOpened():
    print("Error: Cannot open video file.")
    exit()

cv2.namedWindow("Looping Video", cv2.WND_PROP_FULLSCREEN)
cv2.setWindowProperty("Looping Video", cv2.WND_PROP_FULLSCREEN, cv2.WINDOW_FULLSCREEN)


while True:
    ret, frame = cap.read()

    # If video ends, restart from beginning
    if not ret:
        cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
        continue

    frame_resized = cv2.resize(frame, (1300, 960))

    cv2.imshow("Looping Video", frame_resized)

    # Press 'q' to exit
    if cv2.waitKey(25) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
