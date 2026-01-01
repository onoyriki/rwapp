
import React, { useState, useEffect, useRef } from 'react';
import { UserSession, Resident, Role, UserAccount } from './types.ts';
import Layout from './components/Layout.tsx';
import Dashboard from './components/Dashboard.tsx';
import ResidentList from './components/ResidentList.tsx';
import AiAssistant from './components/AiAssistant.tsx';
import UserManagement from './components/UserManagement.tsx';
import { apiService } from './services/apiService.ts';

const GOOGLE_CLIENT_ID = "770161612412-bb7dvaebdm97ml16fgmf2r9v4nmin6u0.apps.googleusercontent.com";

const getApiUrl = () => {
  const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  if (isLocal) {
    return "http://34.182.35.155.nip.io/api"; 
  }
  return `${window.location.origin}/api`;
};

const API_BASE_URL = getApiUrl();

declare global {
  interface Window {
    google: any;
  }
}

const parseJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(null);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiService.setBaseUrl(API_BASE_URL);
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    setApiError(null);
    try {
      const [resData, userData] = await Promise.all([
        apiService.getResidents(),
        apiService.getUsers()
      ]);
      setResidents(resData);
      setUsers(userData);
    } catch (err: any) {
      console.error("Koneksi API Gagal:", err);
      setApiError(err.message || "Gagal terhubung ke Backend.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session && !isLoading) {
      const initializeGoogle = () => {
        if (window.google?.accounts?.id) {
          try {
            window.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID, 
              callback: handleGoogleResponse,
              auto_select: false
            });

            if (googleBtnRef.current) {
              window.google.accounts.id.renderButton(googleBtnRef.current, {
                theme: "outline",
                size: "large",
                width: 320,
                shape: "pill"
              });
            }
          } catch (err) {
            console.error("Google Auth Init Error");
          }
        } else {
          setTimeout(initializeGoogle, 1000);
        }
      };
      initializeGoogle();
    }
  }, [session, isLoading]);

  const handleGoogleResponse = async (response: any) => {
    try {
      const userData = parseJwt(response.credential);
      if (userData) {
        const { email, name, picture } = userData;
        const user = await apiService.loginWithGoogle(email, name, picture);
        setSession(user);
        const updatedUsers = await apiService.getUsers();
        setUsers(updatedUsers);
      }
    } catch (err) {
      alert("Login Gagal. Cek koneksi Backend di VM.");
    }
  };

  const handleVerifyUser = async (userId: string, status: 'APPROVED' | 'REJECTED', role: Role, rt: string) => {
    try {
      const updatedUsers = await apiService.updateUserStatus(userId, status, role, rt);
      setUsers(updatedUsers);
    } catch (err) {
      alert("Gagal memproses verifikasi.");
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentPage('dashboard');
  };

  const handleAddResident = async (data: Omit<Resident, 'id' | 'created_at'>) => {
    try {
      const newResident = await apiService.addResident(data);
      setResidents(prev => [...prev, newResident]);
    } catch (err) {
      alert("Gagal menyimpan data ke DB VM.");
    }
  };

  const handleUpdateResident = async (id: string, updates: Partial<Resident>) => {
    try {
      const updatedResident = await apiService.updateResident(id, updates);
      setResidents(prev => prev.map(r => r.id === id ? updatedResident : r));
    } catch (err) {
      alert("Gagal memperbarui data.");
    }
  };

  const handleDeleteResident = async (id: string) => {
    if (confirm('Hapus data warga ini secara permanen?')) {
      try {
        await apiService.deleteResident(id);
        setResidents(prev => prev.filter(r => r.id !== id));
      } catch (err) {
        alert("Gagal menghapus data.");
      }
    }
  };

  const filteredResidents = React.useMemo(() => {
    if (!session) return [];
    if (session.role === 'ADMIN_RT') {
      return residents.filter(r => r.rt_number === session.rtNumber);
    }
    return residents;
  }, [residents, session]);

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 text-slate-800">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-2xl font-bold">SIM-RW Digital</h1>
            <p className="text-slate-500 text-sm mt-1">Platform Manajemen Kependudukan</p>
          </div>

          <div className="space-y-6">
            <div ref={googleBtnRef} className="flex justify-center min-h-[50px]"></div>
            
            <div className={`p-4 rounded-2xl border ${apiError ? 'bg-red-50 border-red-100' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full ${residents.length > 0 ? 'bg-emerald-500' : (apiError ? 'bg-red-500 animate-pulse' : 'bg-amber-500')}`}></div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Koneksi Backend VM</p>
              </div>
              <code className="text-[10px] text-indigo-600 break-all bg-white px-2 py-1 rounded border block mb-1">
                {API_BASE_URL}
              </code>
              <p className="text-[9px] text-slate-500">
                {residents.length > 0 
                  ? "✅ Server Online & Database Terhubung" 
                  : (apiError ? `❌ Error: ${apiError}` : "⌛ Mencoba menghubungkan ke server...")}
              </p>
            </div>

            <button
              onClick={() => {
                const admin = users.find(u => u.email === 'admin@rw.com');
                if (admin) setSession(admin);
                else alert("Data demo belum siap atau server backend mati.");
              }}
              className="w-full py-3 text-sm bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold hover:bg-indigo-100 rounded-xl transition-all"
            >
              Gunakan Akses Demo (Bypass)
            </button>
            
            <p className="text-[10px] text-center text-slate-400">
              Tips: Jika Error 403, pastikan Nginx memiliki izin akses folder project.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-10 border border-slate-200">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Terkirim</h1>
          <p className="text-slate-600 mb-8 font-medium">Halo {session.name}, akun Anda sudah masuk antrean sistem VM. Silakan informasikan ke Admin RW untuk verifikasi RT.</p>
          <button onClick={handleLogout} className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Keluar</button>
        </div>
      </div>
    );
  }

  return (
    <Layout session={session} onLogout={handleLogout} currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-400 font-medium">Memuat data dari server VM...</p>
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
            <UserManagement users={users} onVerify={handleVerifyUser} />
          )}
          {currentPage === 'ai-assistant' && <AiAssistant residents={filteredResidents} />}
        </>
      )}
    </Layout>
  );
};

export default App;
