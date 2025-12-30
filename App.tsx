
import React, { useState, useEffect, useRef } from 'react';
import { UserSession, Resident, Role, UserAccount } from './types';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ResidentList from './components/ResidentList';
import AiAssistant from './components/AiAssistant';
import UserManagement from './components/UserManagement';
import { supabaseMock } from './services/supabaseMock';
import { authService } from './services/authService';

// Fix for TypeScript errors regarding the 'google' object on window
declare global {
  interface Window {
    google: any;
  }
}

// Fungsi bantuan untuk decode JWT dari Google
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
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const googleBtnRef = useRef<HTMLDivElement>(null);

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

  // Inisialisasi Tombol Google Sign-In Asli
  useEffect(() => {
    if (!session && !isLoading) {
      const initializeGoogle = () => {
        // Correctly handle the window.google object via global declaration
        if (window.google) {
          window.google.accounts.id.initialize({
            // GANTI CLIENT_ID INI dengan milik Anda dari Google Cloud Console
            client_id: "755919655611-example.apps.googleusercontent.com", 
            callback: handleGoogleResponse,
            auto_select: false,
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "outline",
              size: "large",
              width: "100%",
              text: "continue_with",
              shape: "pill"
            });
          }
        } else {
          setTimeout(initializeGoogle, 500);
        }
      };
      initializeGoogle();
    }
  }, [session, isLoading]);

  const handleGoogleResponse = async (response: any) => {
    setIsLoggingIn(true);
    const userData = parseJwt(response.credential);
    
    if (userData) {
      const { email, name, picture } = userData;
      const user = await authService.loginWithGoogle(email, name, picture);
      setSession(user);
      setUsers(authService.getUsers());
    }
    setIsLoggingIn(false);
  };

  const handleVerifyUser = (userId: string, status: 'APPROVED' | 'REJECTED', role: Role, rt: string) => {
    const updatedUsers = authService.updateUserStatus(userId, status, role, rt);
    setUsers(updatedUsers);
    if (session?.id === userId) {
      setSession(prev => prev ? { ...prev, status, role, rtNumber: rt } : null);
    }
  };

  const handleLogout = () => {
    setSession(null);
    setCurrentPage('dashboard');
    // Bersihkan sesi Google juga
    if (window.google) window.google.accounts.id.disableAutoSelect();
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

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 relative">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden p-8 border border-slate-200">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-800">SIM-RW Digital</h1>
            <p className="text-slate-500 font-medium">Implementasi GCP Production</p>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col items-center">
              <div ref={googleBtnRef} className="w-full"></div>
              {isLoggingIn && (
                <p className="mt-4 text-xs text-indigo-600 animate-pulse">Memverifikasi identitas...</p>
              )}
            </div>
            
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest text-slate-400"><span className="bg-white px-2">Atau Akses Cepat</span></div>
            </div>

            <button
              onClick={() => {
                const admin = users.find(u => u.email === 'admin@rw.com');
                if (admin) setSession(admin);
              }}
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 text-slate-700 font-semibold hover:bg-slate-100 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Masuk sebagai Admin RW Utama
            </button>
          </div>
          
          <div className="mt-10 pt-6 border-t border-slate-50">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                <p className="text-[10px] text-blue-700 leading-relaxed font-medium">
                  <strong>Catatan VM:</strong> Pastikan domain atau IP VM Anda sudah terdaftar di <em>Authorized JavaScript Origins</em> pada Google Cloud Console agar login berfungsi.
                </p>
             </div>
          </div>
        </div>
      </div>
    );
  }

  if (session.status === 'PENDING') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-10 border border-slate-200 text-center">
          <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full mx-auto flex items-center justify-center mb-6">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Menunggu Verifikasi RW</h1>
          <p className="text-slate-600 mb-8">
            Halo <strong>{session.name}</strong>, akun Anda ({session.email}) sedang menunggu persetujuan Admin RW sebelum dapat mengakses data penduduk.
          </p>
          <button onClick={handleLogout} className="text-slate-500 hover:text-slate-800 font-medium transition-colors border-b border-slate-300">Keluar & Gunakan Akun Lain</button>
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
