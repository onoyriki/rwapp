
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';
import { apiService } from './services/apiService.ts';

// --- KONFIGURASI ---
const GOOGLE_CLIENT_ID = "770161612412-bb7dvaebdm97ml16fgmf2r9v4nmin6u0.apps.googleusercontent.com";
const API_BASE_URL = window.location.hostname === 'localhost' ? "http://34.182.35.155.nip.io/api" : `${window.location.origin}/api`;

const Gender = { MALE: 'Laki-laki', FEMALE: 'Perempuan' };
const ResidentStatus = { PERMANENT: 'Tetap', TEMPORARY: 'Pendatang/Kontrak' };

// --- KOMPONEN: STAT CARD ---
const StatCard = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>{icon}</div>
    </div>
  </div>
);

// --- KOMPONEN: DASHBOARD ---
const Dashboard = ({ residents }) => {
  const stats = useMemo(() => {
    const male = residents.filter(r => r.gender === Gender.MALE).length;
    const female = residents.filter(r => r.gender === Gender.FEMALE).length;
    const permanent = residents.filter(r => r.status === ResidentStatus.PERMANENT).length;
    const temporary = residents.filter(r => r.status === ResidentStatus.TEMPORARY).length;
    const rts = new Set(residents.map(r => r.rt_number)).size;

    return { total: residents.length, rts, male, female, permanent, temporary };
  }, [residents]);

  const genderData = [
    { name: 'Pria', value: stats.male, color: '#4f46e5' },
    { name: 'Wanita', value: stats.female, color: '#ec4899' }
  ];

  return (
    <div className="space-y-6">
      <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Ringkasan Wilayah RW</h2>
        <p className="text-indigo-100 text-sm mt-1">Data terkini kependudukan tingkat RW dan RT.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Total Warga" value={stats.total} color="bg-indigo-50" icon={<span className="text-indigo-600 font-bold">#</span>} />
        <StatCard title="RT Aktif" value={stats.rts} color="bg-emerald-50" icon={<span className="text-emerald-600 font-bold">RT</span>} />
        <StatCard title="Pria" value={stats.male} color="bg-blue-50" icon={<span className="text-blue-600 font-bold">L</span>} />
        <StatCard title="Wanita" value={stats.female} color="bg-pink-50" icon={<span className="text-pink-600 font-bold">P</span>} />
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={genderData} innerRadius={60} outerRadius={80} dataKey="value">
              {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// --- KOMPONEN: USER MANAGEMENT ---
const UserManagement = ({ users, onVerify }) => (
  <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
    <div className="p-4 border-b font-bold text-slate-700">Manajemen Akses RT</div>
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b">
          <tr><th className="p-4">Nama</th><th className="p-4">Email</th><th className="p-4">Aksi</th></tr>
        </thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-b">
              <td className="p-4 font-medium">{u.name}</td>
              <td className="p-4 text-slate-500">{u.email}</td>
              <td className="p-4 flex gap-2">
                {u.status === 'PENDING' ? (
                  <button onClick={() => onVerify(u.id, 'APPROVED', 'ADMIN_RT', '01')} className="bg-emerald-600 text-white px-3 py-1 rounded text-xs">Setujui</button>
                ) : <span className="text-emerald-600 text-xs font-bold uppercase">{u.role}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

// --- KOMPONEN UTAMA: APP ---
const App = () => {
  const [session, setSession] = useState(null);
  const [residents, setResidents] = useState([]);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const googleBtnRef = useRef(null);

  useEffect(() => {
    apiService.setBaseUrl(API_BASE_URL);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resData, userData] = await Promise.all([apiService.getResidents(), apiService.getUsers()]);
      setResidents(resData || []);
      setUsers(userData || []);
    } finally { setIsLoading(false); }
  };

  useEffect(() => {
    // Fix: Cast window to any to access the dynamically loaded 'google' property for identity services
    if (!session && !isLoading && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (res: any) => {
          const payload = JSON.parse(atob(res.credential.split('.')[1]));
          apiService.loginWithGoogle(payload.email, payload.name, payload.picture).then(setSession);
        }
      });
      (window as any).google.accounts.id.renderButton(googleBtnRef.current, { theme: "outline", size: "large", shape: "pill" });
    }
  }, [session, isLoading]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-sm text-center border">
          <h1 className="text-2xl font-bold mb-2">SIM-RW Digital</h1>
          <p className="text-slate-500 text-sm mb-8">Silakan Login untuk Akses Data</p>
          <div ref={googleBtnRef} className="flex justify-center mb-6"></div>
          <button onClick={() => setSession(users[0])} className="text-xs text-indigo-600 font-bold hover:underline">Gunakan Akses Demo</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-indigo-900 text-white p-6 flex flex-col gap-8">
        <h1 className="font-bold text-xl">SIM-RW</h1>
        <nav className="flex flex-col gap-2">
          <button onClick={() => setCurrentPage('dashboard')} className={`p-3 rounded-lg text-left text-sm ${currentPage === 'dashboard' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>Dashboard</button>
          <button onClick={() => setCurrentPage('residents')} className={`p-3 rounded-lg text-left text-sm ${currentPage === 'residents' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>Data Warga</button>
          {session.role === 'ADMIN_RW' && <button onClick={() => setCurrentPage('users')} className={`p-3 rounded-lg text-left text-sm ${currentPage === 'users' ? 'bg-indigo-700' : 'hover:bg-indigo-800'}`}>Verifikasi User</button>}
        </nav>
        <button onClick={() => setSession(null)} className="mt-auto p-3 text-indigo-300 text-sm hover:text-white">Keluar</button>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        {currentPage === 'dashboard' && <Dashboard residents={residents} />}
        {currentPage === 'users' && <UserManagement users={users} onVerify={(id, s, r, rt) => apiService.updateUserStatus(id, s, r, rt).then(loadData)} />}
        {currentPage === 'residents' && (
          <div className="bg-white p-6 rounded-xl border">
             <h3 className="font-bold mb-4">Daftar Warga Terdaftar</h3>
             <div className="space-y-2">
               {residents.map(r => <div key={r.id} className="p-3 bg-slate-50 rounded border text-sm">{r.name} - RT {r.rt_number} ({r.status})</div>)}
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
