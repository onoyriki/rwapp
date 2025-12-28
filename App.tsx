
import React, { useState, useEffect } from 'react';
import { UserSession, Resident, Role, UserAccount } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ResidentList from './components/ResidentList';
import AiAssistant from './components/AiAssistant';
import UserManagement from './components/UserManagement';
import { supabaseMock } from './services/supabaseMock';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [resData, userData] = await Promise.all([
          supabaseMock.getResidents(),
          Promise.resolve(authService.getUsers())
        ]);
        setResidents(resData);
        setUsers(userData);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    // Simulasi input email via prompt (karena di lingkungan ini tidak bisa pop-up Google OAuth asli)
    const email = prompt("Masukkan Email Google Anda (simulasi):", "warga@gmail.com");
    if (!email) {
      setIsLoggingIn(false);
      return;
    }
    const name = email.split('@')[0].toUpperCase();

    const user = await authService.loginWithGoogle(email, name);
    setSession(user);
    setUsers(authService.getUsers());
    setIsLoggingIn(false);
  };

  const handleVerifyUser = (userId: string, status: 'APPROVED' | 'REJECTED', role: Role, rt: string) => {
    const updatedUsers = authService.updateUserStatus(userId, status, role, rt);
    setUsers(updatedUsers);
    // Jika user yang sedang login statusnya berubah (misal admin mengupdate dirinya sendiri)
    if (session?.id === userId) {
      setSession(prev => prev ? { ...prev, status, role, rtNumber: rt } : null);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentPage('dashboard');
  };

  const handleAddResident = async (data: Omit<Resident, 'id' | 'created_at'>) => {
    const newResident = await supabaseMock.addResident(data);
    setResidents(prev => [...prev, newResident]);
  };

  const handleUpdateResident = async (id: string, updates: Partial<Resident>) => {
    const updatedResident = await supabaseMock.updateResident(id, updates);
    setResidents(prev => prev.map(r => r.id === id ? updatedResident : r));
  };

  const handleDeleteResident = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data warga ini?')) {
      await supabaseMock.deleteResident(id);
      setResidents(prev => prev.filter(r => r.id !== id));
    }
  };

  const filteredResidents = React.useMemo(() => {
    if (!session) return [];
    if (session.role === 'ADMIN_RT') {
      return residents.filter(r => r.rt_number === session.rtNumber);
    }
    return residents;
  }, [residents, session]);

  // View: Login Screen
  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SIM-RW Digital</h1>
            <p className="text-slate-500">Sistem Informasi Manajemen Warga</p>
          </div>

          <div className="space-y-4">
            <button
              disabled={isLoggingIn}
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 p-4 rounded-2xl border-2 border-slate-100 hover:border-indigo-600 hover:bg-indigo-50 transition-all group font-medium text-slate-700"
            >
              <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24s.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {isLoggingIn ? 'Menghubungkan...' : 'Masuk dengan Google'}
            </button>
            
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-400">Admin Utama</span></div>
            </div>

            <button
              onClick={() => {
                // Bypass khusus untuk demo admin default
                const admin = users.find(u => u.email === 'admin@rw.com');
                if (admin) setSession(admin);
              }}
              className="w-full p-3 text-sm text-indigo-600 font-medium hover:bg-indigo-50 rounded-xl transition-colors"
            >
              Login sebagai Admin RW (Demo)
            </button>
          </div>
          
          <p className="text-center mt-8 text-[10px] text-slate-400 leading-relaxed">
            Data login diproses secara digital. Dengan masuk, Anda menyetujui kebijakan manajemen data warga RW setempat.
          </p>
        </div>
      </div>
    );
  }

  // View: Pending Verification Screen
  if (session.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-10 border border-slate-200 text-center">
          <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Verifikasi RW</h1>
          <p className="text-slate-600 mb-8">
            Halo <strong>{session.name}</strong>, akun Anda telah terdaftar. Silakan hubungi Bapak RW untuk menyetujui akses Anda ke sistem manajemen warga.
          </p>
          <div className="bg-slate-50 p-4 rounded-xl text-left mb-8 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-700">{session.email}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Status:</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">Menunggu</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-500 hover:text-slate-800 font-medium transition-colors"
          >
            Keluar dan Cek Nanti
          </button>
        </div>
      </div>
    );
  }

  // View: Rejected Screen
  if (session.status === 'REJECTED') {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10 border border-red-100 text-center">
          <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h1>
          <p className="text-slate-600 mb-8">Maaf, permintaan akses Anda tidak disetujui oleh pengurus RW. Silakan hubungi RW untuk informasi lebih lanjut.</p>
          <button onClick={handleLogout} className="bg-red-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-red-700 transition-colors w-full">Kembali ke Login</button>
        </div>
      </div>
    );
  }

  return (
    <Layout session={session} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {currentPage === 'dashboard' && <Dashboard residents={filteredResidents} />}
          {currentPage === 'residents' && (
            <ResidentList 
              residents={residents} 
              session={session} 
              onAdd={handleAddResident}
              onDelete={handleDeleteResident}
              onUpdate={handleUpdateResident}
            />
          )}
          {currentPage === 'users' && session.role === 'ADMIN_RW' && (
            <UserManagement 
              users={users} 
              onVerify={handleVerifyUser} 
            />
          )}
          {currentPage === 'ai-assistant' && <AiAssistant residents={filteredResidents} />}
        </>
      )}
    </Layout>
  );
};

export default App;
