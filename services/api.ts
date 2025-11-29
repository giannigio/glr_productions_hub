import { Job, CrewMember, Location, InventoryItem, AppSettings, Notification, StandardMaterialList, Rental, CompanyExpense, RecurringPayment, PersonnelCost } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });

    if (!res.ok) {
        const message = await res.text();
        throw new Error(message || 'Errore di rete');
    }

    return res.json();
}

export const api = {
  login: async (email: string, pass: string) => request<{ success: boolean; user?: CrewMember; token?: string }>(`/login`, { method: 'POST', body: JSON.stringify({ email, password: pass }) }),

  getJobs: async () => request<Job[]>(`/jobs`),
  createJob: async (job: Job) => request<Job>(`/jobs`, { method: 'POST', body: JSON.stringify(job) }),
  updateJob: async (job: Job) => request<Job>(`/jobs/${job.id}`, { method: 'PUT', body: JSON.stringify(job) }),
  deleteJob: async (id: string) => request<boolean>(`/jobs/${id}`, { method: 'DELETE' }),

  getCrew: async () => request<CrewMember[]>(`/crew`),
  updateCrewMember: async (member: CrewMember) => request<CrewMember>(`/crew/${member.id}`, { method: 'PUT', body: JSON.stringify(member) }),

  getLocations: async () => request<Location[]>(`/locations`),
  createLocation: async (loc: Location) => request<Location>(`/locations`, { method: 'POST', body: JSON.stringify(loc) }),
  updateLocation: async (loc: Location) => request<Location>(`/locations/${loc.id}`, { method: 'PUT', body: JSON.stringify(loc) }),
  deleteLocation: async (id: string) => request<boolean>(`/locations/${id}`, { method: 'DELETE' }),

  getInventory: async () => request<InventoryItem[]>(`/inventory`),
  createInventoryItem: async (item: InventoryItem) => request<InventoryItem>(`/inventory`, { method: 'POST', body: JSON.stringify(item) }),
  updateInventoryItem: async (item: InventoryItem) => request<InventoryItem>(`/inventory/${item.id}`, { method: 'PUT', body: JSON.stringify(item) }),
  deleteInventoryItem: async (id: string) => request<boolean>(`/inventory/${id}`, { method: 'DELETE' }),

  getStandardLists: async () => request<StandardMaterialList[]>(`/standard-lists`),
  createStandardList: async (list: StandardMaterialList) => request<StandardMaterialList>(`/standard-lists`, { method: 'POST', body: JSON.stringify(list) }),
  updateStandardList: async (list: StandardMaterialList) => request<StandardMaterialList>(`/standard-lists/${list.id}`, { method: 'PUT', body: JSON.stringify(list) }),
  deleteStandardList: async (id: string) => request<boolean>(`/standard-lists/${id}`, { method: 'DELETE' }),

  getRentals: async () => request<Rental[]>(`/rentals`),
  createRental: async (rental: Rental) => request<Rental>(`/rentals`, { method: 'POST', body: JSON.stringify(rental) }),
  updateRental: async (rental: Rental) => request<Rental>(`/rentals/${rental.id}`, { method: 'PUT', body: JSON.stringify(rental) }),
  deleteRental: async (id: string) => request<boolean>(`/rentals/${id}`, { method: 'DELETE' }),

  getSettings: async () => request<AppSettings>(`/settings`),
  updateSettings: async (s: AppSettings) => request<AppSettings>(`/settings`, { method: 'PUT', body: JSON.stringify(s) }),

  getNotifications: async (): Promise<Notification[]> => request<Notification[]>(`/notifications`),

  getCompanyExpenses: async () => request<CompanyExpense[]>(`/company-expenses`),
  createCompanyExpense: async (exp: CompanyExpense) => request<CompanyExpense>(`/company-expenses`, { method: 'POST', body: JSON.stringify(exp) }),
  updateCompanyExpense: async (exp: CompanyExpense) => request<CompanyExpense>(`/company-expenses/${exp.id}`, { method: 'PUT', body: JSON.stringify(exp) }),
  deleteCompanyExpense: async (id: string) => request<boolean>(`/company-expenses/${id}`, { method: 'DELETE' }),

  getRecurringPayments: async () => request<RecurringPayment[]>(`/recurring-payments`),
  createRecurringPayment: async (pay: RecurringPayment) => request<RecurringPayment>(`/recurring-payments`, { method: 'POST', body: JSON.stringify(pay) }),
  updateRecurringPayment: async (pay: RecurringPayment) => request<RecurringPayment>(`/recurring-payments/${pay.id}`, { method: 'PUT', body: JSON.stringify(pay) }),
  deleteRecurringPayment: async (id: string) => request<boolean>(`/recurring-payments/${id}`, { method: 'DELETE' }),

  getPersonnelCosts: async () => request<PersonnelCost[]>(`/personnel-costs`),
  createPersonnelCost: async (cost: PersonnelCost) => request<PersonnelCost>(`/personnel-costs`, { method: 'POST', body: JSON.stringify(cost) }),
  updatePersonnelCost: async (cost: PersonnelCost) => request<PersonnelCost>(`/personnel-costs/${cost.id}`, { method: 'PUT', body: JSON.stringify(cost) }),
  deletePersonnelCost: async (id: string) => request<boolean>(`/personnel-costs/${id}`, { method: 'DELETE' }),
};
