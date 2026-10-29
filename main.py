import os
import jwt
import cv2
import bcrypt
import numpy as np
from datetime import datetime
from deepface import DeepFace
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import psycopg2
from psycopg2.extras import RealDictCursor

app = FastAPI(title="Academic Biometric Management API Architecture")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Role access control keys configuration parameters
PASSCODES = {
    "student": "STU2026",
    "faculty": "FAC2026",
    "management": "MGMT2026"
}
SECRET_KEY = "SUPER_SECURE_ENTERPRISE_JWT_KEY_SIGNATURE"
security = HTTPBearer()

# Connect string routing configurations parsing mapping
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://postgres:Pgsql@25!!@localhost:5432/postgres")

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=["HS256"])
        return payload
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid auth session token context.")

@app.post("/api/auth/signup")
async def signup(
    user_id: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    full_name: str = Form(...),
    role: str = Form(...),
    passcode: str = Form(...),
    branch: str = Form(None),
    academic_year: int = Form(None),
    batch: str = Form(None),
    current_semester: int = Form(None),
    file: UploadFile = File(None)
):
    if passcode != PASSCODES.get(role):
        raise HTTPException(status_code=400, detail="Invalid organizational access registration passcode.")
        
    pwd_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    embedding = None

    if role == "student":
        if not file:
            raise HTTPException(status_code=400, detail="Biometric facial image file attachment parameter missing.")
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            objs = DeepFace.represent(img_path=img, model_name="Facenet", detector_backend="opencv", align=True)
            embedding = objs[0]["embedding"]
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Facial extraction processing failed: {str(e)}")

    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            """INSERT INTO users (user_id, email, password_hash, full_name, role, branch, academic_year, batch, current_semester, face_embedding)
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
            (user_id, email, pwd_hash, full_name, role, branch, academic_year, batch, current_semester, embedding)
        )
        conn.commit()
        return {"status": "success", "message": "Account created successfully."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=400, detail=f"Database execution constraint rejection error: {str(e)}")
    finally:
        cur.close()
        conn.close()

@app.post("/api/auth/login")
async def login(user_id: str = Form(...), password: str = Form(...)):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=400, detail="Invalid security credential pairings.")
        
    token = jwt.encode({"user_id": user['user_id'], "role": user['role']}, SECRET_KEY, algorithm="HS256")
    return {"token": token, "role": user['role'], "name": user['full_name'], "user_id": user['user_id']}

@app.get("/api/dashboard/student/{student_id}")
async def get_student_dashboard(student_id: str, token_payload=Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Fetch metadata context vectors
    cur.execute("SELECT user_id, full_name, branch, current_semester, batch FROM users WHERE user_id = %s", (student_id,))
    student = cur.fetchone()
    
    # 2. Extract monthly bar chart structural telemetry sets
    analytics_query = """
        SELECT TO_CHAR(attendance_date, 'Month') as month_name,
               COUNT(*) as days_attended,
               (COUNT(*)::float / GREATEST(SUM(c.total_held_sessions), 1) * 100) as attendance_percentage
        FROM attendance_records r
        JOIN classes c ON r.class_id = c.id
        WHERE r.student_id = %s AND c.semester = (SELECT current_semester FROM users WHERE user_id = %s)
        GROUP BY TO_CHAR(attendance_date, 'Month')
    """
    cur.execute(analytics_query, (student_id, student_id))
    analytics = cur.fetchall()
    
    cur.close()
    conn.close()
    return {"profile": student, "analytics": analytics}

@app.get("/api/dashboard/faculty/{faculty_id}")
async def get_faculty_dashboard(faculty_id: str, token_payload=Depends(verify_token)):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # 1. Fetch active class maps allocation structural configurations
    cur.execute("SELECT id, subject_name, branch, semester, batch FROM classes WHERE faculty_id = %s", (faculty_id,))
    classes_assigned = cur.fetchall()
    
    cur.close()
    conn.close()
    return {"classes": classes_assigned}

@app.get("/api/dashboard/management")
async def get_management_dashboard(token_payload=Depends(verify_token)):
    if token_payload['role'] != 'management':
        raise HTTPException(status_code=403, detail="Unauthorized operational context clearance exception.")
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Aggregate comprehensive dynamic flags roster across current operational parameters
    query = """
        SELECT u.user_id, u.full_name, u.branch, u.current_semester, u.batch,
               COALESCE((COUNT(r.id)::float / NULLIF(SUM(c.total_held_sessions), 0) * 100), 0) as overall_avg
        FROM users u
        LEFT JOIN attendance_records r ON u.user_id = r.student_id
        LEFT JOIN classes c ON r.class_id = c.id
        WHERE u.role = 'student'
        GROUP BY u.user_id, u.full_name, u.branch, u.current_semester, u.batch
    """
    cur.execute(query)
    roster_flags = cur.fetchall()
    
    cur.close()
    conn.close()
    return {"roster": roster_flags}
