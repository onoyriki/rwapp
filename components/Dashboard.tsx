
import React from 'react';
import { Resident, Gender, ResidentStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

interface DashboardProps {
  residents: Resident[];
}

const Dashboard: React.FC<DashboardProps> = ({ residents }) => {
  const stats = React.useMemo(() => {
    const rts = new Set(residents.map(r => r.rt_number));
    const male = residents.filter(r => r.gender === Gender.MALE).length;
    const female = residents.filter(r => r.gender === Gender.FEMALE).length;
    const permanent = residents.filter(r => r.status === ResidentStatus.PERMANENT).length;
    const temporary = residents.filter(r => r.status === ResidentStatus.TEMPORARY).length;

    const now = new Date();
    const ageGroups = {
      '0-12 (Anak)': 0,
      '13-18 (Remaja)': 0,
      '19-59 (Dewasa)': 0,
      '60+ (Lansia)': 0
    };

    residents.forEach(r => {
      const birth = new Date(r.birth_date);
      let age = now.getFullYear() - birth.getFullYear();
      const m = now.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;

      if (age <= 12) ageGroups['0-12 (Anak)']++;
      else if (age <= 18) ageGroups['13-18 (Remaja)']++;
      else if (age <= 59) ageGroups['19-59 (Dewasa)']++;
      else ageGroups['60+ (Lansia)']++;
    });

    const occupationCounts: Record<string, number> = {};
    residents.forEach(r => {
      const occ = r.occupation || 'Tidak Bekerja';
      occupationCounts[occ] = (occupationCounts[occ] || 0) + 1;
    });

    return {
      totalResidents: residents.length,
      totalRTs: rts.size,
      genderDistribution: { male, female },
      statusDistribution: { permanent, temporary },
      ageDistribution: Object.entries(ageGroups).map(([name, value]) => ({ name, value })),
      occupationDistribution: Object.entries(occupationCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      recentResidents: [...residents].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5)
    };
  }, [residents]);

  const rtSummary = React.useMemo(() => {
    const counts: Record<string, { total: number; male: number; female: number; permanent: number }> = {};
    residents.forEach(r => {
      if (!counts[r.rt_number]) {
        counts[r.rt_number] = { total: 0, male: 0, female: 0, permanent: 0 };
      }
      counts[r.rt_number].total++;
      if (r.gender === Gender.MALE) counts[r.rt_number].male++;
      else counts[r.rt_number].female++;
      if (r.status === ResidentStatus.PERMANENT) counts[r.rt_number].permanent++;
    });
    return Object.entries(counts)
      .map(([rt, data]) => ({ rt, ...data }))
      .sort((a, b) => a.rt.localeCompare(b.rt));
  }, [residents]);

  const genderData = [
    { name: 'Laki-laki', value: stats.genderDistribution.male, color: '#4f46e5' },
    { name: 'Perempuan', value: stats.genderDistribution.female, color: '#ec4899' }
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white shadow-lg shadow-indigo-100">
        <h2 className="text-2xl font-bold mb-2">Selamat Datang, Bapak RW</h2>
        <p className="text-indigo-100 max-w-2xl">Dashboard ini merangkum seluruh data warga dari semua RT di wilayah Anda. Pantau pertumbuhan penduduk dan sebaran demografi secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Penduduk" 
          value={stats.totalResidents.toString()} 
          icon={<svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          color="bg-indigo-50"
        />
        <StatCard 
          title="Total RT Aktif" 
          value={stats.totalRTs.toString()} 
          icon={<svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>}
          color="bg-emerald-50"
        />
        <StatCard 
          title="Warga Tetap" 
          value={stats.statusDistribution.permanent.toString()} 
          icon={<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
          color="bg-blue-50"
        />
        <StatCard 
          title="Pendatang / Kontrak" 
          value={stats.statusDistribution.temporary.toString()} 
          icon={<svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-800 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            Rekapitulasi Wilayah (Per RT)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 font-semibold">Wilayah</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Laki-laki</th>
                  <th className="px-4 py-3 font-semibold">Perempuan</th>
                  <th className="px-4 py-3 font-semibold">Tetap</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rtSummary.map((item) => (
                  <tr key={item.rt} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-indigo-600">RT {item.rt}</td>
                    <td className="px-4 py-3 font-medium">{item.total} Jiwa</td>
                    <td className="px-4 py-3 text-slate-600">{item.male}</td>
                    <td className="px-4 py-3 text-slate-600">{item.female}</td>
                    <td className="px-4 py-3 text-emerald-600 font-medium">{item.permanent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold mb-6 text-slate-700">Warga Baru Terdaftar</h3>
          <div className="space-y-4">
            {stats.recentResidents.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${r.gender === Gender.MALE ? 'bg-indigo-400' : 'bg-pink-400'}`}>
                  {r.name.charAt(0)}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-slate-800 truncate">{r.name}</p>
                  <p className="text-[10px] text-slate-500 font-medium">RT {r.rt_number} • {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</p>
                </div>
              </div>
            ))}
            {stats.recentResidents.length === 0 && (
              <p className="text-center text-xs text-slate-400 py-8 italic">Belum ada data warga terdaftar.</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold mb-6 text-slate-800">Distribusi Kelompok Usia</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.ageDistribution}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                   cursor={{fill: '#f8fafc'}}
                   contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center">
          <h3 className="text-sm font-semibold mb-4 text-slate-700">Demografi Gender Keseluruhan</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode; color: string }> = ({ title, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <p className="text-3xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

export default Dashboard;
