
import React, { useState } from 'react';
import { Resident, ResidentStatus, Gender, UserSession } from '../types';

interface ResidentListProps {
  residents: Resident[];
  session: UserSession;
  onAdd: (resident: Omit<Resident, 'id' | 'created_at'>) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Resident>) => void;
}

const ResidentList: React.FC<ResidentListProps> = ({ residents, session, onAdd, onDelete, onUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [modalState, setModalState] = useState<{ show: boolean; resident?: Resident; mode: 'edit' | 'add' | 'view' }>({ 
    show: false, 
    mode: 'add' 
  });
  const [filterRT, setFilterRT] = useState(session.role === 'ADMIN_RT' ? session.rtNumber : 'all');

  const filteredResidents = residents.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.nik.includes(searchTerm) || (r.no_kk && r.no_kk.includes(searchTerm));
    const matchesRT = filterRT === 'all' || r.rt_number === filterRT;
    return matchesSearch && matchesRT;
  });

  const rtOptions = Array.from(new Set(residents.map(r => r.rt_number))).sort();

  const handleEdit = (resident: Resident) => {
    setModalState({ show: true, resident, mode: 'edit' });
  };

  const handleView = (resident: Resident) => {
    setModalState({ show: true, resident, mode: 'view' });
  };

  const handleAdd = () => {
    setModalState({ show: true, mode: 'add' });
  };

  const handleModalSubmit = (data: Omit<Resident, 'id' | 'created_at'>) => {
    if (modalState.resident && modalState.mode === 'edit') {
      onUpdate(modalState.resident.id, data);
    } else if (modalState.mode === 'add') {
      onAdd(data);
    }
    setModalState({ show: false, mode: 'add' });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Buku Induk Warga Digital</h3>
          <p className="text-sm text-slate-500">
            {session.role === 'ADMIN_RW' ? 'Seluruh data warga di wilayah RW' : `Data warga RT ${session.rtNumber}`}
          </p>
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <input
              type="text"
              placeholder="Cari Nama/NIK/KK..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          </div>

          {session.role === 'ADMIN_RW' && (
            <select 
              className="w-full md:w-auto px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
              value={filterRT}
              onChange={(e) => setFilterRT(e.target.value)}
            >
              <option value="all">Semua RT</option>
              {rtOptions.map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
            </select>
          )}

          <button
            onClick={handleAdd}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Tambah Warga
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Biodata Warga</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">NIK / No. KK</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Wilayah</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Hubungan Kel.</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${resident.gender === Gender.MALE ? 'bg-indigo-500' : 'bg-pink-500'}`}>
                        {resident.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{resident.name}</p>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">{resident.gender} • {resident.birth_place}, {new Date(resident.birth_date).toLocaleDateString('id-ID')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-mono text-[11px] text-slate-600">NIK: {resident.nik}</p>
                    <p className="font-mono text-[10px] text-slate-400">KK: {resident.no_kk}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      RT {resident.rt_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 font-medium">{resident.family_relationship}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      resident.status === ResidentStatus.PERMANENT ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {resident.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleView(resident)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => handleEdit(resident)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => onDelete(resident.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResidents.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-slate-400 italic">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState.show && (
        <ResidentModal 
          resident={modalState.resident}
          mode={modalState.mode}
          onClose={() => setModalState({ show: false, mode: 'add' })} 
          onSubmit={handleModalSubmit}
          initialRT={session.role === 'ADMIN_RT' ? session.rtNumber : undefined}
          isRTLocked={session.role === 'ADMIN_RT'}
        />
      )}
    </div>
  );
};

interface ModalProps {
  resident?: Resident;
  mode: 'add' | 'edit' | 'view';
  onClose: () => void;
  onSubmit: (data: Omit<Resident, 'id' | 'created_at'>) => void;
  initialRT?: string;
  isRTLocked?: boolean;
}

const ResidentModal: React.FC<ModalProps> = ({ resident, mode, onClose, onSubmit, initialRT, isRTLocked }) => {
  const isView = mode === 'view';
  const [formData, setFormData] = useState({
    nik: resident?.nik || '',
    no_kk: resident?.no_kk || '',
    name: resident?.name || '',
    rt_number: resident?.rt_number || initialRT || '01',
    address: resident?.address || '',
    gender: resident?.gender || Gender.MALE,
    birth_place: resident?.birth_place || '',
    birth_date: resident?.birth_date ? new Date(resident.birth_date).toISOString().split('T')[0] : '',
    occupation: resident?.occupation || '',
    family_relationship: resident?.family_relationship || 'Kepala Keluarga',
    status: resident?.status || ResidentStatus.PERMANENT
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isView) return;
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-200">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-800">
              {isView ? 'Profil Lengkap Warga' : resident ? 'Perbarui Data Warga' : 'Pendaftaran Warga Baru'}
            </h3>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Arsip Kependudukan Digital</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">NIK (KTP)</label>
            <input required disabled={isView} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-50 font-mono text-sm" placeholder="16 Digit NIK" maxLength={16} value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nomor Kartu Keluarga (KK)</label>
            <input required disabled={isView} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-50 font-mono text-sm" placeholder="16 Digit No KK" maxLength={16} value={formData.no_kk} onChange={e => setFormData({...formData, no_kk: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Nama Lengkap Sesuai Dokumen</label>
            <input required disabled={isView} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-50 text-sm font-semibold" placeholder="Nama Lengkap" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tempat Lahir</label>
            <input required disabled={isView} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all disabled:bg-slate-50 text-sm" placeholder="Kota/Kabupaten" value={formData.birth_place} onChange={e => setFormData({...formData, birth_place: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Tanggal Lahir</label>
            <input required disabled={isView} type="date" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none disabled:bg-slate-50 text-sm" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status Hubungan dlm Keluarga</label>
            <select disabled={isView} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white disabled:bg-slate-50 text-sm font-medium" value={formData.family_relationship} onChange={e => setFormData({...formData, family_relationship: e.target.value})}>
              <option value="Kepala Keluarga">Kepala Keluarga</option>
              <option value="Istri">Istri</option>
              <option value="Anak">Anak</option>
              <option value="Orang Tua">Orang Tua</option>
              <option value="Cucu">Cucu</option>
              <option value="Menantu">Menantu</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Jenis Kelamin</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input disabled={isView} type="radio" name="gender" value={Gender.MALE} checked={formData.gender === Gender.MALE} onChange={() => setFormData({...formData, gender: Gender.MALE})} />
                <span className="text-sm font-medium text-slate-700">Laki-laki</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input disabled={isView} type="radio" name="gender" value={Gender.FEMALE} checked={formData.gender === Gender.FEMALE} onChange={() => setFormData({...formData, gender: Gender.FEMALE})} />
                <span className="text-sm font-medium text-slate-700">Perempuan</span>
              </label>
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Wilayah RT</label>
            <select disabled={isRTLocked || isView} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white disabled:bg-slate-50 text-sm font-medium" value={formData.rt_number} onChange={e => setFormData({...formData, rt_number: e.target.value})}>
              <option value="01">RT 01</option>
              <option value="02">RT 02</option>
              <option value="03">RT 03</option>
              <option value="04">RT 04</option>
              <option value="05">RT 05</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Pekerjaan</label>
            <input required disabled={isView} type="text" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50 text-sm" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Alamat Lengkap</label>
            <textarea required disabled={isView} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none h-20 disabled:bg-slate-50 text-sm resize-none" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-tight">Status Kependudukan</label>
            <select disabled={isView} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white disabled:bg-slate-50 text-sm font-medium" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ResidentStatus})}>
              <option value={ResidentStatus.PERMANENT}>Penduduk Tetap</option>
              <option value={ResidentStatus.TEMPORARY}>Kontrak/Sementara</option>
            </select>
          </div>
          
          <div className="md:col-span-2 pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 px-6 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-all text-sm">
              {isView ? 'Tutup' : 'Batal'}
            </button>
            {!isView && (
              <button type="submit" className="flex-1 px-6 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all text-sm">
                Simpan Data
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidentList;
