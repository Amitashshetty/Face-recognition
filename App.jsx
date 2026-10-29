import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';
import { Shield, User, BookOpen, Camera, CheckCircle, AlertTriangle } from 'lucide-react';

// Moved outside the component to provide global scope visibility to all trailing code fragments
const API_BASE = import.meta.env.VITE_API_URL || 'https://onrender.com';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [role, setRole] = useState(localStorage.getItem('role'));
  const [view, setView] = useState('login'); 
  
  if (!token) {
    return <AuthPortal setToken={setToken} setRole={setRole} view={view} setView={setView} />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans">
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-bold tracking-wider text-blue-500 flex items-center gap-2">
          <Shield className="w-6 h-6" /> BIO-ATTENDANCE CONTROL MATRIX
        </h1>
        <button onClick={() => {
          localStorage.clear();
          setToken(null);
          setRole(null);
          setView('login');
        }} className="bg-red-950 text-red-400 border border-red-800 px-4 py-1.5 rounded hover:bg-red-900 transition font-medium text-sm">
          Disconnect Session
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
function AuthPortal({ setToken, setRole, view, setView }) {
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
      alert("Camera activation block error: " + err.message);
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
        alert("Enrollment committed successfully. Route into login window operations.");
        setIsLogin(true);
      }
    } catch (err) {
      alert("Operational failure response exception: " + (err.response?.data?.detail || err.message));
    }
  };
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 text-gray-200">
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 rounded-xl shadow-2xl p-8 grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white mb-2">
            {isLogin ? "Sign In to Terminal" : "Enroll New Profile"}
          </h2>
          <p className="text-sm text-gray-400 mb-6">Select appropriate organizational clearance level roles.</p>
          
          <div className="grid grid-cols-3 gap-2 mb-6">
            {['student', 'faculty', 'management'].map(r => (
              <button key={r} type="button" onClick={() => setSelectedRole(r)} className={`p-2.5 rounded text-xs uppercase tracking-wider font-bold border transition ${selectedRole === r ? 'bg-blue-600 border-blue-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            <input type="text" placeholder="User Alpha ID Key *" required onChange={e => setFormData({...formData, user_id: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:border-blue-500 focus:outline-none" />
            {!isLogin && <input type="text" placeholder="Full Registry Name *" required onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:border-blue-500 focus:outline-none" />}
            {!isLogin && <input type="email" placeholder="Email Address *" required onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:border-blue-500 focus:outline-none" />}
            <input type="password" placeholder="Password Access String *" required onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 rounded bg-gray-800 border border-gray-700 text-sm focus:border-blue-500 focus:outline-none" />
            {!isLogin && <input type="password" placeholder="Security Role Passcode Verification *" required onChange={e => setFormData({...formData, passcode: e.target.value})} className="w-full p-2.5 rounded bg-yellow-950/30 border border-yellow-800/50 text-sm text-yellow-300 placeholder-yellow-600 focus:outline-none" />}

            {!isLogin && selectedRole === 'student' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select onChange={e => setFormData({...formData, branch: e.target.value})} className="p-2 rounded bg-gray-800 border border-gray-700 text-gray-300">
                  <option value="CSE">CSE</option><option value="DSAI">DSAI</option><option value="ECE">ECE</option>
                </select>
                <select onChange={e => setFormData({...formData, academic_year: parseInt(e.target.value)})} className="p-2 rounded bg-gray-800 border border-gray-700 text-gray-300">
                  <option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
                </select>
                <select onChange={e => setFormData({...formData, batch: e.target.value})} className="p-2 rounded bg-gray-800 border border-gray-700 text-gray-300">
                  <option value="Batch A">Batch A</option><option value="Batch B">Batch B</option><option value="Batch C">Batch C</option>
                </select>
                <select onChange={e => setFormData({...formData, current_semester: parseInt(e.target.value)})} className="p-2 rounded bg-gray-800 border border-gray-700 text-gray-300">
                  {Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>Sem {n}</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 font-bold tracking-wide rounded text-sm text-white transition shadow-lg">
              {isLogin ? "Authenticate Credentials" : "Commit Security Record Registration"}
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            {isLogin ? "New user interface profile allocation?" : "Already possess system portal access key entries?"}
            <button onClick={() => setIsLogin(!isLogin)} className="text-blue-400 ml-1 hover:underline font-semibold">
              {isLogin ? "Register Account" : "Access Credentials Gate"}
            </button>
          </p>
        </div>

        <div className="bg-gray-950 rounded-xl border border-gray-800 flex flex-col items-center justify-center p-4 relative min-h-[300px]">
          {!isLogin && selectedRole === 'student' ? (
            <>
              {camActive && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover rounded bg-black scale-x-[-1]" />}
              {imgData && <img src={imgData} alt="matrix-preview" className="w-full h-full object-cover rounded" />}
              {!camActive && !imgData && <div className="text-gray-600 text-xs font-mono uppercase tracking-widest text-center">Facial Vector Engine Offline<br/><span className="text-[10px] text-gray-700">Capture identity snapshot anchor</span></div>}
              
              <div className="mt-4 space-x-2">
                {!camActive && <button type="button" onClick={startCamera} className="bg-gray-800 text-xs border border-gray-700 px-4 py-1.5 rounded hover:bg-gray-700 flex items-center gap-1"><Camera className="w-3.5 h-3.5"/> Fire Up Lens</button>}
                {camActive && <button type="button" onClick={captureFrame} className="bg-green-600 text-xs text-white px-4 py-1.5 rounded hover:bg-green-700">Freeze Frame Matrix</button>}
              </div>
            </>
          ) : (
            <div className="text-center p-6 space-y-2">
              <Shield className="w-12 h-12 text-gray-800 mx-auto" />
              <p className="text-xs font-mono text-gray-600 uppercase tracking-wider">Secured Dynamic Enterprise Domain Authorization Gateway</p>
            </div>
          )}
          <canvas ref={canvasRef} width="640" height="480" className="hidden" />
        </div>
      </div>
    </div>
  );
} // Fixed: Added trailing closing bracket here to close the AuthPortal body scope
function StudentDashboard() {
  const [data, setData] = useState(null);
  const uid = localStorage.getItem('user_id');

  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/student/${uid}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setData(res.data));
  }, [uid]);

  if (!data) return <div className="text-center py-12 font-mono text-xs text-gray-500 animate-pulse">Querying matrix profile parameters...</div>;

  const chartSource = data.analytics.map(item => ({
    name: item.month_name ? item.month_name.trim() : 'Unknown',
    percentage: parseFloat(item.attendance_percentage || 0),
    rawDays: item.days_attended
  }));

  const overallAvg = chartSource.length ? (chartSource.reduce((acc, c) => acc + c.percentage, 0) / chartSource.length) : 0;
  const targetThresholdColor = overallAvg >= 75 ? '#22c55e' : '#ef4444';

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-blue-400">Student Matrix Identity Overview</h3>
          <h2 className="text-2xl font-black text-white">{data.profile?.full_name}</h2>
          <p className="text-xs text-gray-400 mt-1 font-mono">{data.profile?.branch} | Semester {data.profile?.current_semester} | {data.profile?.batch}</p>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg px-6 py-3 text-center min-w-[160px]">
          <span className="block text-[10px] font-mono tracking-widest text-gray-500 uppercase">Current Term Metrics</span>
          <span className={`text-3xl font-black ${overallAvg >= 75 ? 'text-green-400' : 'text-red-400'}`}>{overallAvg.toFixed(1)}%</span>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider text-gray-400">Interactive Term Biometric Roster Report Analytics</h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartSource} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} fontFamily="monospace" />
              <YAxis stroke="#9ca3af" fontSize={11} domain={[0, 100]} />
              <Tooltip cursor={{ fill: '#111827' }} content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-gray-950 border border-gray-800 p-3 rounded shadow-2xl font-mono text-xs space-y-1">
                      <p className="text-white font-bold">{payload.payload.name}</p>
                      <p className="text-blue-400">Ratio: {payload.value.toFixed(2)}%</p>
                      <p className="text-gray-500">Days Logged: {payload.payload.rawDays} Days</p>
                    </div>
                  );
                }
                return null;
              }} />
              <ReferenceLine y={75} stroke={targetThresholdColor} strokeDasharray="5 5" label={{ value: `Semester Average Threshold (75%)`, fill: targetThresholdColor, fontSize: 10, position: 'top', fontFamily: 'monospace' }} />
              <Bar dataKey="percentage" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
function FacultyDashboard() {
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [roster, setRoster] = useState([]);
  const fid = localStorage.getItem('user_id');

  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/faculty/${fid}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      setClasses(res.data.classes);
      if (res.data.classes.length > 0) setSelectedClass(res.data.classes[0].id.toString());
    });
  }, [fid]);

  useEffect(() => {
    if (!selectedClass || classes.length === 0) return;
    axios.get(`${API_BASE}/api/dashboard/management`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => {
      const activeMeta = classes.find(c => c.id === parseInt(selectedClass));
      if (activeMeta) {
        const filtered = res.data.roster.filter(s => s.branch === activeMeta.branch && s.current_semester === activeMeta.semester && s.batch === activeMeta.batch);
        setRoster(filtered);
      }
    });
  }, [selectedClass, classes]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-4">
        <label className="block text-xs font-mono uppercase tracking-widest text-blue-400">Select Active Academic Allocation Blocks</label>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="w-full md:w-1/2 p-3 rounded bg-gray-950 border border-gray-800 text-sm text-white font-medium focus:border-blue-500 focus:outline-none">
          {classes.map(c => <option key={c.id} value={c.id}>{c.subject_name} ({c.branch} - Sem {c.semester} - {c.batch})</option>)}
        </select>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <RosterTable roster={roster} />
      </div>
    </div>
  );
}

function ManagementDashboard() {
  const [fullRoster, setFullRoster] = useState([]);
  const [filter, setFilter] = useState({ year: 'ALL', batch: 'ALL', semester: 'ALL', branch: 'ALL' });

  useEffect(() => {
    axios.get(`${API_BASE}/api/dashboard/management`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }).then(res => setFullRoster(res.data.roster));
  }, []);

  const processedRoster = fullRoster.filter(student => {
    // Fixed: Derive academic year from semester since column context is missing from backend dataset
    const derivedYear = Math.ceil((student.current_semester || 1) / 2);
    
    if (filter.year !== 'ALL' && derivedYear !== parseInt(filter.year)) return false;
    if (filter.batch !== 'ALL' && student.batch !== filter.batch) return false;
    if (filter.semester !== 'ALL' && student.current_semester !== parseInt(filter.semester)) return false;
    if (filter.branch !== 'ALL' && student.branch !== filter.branch) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Academic Timeline Year</label>
          <select onChange={e => setFilter({...filter, year: e.target.value})} className="w-full p-2 rounded bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <option value="ALL">All Years (1-4)</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Class Cohort Group</label>
          <select onChange={e => setFilter({...filter, batch: e.target.value})} className="w-full p-2 rounded bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <option value="ALL">All Batches (A-C)</option><option value="Batch A">Batch A</option><option value="Batch B">Batch B</option><option value="Batch C">Batch C</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Target Term Blocks</label>
          <select onChange={e => setFilter({...filter, semester: e.target.value})} className="w-full p-2 rounded bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <option value="ALL">All Semesters (1-8)</option>
            {Array.from({length:8},(_,i)=>i+1).map(n=><option key={n} value={n}>Semester {n}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-mono uppercase tracking-widest text-gray-500 mb-1.5">Academic Domain Branch</label>
          <select onChange={e => setFilter({...filter, branch: e.target.value})} className="w-full p-2 rounded bg-gray-950 border border-gray-850 text-xs text-gray-300">
            <option value="ALL">All Branches</option><option value="CSE">CSE</option><option value="DSAI">DSAI</option><option value="ECE">ECE</option>
          </select>
        </div>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden shadow-2xl">
        <RosterTable roster={processedRoster} />
      </div>
    </div>
  );
}

function RosterTable({ roster }) {
  if (roster.length === 0) return <div className="text-center py-12 text-sm font-mono text-gray-600">No records found.</div>;
  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-left border-collapse font-mono text-xs">
        <thead>
          <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 uppercase text-[10px] tracking-wider">
            <th className="p-4 font-bold">Identity ID</th>
            <th className="p-4 font-bold">Full Name</th>
            <th className="p-4 font-bold">Branch Mapping</th>
            <th className="p-4 font-bold">Semester Block</th>
            <th className="p-4 font-bold">Batch ID</th>
            <th className="p-4 font-bold text-center">Calculated Ratios</th>
            <th className="p-4 font-bold text-right">Status Flag</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/60 bg-gray-900/20">
          {roster.map(student => {
            const ratio = parseFloat(student.overall_avg || 0);
            const isSafe = ratio >= 75;
            return (
              <tr key={student.user_id} className="hover:bg-gray-800/40 transition-colors">
                <td className="p-4 font-bold text-gray-300">{student.user_id}</td>
                <td className="p-4 font-semibold text-white">{student.full_name}</td>
                <td className="p-4 text-gray-400">{student.branch}</td>
                <td className="p-4 text-gray-400">Sem {student.current_semester}</td>
                <td className="p-4 text-gray-400">{student.batch}</td>
                <td className="p-4 text-center font-bold text-gray-200">{ratio.toFixed(1)}%</td>
                <td className="p-4 text-right">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded font-bold uppercase tracking-wider text-[10px] border ${isSafe ? 'bg-green-950/40 border-green-800/60 text-green-400' : 'bg-red-950/40 border-red-800/60 text-red-400'}`}>
                    {isSafe ? <CheckCircle className="w-3 h-3"/> : <AlertTriangle className="w-3 h-3"/>}
                    {isSafe ? 'Clear (>=75%)' : 'Shortage (<75%)'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
