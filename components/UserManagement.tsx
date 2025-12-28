
import React from 'react';
import { UserAccount, Role } from '../types';

interface UserManagementProps {
  users: UserAccount[];
  onVerify: (userId: string, status: 'APPROVED' | 'REJECTED', role: Role, rtNumber: string) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ users, onVerify }) => {
  const pendingUsers = users.filter(u => u.status === 'PENDING');

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">Permintaan Akses Baru</h3>
          <p className="text-sm text-slate-500">Daftar user yang login via Gmail dan menunggu persetujuan Anda.</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pendingUsers.map((user) => (
                <PendingUserRow key={user.id} user={user} onVerify={onVerify} />
              ))}
              {pendingUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                    Tidak ada permintaan akses tertunda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800">User Terverifikasi</h3>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.filter(u => u.status === 'APPROVED').map(user => (
            <div key={user.id} className="flex items-center gap-3 p-4 border border-slate-100 rounded-lg">
              <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
              <div>
                <p className="font-medium text-slate-800 text-sm">{user.name}</p>
                <p className="text-xs text-slate-500">{user.role} {user.rtNumber ? `RT ${user.rtNumber}` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PendingUserRow: React.FC<{ user: UserAccount, onVerify: any }> = ({ user, onVerify }) => {
  const [role, setRole] = React.useState<Role>('ADMIN_RT');
  const [rt, setRt] = React.useState('01');

  return (
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <img src={user.avatar} className="w-8 h-8 rounded-full" alt="" />
          <span className="text-sm font-medium text-slate-900">{user.name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value as Role)}
            className="text-xs border border-slate-200 rounded px-2 py-1 outline-none"
          >
            <option value="ADMIN_RT">Admin RT</option>
            <option value="ADMIN_RW">Admin RW</option>
          </select>
          {role === 'ADMIN_RT' && (
            <select 
              value={rt} 
              onChange={(e) => setRt(e.target.value)}
              className="text-xs border border-slate-200 rounded px-2 py-1 outline-none"
            >
              <option value="01">RT 01</option>
              <option value="02">RT 02</option>
              <option value="03">RT 03</option>
              <option value="04">RT 04</option>
            </select>
          )}
          <button 
            onClick={() => onVerify(user.id, 'APPROVED', role, rt)}
            className="bg-emerald-600 text-white text-xs px-3 py-1 rounded hover:bg-emerald-700"
          >
            Setujui
          </button>
          <button 
            onClick={() => onVerify(user.id, 'REJECTED', role, rt)}
            className="text-red-600 text-xs px-3 py-1 border border-red-200 rounded hover:bg-red-50"
          >
            Tolak
          </button>
        </div>
      </td>
    </tr>
  );
};

export default UserManagement;
