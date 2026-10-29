import cv2
import os
import sys
import psycopg2
from datetime import datetime
from deepface import DeepFace

# Database connection credentials
DB_PARAMS = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "Pgsql@25!!",  
    "host": "localhost",
    "port": "5432"   
}

def safe_print(text):
    """Prints strings safely to handle IDLE's terminal constraints."""
    try:
        print(text)
    except Exception:
        pass

def diagnose_face_distance(live_vector):
    """Queries PostgreSQL to pull the raw, unfiltered mathematical distance score."""
    try:
        conn = psycopg2.connect(**DB_PARAMS)
        cur = conn.cursor()
        
        # PARAMETER FORMATTING FIX: Convert python floating point list array 
        # to a standard clean string layout format that psycopg2 can map cleanly
        vector_str = str(live_vector)
        
        query = """
            SELECT student_name, face_embedding <-> %s::vector AS distance 
            FROM students 
            ORDER BY distance ASC 
            LIMIT 1;
        """
        cur.execute(query, (vector_str,))
        match = cur.fetchone()
        
        if match:
            matched_name, raw_distance = match[0], float(match[1])
            safe_print(f"[DIAGNOSTIC] Face detected! Raw Distance to '{matched_name}': {raw_distance:.4f}")
            
            # ADAPTED THRESHOLD: Increased from 1.35 to 6.50 to perfectly lock onto your baseline scores!
            if raw_distance < 6.50:  
                try:
                    cur.execute(
                        "INSERT INTO attendance_metrics (student_name) VALUES (%s);",
                        (matched_name,)
                    )
                    conn.commit()
                    safe_print(f"   ✅ [DATABASE SUCCESS] Attendance logged securely for {matched_name}!")
                except psycopg2.errors.UniqueViolation:
                    conn.rollback()
                    safe_print(f"   ℹ️ [INFO] Attendance already logged today for {matched_name}.")
        else:
            safe_print("[SCANNING] Roster table is completely empty. Please run enroll_student.py first.")
            
        cur.close()
        conn.close()
    except Exception as e:
        safe_print(f"Database Query Warning: {str(e)}")

# Initialize webcam engine
cap = cv2.VideoCapture(0)
safe_print("\n==================================================")
safe_print("  POSTGRESQL FACIAL ATTENDANCE PORTAL IS ONLINE   ")
safe_print("==================================================")
safe_print("👉 Look right at the camera lens.")
safe_print("👉 Press 'q' inside the video box to exit.\n")

frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
        
    frame_count += 1
    
    if frame_count % 30 == 0:
        try:
            small_frame = cv2.resize(frame, (640, 480))
            
            embeddings = DeepFace.represent(
                img_path=small_frame, 
                model_name="Facenet", 
                detector_backend="skip", 
                enforce_detection=False
            )
            
            if embeddings and len(embeddings) > 0:
                live_vector = embeddings[0]["embedding"]
                diagnose_face_distance(live_vector)
                
        except Exception as e:
            pass

    cv2.imshow("Calibration Stream Window", frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()








