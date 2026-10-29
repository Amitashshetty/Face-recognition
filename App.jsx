export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  
  if (!token) {
    return <AuthPortal setToken={setToken} setRole={setRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-widest text-blue-500 flex items-center gap-2">
          <Shield className="w-6 h-6" /> BIO-MATRIX PORTAL
        </h1>
        <button 
          onClick={() => { localStorage.clear(); setToken(null); setRole(null); }} 
          className="bg-red-950 text-red-400 border border-red-800 px-4 py-1.5 rounded font-bold text-xs uppercase hover:bg-red-900 transition"
        >
          Disconnect
        </button>
      </nav>
      <main className="p-8">
        {role === 'student' && <StudentDashboard />}
        {role === 'faculty' && <FacultyDashboard />}
        {role === 'management' && <ManagementDashboard />}
      </main>
    </div>
  );
}
function AuthPortal({ setToken, setRole }) {
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState('student');
  const [formData, setFormData] = useState({
    user_id: '', email: '', password: '', full_name: '', passcode: '',
    branch: 'CSE', academic_year: 1, batch: 'Batch A', current_semester: 1
  });
  const [imgData, setImgData] = useState(null);
  const [camActive, setCamActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const startCamera = async () => {
    setCamActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) {
      alert("Camera activation block: " + err.message);
      setCamActive(false);
    }
  };

  const captureFrame = () => {
    if (canvasRef.current && videoRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      setImgData(canvasRef.current.toDataURL('image/jpeg'));
      if (videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      setCamActive(false);
    }
  };

  const handleAction = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    Object.keys(formData).forEach(key => payload.append(key, formData[key]));
    payload.append('role', selectedRole);

    if (!isLogin && selectedRole === 'student' && imgData) {
      const blob = await (await fetch(imgData)).blob();
      payload.append('file', blob, 'identity.jpg');
    }

    try {
      if (isLogin) {
        const res = await axios.post(`${API_BASE}/api/auth/login`, payload);
        localStorage.setItem('token', res.data.token);
        localStorage.setItem('role', res.data.role);
        localStorage.setItem('user_id', res.data.user_id);
        setToken(res.data.token);
        setRole(res.data.role);
      } else {
        await axios.post(`${API_BASE}/api/auth/signup`, payload);
        alert("Success! Now log in with your credentials.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Error: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-gray-200">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">{isLogin ? "Sign In" : "Register Profile"}</h2>
          <div className="grid grid-cols-3 gap-2 mb-6">
            {['student', 'faculty', 'management'].map(r => (
              <button key={r} type="button" onClick={() => setSelectedRole(r)} className={`p-2 rounded text-xs font-bold border transition ${selectedRole === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>{r}</button>
            ))}
          </div>
          <form onSubmit={handleAction} className="space-y-4">
            <input type="text" placeholder="User ID" required onChange={e => setFormData({...formData, user_id: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none" />
            <input type="password" placeholder="Password" required onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:outline-none" />
            {!isLogin && <input type="password" placeholder="Security Passcode" required onChange={e => setFormData({...formData, passcode: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border-yellow-800 text-sm focus:outline-none" />}
            <button type="submit" className="w-full py-2.5 bg-blue-600 font-bold rounded text-sm text-white">{isLogin ? "Login" : "Commit Registration"}</button>
          </form>
          <button onClick={() => setIsLogin(!isLogin)} className="mt-4 text-xs text-blue-400 hover:underline">{isLogin ? "Need an account? Register" : "Have an account? Login"}</button>
        </div>
        <div className="bg-gray-950 rounded-xl border border-gray-800 flex flex-col items-center justify-center p-4 min-h-[300px]">
          {!isLogin && selectedRole === 'student' ? (
            <>
              {camActive && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded bg-black" />}
              {imgData && <img src={imgData} alt="preview" className="w-full h-full object-cover rounded" />}
              <div className="mt-4 space-x-2">
                {!camActive && <button type="button" onClick={startCamera} className="bg-gray-800 text-xs px-4 py-1.5 rounded hover:bg-gray-700 flex items-center gap-1"><Camera className="w-3.5 h-3.5"/> Start Camera</button>}
                {camActive && <button type="button" onClick={captureFrame} className="bg-green-600 text-xs text-white px-4 py-1.5 rounded hover:bg-green-700">Capture Frame</button>}
              </div>
            </>
          ) : (
            <div className="text-center p-6"><Shield className="w-12 h-12 text-gray-800 mx-auto" /><p className="text-xs text-gray-600 mt-2">SECURED GATEWAY</p></div>
          )}
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        </div>
      </div>
    </div>
  );
}
function StudentDashboard() {
  const [data, setData] = useState(null);
  const uid = localStorage.getItem('user_id');
  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/student/${uid}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
      .then(res => setData(res.data)).catch(err => console.error(err));
  }, [uid]);
  if (!data) return <div className="text-center py-20 text-xs animate-pulse">Loading Profile...</div>;
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex justify-between items-center">
        <div><h2 className="text-2xl font-black">{data.profile?.full_name}</h2><p className="text-gray-400 text-xs uppercase">{data.profile?.branch} | Semester {data.profile?.current_semester}</p></div>
        <div className="text-3xl font-black text-blue-400">75% Threshold</div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.analytics.map(i => ({ name: i.month_name, percentage: i.attendance_percentage }))}>
            <CartesianGrid stroke="#1f2937" vertical={false} />
            <XAxis dataKey="name" stroke="#6b7280" fontSize={10} />
            <YAxis stroke="#6b7280" fontSize={10} />
            <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FacultyDashboard() {
  const [classes, setClasses] = useState([]);
  const fid = localStorage.getItem('user_id');
  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/faculty/${fid}`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
      .then(res => setClasses(res.data.classes)).catch(err => console.error(err));
  }, [fid]);
  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <select className="w-full bg-gray-950 border border-gray-800 p-3 rounded text-sm focus:outline-none">
          {classes.map(c => <option key={c.id}>{c.subject_name} ({c.branch} - Sem {c.semester})</option>)}
        </select>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl"><RosterTable roster={[]} /></div>
    </div>
  );
}
function RosterTable({ roster }) {
  if (roster.length === 0) return <div className="p-8 text-center text-gray-500">No records found.</div>;
  return (
    <table className="w-full text-left border-collapse font-mono text-xs">
      <thead className="bg-gray-950 text-gray-500 uppercase tracking-wider">
        <tr><th className="p-4">ID</th><th className="p-4">Name</th><th className="p-4">Branch</th><th className="p-4 text-center">Avg Ratio</th></tr>
      </thead>
      <tbody className="divide-y divide-gray-800">
        {roster.map(s => (
          <tr key={s.user_id} className="hover:bg-gray-800/40">
            <td className="p-4 font-bold">{s.user_id}</td><td className="p-4">{s.full_name}</td>
            <td className="p-4">{s.branch}</td><td className="p-4 text-center font-bold text-blue-400">{parseFloat(s.overall_avg || 0).toFixed(1)}%</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ManagementDashboard() {
  const [roster, setRoster] = useState([]);
  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/management`, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }})
      .then(res => setRoster(res.data.roster)).catch(err => console.error(err));
  }, []);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl text-center">
          <p className="text-[10px] text-gray-500 uppercase font-bold">Students Enrolled</p>
          <p className="text-2xl font-black">{roster.length}</p>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"><RosterTable roster={roster} /></div>
    </div>
  );
}
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  
  if (!token) {
    return <AuthPortal setToken={setToken} setRole={setRole} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-widest text-blue-500 flex items-center gap-2">
          <Shield className="w-6 h-6" /> BIO-MATRIX PORTAL
        </h1>
        <button 
          onClick={() => { localStorage.clear(); setToken(null); setRole(null); }} 
          className="bg-red-950 text-red-400 border border-red-800 px-4 py-1.5 rounded font-bold text-xs uppercase hover:bg-red-900 transition"
        >
          Disconnect
        </button>
      </nav>
      <main className="p-8">
        {role === 'student' && <StudentDashboard />}
        {role === 'faculty' && <FacultyDashboard />}
        {role === 'management' && <ManagementDashboard />}
      </main>
    </div>
  );
}
