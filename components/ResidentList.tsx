
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
  const [modalState, setModalState] = useState<{ show: boolean; resident?: Resident }>({ show: false });
  const [filterRT, setFilterRT] = useState(session.role === 'ADMIN_RT' ? session.rtNumber : 'all');

  const filteredResidents = residents.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) || r.nik.includes(searchTerm);
    const matchesRT = filterRT === 'all' || r.rt_number === filterRT;
    return matchesSearch && matchesRT;
  });

  const rtOptions = Array.from(new Set(residents.map(r => r.rt_number))).sort();

  const handleEdit = (resident: Resident) => {
    setModalState({ show: true, resident });
  };

  const handleAdd = () => {
    setModalState({ show: true });
  };

  const handleModalSubmit = (data: Omit<Resident, 'id' | 'created_at'>) => {
    if (modalState.resident) {
      onUpdate(modalState.resident.id, data);
    } else {
      onAdd(data);
    }
    setModalState({ show: false });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="relative w-full md:w-96">
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau NIK..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          {session.role === 'ADMIN_RW' && (
            <select 
              className="px-4 py-2 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={filterRT}
              onChange={(e) => setFilterRT(e.target.value)}
            >
              <option value="all">Semua RT</option>
              {rtOptions.map(rt => <option key={rt} value={rt}>RT {rt}</option>)}
            </select>
          )}
          <button
            onClick={handleAdd}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            Tambah Warga
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Penduduk</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">RT</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Pekerjaan</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResidents.map((resident) => (
                <tr key={resident.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${resident.gender === Gender.MALE ? 'bg-blue-400' : 'bg-pink-400'}`}>
                        {resident.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{resident.name}</p>
                        <p className="text-xs text-slate-500">{resident.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{resident.nik}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                      RT {resident.rt_number}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">{resident.occupation}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      resident.status === ResidentStatus.PERMANENT ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {resident.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex gap-3">
                      <button onClick={() => handleEdit(resident)} className="text-blue-600 hover:text-blue-900">Edit</button>
                      <button onClick={() => onDelete(resident.id)} className="text-red-600 hover:text-red-900">Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredResidents.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <svg className="w-12 h-12 text-slate-200 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p>Tidak ada data penduduk ditemukan</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modalState.show && (
        <ResidentModal 
          resident={modalState.resident}
          onClose={() => setModalState({ show: false })} 
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
  onClose: () => void;
  onSubmit: (data: Omit<Resident, 'id' | 'created_at'>) => void;
  initialRT?: string;
  isRTLocked?: boolean;
}

const ResidentModal: React.FC<ModalProps> = ({ resident, onClose, onSubmit, initialRT, isRTLocked }) => {
  const [formData, setFormData] = useState({
    nik: resident?.nik || '',
    name: resident?.name || '',
    rt_number: resident?.rt_number || initialRT || '01',
    address: resident?.address || '',
    gender: resident?.gender || Gender.MALE,
    birth_date: resident?.birth_date || '',
    occupation: resident?.occupation || '',
    status: resident?.status || ResidentStatus.PERMANENT
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800">{resident ? 'Edit Data Warga' : 'Tambah Data Warga'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">NIK</label>
            <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="16 Digit NIK" maxLength={16} value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Nama Lengkap</label>
            <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Nama sesuai KTP" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">RT</label>
            <select disabled={isRTLocked} className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50 disabled:opacity-70" value={formData.rt_number} onChange={e => setFormData({...formData, rt_number: e.target.value})}>
              <option value="01">RT 01</option>
              <option value="02">RT 02</option>
              <option value="03">RT 03</option>
              <option value="04">RT 04</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Jenis Kelamin</label>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value={Gender.MALE} checked={formData.gender === Gender.MALE} onChange={() => setFormData({...formData, gender: Gender.MALE})} />
                <span className="text-sm">Laki-laki</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="gender" value={Gender.FEMALE} checked={formData.gender === Gender.FEMALE} onChange={() => setFormData({...formData, gender: Gender.FEMALE})} />
                <span className="text-sm">Perempuan</span>
              </label>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Tanggal Lahir</label>
            <input required type="date" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.birth_date} onChange={e => setFormData({...formData, birth_date: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Pekerjaan</label>
            <input required type="text" className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Contoh: PNS, Swasta" value={formData.occupation} onChange={e => setFormData({...formData, occupation: e.target.value})} />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
            <textarea required className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none h-20" placeholder="Alamat rumah..." value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})}></textarea>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700">Status Penduduk</label>
            <select className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ResidentStatus})}>
              <option value={ResidentStatus.PERMANENT}>Penduduk Tetap</option>
              <option value={ResidentStatus.TEMPORARY}>Penduduk Kontrak/Sementar</option>
            </select>
          </div>
          
          <div className="md:col-span-2 pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-slate-200 font-medium hover:bg-slate-50 transition-colors">Batal</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition-colors">
              {resident ? 'Simpan Perubahan' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResidentList;
