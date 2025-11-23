
import { Job, CrewMember, JobStatus, CrewType, CrewRole, Location, InventoryItem, VehicleType, Notification, ApprovalStatus, SystemRole, AppSettings } from '../types';

// MOCK SETTINGS
let MOCK_SETTINGS: AppSettings = {
    companyName: 'GLR Productions Srl',
    pIva: 'IT12345678901',
    address: 'Via del Sound Check 1, Milano',
    bankName: 'Intesa Sanpaolo',
    iban: 'IT00X0000000000000000000000',
    defaultDailyIndemnity: 50,
    kmCost: 0.45,
    defaultVatRate: 22,
    googleCalendarClientId: '',
    googleCalendarClientSecret: '',
    googleCalendarId: 'primary'
};

// MOCK DATA
let MOCK_INVENTORY: InventoryItem[] = [
  { id: 'inv1', name: 'Shure SM58', category: 'Audio', quantityOwned: 10, weightKg: 0.3 },
  { id: 'inv2', name: 'Yamaha QL1', category: 'Audio', quantityOwned: 2, weightKg: 15 },
  { id: 'inv3', name: 'Robe Pointe', category: 'Luci', quantityOwned: 12, weightKg: 20 },
  { id: 'inv4', name: 'Barra LED', category: 'Luci', quantityOwned: 20, weightKg: 2 },
  { id: 'inv5', name: 'Samsung 55" 4K', category: 'Video', quantityOwned: 4, weightKg: 12 },
  { id: 'inv6', name: 'Traliccio 2m 29x29', category: 'Strutture', quantityOwned: 30, weightKg: 8 },
];

let MOCK_JOBS: Job[] = [
  {
    id: '101',
    title: 'Festival Jazz Milano',
    client: 'Comune di Milano',
    location: 'Piazza Duomo',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    status: JobStatus.CONFIRMED,
    departments: ['Audio', 'Luci'],
    isAwayJob: false,
    isSubcontracted: false,
    outfit: 'Polo',
    outfitNoLogo: true,
    phases: [
      { 
          id: 'ph1', 
          name: 'Montaggio',
          start: '2024-06-15T08:00',
          end: '2024-06-15T18:00',
          callTimeWarehouse: '2024-06-15T07:00',
          callTimeSite: '2024-06-15T08:00'
      },
      { 
          id: 'ph2', 
          name: 'Evento Day 1',
          start: '2024-06-16T18:00',
          end: '2024-06-16T23:00',
          callTimeSite: '2024-06-16T17:00'
      }
    ],
    vehicles: [
      { id: 'v1', type: VehicleType.EUROCARGO_75, quantity: 1, isRental: false }
    ],
    description: 'Festival Jazz all\'aperto. Richiesto impianto audio principale, luci d\'ambiente e 2 schermi ledwall laterali.',
    materialList: [
      { id: 'm1', name: 'Line Array Set', category: 'Audio', quantity: 12, isExternal: false, notes: 'Main PA' },
      { id: 'm2', inventoryId: 'inv2', name: 'Yamaha QL1', category: 'Audio', quantity: 2, isExternal: false },
      { id: 'm3', inventoryId: 'inv3', name: 'Robe Pointe', category: 'Luci', quantity: 24, isExternal: false }
    ],
    assignedCrew: ['1', '2'],
    notes: 'Accesso ztl richiesto per i furgoni.'
  },
  {
    id: '102',
    title: 'Convention Aziendale Tech',
    client: 'Tech Corp',
    location: 'Centro Congressi',
    startDate: '2024-07-01',
    endDate: '2024-07-02',
    status: JobStatus.CONFIRMED,
    departments: ['Video'],
    isAwayJob: true,
    isSubcontracted: true,
    subcontractorName: 'Big Events Srl',
    outfit: 'Camicia',
    outfitNoLogo: false,
    phases: [],
    vehicles: [],
    description: 'Convention con streaming.',
    materialList: [], // INTENTIONAL EMPTY LIST FOR ALERT TESTING
    assignedCrew: [],
    notes: ''
  }
];

let MOCK_CREW: CrewMember[] = [
  { 
      id: '1', 
      name: 'Mario Rossi', 
      type: CrewType.INTERNAL, 
      roles: [CrewRole.AUDIO_ENG, CrewRole.PROJECT_MGR], 
      dailyRate: 0, // Interno
      overtimeRate: 30,
      travelIndemnity: 50,
      email: 'mario.rossi@glr.it',
      password: 'password',
      accessRole: 'ADMIN',
      phone: '333-1234567', 
      tasks: [],
      absences: [
          {
              id: 'abs1',
              type: 'Ferie',
              startDate: '2024-08-10',
              endDate: '2024-08-20',
              status: ApprovalStatus.APPROVED_MANAGER,
              workflowLog: [
                  { id: 'l1', date: '2024-05-01T10:00', user: 'Mario Rossi', action: 'Richiesta creata' },
                  { id: 'l2', date: '2024-05-02T09:30', user: 'Admin', action: 'Approvata', note: 'Buone vacanze!' }
              ]
          }
      ],
      expenses: [
          {
              id: 'exp1',
              date: '2024-06-01',
              jobId: '101',
              jobTitle: 'Festival Jazz Milano',
              amount: 45.50,
              category: 'Pasto',
              description: 'Pranzo trasferta Torino',
              status: ApprovalStatus.PENDING,
              workflowLog: [
                  { id: 'l1', date: '2024-06-02T10:00', user: 'Mario Rossi', action: 'Richiesta inserita' }
              ]
          }
      ],
      documents: [
          {
              id: 'doc1',
              name: 'Attestato Sicurezza Alto Rischio',
              type: 'Certificazione',
              expiryDate: '2026-05-20',
              uploadDate: '2023-05-20',
              fileUrl: '#'
          },
          {
              id: 'doc2',
              name: 'Visita Medica',
              type: 'Visita Medica',
              expiryDate: '2024-12-31',
              uploadDate: '2024-01-15',
              fileUrl: '#'
          }
      ]
  },
  { 
      id: '2', 
      name: 'Luca Bianchi', 
      type: CrewType.FREELANCE, 
      roles: [CrewRole.LIGHT_OP], 
      dailyRate: 250, 
      email: 'luca.bianchi@gmail.com', // Esterno no access
      phone: '333-7654321', 
      accessRole: 'TECH',
      absences: [],
      expenses: [],
      tasks: [],
      documents: []
  },
  { 
      id: '3', 
      name: 'Giulia Verdi', 
      type: CrewType.INTERNAL, 
      roles: [CrewRole.VIDEO_TECH], 
      dailyRate: 0, 
      email: 'giulia.verdi@glr.it',
      accessRole: 'MANAGER',
      phone: '333-9988776', 
      absences: [],
      expenses: [],
      tasks: [],
      documents: []
  },
];

let MOCK_LOCATIONS: Location[] = [
  {
    id: 'l1',
    name: 'Teatro degli Arcimboldi',
    address: 'Viale dell\'Innovazione 20, Milano',
    hallSizeMQ: 1200,
    mapsLink: 'https://goo.gl/maps/example',
    isZtl: false,
    contactName: 'Sig. Giuseppe Verdi',
    contactPhone: '02-12345678',
    accessHours: '08:00 - 20:00 (Pausa 13-14)',
    power: {
      type: 'INDUSTRIALE',
      industrialSockets: ['32A', '63A'],
      hasPerimeterSockets: true,
      requiresGenerator: false,
      distanceFromPanel: 25,
      notes: 'Quadro elettrico dietro palco sx'
    },
    network: {
      hasWired: true,
      hasWifi: true,
      addressing: 'DHCP',
      staticDetails: '',
      firewallProxyNotes: 'Nessun blocco'
    },
    logistics: {
      loadFloor: 'Piano Terra',
      hasParking: true,
      hasLift: false,
      stairsDetails: '',
      hasEmptyStorage: true,
      emptyStorageNotes: 'Stanza laterale dedicata'
    },
    equipment: {
      audio: {
        present: true,
        hasPA: true,
        paNotes: 'Impianto residente L-Acoustics',
        hasMics: false,
        micsNotes: '',
        hasMixerOuts: true,
        mixerNotes: ''
      },
      video: {
        present: false,
        hasTV: false,
        hasProjector: false,
        hasLedwall: false,
        hasMonitorGobo: false,
        signals: [],
        notes: ''
      },
      hasLights: true,
      lightsNotes: 'Americane fisse motorizzate'
    },
    generalSurveyNotes: 'Location molto agevole, attenzione solo agli orari di scarico rigidi.'
  }
];

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper for availability
export interface AvailabilityResult {
  available: number;
  conflicts: { jobName: string; quantity: number }[];
}

export const checkAvailability = (inventoryId: string, startDate: string, endDate: string, currentJobId?: string): AvailabilityResult => {
  const item = MOCK_INVENTORY.find(i => i.id === inventoryId);
  if (!item) return { available: 0, conflicts: [] };

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();

  let used = 0;
  const conflicts: { jobName: string; quantity: number }[] = [];

  MOCK_JOBS.forEach(job => {
    // Skip cancelled, draft (optional), or the current job itself
    if (job.status === JobStatus.CANCELLED || job.id === currentJobId) return;
    
    // Check overlap
    const jobStart = new Date(job.startDate).getTime();
    const jobEnd = new Date(job.endDate).getTime();

    // Simple overlap check
    if (start <= jobEnd && end >= jobStart) {
      const mat = job.materialList.find(m => m.inventoryId === inventoryId);
      if (mat) {
        used += mat.quantity;
        conflicts.push({ jobName: job.title, quantity: mat.quantity });
      }
    }
  });

  return {
    available: Math.max(0, item.quantityOwned - used),
    conflicts
  };
};

export const calculateMissedRestDays = (crewId: string, year: number, month: number) => {
    // Helper to get week number
    const getWeek = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
    };

    const daysWorkedByWeek: Record<number, number> = {};
    const totalDaysWorked = new Set<string>();

    MOCK_JOBS.forEach(job => {
        if (!job.assignedCrew.includes(crewId) || job.status === JobStatus.CANCELLED) return;
        
        let d = new Date(job.startDate);
        const end = new Date(job.endDate);
        
        while (d <= end) {
            if (d.getFullYear() === year && d.getMonth() === month) {
                const dayStr = d.toISOString().split('T')[0];
                totalDaysWorked.add(dayStr);
                
                const weekNum = getWeek(d);
                daysWorkedByWeek[weekNum] = (daysWorkedByWeek[weekNum] || 0) + 1;
            }
            d.setDate(d.getDate() + 1);
        }
    });

    let missedRestDays = 0;
    Object.values(daysWorkedByWeek).forEach(days => {
        if (days > 5) {
            missedRestDays += (days - 5);
        }
    });

    return {
        totalWorked: totalDaysWorked.size,
        missedRest: missedRestDays
    };
};

export const api = {
  // SETTINGS
  getSettings: async (): Promise<AppSettings> => {
      await delay(500);
      return { ...MOCK_SETTINGS };
  },

  updateSettings: async (settings: AppSettings): Promise<AppSettings> => {
      await delay(500);
      MOCK_SETTINGS = settings;
      return settings;
  },

  // NOTIFICATIONS
  getNotifications: async (): Promise<Notification[]> => {
      // Logic to generate notifications dynamically based on data state
      const notifs: Notification[] = [];
      
      // 1. Check Jobs Confirmed but Empty Material
      MOCK_JOBS.forEach(job => {
          if (job.status === JobStatus.CONFIRMED && job.materialList.length === 0) {
              notifs.push({
                  id: `n-mat-${job.id}`,
                  type: 'WARNING',
                  title: 'Materiale Mancante',
                  message: `Il lavoro "${job.title}" è confermato ma non ha ancora una lista materiali.`,
                  timestamp: new Date().toISOString(),
                  read: false,
                  linkTo: 'JOBS'
              });
          }
      });

      // 2. Mock some recent approvals
      notifs.push({
          id: 'n-exp-1',
          type: 'INFO',
          title: 'Rimborso Richiesto',
          message: 'Mario Rossi ha inserito una nuova nota spese da approvare.',
          timestamp: new Date().toISOString(),
          read: false,
          linkTo: 'CREW'
      });

      return notifs;
  },

  // JOBS CRUD
  getJobs: async (): Promise<Job[]> => {
    await delay(600); 
    return [...MOCK_JOBS];
  },

  createJob: async (job: Job): Promise<Job> => {
    await delay(600);
    MOCK_JOBS.push(job);
    return job;
  },

  updateJob: async (job: Job): Promise<Job> => {
    await delay(600);
    MOCK_JOBS = MOCK_JOBS.map(j => j.id === job.id ? job : j);
    return job;
  },

  deleteJob: async (id: string): Promise<boolean> => {
    await delay(600);
    MOCK_JOBS = MOCK_JOBS.filter(j => j.id !== id);
    return true;
  },

  // CREW CRUD
  getCrew: async (): Promise<CrewMember[]> => {
    await delay(500);
    return [...MOCK_CREW];
  },

  updateCrewMember: async (member: CrewMember): Promise<CrewMember> => {
      await delay(400);
      MOCK_CREW = MOCK_CREW.map(c => c.id === member.id ? member : c);
      return member;
  },

  // LOCATION CRUD
  getLocations: async (): Promise<Location[]> => {
    await delay(500);
    return [...MOCK_LOCATIONS];
  },

  createLocation: async (location: Location): Promise<Location> => {
    await delay(500);
    MOCK_LOCATIONS.push(location);
    return location;
  },

  updateLocation: async (location: Location): Promise<Location> => {
    await delay(500);
    MOCK_LOCATIONS = MOCK_LOCATIONS.map(l => l.id === location.id ? location : l);
    return location;
  },

  deleteLocation: async (id: string): Promise<boolean> => {
    await delay(500);
    MOCK_LOCATIONS = MOCK_LOCATIONS.filter(l => l.id !== id);
    return true;
  },

  // INVENTORY CRUD
  getInventory: async (): Promise<InventoryItem[]> => {
    await delay(500);
    return [...MOCK_INVENTORY];
  },

  createInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    await delay(500);
    MOCK_INVENTORY.push(item);
    return item;
  },

  updateInventoryItem: async (item: InventoryItem): Promise<InventoryItem> => {
    await delay(500);
    MOCK_INVENTORY = MOCK_INVENTORY.map(i => i.id === item.id ? item : i);
    return item;
  },

  deleteInventoryItem: async (id: string): Promise<boolean> => {
    await delay(500);
    MOCK_INVENTORY = MOCK_INVENTORY.filter(i => i.id !== id);
    return true;
  }
};