import { Job, CrewMember, Location, InventoryItem, AppSettings, Notification, JobStatus, CrewType, CrewRole, ApprovalStatus, VehicleType, StandardMaterialList, Rental, RentalStatus, CompanyExpense, RecurringPayment, PersonnelCost } from '../types';

// --- MOCK DATA FOR DEMO MODE ---

let MOCK_SETTINGS: AppSettings = {
    companyName: 'GLR Productions Srl',
    pIva: '12345678901',
    address: 'Via Roma 1, Milano',
    bankName: 'Intesa Sanpaolo',
    iban: 'IT0000000000000000000000000',
    logoUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIiBmaWxsPSJub25lIiBzdHJva2U9IiNmNWZlMGIiIHN0cm9rZS13aWR0aD0iNSI+CiAgPGNpcmNsZSBjeD0iNTAiIGN5PSI1MCIgcj0iNDUiIC8+CiAgPHRleHQgeD0iNTAiIHk9IjU4IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjZjVmZTBiIiBzdHJva2U9Im5vbmUiIGZvbnQtc2l6ZT0iNDAiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXdlaWdodD0iYm9sZCI+R0xSPC90ZXh0Pgo8L3N2Zz4=',
    defaultDailyIndemnity: 50,
    kmCost: 0.5,
    defaultVatRate: 22,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarId: '',
    crewRoles: [
        'Project Manager',
        'Fellicista Audio',
        'Operatore Luci',
        'Tecnico Video',
        'Rigger',
        'Facchino',
        'Autista',
        'Responsabile Magazzino'
    ],
    permissions: {
        MANAGER: {
            canViewDashboard: true,
            canViewJobs: true,
            canManageJobs: true,
            canDeleteJobs: false,
            canViewBudget: true,
            canViewCrew: true,
            canManageCrew: true,
            canViewInventory: true,
            canManageInventory: true,
            canViewLocations: true,
            canManageLocations: true,
            canViewExpenses: true,
            canManageExpenses: false,
            canViewRentals: true,
            canManageRentals: true
        },
        TECH: {
            canViewDashboard: true,
            canViewJobs: true,
            canManageJobs: false,
            canDeleteJobs: false,
            canViewBudget: false,
            canViewCrew: true, // Only own profile usually handled by logic, but section visible
            canManageCrew: false,
            canViewInventory: true,
            canManageInventory: false,
            canViewLocations: true,
            canManageLocations: true,
            canViewExpenses: true,
            canManageExpenses: false,
            canViewRentals: true,
            canManageRentals: false
        }
    }
};

let MOCK_INVENTORY: InventoryItem[] = [
    { id: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantityOwned: 10, serialNumber: 'SN001', accessories: 'Cavo XLR, Asta', status: 'Operativo' },
    { id: '2', name: 'Yamaha QL1', category: 'Audio', type: 'Mixer', quantityOwned: 2, serialNumber: 'SN002', accessories: 'Cavo Alimentazione, Case', status: 'Operativo' },
    { id: '3', name: 'Panasonic PTZ', category: 'Video', type: 'Camera', quantityOwned: 4, serialNumber: 'SN003', accessories: 'Cavo SDI, Controller PTZ', status: 'Operativo' },
    { id: '4', name: 'Cavo XLR 10m', category: 'Cavi', type: 'XLR', quantityOwned: 50, status: 'Operativo' },
    { id: '5', name: 'Par LED', category: 'Luci', type: 'Faro', quantityOwned: 20, accessories: 'Cavo DMX, Gancio', status: 'Operativo' },
    { id: '6', name: 'Americana 2m', category: 'Strutture', type: 'Truss', quantityOwned: 12, accessories: 'Spine, Coppiglie', status: 'Operativo' },
    { id: '7', name: 'HDMI 10m', category: 'Cavi', type: 'HDMI', quantityOwned: 15, status: 'Operativo' },
    { id: '8', name: 'Macchina Fumo', category: 'Luci', type: 'Effetti', quantityOwned: 2, accessories: 'Liquido Fumo', status: 'Operativo' },
    { id: '9', name: 'Video Proiettore 10k', category: 'Video', type: 'Proiettore', quantityOwned: 1, accessories: 'Ottica, Cavo HDMI, Staffa', status: 'Operativo' }
];

let MOCK_LOCATIONS: Location[] = [
    {
        id: '1', name: 'Teatro Nazionale', address: 'Piazza Piemonte 12, Milano', hallSizeMQ: 500, mapsLink: '', isZtl: true, contactName: 'Mario Rossi', contactPhone: '3331234567', accessHours: '08:00 - 20:00',
        power: { hasCivil: false, hasIndustrial: true, industrialSockets: ['32A', '63A'], requiresGenerator: false, distanceFromPanel: 20, notes: '' },
        network: { isUnavailable: false, hasWired: true, hasWifi: true, hasWallLan: true, wallLanDistance: 15, addressing: 'DHCP', staticDetails: '', firewallProxyNotes: '' },
        logistics: { loadFloor: 'Piano Terra', hasParking: true, hasLift: false, stairsDetails: '', hasEmptyStorage: true, emptyStorageNotes: '' },
        equipment: {
            audio: { present: true, hasPA: true, paNotes: 'Impianto L-Acoustics residente', hasMics: false, micsNotes: '', hasMixerOuts: true, mixerNotes: 'Left/Right XLR su palco' },
            video: { present: false, hasTV: false, hasProjector: false, hasLedwall: false, hasMonitorGobo: false, signals: [], notes: '' },
            hasLights: true, lightsNotes: 'Americana frontale con piazzato generico',
            hasPerimeterSockets: true
        },
        generalSurveyNotes: 'Scaricare dal retro, attenzione alla ZTL attiva fino alle 19.30'
    }
];

let MOCK_CREW: CrewMember[] = [
    { id: 'demo-admin-id', name: 'Admin Demo', type: CrewType.INTERNAL, roles: ['Project Manager'], dailyRate: 0, phone: '3339999999', email: 'admin@glr.it', password: 'password', accessRole: 'ADMIN', absences: [], expenses: [] },
    { id: '2', name: 'Luca Bianchi', type: CrewType.INTERNAL, roles: ['Fellicista Audio'], dailyRate: 0, phone: '3338888888', email: 'luca@glr.it', password: 'password', accessRole: 'TECH', absences: [], expenses: [] },
    { id: '3', name: 'Marco Verdi', type: CrewType.FREELANCE, roles: ['Operatore Luci'], dailyRate: 250, phone: '3337777777', absences: [], expenses: [] },
    { id: '4', name: 'Giulia Neri', type: CrewType.FREELANCE, roles: ['Tecnico Video'], dailyRate: 300, phone: '3336666666', absences: [], expenses: [] }
];

let MOCK_JOBS: Job[] = [
    {
        id: '1', title: 'Convention Aziendale Alpha', client: 'Alpha Corp', location: 'Teatro Nazionale', locationId: '1',
        startDate: new Date().toISOString().split('T')[0], endDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: JobStatus.CONFIRMED, description: 'Convention annuale con streaming', departments: ['Audio', 'Video'],
        isAwayJob: false, isSubcontracted: false, outfitNoLogo: false,
        internalClient: 'Agenzia Eventi XY', contactName: 'Sig. Brambilla', contactPhone: '3334445555', outfit: 'Polo',
        phases: [
            { id: 'p1', name: 'Allestimento', start: new Date().toISOString(), end: new Date(Date.now() + 14400000).toISOString(), callTimeWarehouse: new Date().toISOString(), callTimeSite: new Date(Date.now() + 3600000).toISOString() }
        ],
        vehicles: [{ id: 'v1', type: VehicleType.DUCATO, quantity: 2, isRental: false }],
        materialList: [
            { id: 'm1', inventoryId: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantity: 2, isExternal: false },
            { id: 'm2', inventoryId: '2', name: 'Yamaha QL1', category: 'Audio', type: 'Mixer', quantity: 1, isExternal: false }
        ],
        assignedCrew: ['2', '3'], notes: '',
        extraCharges: 250, totalInvoiced: 8500
    },
    {
        id: '2', title: 'Gala Dinner Beta', client: 'Beta Inc', location: 'Hotel Rome', locationId: '',
        startDate: new Date(Date.now() - 864000000).toISOString().split('T')[0], endDate: new Date(Date.now() - 777600000).toISOString().split('T')[0],
        status: JobStatus.COMPLETED, description: 'Cena di gala', departments: ['Luci'],
        isAwayJob: false, isSubcontracted: false, outfitNoLogo: true,
        contactName: '', contactPhone: '', contactEmail: '',
        phases: [], vehicles: [], materialList: [], assignedCrew: ['2', '4'], notes: '',
        extraCharges: 0, totalInvoiced: 4200
    }
];

let MOCK_STANDARD_LISTS: StandardMaterialList[] = [
    {
        id: '1', name: 'Kit Conferenza Base', labels: ['Audio'],
        items: [
            { id: 'sl1', inventoryId: '1', name: 'Shure SM58', category: 'Audio', type: 'Microfono', quantity: 4, isExternal: false },
            { id: 'sl2', inventoryId: '4', name: 'Cavo XLR 10m', category: 'Cavi', type: 'XLR', quantity: 10, isExternal: false }
        ]
    }
];

let MOCK_RENTALS: Rental[] = [
    {
        id: 'r1', status: RentalStatus.CONFIRMED, client: 'Service Partner SRL', contactName: 'Giovanni Muciaccia', contactPhone: '3330000000',
        pickupDate: new Date().toISOString(), returnDate: new Date(Date.now() + 172800000).toISOString(), deliveryMethod: 'RITIRO',
        items: [
             { id: 'ri1', inventoryId: '5', name: 'Par LED', category: 'Luci', type: 'Faro', quantity: 4, isExternal: false },
             { id: 'ri2', inventoryId: '7', name: 'HDMI 10m', category: 'Cavi', type: 'HDMI', quantity: 2, isExternal: false }
        ],
        notes: 'Pagamento al ritiro',
        totalPrice: 150
    }
];

// --- MOCK FINANCIAL DATA ---
let MOCK_EXPENSES: CompanyExpense[] = [
    { id: '1', date: new Date().toISOString().split('T')[0], category: 'Affitto Locali', description: 'Affitto Magazzino Gennaio', amount: 1500, isPaid: true },
    { id: '2', date: new Date().toISOString().split('T')[0], category: 'Utenze', description: 'Bolletta Elettrica', amount: 320, isPaid: false },
    { id: '3', date: new Date(Date.now() - 2592000000).toISOString().split('T')[0], category: 'Assicurazioni', description: 'Assicurazione Furgoni', amount: 800, isPaid: true }
];

let MOCK_RECURRING: RecurringPayment[] = [
    { id: '1', name: 'Leasing Furgone', category: 'Leasing', amount: 450, frequency: 'Monthly', nextDueDate: new Date(Date.now() + 604800000).toISOString().split('T')[0], isActive: true, provider: 'Leasys' },
    { id: '2', name: 'Adobe Creative Cloud', category: 'Abbonamenti', amount: 60, frequency: 'Monthly', nextDueDate: new Date(Date.now() + 1209600000).toISOString().split('T')[0], isActive: true, provider: 'Adobe' }
];

let MOCK_PERSONNEL_COSTS: PersonnelCost[] = [
    { id: '1', title: 'F24 Gennaio 2024', date: '2024-02-16', amount: 2450, type: 'F24', status: 'PAID' },
    { id: '2', title: 'Contributi INPS', date: '2024-03-16', amount: 1200, type: 'INPS', status: 'UNPAID' }
];

// --- MOCK API ---

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const api = {
  login: async (email: string, pass: string) => {
      await delay(500);
      return { success: true, user: MOCK_CREW[0], token: 'demo' };
  },

  getJobs: async () => { await delay(300); return [...MOCK_JOBS]; },
  createJob: async (job: Job) => { await delay(300); const n = {...job, id: Date.now().toString()}; MOCK_JOBS.push(n); return n; },
  updateJob: async (job: Job) => { await delay(300); MOCK_JOBS = MOCK_JOBS.map(j => j.id === job.id ? job : j); return job; },
  deleteJob: async (id: string) => { await delay(300); MOCK_JOBS = MOCK_JOBS.filter(j => j.id !== id); return true; },

  getCrew: async () => { await delay(300); return [...MOCK_CREW]; },
  updateCrewMember: async (member: CrewMember) => { 
      await delay(300); 
      if(member.id.length < 10) { // New
          const n = {...member, id: Date.now().toString()};
          MOCK_CREW.push(n);
          return n;
      } else {
          MOCK_CREW = MOCK_CREW.map(c => c.id === member.id ? member : c);
          return member;
      }
  },

  getLocations: async () => { await delay(300); return [...MOCK_LOCATIONS]; },
  createLocation: async (loc: Location) => { await delay(300); const n = {...loc, id: Date.now().toString()}; MOCK_LOCATIONS.push(n); return n; },
  updateLocation: async (loc: Location) => { await delay(300); MOCK_LOCATIONS = MOCK_LOCATIONS.map(l => l.id === loc.id ? loc : l); return loc; },
  deleteLocation: async (id: string) => { await delay(300); MOCK_LOCATIONS = MOCK_LOCATIONS.filter(l => l.id !== id); return true; },

  getInventory: async () => { await delay(300); return [...MOCK_INVENTORY]; },
  createInventoryItem: async (item: InventoryItem) => { await delay(300); const n = {...item, id: Date.now().toString()}; MOCK_INVENTORY.push(n); return n; },
  updateInventoryItem: async (item: InventoryItem) => { await delay(300); MOCK_INVENTORY = MOCK_INVENTORY.map(i => i.id === item.id ? item : i); return item; },
  deleteInventoryItem: async (id: string) => { await delay(300); MOCK_INVENTORY = MOCK_INVENTORY.filter(i => i.id !== id); return true; },

  getStandardLists: async () => { await delay(300); return [...MOCK_STANDARD_LISTS]; },
  createStandardList: async (list: StandardMaterialList) => { await delay(300); const n = {...list, id: Date.now().toString()}; MOCK_STANDARD_LISTS.push(n); return n; },
  updateStandardList: async (list: StandardMaterialList) => { await delay(300); MOCK_STANDARD_LISTS = MOCK_STANDARD_LISTS.map(l => l.id === list.id ? list : l); return list; },
  deleteStandardList: async (id: string) => { await delay(300); MOCK_STANDARD_LISTS = MOCK_STANDARD_LISTS.filter(l => l.id !== id); return true; },

  getRentals: async () => { await delay(300); return [...MOCK_RENTALS]; },
  createRental: async (rental: Rental) => { await delay(300); const n = {...rental, id: Date.now().toString()}; MOCK_RENTALS.push(n); return n; },
  updateRental: async (rental: Rental) => { await delay(300); MOCK_RENTALS = MOCK_RENTALS.map(r => r.id === rental.id ? rental : r); return rental; },
  deleteRental: async (id: string) => { await delay(300); MOCK_RENTALS = MOCK_RENTALS.filter(r => r.id !== id); return true; },

  getSettings: async () => { await delay(300); return MOCK_SETTINGS; },
  updateSettings: async (s: AppSettings) => { await delay(300); MOCK_SETTINGS = s; return s; },

  getNotifications: async (): Promise<Notification[]> => { 
      await delay(300); 
      // Return a sample notification to demonstrate the system
      return [
          {
              id: 'notif-1',
              type: 'INFO',
              title: 'Benvenuto in GLR HUB',
              message: 'Il sistema è stato aggiornato con le nuove funzionalità di Noleggio.',
              timestamp: new Date().toISOString(),
              read: false,
              linkTo: 'RENTALS'
          },
          {
              id: 'notif-2',
              type: 'WARNING',
              title: 'Scadenza Sicurezza',
              message: 'Il certificato di sicurezza per Luca Bianchi scade tra 30 giorni.',
              timestamp: new Date().toISOString(),
              read: false,
              linkTo: 'CREW'
          }
      ]; 
  },

  // --- NEW FINANCIAL ENDPOINTS ---
  getCompanyExpenses: async () => { await delay(300); return [...MOCK_EXPENSES]; },
  createCompanyExpense: async (exp: CompanyExpense) => { await delay(300); const n = {...exp, id: Date.now().toString()}; MOCK_EXPENSES.push(n); return n; },
  updateCompanyExpense: async (exp: CompanyExpense) => { await delay(300); MOCK_EXPENSES = MOCK_EXPENSES.map(e => e.id === exp.id ? exp : e); return exp; },
  deleteCompanyExpense: async (id: string) => { await delay(300); MOCK_EXPENSES = MOCK_EXPENSES.filter(e => e.id !== id); return true; },

  getRecurringPayments: async () => { await delay(300); return [...MOCK_RECURRING]; },
  createRecurringPayment: async (pay: RecurringPayment) => { await delay(300); const n = {...pay, id: Date.now().toString()}; MOCK_RECURRING.push(n); return n; },
  updateRecurringPayment: async (pay: RecurringPayment) => { await delay(300); MOCK_RECURRING = MOCK_RECURRING.map(p => p.id === pay.id ? pay : p); return pay; },
  deleteRecurringPayment: async (id: string) => { await delay(300); MOCK_RECURRING = MOCK_RECURRING.filter(p => p.id !== id); return true; },

  getPersonnelCosts: async () => { await delay(300); return [...MOCK_PERSONNEL_COSTS]; },
  createPersonnelCost: async (cost: PersonnelCost) => { await delay(300); const n = {...cost, id: Date.now().toString()}; MOCK_PERSONNEL_COSTS.push(n); return n; },
  updatePersonnelCost: async (cost: PersonnelCost) => { await delay(300); MOCK_PERSONNEL_COSTS = MOCK_PERSONNEL_COSTS.map(c => c.id === cost.id ? cost : c); return cost; },
  deletePersonnelCost: async (id: string) => { await delay(300); MOCK_PERSONNEL_COSTS = MOCK_PERSONNEL_COSTS.filter(c => c.id !== id); return true; },
};