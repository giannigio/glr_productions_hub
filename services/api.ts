import { Job, CrewMember, Location, InventoryItem, AppSettings, Notification } from '../types';

const API_URL = '/api';

export const api = {
  // --- AUTH ---
  login: async (email: string, password: string): Promise<any> => {
      const res = await fetch(`${API_URL}/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
      });
      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Login failed');
      }
      return res.json();
  },

  // --- JOBS ---
  getJobs: async (): Promise<Job[]> => {
    const res = await fetch(`${API_URL}/jobs`);
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },
  createJob: async (job: Job): Promise<Job> => {
    const { id, ...data } = job; 
    const res = await fetch(`${API_URL}/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    return res.json();
  },
  updateJob: async (job: Job): Promise<Job> => {
    const res = await fetch(`${API_URL}/jobs/${job.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(job)
    });
    return res.json();
  },
  deleteJob: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/jobs/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- CREW ---
  getCrew: async (): Promise<CrewMember[]> => {
    const res = await fetch(`${API_URL}/crew`);
    return res.json();
  },
  updateCrewMember: async (member: CrewMember): Promise<CrewMember> => {
    const isTempId = member.id.length < 20; 
    
    if (isTempId) {
       const res = await fetch(`${API_URL}/crew`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(member)
       });
       return res.json();
    } else {
       const res = await fetch(`${API_URL}/crew/${member.id}`, {
         method: 'PUT',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(member)
       });
       return res.json();
    }
  },

  // --- LOCATIONS ---
  getLocations: async (): Promise<Location[]> => {
    const res = await fetch(`${API_URL}/locations`);
    return res.json();
  },
  createLocation: async (loc: Location): Promise<Location> => {
    const res = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc)
    });
    return res.json();
  },
  updateLocation: async (loc: Location): Promise<Location> => {
    const res = await fetch(`${API_URL}/locations/${loc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(loc)
    });
    return res.json();
  },
  deleteLocation: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/locations/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- INVENTORY ---
  getInventory: async (): Promise<InventoryItem[]> => {
    const res = await fetch(`${API_URL}/inventory`);
    return res.json();
  },
  createInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    const res = await fetch(`${API_URL}/inventory`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },
  updateInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    const res = await fetch(`${API_URL}/inventory/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    return res.json();
  },
  deleteInventoryItem: async (id: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/inventory/${id}`, { method: 'DELETE' });
    return res.ok;
  },

  // --- SETTINGS ---
  getSettings: async (): Promise<AppSettings> => {
    const res = await fetch(`${API_URL}/settings`);
    return res.json();
  },
  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
    const res = await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    return res.json();
  },

  // --- NOTIFICATIONS ---
  getNotifications: async (): Promise<Notification[]> => {
    const res = await fetch(`${API_URL}/notifications`);
    return res.json();
  }
};

export const checkAvailability = (inventoryId: string, startDate: string, endDate: string, currentJobId?: string): any => {
    return { available: 999, conflicts: [] }; 
};

export const calculateMissedRestDays = (crewId: string, year: number, month: number): any => {
    return { totalWorked: 0, missedRest: 0 }; 
};