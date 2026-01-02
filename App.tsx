
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';
import { 
  Users, UserCheck, MapPin, Database, MessageSquare, 
  LogOut, Plus, Search, Filter, Edit2, Trash2, Eye, ShieldCheck
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { apiService } from './services/apiService.ts';
// Import proper types to resolve inference issues
import { Resident, UserAccount, UserSession, Role } from './types.ts';

// --- KONSTRUKTOR / TYPES ---
const Gender = { MALE: 'Laki-laki', FEMALE: 'Perempuan' };
const ResidentStatus = { PERMANENT: 'Tetap', TEMPORARY: 'Pendatang/Kontrak' };

// --- KOMPONEN: STAT CARD ---
const StatCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string, icon: any, color: string, subValue?: string }) => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
        {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

// --- KOMPONEN: DASHBOARD ---
const Dashboard = ({ residents, session }: { residents: Resident[], session: UserSession }) => {
  const stats = useMemo(() => {
    const male = residents.filter(r => r.gender === Gender.MALE).length;
    const female = residents.filter(r => r.gender === Gender.FEMALE).length;
    const permanent = residents.filter(r => r.status === ResidentStatus.PERMANENT).length;
    const rts = new Set(residents.map(r => r.rt_number)).size;
    
    // Distribusi RT
    const rtMap: Record<string, number> = {};
    residents.forEach(r => {
      rtMap[r.rt_number] = (rtMap[r.rt_number] || 0) + 1;
    });
    const rtData = Object.entries(rtMap).map(([name, value]) => ({ name: `RT ${name}`, value }));

    return { total: residents.length, rts, male, female, permanent, rtData };
  }, [residents]);

  const genderData = [
    { name: 'Laki-laki', value: stats.male, color: '#4f46e5' },
    { name: 'Perempuan', value: stats.female, color: '#ec4899' }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
        <h2 className="text-2xl font-bold">Halo, {session.name}</h2>
        <p className="text-indigo-100 mt-1 max-w-xl">
          Selamat datang di Pusat Kendali Digital RW. Berikut adalah rangkuman data kependudukan wilayah Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Warga" value={stats.total.toString()} icon={Users} color="bg-indigo-500" subValue="Jiwa terdaftar" />
        <StatCard title="RT Aktif" value={stats.rts.toString()} icon={MapPin} color="bg-emerald-500" subValue="Wilayah RT" />
        <StatCard title="Laki-laki" value={stats.male.toString()} icon={UserCheck} color="bg-blue-500" subValue={`${Math.round((stats.male/stats.total)*100 || 0)}% dari total`} />
        <StatCard title="Perempuan" value={stats.female.toString()} icon={UserCheck} color="bg-pink-500" subValue={`${Math.round((stats.female/stats.total)*100 || 0)}% dari total`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Database size={18} className="text-indigo-600" /> Sebaran Warga per RT
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.rtData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="font-bold text-slate-800 mb-6">Proporsi Gender</h3>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {genderData.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-slate-500 italic">"Data mencakup seluruh RT yang sudah terverifikasi"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN: RESIDENT LIST ---
// Added proper type for props to resolve 'unknown' inference in map
const ResidentList = ({ residents, onAdd, onEdit, onDelete, session }: { 
  residents: Resident[], 
  onAdd: () => void, 
  onEdit: (r: Resident) => void, 
  onDelete: (id: string) => void, 
  session: UserSession 
}) => {
  const [search, setSearch] = useState('');
  const [rtFilter, setRtFilter] = useState('all');

  const filtered = residents.filter(r => {
    const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || r.nik.includes(search);
    const matchRt = rtFilter === 'all' || r.rt_number === rtFilter;
    return matchSearch && matchRt;
  });

  const rtOptions = Array.from(new Set(residents.map(r => r.rt_number))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800">Database Kependudukan</h3>
          <p className="text-sm text-slate-500">Kelola data warga tingkat RW dan RT secara terpusat.</p>
        </div>
        <button 
          onClick={onAdd}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} /> Tambah Warga
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari berdasarkan Nama atau NIK..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-3 top-3 text-slate-400" size={18} />
            <select 
              className="pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white font-medium text-sm appearance-none"
              value={rtFilter}
              onChange={(e) => setRtFilter(e.target.value)}
            >
              <option value="all">Semua RT</option>
              {rtOptions.map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Nama Lengkap / NIK</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">Alamat / RT</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-800">{r.name}</p>
                    <p className="text-xs text-slate-500 font-mono">{r.nik}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-slate-700 truncate max-w-[200px]">{r.address}</p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[10px] font-bold">RT {r.rt_number}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      r.status === ResidentStatus.PERMANENT ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {r.status === ResidentStatus.PERMANENT ? 'Tetap' : 'Kontrak'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => onEdit(r)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => onDelete(r.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- KOMPONEN: USER VERIFICATION ---
const UserManagement = ({ users, onVerify }: { users: UserAccount[], onVerify: (id: string, s: string, r: Role, rt: string) => void }) => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <ShieldCheck className="text-indigo-600" /> Verifikasi Admin RT
        </h3>
        <p className="text-sm text-slate-500 mt-1">Berikan akses Admin RT kepada warga yang sudah mendaftar via Google.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">User</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-center">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase text-right">Tindakan</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img src={u.avatar} className="w-8 h-8 rounded-full border" alt="" />
                    <div>
                      <p className="font-bold text-sm text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-500">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                   <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                    u.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {u.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  {u.status === 'PENDING' && (
                    <button 
                      onClick={() => onVerify(u.id, 'APPROVED', 'ADMIN_RT', '01')}
                      className="bg-indigo-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors"
                    >
                      Setujui Akses
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// --- KOMPONEN UTAMA: APP ---
const App = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);
  
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.setBaseUrl(API_BASE_URL);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rData, uData] = await Promise.all([
        apiService.getResidents(),
        apiService.getUsers()
      ]);
      setResidents(rData || []);
      setUsers(uData || []);
    } catch (err) {
      console.error("Gagal memuat data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session && !isLoading && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (res: any) => {
          const payload = JSON.parse(atob(res.credential.split('.')[1]));
          const user = await apiService.loginWithGoogle(payload.email, payload.name, payload.picture);
          setSession(user);
        }
      });
      if (googleBtnRef.current) {
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, { theme: "outline", size: "large", shape: "pill" });
      }
    }
  }, [session, isLoading]);

  const handleSaveResident = async (formData: any) => {
    try {
      if (editingResident) {
        await apiService.updateResident(editingResident.id, formData);
      } else {
        await apiService.addResident(formData);
      }
      setShowModal(false);
      setEditingResident(null);
      loadData();
    } catch (err) {
      alert("Gagal menyimpan data warga.");
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (confirm("Hapus data warga ini?")) {
      await apiService.deleteResident(id);
      loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-medium text-slate-500">Menghubungkan ke Server...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md text-center border border-white">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-100 rotate-3">
             <Database className="text-white -rotate-3" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-2 tracking-tight">SIM-RW <span className="text-indigo-600">Digital</span></h1>
          <p className="text-slate-500 mb-10 font-medium">Sistem Informasi Manajemen Rukun Warga Modern</p>
          <div ref={googleBtnRef} className="flex justify-center mb-8"></div>
          <div className="pt-8 border-t border-slate-100">
            <button 
              onClick={() => setSession(users.find(u => u.role === 'ADMIN_RW') || users[0])}
              className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
            >
              Mode Demo Pengurus
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-72 bg-indigo-950 text-white flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
              <Database size={20} />
            </div>
            <h1 className="font-black text-xl tracking-tighter">SIM-RW</h1>
          </div>
          
          <nav className="space-y-2">
            <SidebarLink 
              active={currentPage === 'dashboard'} 
              onClick={() => setCurrentPage('dashboard')} 
              icon={Users} 
              label="Dashboard" 
            />
            <SidebarLink 
              active={currentPage === 'residents'} 
              onClick={() => setCurrentPage('residents')} 
              icon={MapPin} 
              label="Data Warga" 
            />
            {session.role === 'ADMIN_RW' && (
              <SidebarLink 
                active={currentPage === 'users'} 
                onClick={() => setCurrentPage('users')} 
                icon={ShieldCheck} 
                label="Verifikasi User" 
              />
            )}
            <SidebarLink 
              active={currentPage === 'ai'} 
              onClick={() => setCurrentPage('ai')} 
              icon={MessageSquare} 
              label="Asisten AI" 
            />
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-indigo-900/50">
          <div className="flex items-center gap-3 mb-6">
            <img src={session.avatar} className="w-10 h-10 rounded-xl border-2 border-indigo-800" alt="" />
            <div className="overflow-hidden">
              <p className="font-bold text-sm truncate">{session.name}</p>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                {session.role === 'ADMIN_RW' ? 'Ketua RW' : `Admin RT ${session.rtNumber || '00'}`}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSession(null)}
            className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white py-3 rounded-xl text-sm font-bold transition-all border border-red-500/20"
          >
            <LogOut size={16} /> Keluar Sistem
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-10 flex-shrink-0">
          <h2 className="font-bold text-slate-800 text-lg capitalize">{currentPage.replace('-', ' ')}</h2>
          <div className="flex items-center gap-4 text-sm font-medium text-slate-500">
             {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-10 bg-slate-50/50">
          {currentPage === 'dashboard' && <Dashboard residents={residents} session={session} />}
          {currentPage === 'residents' && (
            <ResidentList 
              residents={residents} 
              session={session}
              onAdd={() => { setEditingResident(null); setShowModal(true); }}
              onEdit={(r) => { setEditingResident(r); setShowModal(true); }}
              onDelete={handleDeleteResident}
            />
          )}
          {currentPage === 'users' && (
            <UserManagement users={users} onVerify={(id, s, r, rt) => apiService.updateUserStatus(id, s, r as Role, rt).then(loadData)} />
          )}
          {currentPage === 'ai' && (
            <div className="h-full flex items-center justify-center text-slate-400 italic">
               Modul Asisten AI sedang dalam pemeliharaan...
            </div>
          )}
        </section>
      </main>

      {/* MODAL FORM WARGA */}
      {showModal && (
        <ResidentFormModal 
          resident={editingResident} 
          onClose={() => setShowModal(false)} 
          onSave={handleSaveResident} 
        />
      )}
    </div>
  );
};

const SidebarLink = ({ active, onClick, icon: Icon, label }: { active: boolean, onClick: () => void, icon: any, label: string }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-bold transition-all ${
      active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'
    }`}
  >
    <Icon size={18} /> {label}
  </button>
);

const ResidentFormModal = ({ resident, onClose, onSave }: { resident: Resident | null, onClose: () => void, onSave: (form: any) => void }) => {
  const [form, setForm] = useState({
    name: resident?.name || '',
    nik: resident?.nik || '',
    rt_number: resident?.rt_number || '01',
    address: resident?.address || '',
    gender: resident?.gender || Gender.MALE,
    status: resident?.status || ResidentStatus.PERMANENT,
    no_kk: resident?.no_kk || ''
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-950/40 backdrop-blur-sm">
      <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden border border-white animate-in zoom-in duration-200">
        <div className="px-8 py-6 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
           <h3 className="font-bold text-slate-800 text-lg">{resident ? 'Edit Data Warga' : 'Pendaftaran Warga Baru'}</h3>
           <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><Plus className="rotate-45" size={24} /></button>
        </div>
        <form className="p-8 space-y-4" onSubmit={(e) => { e.preventDefault(); onSave(form); }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</label>
              <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-medium" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIK</label>
              <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono" value={form.nik} onChange={e => setForm({...form, nik: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No. Kartu Keluarga</label>
              <input required className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 font-mono" value={form.no_kk} onChange={e => setForm({...form, no_kk: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">RT Wilayah</label>
              <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium" value={form.rt_number} onChange={e => setForm({...form, rt_number: e.target.value})}>
                <option value="01">RT 01</option>
                <option value="02">RT 02</option>
                <option value="03">RT 03</option>
                <option value="04">RT 04</option>
              </select>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Alamat Domisili</label>
            <textarea className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none h-20 resize-none font-medium" value={form.address} onChange={e => setForm({...form, address: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jenis Kelamin</label>
                <div className="flex gap-4 p-2">
                   <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600">
                     <input type="radio" checked={form.gender === Gender.MALE} onChange={() => setForm({...form, gender: Gender.MALE})} /> L
                   </label>
                   <label className="flex items-center gap-2 cursor-pointer text-sm font-bold text-slate-600">
                     <input type="radio" checked={form.gender === Gender.FEMALE} onChange={() => setForm({...form, gender: Gender.FEMALE})} /> P
                   </label>
                </div>
             </div>
             <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status Kependudukan</label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white font-medium" value={form.status} onChange={e => setForm({...form, status: e.target.value})} >
                   <option value={ResidentStatus.PERMANENT}>Tetap</option>
                   <option value={ResidentStatus.TEMPORARY}>Kontrak</option>
                </select>
             </div>
          </div>
          <div className="pt-6 flex gap-3">
             <button type="button" onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 font-bold text-slate-500 hover:bg-slate-50 transition-colors">Batal</button>
             <button type="submit" className="flex-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">Simpan Data</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Konfigurasi Global
const GOOGLE_CLIENT_ID = "770161612412-bb7dvaebdm97ml16fgmf2r9v4nmin6u0.apps.googleusercontent.com";
const API_BASE_URL = window.location.hostname === 'localhost' ? "http://34.182.35.155.nip.io/api" : `${window.location.origin}/api`;

export default App;
