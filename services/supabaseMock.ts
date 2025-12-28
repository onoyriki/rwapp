
import { Resident, ResidentStatus, Gender } from '../types';

const STORAGE_KEY = 'sim_rw_residents_db';

const INITIAL_DATA: Resident[] = [
  {
    id: '1',
    nik: '3271000000000001',
    name: 'Budi Santoso',
    rt_number: '01',
    address: 'Jl. Merdeka No. 10',
    gender: Gender.MALE,
    birth_date: '1985-05-12',
    occupation: 'Wiraswasta',
    status: ResidentStatus.PERMANENT,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    nik: '3271000000000002',
    name: 'Siti Aminah',
    rt_number: '02',
    address: 'Jl. Merdeka No. 15',
    gender: Gender.FEMALE,
    birth_date: '1990-08-22',
    occupation: 'Guru',
    status: ResidentStatus.PERMANENT,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    nik: '3271000000000003',
    name: 'Andi Wijaya',
    rt_number: '01',
    address: 'Jl. Merdeka No. 12',
    gender: Gender.MALE,
    birth_date: '1995-01-05',
    occupation: 'Mahasiswa',
    status: ResidentStatus.TEMPORARY,
    created_at: new Date().toISOString()
  }
];

export const supabaseMock = {
  getResidents: async (rtNumber?: string): Promise<Resident[]> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const residents: Resident[] = data ? JSON.parse(data) : INITIAL_DATA;
    if (!data) localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_DATA));
    
    if (rtNumber) {
      return residents.filter(r => r.rt_number === rtNumber);
    }
    return residents;
  },

  addResident: async (resident: Omit<Resident, 'id' | 'created_at'>): Promise<Resident> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const residents: Resident[] = data ? JSON.parse(data) : INITIAL_DATA;
    
    const newResident: Resident = {
      ...resident,
      id: Math.random().toString(36).substr(2, 9),
      created_at: new Date().toISOString()
    };
    
    residents.push(newResident);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
    return newResident;
  },

  deleteResident: async (id: string): Promise<void> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const residents: Resident[] = data ? JSON.parse(data) : INITIAL_DATA;
    const filtered = residents.filter(r => r.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  },

  updateResident: async (id: string, updates: Partial<Resident>): Promise<Resident> => {
    const data = localStorage.getItem(STORAGE_KEY);
    const residents: Resident[] = data ? JSON.parse(data) : INITIAL_DATA;
    const index = residents.findIndex(r => r.id === id);
    if (index === -1) throw new Error('Resident not found');
    
    residents[index] = { ...residents[index], ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(residents));
    return residents[index];
  }
};
