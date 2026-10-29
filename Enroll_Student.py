import os
import psycopg2
from deepface import DeepFace

DB_PARAMS = {
    "dbname": "postgres",
    "user": "postgres",
    "password": "Pgsql@25!!",  # Blank password per trust rules
    "host": "localhost",
    "port": "5432"   
}

IMAGE_PATH = "C:/Users/Amitash/Downloads/Employee_db/Photo1.jpeg"

try:
    print("Step 1: Extracting 128-dimensional Facenet vector map...")
    embeddings = DeepFace.represent(img_path=IMAGE_PATH, model_name="Facenet", detector_backend="skip")
    embedding_vector = embeddings[0]["embedding"]
    
    print("Step 2: Connecting to PostgreSQL Server...")
    conn = psycopg2.connect(**DB_PARAMS)
    cur = conn.cursor()
    
    student_name = "Amitash"
    print(f"Step 3: Uploading payload data for {student_name}...")
    cur.execute(
        "INSERT INTO students (student_name, face_embedding) VALUES (%s, %s);",
        (student_name, embedding_vector)
    )
    conn.commit()
    
    # Verification query to print back exactly what is in the table
    cur.execute("SELECT count(*) FROM students;")
    total_records = cur.fetchone()[0]
    
    print(f"\n🎉 SUCCESS: Enrolled {student_name}!")
    print(f"📊 Current total students saved in database: {total_records}")
    
    cur.close()
    conn.close()

except Exception as e:
    print(f"\n❌ Enrollment Stopped: {str(e)}")




