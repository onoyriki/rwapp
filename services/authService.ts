
import { UserAccount, Role } from '../types';

const USERS_KEY = 'sim_rw_users_db';

// User awal (Admin RW bawaan)
const INITIAL_USERS: UserAccount[] = [
  {
    id: 'admin-rw-id',
    email: 'admin@rw.com',
    name: 'Bapak RW Utama',
    role: 'ADMIN_RW',
    status: 'APPROVED',
    avatar: 'https://ui-avatars.com/api/?name=RW&background=4f46e5&color=fff'
  }
];

export const authService = {
  getUsers: (): UserAccount[] => {
    const data = localStorage.getItem(USERS_KEY);
    if (!data) {
      localStorage.setItem(USERS_KEY, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },

  // Simulasi Login Google
  loginWithGoogle: async (email: string, name: string): Promise<UserAccount> => {
    const users = authService.getUsers();
    let user = users.find(u => u.email === email);

    if (!user) {
      // Pendaftaran otomatis jika email belum ada
      user = {
        id: Math.random().toString(36).substr(2, 9),
        email,
        name,
        role: 'ADMIN_RT', // Default pendaftar baru adalah RT (atau bisa disesuaikan)
        rtNumber: '01',   // Default RT
        status: 'PENDING',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
      };
      users.push(user);
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }

    return user;
  },

  updateUserStatus: (userId: string, status: 'APPROVED' | 'REJECTED', role?: Role, rtNumber?: string) => {
    const users = authService.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index !== -1) {
      users[index].status = status;
      if (role) users[index].role = role;
      if (rtNumber) users[index].rtNumber = rtNumber;
      localStorage.setItem(USERS_KEY, JSON.stringify(users));
    }
    return users;
  }
};
