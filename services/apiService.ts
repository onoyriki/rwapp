
import { Resident, UserAccount, Role } from '../types';

let BASE_URL = "";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const apiService = {
  setBaseUrl: (url: string) => {
    BASE_URL = url;
  },

  // --- RESIDENTS API ---
  getResidents: async (): Promise<Resident[]> => {
    try {
      const response = await fetch(`${BASE_URL}/residents`);
      return handleResponse(response);
    } catch (err) {
      console.error("Fetch Residents Error:", err);
      return [];
    }
  },

  addResident: async (resident: Omit<Resident, 'id' | 'created_at'>): Promise<Resident> => {
    const response = await fetch(`${BASE_URL}/residents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(resident)
    });
    return handleResponse(response);
  },

  updateResident: async (id: string, updates: Partial<Resident>): Promise<Resident> => {
    const response = await fetch(`${BASE_URL}/residents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return handleResponse(response);
  },

  deleteResident: async (id: string): Promise<void> => {
    const response = await fetch(`${BASE_URL}/residents/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error("Gagal menghapus data");
  },

  // --- USERS / AUTH API ---
  getUsers: async (): Promise<UserAccount[]> => {
    try {
      const response = await fetch(`${BASE_URL}/users`);
      return handleResponse(response);
    } catch (err) {
      console.error("Fetch Users Error:", err);
      return [];
    }
  },

  loginWithGoogle: async (email: string, name: string, picture?: string): Promise<UserAccount> => {
    const response = await fetch(`${BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, picture })
    });
    return handleResponse(response);
  },

  updateUserStatus: async (userId: string, status: string, role: Role, rtNumber: string): Promise<UserAccount[]> => {
    const response = await fetch(`${BASE_URL}/users/${userId}/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, role, rtNumber })
    });
    await handleResponse(response);
    return apiService.getUsers();
  }
};
