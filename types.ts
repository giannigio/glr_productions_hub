
// Enums for Statuses
export enum JobStatus {
  DRAFT = 'Bozza',
  CONFIRMED = 'Confermato',
  IN_PROGRESS = 'In Corso',
  COMPLETED = 'Completato',
  CANCELLED = 'Annullato'
}

export enum CrewRole {
  AUDIO_ENG = 'Fellicista Audio',
  LIGHT_OP = 'Operatore Luci',
  VIDEO_TECH = 'Tecnico Video',
  RIGGER = 'Rigger',
  STAGE_HAND = 'Facchino',
  PROJECT_MGR = 'Project Manager'
}

export enum CrewType {
  INTERNAL = 'Interno',
  FREELANCE = 'Esterno'
}

export enum VehicleType {
  DUCATO = 'Ducato',
  DAILY_35 = 'Daily 35Q',
  EUROCARGO_75 = 'Eurocargo 75Q',
  MOTRICE = 'Motrice',
  RENTAL = 'Furgone a Noleggio'
}

export enum ApprovalStatus {
  PENDING = 'In Attesa',
  APPROVED_MANAGER = 'Approvato (Manager)',
  REJECTED = 'Rifiutato',
  COMPLETED = 'Completato / Pagato'
}

export type OutfitType = 'Polo' | 'Camicia' | 'Abito';
export type SystemRole = 'ADMIN' | 'MANAGER' | 'TECH';

// Data Models
export interface Notification {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  linkTo?: string; // Optional link to a specific section
}

export interface WorkflowLog {
  id: string;
  date: string;
  user: string; // 'Admin', 'Manager', or Crew Name
  action: string; // 'Created', 'Approved', 'Commented'
  note?: string;
}

export interface InventoryItem {
  id: string;
  name: string; // From CSV 'Attrezzatura'
  category: string; // Flexible string to match CSV 'Categoria'
  type?: string; // From CSV 'Tipologia'
  quantityOwned: number; // From CSV 'Quantità'
  weightKg?: number;
  
  // New CSV fields
  serialNumber?: string; // From CSV 'Seriale'
  status?: string; // From CSV 'Stato'
  accessories?: string; // From CSV 'Accessori/Kit' or 'Correlati'
  
  notes?: string;
}

export interface MaterialItem {
  id: string;
  inventoryId?: string; // Link to inventory if internal
  category: string;
  type?: string; // Sub-category (Tipologia) from Inventory
  name: string;
  quantity: number;
  // New fields
  isExternal: boolean;
  cost?: number; // Costo per noleggio esterno
  supplier?: string; // For rentals
  notes?: string; // Technical notes
}

export interface CrewExpense {
  id: string;
  jobId?: string; // Linked Job
  jobTitle?: string;
  date: string;
  amount: number;
  description: string;
  category: 'Viaggio' | 'Pasto' | 'Alloggio' | 'Materiale' | 'Altro';
  status: ApprovalStatus;
  workflowLog: WorkflowLog[];
  attachmentUrl?: string; // Mock url
}

export interface CrewAbsence {
  id: string;
  type: 'Ferie' | 'Permesso' | 'Malattia';
  startDate: string;
  endDate: string;
  status: ApprovalStatus;
  workflowLog: WorkflowLog[];
}

export interface CrewTask {
    id: string;
    date: string; // ISO Date YYYY-MM-DD
    description: string;
    assignedBy: string;
}

export interface CrewDocument {
    id: string;
    name: string;
    type: 'Unilav' | 'Certificazione' | 'Visita Medica' | 'Altro';
    expiryDate?: string; // ISO Date
    uploadDate: string;
    fileUrl?: string; // Mock URL
}

export interface CrewMember {
  id: string;
  name: string;
  type: CrewType;
  roles: CrewRole[];
  
  // Financials
  dailyRate: number;
  overtimeRate?: number; // Costo orario extra
  travelIndemnity?: number; // Diaria
  
  // Auth (Internal only)
  email?: string;
  password?: string;
  accessRole?: SystemRole;

  phone: string;
  
  absences: CrewAbsence[];
  expenses: CrewExpense[];
  tasks?: CrewTask[]; // Extra tasks outside of jobs
  documents?: CrewDocument[];
}

export interface LocationPower {
  type: 'CIVILE' | 'INDUSTRIALE';
  industrialSockets: string[]; // '16A', '32A', '63A', '128A'
  hasPerimeterSockets: boolean;
  requiresGenerator: boolean;
  distanceFromPanel: number; // in meters
  notes: string;
}

export interface LocationNetwork {
  hasWired: boolean;
  hasWifi: boolean;
  addressing: 'DHCP' | 'STATIC';
  staticDetails: string;
  firewallProxyNotes: string;
}

export interface LocationLogistics {
  loadFloor: string;
  hasParking: boolean;
  hasLift: boolean;
  stairsDetails: string;
  hasEmptyStorage: boolean; // Stipaggio vuoti
  emptyStorageNotes: string;
}

export interface LocationAudioDetails {
  present: boolean;
  hasPA: boolean; // Impianto
  paNotes: string; // Note specifiche Impianto
  hasMics: boolean; // Microfonia
  micsNotes: string; // Note specifiche Microfonia
  hasMixerOuts: boolean; // Uscite Mixer
  mixerNotes: string; // Note specifiche Mixer
}

export interface LocationVideoDetails {
  present: boolean;
  hasTV: boolean;
  hasProjector: boolean;
  hasLedwall: boolean;
  hasMonitorGobo: boolean;
  signals: string[]; // 'HDMI', 'VGA', 'SDI'
  notes: string;
}

export interface LocationEquipment {
  audio: LocationAudioDetails;
  video: LocationVideoDetails;
  hasLights: boolean; // Keep lights simple for now or expand later
  lightsNotes: string;
}

export interface Location {
  id: string;
  name: string;
  address: string;
  hallSizeMQ: number; // MQ Sala
  mapsLink: string;
  isZtl: boolean;
  contactName: string;
  contactPhone: string;
  accessHours: string; // Orari e pause
  power: LocationPower;
  network: LocationNetwork;
  logistics: LocationLogistics;
  equipment: LocationEquipment;
  generalSurveyNotes: string; // Note Generali Sopralluogo
}

export interface JobPhase {
  id: string;
  name: string; // Free text name instead of enum
  start: string; // ISO DateTime
  end: string; // ISO DateTime
  callTimeWarehouse?: string; // ISO DateTime
  callTimeSite?: string; // ISO DateTime
}

export interface JobVehicle {
  id: string;
  type: VehicleType;
  quantity: number;
  isRental: boolean;
  rentalCompany?: string;
  pickupDate?: string; // ISO String
  returnDate?: string;
  cost?: number; // Costo noleggio
}

export interface Job {
  id: string;
  title: string;
  client: string;
  location: string; // Stores the name or address
  locationId?: string; // Links to a saved Location object
  startDate: string; // ISO Date YYYY-MM-DD
  endDate: string;   // ISO Date YYYY-MM-DD
  status: JobStatus;
  
  // New Fields
  departments: string[]; // ['Audio', 'Video', 'Luci']
  isAwayJob: boolean; // Trasferta
  
  // Subcontracting
  isSubcontracted: boolean;
  subcontractorName?: string;

  // Outfit
  outfit?: OutfitType;
  outfitNoLogo: boolean;

  phases: JobPhase[];
  vehicles: JobVehicle[];

  description: string;
  materialList: MaterialItem[];
  assignedCrew: string[]; // CrewMember IDs
  notes: string;
}

export interface AppSettings {
    // Company Info
    companyName: string;
    pIva: string;
    address: string;
    bankName: string;
    iban: string;
    logoUrl?: string;

    // Economic Parameters
    defaultDailyIndemnity: number; // Diaria standard
    kmCost: number; // Costo al km
    defaultVatRate: number; // IVA 22%

    // Integrations (Google Calendar)
    googleCalendarClientId: string;
    googleCalendarClientSecret: string; // Should be stored securely in backend in real app
    googleCalendarId: string; // Primary Calendar ID
}