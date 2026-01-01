
export type Role = 'ADMIN_RW' | 'ADMIN_RT';
export type AccountStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
}

export enum ResidentStatus {
  PERMANENT = 'Tetap',
  TEMPORARY = 'Pendatang/Kontrak'
}

export interface Resident {
  id: string;
  nik: string;
  no_kk: string;
  name: string;
  rt_number: string;
  address: string;
  gender: Gender;
  birth_place: string;
  birth_date: string;
  occupation: string;
  family_relationship: string;
  status: ResidentStatus;
  created_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  name: string;
  role: Role;
  rtNumber?: string;
  status: AccountStatus;
  avatar?: string;
}

export interface UserSession extends UserAccount {}

export interface DashboardStats {
  totalResidents: number;
  totalRTs: number;
  genderDistribution: { male: number; female: number };
  statusDistribution: { permanent: number; temporary: number };
}
