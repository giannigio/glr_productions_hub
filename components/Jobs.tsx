
import React, { useState, useMemo } from 'react';
import { Job, JobStatus, MaterialItem, CrewMember, Location, InventoryItem, JobPhase, JobVehicle, VehicleType, OutfitType, StandardMaterialList, AppSettings, ApprovalStatus } from '../types';
import { generateEquipmentList } from '../services/geminiService';
import { checkAvailabilityHelper } from '../services/helpers';
import { Plus, Calendar, MapPin, Trash2, Edit3, Wand2, UserPlus, Package, Check, Plane, Clock, X, Truck, AlertTriangle, StickyNote, Building2, Shirt, AlertOctagon, Info, ClipboardList, Speaker, Monitor, Zap, Box, Cable, ChevronRight, Sparkles, Search, Radio, ArrowRightCircle, Lightbulb, Square, CheckSquare, Printer, ShoppingCart, Minus, Filter, ClipboardCheck, Copy, FileInput, FilePlus, LayoutGrid, CalendarRange, Phone, Ruler, Network, Columns, Archive, FolderOpen, Folder, ArrowDownCircle, ArrowLeft, ArrowRight, List, Briefcase, Wifi, Power } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
  crew: CrewMember[];
  locations: Location[];
  inventory: InventoryItem[]; 
  standardLists?: StandardMaterialList[];
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
  settings?: AppSettings;
}

const QUICK_ITEMS = [
    { name: 'Tavolo Regia', category: 'Strutture', type: 'Arredo' },
    { name: 'Gaffa', category: 'Altro', type: 'Consumabili' },
    { name: 'Nastri', category: 'Altro', type: 'Consumabili' },
    { name: 'Batterie', category: 'Altro', type: 'Consumabili' },
    { name: 'DPI', category: 'Altro', type: 'Sicurezza' },
    { name: 'Teli pioggia', category: 'Accessori', type: 'Meteo' },
    { name: 'Canaline', category: 'Cavi', type: 'Pedane' },
    { name: 'Router 5G', category: 'Rete', type: 'Network' },
];

export const Jobs: React.FC<JobsProps> = ({ jobs, crew, locations, inventory, standardLists = [], onAddJob, onUpdateJob, onDeleteJob, currentUser, settings }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'LOCATION' | 'PHASES' | 'MATERIAL' | 'CREW' | 'PLAN' | 'BUDGET'>('DETAILS');
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'ARCHIVE'>('TIMELINE');
  
  // Material State
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [isImportKitModalOpen, setIsImportKitModalOpen] = useState(false);
  const [catalogCategory, setCatalogCategory] = useState('ALL');
  const [addedFeedback, setAddedFeedback] = useState<Record<string, boolean>>({}); 
  
  const [matSource, setMatSource] = useState<'INVENTORY' | 'EXTERNAL'>('INVENTORY');
  const [newMatInventoryId, setNewMatInventoryId] = useState('');
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('Audio');
  const [newMatType, setNewMatType] = useState(''); 
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatSupplier, setNewMatSupplier] = useState('');
  const [newMatCost, setNewMatCost] = useState(0);
  const [newMatNotes, setNewMatNotes] = useState('');
  
  const [invSearchTerm, setInvSearchTerm] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('ALL');
  const [invTypeFilter, setInvTypeFilter] = useState('ALL');

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE'); // Default to Active jobs
  
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [showArchived, setShowArchived] = useState(false);

  // Archive State
  const [expandedYears, setExpandedYears] = useState<Record<string, boolean>>({});
  const [expandedMonths, setExpandedMonths] = useState<Record<string, boolean>>({});

  const userRole = currentUser?.role || 'TECH';
  const permissions = settings?.permissions?.[userRole as 'MANAGER' | 'TECH'] || { canViewBudget: false };
  const canEdit = userRole === 'ADMIN' || userRole === 'MANAGER' || userRole === 'TECH';
  const showBudget = userRole === 'ADMIN' || permissions.canViewBudget;

  const handleNewJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      title: '', client: '', location: '', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0],
      status: JobStatus.DRAFT, description: '', departments: [], isAwayJob: false, isSubcontracted: false, outfitNoLogo: false,
      phases: [], vehicles: [], materialList: [], assignedCrew: [], notes: ''
    };
    setActiveJob(newJob); setIsEditing(true); setActiveTab('DETAILS');
  };

  const handleCreateFromExisting = (sourceJob: Job) => {
      const newJob: Job = {
          ...sourceJob,
          id: Date.now().toString(),
          title: `Copia di ${sourceJob.title}`,
          status: JobStatus.DRAFT,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          assignedCrew: [], 
      };
      setActiveJob(newJob);
      setIsEditing(true);
      setActiveTab('DETAILS');
      setIsTemplateModalOpen(false);
  };

  const handleDuplicateJob = (jobToDuplicate: Job) => {
      const newJob: Job = {
          ...jobToDuplicate, id: Date.now().toString(), title: `${jobToDuplicate.title} (Copia)`, status: JobStatus.DRAFT,
          startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], assignedCrew: [], phases: []
      };
      onAddJob(newJob);
  };

  const handleImportKit = (kit: StandardMaterialList) => {
      if (!activeJob) return;
      const newItems: MaterialItem[] = kit.items.map(item => ({
          ...item,
          id: Date.now().toString() + Math.random().toString().slice(2)
      }));
      
      setActiveJob(prev => {
          if (!prev) return null;
          const mergedList = [...prev.materialList];
          newItems.forEach(newItem => {
              const existingIdx = mergedList.findIndex(m => m.inventoryId === newItem.inventoryId && !m.isExternal);
              if (existingIdx >= 0 && newItem.inventoryId) {
                  mergedList[existingIdx].quantity += newItem.quantity;
              } else {
                  mergedList.push(newItem);
              }
          });
          return { ...prev, materialList: mergedList };
      });
      setIsImportKitModalOpen(false);
  };

  const handleSave = () => {
    if (activeJob) {
      const exists = jobs.find(j => j.id === activeJob.id);
      if (exists) onUpdateJob(activeJob); else onAddJob(activeJob);
      setIsEditing(false); setActiveJob(null);
    }
  };

  const handlePrint = () => window.print();

  const addItemToList = (itemData: MaterialItem) => {
      setActiveJob(prev => { 
          if (!prev) return null; 
          const existingIndex = prev.materialList.findIndex(m => m.inventoryId === itemData.inventoryId && !m.isExternal);
          if (existingIndex >= 0 && itemData.inventoryId) {
              const newList = [...prev.materialList];
              newList[existingIndex].quantity += itemData.quantity;
              if (itemData.notes) {
                  newList[existingIndex].notes = newList[existingIndex].notes ? `${newList[existingIndex].notes} | ${itemData.notes}` : itemData.notes;
              }
              return { ...prev, materialList: newList };
          }
          return { ...prev, materialList: [...prev.materialList, itemData] }; 
      });
  };

  const updateItemQuantity = (itemId: string, delta: number) => {
      if (!activeJob) return;
      setActiveJob({
          ...activeJob,
          materialList: activeJob.materialList.map(m => m.id === itemId ? { ...m, quantity: Math.max(1, m.quantity + delta) } : m)
      });
  };

  const updateItemNotes = (itemId: string, newNotes: string) => {
      if (!activeJob) return;
      setActiveJob({
          ...activeJob,
          materialList: activeJob.materialList.map(m => m.id === itemId ? { ...m, notes: newNotes } : m)
      });
  };

  const addManualMaterial = () => {
      if (!activeJob) return;
      let newItem: MaterialItem;
      if (matSource === 'INVENTORY') {
          const invItem = inventory.find(i => i.id === newMatInventoryId);
          if (invItem) {
              newItem = { id: Date.now().toString(), inventoryId: invItem.id, name: invItem.name, category: invItem.category, type: invItem.type, quantity: newMatQty, isExternal: false, notes: newMatNotes };
          } else return;
      } else {
          newItem = { id: Date.now().toString(), name: newMatName || 'Materiale Esterno', category: newMatCategory as any, type: newMatType, quantity: newMatQty, isExternal: true, supplier: newMatSupplier, cost: newMatCost, notes: newMatNotes };
      }
      addItemToList(newItem);
      setNewMatInventoryId(''); setNewMatName(''); setNewMatType(''); setNewMatQty(1); setNewMatNotes('');
  };

  const handleQuickItemToggle = (qItem: typeof QUICK_ITEMS[0]) => {
        if (!activeJob) return;
        const existing = activeJob.materialList.find(m => m.name === qItem.name && !m.inventoryId);
        if (existing) {
            setActiveJob({ ...activeJob, materialList: activeJob.materialList.filter(m => m.id !== existing.id) });
        } else {
            const newItem: MaterialItem = {
                id: Date.now().toString(), name: qItem.name, category: qItem.category, type: qItem.type, quantity: 1, isExternal: false, notes: 'Aggiunta rapida'
            };
            setActiveJob({ ...activeJob, materialList: [...activeJob.materialList, newItem] });
        }
  };

  const toggleCrewAssignment = (crewId: string) => {
    if (!activeJob) return;
    const current = activeJob.assignedCrew;
    const updated = current.includes(crewId) ? current.filter(id => id !== crewId) : [...current, crewId];
    setActiveJob({ ...activeJob, assignedCrew: updated });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locId = e.target.value;
      if (!activeJob) return;
      if (locId === "custom") setActiveJob({...activeJob, locationId: undefined, location: ''});
      else {
          const selectedLoc = locations.find(l => l.id === locId);
          if (selectedLoc) setActiveJob({...activeJob, locationId: selectedLoc.id, location: selectedLoc.name});
      }
  };

  const addPhase = () => {
      if (!activeJob) return;
      const newPhase: JobPhase = { id: Date.now().toString(), name: '', start: `${activeJob.startDate}T09:00`, end: `${activeJob.startDate}T18:00` };
      setActiveJob({...activeJob, phases: [...activeJob.phases, newPhase]});
  };

  const removePhase = (phaseId: string) => { if(!activeJob) return; setActiveJob({...activeJob, phases: activeJob.phases.filter(p => p.id !== phaseId)}); }
  const updatePhase = (phaseId: string, field: keyof JobPhase, value: any) => { if(!activeJob) return; setActiveJob({...activeJob, phases: activeJob.phases.map(p => p.id === phaseId ? {...p, [field]: value} : p)}); }

  const addVehicle = () => {
      if (!activeJob) return;
      const newVehicle: JobVehicle = { id: Date.now().toString(), type: VehicleType.DUCATO, quantity: 1, isRental: false };
      setActiveJob({...activeJob, vehicles: [...activeJob.vehicles, newVehicle]});
  };
  const updateVehicle = (vId: string, field: keyof JobVehicle, value: any) => { if(!activeJob) return; setActiveJob({...activeJob, vehicles: activeJob.vehicles.map(v => v.id === vId ? {...v, [field]: value} : v)}); };
  const removeVehicle = (vId: string) => { if(!activeJob) return; setActiveJob({...activeJob, vehicles: activeJob.vehicles.filter(v => v.id !== vId)}); };

  const availableTypes = useMemo(() => {
      let items = inventory;
      if (invCategoryFilter !== 'ALL') items = items.filter(i => i.category === invCategoryFilter);
      const types = new Set(items.map(i => i.type).filter(Boolean) as string[]);
      return ['ALL', ...Array.from(types).sort()];
  }, [inventory, invCategoryFilter]);

  const filteredInventory = useMemo(() => {
      const s = invSearchTerm.toLowerCase();
      return inventory.filter(i => {
          const matchSearch = i.name.toLowerCase().includes(s) || (i.serialNumber && i.serialNumber.toLowerCase().includes(s));
          const matchCat = invCategoryFilter === 'ALL' || i.category === invCategoryFilter;
          const matchType = invTypeFilter === 'ALL' || i.type === invTypeFilter;
          return matchSearch && matchCat && matchType;
      });
  }, [inventory, invSearchTerm, invCategoryFilter, invTypeFilter]);
  
  const catalogItems = useMemo(() => {
      return inventory.filter(i => catalogCategory === 'ALL' || i.category === catalogCategory);
  }, [inventory, catalogCategory]);

  const handleCatalogAdd = (item: InventoryItem) => {
      if (!activeJob) return;
      const newItem: MaterialItem = { id: Date.now().toString(), inventoryId: item.id, name: item.name, category: item.category, type: item.type, quantity: 1, isExternal: false };
      addItemToList(newItem);
      setAddedFeedback(prev => ({...prev, [item.id]: true}));
      setTimeout(() => { setAddedFeedback(prev => ({...prev, [item.id]: false})); }, 1000);
  };

  const materialByCategory = useMemo(() => {
    if (!activeJob) return {};
    const groups: Record<string, MaterialItem[]> = { 'Audio': [], 'Video': [], 'Luci': [], 'Strutture': [], 'Cavi': [] };
    activeJob.materialList.forEach(item => {
        if (groups[item.category]) groups[item.category].push(item);
        else { if(!groups['Altro']) groups['Altro'] = []; groups['Altro'].push(item); }
    });
    return groups;
  }, [activeJob?.materialList]);

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Audio': return <Speaker size={16}/>;
        case 'Video': return <Monitor size={16}/>;
        case 'Luci': return <Zap size={16}/>;
        case 'Strutture': return <Box size={16}/>;
        case 'Cavi': return <Cable size={16}/>;
        default: return <Package size={16}/>;
    }
  };

  const filteredJobs = useMemo(() => {
      let filtered = jobs.filter(j => {
          const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || j.client.toLowerCase().includes(searchTerm.toLowerCase()) || j.location.toLowerCase().includes(searchTerm.toLowerCase());
          let matchStatus = true;
          
          if (statusFilter === 'ACTIVE') {
              matchStatus = j.status !== JobStatus.COMPLETED && j.status !== JobStatus.CANCELLED;
          } else if (statusFilter === 'ARCHIVED') {
              matchStatus = j.status === JobStatus.COMPLETED || j.status === JobStatus.CANCELLED;
          } else if (statusFilter !== 'ALL') {
              matchStatus = j.status === statusFilter;
          }
          
          return matchSearch && matchStatus;
      });
      return filtered.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [jobs, searchTerm, statusFilter]);

  // --- TIMELINE GROUPING ---
  const timelineWeeks = useMemo(() => {
      const weeks: Record<string, { start: Date, end: Date, jobs: Job[] }> = {};
      
      filteredJobs.forEach(job => {
          const date = new Date(job.startDate);
          // Get Start of Week (Monday)
          const day = date.getDay() || 7; 
          if (day !== 1) date.setHours(-24 * (day - 1));
          
          const weekKey = date.toISOString().split('T')[0];
          if (!weeks[weekKey]) {
              const endDate = new Date(date);
              endDate.setDate(date.getDate() + 6);
              weeks[weekKey] = { start: new Date(date), end: endDate, jobs: [] };
          }
          weeks[weekKey].jobs.push(job);
      });
      
      return Object.values(weeks).sort((a,b) => a.start.getTime() - b.start.getTime());
  }, [filteredJobs]);

  // --- ARCHIVE TREE ---
  const archiveTree = useMemo(() => {
      const tree: Record<string, Record<string, Job[]>> = {};
      filteredJobs.forEach(job => {
          const d = new Date(job.startDate);
          const y = d.getFullYear().toString();
          const m = d.toLocaleString('it-IT', { month: 'long' });
          const M = m.charAt(0).toUpperCase() + m.slice(1);
          
          if (!tree[y]) tree[y] = {};
          if (!tree[y][M]) tree[y][M] = [];
          tree[y][M].push(job);
      });
      return tree;
  }, [filteredJobs]);

  const activeLocationData = useMemo(() => {
      if (!activeJob || !activeJob.locationId) return null;
      return locations.find(l => l.id === activeJob.locationId);
  }, [activeJob, locations]);

  const getStatusBadge = (status: JobStatus) => {
      switch(status) {
          case JobStatus.DRAFT: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-gray-600 text-gray-200">Bozza</span>;
          case JobStatus.CONFIRMED: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-green-600 text-white">Confermato</span>;
          case JobStatus.IN_PROGRESS: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-blue-600 text-white">In Corso</span>;
          case JobStatus.COMPLETED: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-purple-600 text-white">Completato</span>;
          default: return <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-red-900 text-red-200">Annullato</span>;
      }
  }

  // BUDGET CALCULATIONS
  const calculateBudget = () => {
      if (!activeJob) return { freelance: 0, materials: 0, vehicles: 0, expenses: 0, total: 0 };
      
      // Freelance Costs
      const days = Math.max(1, Math.ceil((new Date(activeJob.endDate).getTime() - new Date(activeJob.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
      const freelanceCost = activeJob.assignedCrew.reduce((acc, crewId) => {
          const member = crew.find(c => c.id === crewId);
          return acc + (member && member.type === 'Esterno' ? member.dailyRate * days : 0);
      }, 0);

      // Material Costs
      const materialCost = activeJob.materialList.reduce((acc, m) => acc + (m.isExternal ? (m.cost || 0) * m.quantity : 0), 0);

      // Vehicle Costs
      const vehicleCost = activeJob.vehicles.reduce((acc, v) => acc + (v.isRental ? (v.cost || 0) : 0), 0);

      // Expenses (Reimbursements linked to this job)
      const expensesCost = crew.reduce((acc, c) => {
          const jobExpenses = c.expenses?.filter(e => e.jobId === activeJob.id && e.status !== ApprovalStatus.REJECTED) || [];
          return acc + jobExpenses.reduce((sum, e) => sum + e.amount, 0);
      }, 0);

      return {
          freelance: freelanceCost,
          materials: materialCost,
          vehicles: vehicleCost,
          expenses: expensesCost,
          total: freelanceCost + materialCost + vehicleCost + expensesCost
      };
  };

  const budget = calculateBudget();
  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  if (isEditing && activeJob) {
    return (
      <div className={`bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl h-[calc(100vh-140px)] flex flex-col print-only`}>
        <div className="flex justify-between items-center mb-4 shrink-0 no-print">
          <h2 className="text-xl font-bold text-white">{jobs.find(j => j.id === activeJob.id) ? 'Modifica Scheda Lavoro' : 'Nuova Scheda Lavoro'}</h2>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
            {canEdit && <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400">Salva</button>}
          </div>
        </div>

        <div className="flex border-b border-glr-700 mb-4 shrink-0 overflow-x-auto no-print">
             {['DETAILS', 'LOCATION', 'PHASES', 'MATERIAL', 'CREW', 'PLAN', ...(showBudget ? ['BUDGET'] : [])].map(tab => (
                 <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${activeTab === tab ? 'border-glr-accent text-white' : 'border-transparent text-gray-400 hover:text-gray-200'}`}>
                     {tab === 'DETAILS' ? 'Dettagli Evento' : tab === 'LOCATION' ? 'Scheda Location' : tab === 'PHASES' ? 'Fasi & Logistica' : tab === 'MATERIAL' ? 'Materiale' : tab === 'CREW' ? 'Crew' : tab === 'PLAN' ? 'Piano Produzione' : 'Budget'}
                 </button>
             ))}
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
            {activeTab === 'DETAILS' && (
                <div className="space-y-4 max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Titolo Evento</label>
                            <input disabled={!canEdit} type="text" value={activeJob.title} onChange={e => setActiveJob({...activeJob, title: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                            <input disabled={!canEdit} type="text" value={activeJob.client} onChange={e => setActiveJob({...activeJob, client: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Stato</label>
                            <select disabled={!canEdit} value={activeJob.status} onChange={e => setActiveJob({...activeJob, status: e.target.value as JobStatus})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white">
                                {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Location</label>
                            <div className="flex gap-2">
                                <select disabled={!canEdit} value={activeJob.locationId || "custom"} onChange={handleLocationChange} className="w-1/3 bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm">
                                    <option value="custom">Manuale...</option>{locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
                                </select>
                                <input disabled={!canEdit} type="text" value={activeJob.location} onChange={e => setActiveJob({...activeJob, location: e.target.value, locationId: undefined})} placeholder="Indirizzo" className="w-2/3 bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm text-gray-400 mb-1">Inizio Evento</label>
                             <input disabled={!canEdit} type="date" value={activeJob.startDate} onChange={e => setActiveJob({...activeJob, startDate: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                        </div>
                        <div>
                             <label className="block text-sm text-gray-400 mb-1">Fine Evento</label>
                             <input disabled={!canEdit} type="date" value={activeJob.endDate} onChange={e => setActiveJob({...activeJob, endDate: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                        </div>
                         <div className="col-span-2">
                             <label className="block text-sm text-gray-400 mb-1">Descrizione / Note</label>
                             <textarea disabled={!canEdit} value={activeJob.description} onChange={e => setActiveJob({...activeJob, description: e.target.value})} className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white h-24 text-sm" />
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'LOCATION' && (
                <div className="space-y-6">
                    {activeLocationData ? (
                        <div className="space-y-6 animate-fade-in">
                            {/* GENERAL & ACCESS */}
                            <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                <h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><MapPin size={16}/> Accesso & Contatti</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-white font-bold text-lg mb-1">{activeLocationData.name}</p>
                                        <p className="text-gray-400 text-sm mb-2">{activeLocationData.address}</p>
                                        {activeLocationData.mapsLink && <a href={activeLocationData.mapsLink} target="_blank" className="text-blue-400 text-xs hover:underline">Vedi su Maps</a>}
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p><span className="text-gray-500">Referente:</span> <span className="text-white font-bold">{activeLocationData.contactName}</span></p>
                                        <p><span className="text-gray-500">Telefono:</span> <span className="text-white font-bold">{activeLocationData.contactPhone}</span></p>
                                        <p><span className="text-gray-500">Orari:</span> <span className="text-white">{activeLocationData.accessHours}</span></p>
                                        <p><span className="text-gray-500">ZTL:</span> <span className={activeLocationData.isZtl ? 'text-red-400 font-bold' : 'text-green-400'}>{activeLocationData.isZtl ? 'ATTIVA' : 'NO'}</span></p>
                                    </div>
                                </div>
                                {activeLocationData.generalSurveyNotes && (
                                    <div className="mt-4 pt-4 border-t border-glr-700">
                                        <p className="text-xs text-gray-500 uppercase mb-1">Note Generali</p>
                                        <p className="text-sm text-gray-300 italic">"{activeLocationData.generalSurveyNotes}"</p>
                                    </div>
                                )}
                            </div>

                            {/* LOGISTICS & POWER GRID */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                    <h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Truck size={16}/> Logistica</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between"><span>Piano Scarico:</span> <span className="text-white font-bold">{activeLocationData.logistics.loadFloor}</span></div>
                                        <div className="flex justify-between"><span>Parcheggio:</span> <span className={activeLocationData.logistics.hasParking ? "text-green-400" : "text-red-400"}>{activeLocationData.logistics.hasParking ? 'SI' : 'NO'}</span></div>
                                        <div className="flex justify-between"><span>Montacarichi:</span> <span className={activeLocationData.logistics.hasLift ? "text-green-400" : "text-gray-400"}>{activeLocationData.logistics.hasLift ? 'SI' : 'NO'}</span></div>
                                        {activeLocationData.logistics.stairsDetails && <div className="text-xs text-gray-400 mt-2">Scale: {activeLocationData.logistics.stairsDetails}</div>}
                                    </div>
                                </div>
                                <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                    <h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Zap size={16}/> Corrente</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-2">
                                            {activeLocationData.power.hasCivil && <span className="bg-glr-800 px-2 py-1 rounded text-xs">Civile</span>}
                                            {activeLocationData.power.hasIndustrial && <span className="bg-glr-800 px-2 py-1 rounded text-xs">Industriale {activeLocationData.power.industrialSockets.join(', ')}</span>}
                                        </div>
                                        {activeLocationData.power.requiresGenerator && <p className="text-red-400 font-bold">Serve Generatore</p>}
                                        <p>Distanza Quadro: <span className="font-bold text-white">{activeLocationData.power.distanceFromPanel} mt</span></p>
                                    </div>
                                </div>
                            </div>

                            {/* NETWORK & EQUIPMENT */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                 <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                    <h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Network size={16}/> Rete & IT</h3>
                                    {activeLocationData.network.isUnavailable ? <p className="text-red-400 text-sm">Non Disponibile</p> : (
                                        <div className="space-y-2 text-sm">
                                            <div className="flex gap-2">
                                                {activeLocationData.network.hasWired && <span className="text-green-400">Cablata</span>}
                                                {activeLocationData.network.hasWifi && <span className="text-green-400">Wi-Fi</span>}
                                            </div>
                                            {activeLocationData.network.hasWallLan && <p>Lan Muro: {activeLocationData.network.wallLanDistance} mt</p>}
                                            <p>IP: {activeLocationData.network.addressing}</p>
                                        </div>
                                    )}
                                 </div>
                                 <div className="bg-glr-900/50 p-4 rounded-lg border border-glr-700">
                                    <h3 className="text-glr-accent font-bold uppercase text-sm mb-3 flex items-center gap-2"><Monitor size={16}/> Dotazioni Sala</h3>
                                    <div className="space-y-2 text-sm">
                                        {activeLocationData.equipment.hasPerimeterSockets && <p className="text-green-400">Prese Perimetrali Presenti</p>}
                                        {activeLocationData.equipment.audio.present && <p>Audio: {activeLocationData.equipment.audio.hasPA ? 'PA' : ''} {activeLocationData.equipment.audio.hasMics ? 'Mic' : ''}</p>}
                                        {activeLocationData.equipment.video.present && <p>Video: {activeLocationData.equipment.video.hasProjector ? 'VPR' : ''} {activeLocationData.equipment.video.hasLedwall ? 'Ledwall' : ''}</p>}
                                        {activeLocationData.equipment.hasLights && <p>Luci: Presenti</p>}
                                    </div>
                                 </div>
                            </div>
                        </div>
                    ) : <p className="text-center text-gray-500 py-10">Nessuna location selezionata.</p>}
                </div>
            )}

            {activeTab === 'PHASES' && (
                <div className="space-y-8">
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18}/> Fasi Operative</h3>
                            {canEdit && <button onClick={addPhase} className="bg-glr-700 hover:bg-glr-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Plus size={16}/> Aggiungi</button>}
                        </div>
                        <div className="space-y-2">
                            {activeJob.phases.map((phase, idx) => (
                                <div key={phase.id} className="bg-glr-900 border border-glr-700 p-2 rounded-lg flex items-center gap-2 overflow-x-auto">
                                    <span className="text-xs text-gray-500 font-bold shrink-0 w-6 text-center">{idx + 1}</span>
                                    <input disabled={!canEdit} type="text" value={phase.name} onChange={e => updatePhase(phase.id, 'name', e.target.value)} className="flex-1 min-w-[120px] bg-glr-800 border border-glr-600 rounded px-2 py-1 text-white text-xs"/>
                                    <input disabled={!canEdit} type="datetime-local" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)} className="w-32 bg-glr-800 border border-glr-600 rounded px-1 py-1 text-white text-[10px]"/>
                                    <input disabled={!canEdit} type="datetime-local" value={phase.end} onChange={e => updatePhase(phase.id, 'end', e.target.value)} className="w-32 bg-glr-800 border border-glr-600 rounded px-1 py-1 text-white text-[10px]"/>
                                    {canEdit && <button onClick={() => removePhase(phase.id)} className="text-gray-500 hover:text-red-400 p-1"><Trash2 size={14}/></button>}
                                </div>
                            ))}
                        </div>
                     </div>

                     <div className="border-t border-glr-700 pt-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold flex items-center gap-2"><Truck size={18}/> Logistica Mezzi</h3>
                            {canEdit && <button onClick={addVehicle} className="bg-glr-700 hover:bg-glr-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"><Plus size={16}/> Aggiungi Mezzo</button>}
                        </div>
                        <div className="space-y-2">
                            {activeJob.vehicles.map(v => (
                                <div key={v.id} className="bg-glr-900 border border-glr-700 p-3 rounded-lg">
                                    <div className="flex gap-2 mb-2">
                                        <select disabled={!canEdit} value={v.type} onChange={e => updateVehicle(v.id, 'type', e.target.value)} className="bg-glr-800 border border-glr-600 rounded text-white text-sm p-1 w-32">
                                            {Object.values(VehicleType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                        <input disabled={!canEdit} type="number" min="1" value={v.quantity} onChange={e => updateVehicle(v.id, 'quantity', parseInt(e.target.value))} className="w-16 bg-glr-800 border border-glr-600 rounded text-white text-sm p-1 text-center"/>
                                        <label className="flex items-center gap-2 text-sm text-gray-300 ml-2"><input disabled={!canEdit} type="checkbox" checked={v.isRental} onChange={e => updateVehicle(v.id, 'isRental', e.target.checked)}/> Noleggio</label>
                                        {canEdit && <button onClick={() => removeVehicle(v.id)} className="ml-auto text-gray-500 hover:text-red-400"><Trash2 size={16}/></button>}
                                    </div>
                                    {v.isRental && (
                                        <div className="grid grid-cols-2 gap-2 mt-2 p-2 bg-glr-800/50 rounded">
                                            <input disabled={!canEdit} type="text" placeholder="Fornitore" value={v.rentalCompany} onChange={e => updateVehicle(v.id, 'rentalCompany', e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-1 text-xs text-white"/>
                                            <input disabled={!canEdit} type="number" placeholder="Costo €" value={v.cost || ''} onChange={e => updateVehicle(v.id, 'cost', parseFloat(e.target.value))} className="w-full bg-glr-900 border border-glr-600 rounded p-1 text-xs text-white"/>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                     </div>
                </div>
            )}

            {activeTab === 'MATERIAL' && (
                <div className="flex flex-col lg:flex-row gap-6 h-full">
                    {/* LEFT COLUMN: INPUTS & QUICK ITEMS */}
                    {canEdit && (
                        <div className="lg:w-1/3 flex flex-col gap-4">
                            {/* Main Adder */}
                            <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><Package size={16}/> Aggiungi Materiale</h4>
                                
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => setIsCatalogOpen(true)} className="flex-1 bg-glr-accent text-glr-900 font-bold py-2 rounded hover:bg-amber-400 flex items-center justify-center gap-2 text-xs"><ClipboardCheck size={16}/> Catalogo</button>
                                    <button onClick={() => setIsImportKitModalOpen(true)} className="flex-1 bg-blue-600 text-white font-bold py-2 rounded hover:bg-blue-500 flex items-center justify-center gap-2 text-xs"><ArrowDownCircle size={16}/> Importa Kit</button>
                                </div>

                                <div className="flex gap-2 mb-2">
                                    <button onClick={() => setMatSource('INVENTORY')} className={`flex-1 text-xs py-1 rounded ${matSource === 'INVENTORY' ? 'bg-glr-700 text-white' : 'bg-glr-800 text-gray-400'}`}>Magazzino</button>
                                    <button onClick={() => setMatSource('EXTERNAL')} className={`flex-1 text-xs py-1 rounded ${matSource === 'EXTERNAL' ? 'bg-orange-900/50 text-orange-200 border border-orange-800' : 'bg-glr-800 text-gray-400'}`}>Esterno</button>
                                </div>

                                {matSource === 'INVENTORY' ? (
                                    <>
                                        <div className="flex gap-2 mb-2">
                                            <select value={invCategoryFilter} onChange={e => setInvCategoryFilter(e.target.value)} className="w-1/2 bg-glr-800 border border-glr-600 rounded text-white text-xs p-2"><option value="ALL">Cat: Tutte</option><option>Audio</option><option>Video</option><option>Luci</option><option>Cavi</option><option>Strutture</option></select>
                                            <select value={invTypeFilter} onChange={e => setInvTypeFilter(e.target.value)} className="w-1/2 bg-glr-800 border border-glr-600 rounded text-white text-xs p-2">{availableTypes.map(t => <option key={t} value={t}>{t === 'ALL' ? 'Tipo: Tutti' : t}</option>)}</select>
                                        </div>
                                        <select value={newMatInventoryId} onChange={e => setNewMatInventoryId(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-2 text-white text-xs mb-2 outline-none">
                                            <option value="">Seleziona Articolo...</option>
                                            {filteredInventory.map(i => (<option key={i.id} value={i.id}>[{i.category}] {i.name} (Disp: {i.quantityOwned})</option>))}
                                        </select>
                                    </>
                                ) : (
                                    <div className="space-y-2 mb-2">
                                        <input type="text" placeholder="Nome Materiale" value={newMatName} onChange={e => setNewMatName(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-2 text-white text-sm" />
                                        <input type="number" placeholder="Costo Noleggio €" value={newMatCost || ''} onChange={e => setNewMatCost(parseFloat(e.target.value))} className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-2 text-white text-sm" />
                                    </div>
                                )}
                                
                                <input type="text" placeholder="Note opzionali..." value={newMatNotes} onChange={e => setNewMatNotes(e.target.value)} className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-2 text-white text-xs mb-2"/>
                                <div className="flex gap-2">
                                    <input type="number" min="1" value={newMatQty} onChange={e => setNewMatQty(parseInt(e.target.value))} className="w-16 bg-glr-800 border border-glr-600 rounded px-2 py-2 text-white text-sm text-center" />
                                    <button onClick={addManualMaterial} className="flex-1 bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-3 py-1 rounded font-bold transition-colors"><Plus size={18} className="inline mr-1"/> Aggiungi</button>
                                </div>
                            </div>

                            {/* QUICK ITEMS SECTION */}
                            <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                                <h4 className="text-white font-semibold mb-3 flex items-center gap-2 text-xs uppercase"><Lightbulb size={14} className="text-glr-accent"/> Potrebbe servire</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {QUICK_ITEMS.map((qItem) => {
                                        const isAdded = activeJob.materialList.some(m => m.name === qItem.name);
                                        // Logic to detect if Router 5G should flash
                                        const isRouterNeeded = qItem.name === 'Router 5G' && activeLocationData?.network.isUnavailable && !isAdded;
                                        
                                        return (
                                            <button key={qItem.name} onClick={() => handleQuickItemToggle(qItem)} 
                                                className={`text-xs p-2 rounded border transition-all flex items-center justify-between ${isAdded ? 'bg-glr-accent text-glr-900 border-glr-accent font-bold' : 'bg-glr-800 text-gray-400 border-glr-700 hover:text-white'} ${isRouterNeeded ? 'animate-pulse border-red-500 bg-red-900/20 text-red-300 ring-1 ring-red-500' : ''}`}>
                                                {qItem.name}
                                                {isAdded && <Check size={12}/>}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* RIGHT COLUMN: LIST */}
                    <div className="flex-1 bg-glr-900 rounded-xl border border-glr-700 overflow-hidden flex flex-col">
                        <div className="overflow-y-auto flex-1 p-2">
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Rete', 'Accessori', 'Altro'].map(cat => {
                            const items = materialByCategory[cat];
                            if (!items || items.length === 0) return null;
                            return (
                                <div key={cat} className="mb-4 last:mb-0">
                                    <div className="bg-glr-800 px-3 py-1.5 flex items-center gap-2 text-xs font-bold text-glr-accent uppercase tracking-wider rounded-t-lg border-b border-glr-700">{getCategoryIcon(cat)} {cat}</div>
                                    <table className="w-full text-left text-sm bg-glr-800/20">
                                        <tbody className="divide-y divide-glr-800/50">
                                            {items.map((item) => (
                                                <tr key={item.id} className="hover:bg-glr-800/50 group">
                                                    <td className="pl-3 py-2 font-medium text-white w-1/3">
                                                        {item.name}
                                                        <div className="text-[10px] text-gray-500">{item.category} {item.type ? `• ${item.type}` : ''} {item.isExternal && <span className="text-orange-400 ml-1">(Ext)</span>}</div>
                                                    </td>
                                                    <td className="py-2 w-1/3">
                                                        <input type="text" value={item.notes || ''} onChange={e => updateItemNotes(item.id, e.target.value)} className="bg-transparent border-b border-transparent hover:border-gray-600 text-xs text-gray-300 w-full focus:border-glr-accent focus:outline-none" placeholder="Note..."/>
                                                    </td>
                                                    <td className="py-2 text-right pr-2 w-24">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {canEdit && <button onClick={() => updateItemQuantity(item.id, -1)} className="p-0.5 hover:bg-glr-700 rounded text-gray-500"><Minus size={12}/></button>}
                                                            <span className="font-bold text-glr-accent w-6 text-center">{item.quantity}</span>
                                                            {canEdit && <button onClick={() => updateItemQuantity(item.id, 1)} className="p-0.5 hover:bg-glr-700 rounded text-gray-500"><Plus size={12}/></button>}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 text-right w-8">{canEdit && <button onClick={() => setActiveJob({...activeJob, materialList: activeJob.materialList.filter(m => m.id !== item.id)})} className="text-gray-600 hover:text-red-400"><X size={14}/></button>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                        </div>
                    </div>

                    {/* IMPORT KIT MODAL */}
                    {isImportKitModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                            <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md shadow-2xl animate-fade-in">
                                <div className="p-4 border-b border-glr-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-white">Importa Kit Standard</h3>
                                    <button onClick={() => setIsImportKitModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                                </div>
                                <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto">
                                    {standardLists.length === 0 && <p className="text-gray-500 italic text-center">Nessun kit salvato.</p>}
                                    {standardLists.map(list => (
                                        <button key={list.id} onClick={() => handleImportKit(list)} className="w-full text-left bg-glr-900 border border-glr-700 p-3 rounded hover:border-glr-accent transition-colors">
                                            <h4 className="font-bold text-white">{list.name}</h4>
                                            <p className="text-xs text-gray-400">{list.items.length} articoli</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CATALOG MODAL */}
                    {isCatalogOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                            <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-5xl h-[80vh] flex flex-col shadow-2xl animate-fade-in">
                                <div className="p-4 border-b border-glr-700 flex justify-between items-center shrink-0">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><ClipboardCheck className="text-glr-accent"/> Catalogo Rapido</h3>
                                    <button onClick={() => setIsCatalogOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                                </div>
                                <div className="p-4 bg-glr-900 border-b border-glr-700 flex gap-4 shrink-0 overflow-x-auto">
                                     {['ALL', 'Audio', 'Video', 'Luci', 'Strutture', 'Cavi'].map(cat => (
                                         <button key={cat} onClick={() => setCatalogCategory(cat)} className={`px-4 py-2 rounded text-sm font-bold whitespace-nowrap transition-colors ${catalogCategory === cat ? 'bg-glr-accent text-glr-900' : 'bg-glr-800 text-gray-400 hover:text-white'}`}>{cat === 'ALL' ? 'Tutto' : cat}</button>
                                     ))}
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {catalogItems.map(item => (
                                            <div key={item.id} className="bg-glr-900 border border-glr-700 p-3 rounded hover:border-glr-500 cursor-pointer group relative" onClick={() => handleCatalogAdd(item)}>
                                                <h4 className="text-sm font-bold text-white leading-tight mb-1">{item.name}</h4>
                                                <div className="mt-2 text-[10px] text-gray-500">Disp: {item.quantityOwned}</div>
                                                {addedFeedback[item.id] && (
                                                    <div className="absolute inset-0 bg-green-600/90 flex items-center justify-center rounded animate-fade-in font-bold text-white">OK</div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {activeTab === 'CREW' && (
                <div>
                     <h3 className="text-glr-accent font-semibold uppercase text-sm tracking-wider mb-4 flex items-center gap-2"><UserPlus size={16}/> Assegnazione Tecnici</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {crew.map(c => {
                            const isAssigned = activeJob.assignedCrew.includes(c.id);
                            return (
                                <button key={c.id} onClick={() => canEdit && toggleCrewAssignment(c.id)} disabled={!canEdit} className={`p-3 rounded border text-left transition-all ${isAssigned ? 'bg-green-600/20 border-green-500 text-green-100' : 'bg-glr-900 border-glr-700 text-gray-400'}`}>
                                    <div className="flex justify-between items-center"><span className="font-bold text-sm">{c.name}</span>{isAssigned && <Check size={16} />}</div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'BUDGET' && showBudget && (
                <div className="space-y-6 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-glr-900 p-4 rounded-lg border border-glr-700">
                            <p className="text-xs text-gray-400 uppercase">Totale Personale (Ext)</p>
                            <p className="text-xl font-bold text-white">€ {budget.freelance.toFixed(2)}</p>
                        </div>
                        <div className="bg-glr-900 p-4 rounded-lg border border-glr-700">
                            <p className="text-xs text-gray-400 uppercase">Materiale Extra</p>
                            <p className="text-xl font-bold text-white">€ {budget.materials.toFixed(2)}</p>
                        </div>
                        <div className="bg-glr-900 p-4 rounded-lg border border-glr-700">
                            <p className="text-xs text-gray-400 uppercase">Logistica & Spese</p>
                            <p className="text-xl font-bold text-white">€ {(budget.vehicles + budget.expenses).toFixed(2)}</p>
                        </div>
                        <div className="bg-green-900/20 p-4 rounded-lg border border-green-800">
                            <p className="text-xs text-green-300 uppercase font-bold">Costo Totale Evento</p>
                            <p className="text-2xl font-bold text-green-400">€ {budget.total.toFixed(2)}</p>
                        </div>
                    </div>
                    <div className="bg-glr-900/50 p-4 rounded border border-glr-700 text-sm text-gray-400">
                        <p className="flex gap-2"><Info size={16}/> <span>Il calcolo include: tariffe giornaliere dei freelance per la durata dell'evento, noleggio materiale esterno, costi furgoni a noleggio e rimborsi spese approvati collegati a questo lavoro.</span></p>
                    </div>
                </div>
            )}

            {activeTab === 'PLAN' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center no-print">
                        <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList size={18}/> Piano di Produzione</h3>
                        <button onClick={handlePrint} className="bg-glr-accent text-glr-900 font-bold px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-400"><Printer size={16}/> Stampa PDF</button>
                    </div>
                    
                    <div className="bg-white text-black p-8 rounded shadow-lg min-h-[1000px] font-sans print-only">
                        <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
                            <div className="flex items-center gap-4">
                                {settings?.logoUrl ? <img src={settings.logoUrl} className="w-16 h-16 object-contain" alt="GLR" /> : <div className="w-16 h-16 bg-black text-white flex items-center justify-center font-bold text-2xl rounded">GLR</div>}
                                <div><h1 className="text-xl font-bold uppercase tracking-tight text-black">{settings?.companyName || 'GLR Productions'}</h1></div>
                            </div>
                            <div className="text-right"><h2 className="text-2xl font-bold uppercase tracking-tight text-black">Piano di Produzione</h2></div>
                        </div>
                        <div className="mb-8 p-4 bg-white border border-black rounded-lg">
                            <div className="grid grid-cols-2 gap-y-2 gap-x-8 text-sm text-black">
                                <div className="flex border-b border-gray-300 py-1"><span className="font-bold w-24">Titolo:</span> {activeJob.title}</div>
                                <div className="flex border-b border-gray-300 py-1"><span className="font-bold w-24">Location:</span> {activeJob.location}</div>
                            </div>
                        </div>
                        <div className="mb-8">
                            <h3 className="text-lg font-bold uppercase border-b-2 border-black mb-3 pb-1 text-black">Programma Orario</h3>
                            <table className="w-full text-sm text-left border-collapse border border-black">
                                <thead className="bg-gray-100 text-black uppercase font-bold text-xs">
                                    <tr><th className="p-2 border border-black">Fase</th><th className="p-2 border border-black">Inizio</th><th className="p-2 border border-black">Fine</th></tr>
                                </thead>
                                <tbody className="text-black">
                                    {activeJob.phases.map(p => (<tr key={p.id}><td className="p-2 border border-black font-bold">{p.name}</td><td className="p-2 border border-black">{p.start.replace('T', ' ')}</td><td className="p-2 border border-black">{p.end.replace('T', ' ')}</td></tr>))}
                                </tbody>
                            </table>
                        </div>
                        <div className="page-break"></div>
                        <div className="border-b-2 border-black pb-4 mb-6 pt-8 flex justify-between items-center">
                             <div className="flex items-center gap-4">
                                {settings?.logoUrl && <img src={settings.logoUrl} className="w-12 h-12 object-contain" alt="GLR" />}
                                <div><h1 className="text-2xl font-bold uppercase tracking-tight text-black">Packing List</h1></div>
                            </div>
                        </div>
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi'].map(cat => {
                            const items = materialByCategory[cat];
                            if (!items || items.length === 0) return null;
                            return (
                                <div key={cat} className="mb-6 break-inside-avoid">
                                    <h4 className="font-bold uppercase bg-gray-200 text-black border border-black px-3 py-1 mb-0 text-sm">{cat}</h4>
                                    <table className="w-full text-sm border-collapse border border-black">
                                        <thead className="bg-gray-100 text-xs uppercase text-black"><tr><th className="border border-black p-2 w-12 text-center">Chk</th><th className="border border-black p-2 text-left">Articolo</th><th className="border border-black p-2 text-center w-16">Qtà</th></tr></thead>
                                        <tbody className="text-black">
                                            {items.map(m => (
                                                <tr key={m.id}>
                                                    <td className="border border-black p-2 text-center align-middle"><div className="w-4 h-4 border border-black mx-auto"></div></td>
                                                    <td className="border border-black p-2 font-bold align-middle">{m.name}</td>
                                                    <td className="border border-black p-2 text-center font-bold text-lg align-middle">{m.quantity}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}
        </div>

        {isTemplateModalOpen && (
             <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print">
                <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-lg shadow-2xl animate-fade-in flex flex-col max-h-[80vh]">
                     <div className="p-4 border-b border-glr-700 flex justify-between items-center">
                         <h3 className="text-lg font-bold text-white flex items-center gap-2"><Copy size={18}/> Crea da Lavoro Esistente</h3>
                         <button onClick={() => setIsTemplateModalOpen(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
                     </div>
                     <div className="flex-1 overflow-y-auto p-4 space-y-2">
                         {jobs.map(j => (
                             <button key={j.id} onClick={() => handleCreateFromExisting(j)} className="w-full text-left bg-glr-900 border border-glr-700 p-3 rounded hover:border-glr-accent transition-colors group">
                                 <h4 className="font-bold text-white group-hover:text-glr-accent">{j.title}</h4>
                                 <p className="text-xs text-gray-400">{j.client} • {j.location}</p>
                             </button>
                         ))}
                     </div>
                </div>
             </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-white">Schede Lavoro</h2></div>
        <div className="flex flex-col sm:flex-row gap-3 items-center w-full md:w-auto">
             <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700 w-full sm:w-auto">
                <button onClick={() => setViewMode('TIMELINE')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors ${viewMode === 'TIMELINE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><List size={16}/><span className="hidden sm:inline">Timeline</span></button>
                <button onClick={() => setViewMode('ARCHIVE')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-sm flex items-center justify-center gap-2 transition-colors ${viewMode === 'ARCHIVE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><Archive size={16}/><span className="hidden sm:inline">Archivio</span></button>
             </div>
             
             {viewMode !== 'ARCHIVE' && (
                 <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                     <button onClick={() => setStatusFilter(statusFilter === 'ACTIVE' ? 'ALL' : 'ACTIVE')} className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${statusFilter === 'ACTIVE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}>
                         {statusFilter === 'ACTIVE' ? 'Solo Attivi' : 'Tutti'}
                     </button>
                 </div>
             )}

             <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-2.5 text-gray-400" size={16}/>
                 <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full bg-glr-800 border border-glr-700 rounded-lg pl-10 pr-4 py-1.5 text-white text-sm focus:border-glr-accent outline-none"/>
             </div>
             {canEdit && (
                <div className="flex gap-2">
                     <button onClick={() => setIsTemplateModalOpen(true)} className="flex items-center justify-center gap-2 bg-glr-800 border border-glr-700 text-gray-300 font-bold px-3 py-1.5 rounded-lg hover:bg-glr-700 transition-colors" title="Da Modello"><Copy size={18} /></button>
                     <button onClick={handleNewJob} className="flex items-center justify-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-1.5 rounded-lg hover:bg-amber-400 transition-colors"><Plus size={18} /> <span className="hidden sm:inline">Nuova</span></button>
                </div>
             )}
        </div>
      </div>

        {/* --- TIMELINE VIEW --- */}
        {viewMode === 'TIMELINE' && (
            <div className="space-y-6 animate-fade-in">
                {timelineWeeks.length === 0 && <p className="text-center text-gray-500 py-10">Nessun lavoro trovato per questo periodo.</p>}
                {timelineWeeks.map((week, index) => (
                    <div key={index} className="bg-glr-900 border border-glr-700 rounded-xl overflow-hidden">
                        <div className="bg-glr-800 px-4 py-3 border-b border-glr-700 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <CalendarRange size={16} className="text-glr-accent"/>
                                {week.start.toLocaleDateString()} - {week.end.toLocaleDateString()}
                            </h3>
                            <span className="text-xs bg-glr-900 text-gray-400 px-2 py-1 rounded">{week.jobs.length} Lavori</span>
                        </div>
                        <div className="divide-y divide-glr-700/50">
                            {week.jobs.map(job => (
                                <div key={job.id} onClick={() => { setActiveJob(job); setIsEditing(true); }} className="p-4 hover:bg-glr-800/50 cursor-pointer transition-colors flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: job.status === JobStatus.CONFIRMED ? '#22c55e' : job.status === JobStatus.DRAFT ? '#9ca3af' : '#3b82f6' }}></div>
                                        <div>
                                            <h4 className="font-bold text-white group-hover:text-glr-accent">{job.title}</h4>
                                            <p className="text-xs text-gray-400">{job.client}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-300">
                                        <span className="hidden sm:flex items-center gap-1 w-32"><Calendar size={14}/> {new Date(job.startDate).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'})}</span>
                                        <span className="hidden md:flex items-center gap-1 w-48 truncate"><MapPin size={14}/> {job.location || 'N/D'}</span>
                                        <span className="hidden lg:flex items-center gap-1"><Briefcase size={14}/> {job.assignedCrew.length}</span>
                                        <div className="w-24 text-right">{getStatusBadge(job.status)}</div>
                                        <ChevronRight size={16} className="text-gray-600"/>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}

       {viewMode === 'ARCHIVE' && (
           <div className="bg-glr-800 rounded-xl border border-glr-700 p-4">
               {Object.keys(archiveTree).sort((a,b) => b.localeCompare(a)).map(year => (
                   <div key={year} className="mb-2">
                       <button 
                            onClick={() => setExpandedYears(p => ({...p, [year]: !p[year]}))}
                            className="w-full flex items-center gap-2 p-3 bg-glr-900 rounded-lg hover:bg-glr-700 transition-colors text-left"
                       >
                           {expandedYears[year] ? <FolderOpen size={18} className="text-glr-accent"/> : <Folder size={18} className="text-gray-400"/>}
                           <span className="font-bold text-white">{year}</span>
                       </button>
                       
                       {expandedYears[year] && (
                           <div className="ml-4 pl-4 border-l border-glr-700 mt-2 space-y-2">
                               {Object.keys(archiveTree[year]).map(month => (
                                   <div key={month}>
                                       <button 
                                            onClick={() => setExpandedMonths(p => ({...p, [year+month]: !p[year+month]}))}
                                            className="w-full flex items-center gap-2 p-2 hover:text-white text-gray-400 text-sm"
                                       >
                                           {expandedMonths[year+month] ? <FolderOpen size={14}/> : <Folder size={14}/>}
                                           <span>{month}</span>
                                           <span className="text-[10px] bg-glr-900 px-1.5 rounded">{archiveTree[year][month].length}</span>
                                       </button>
                                       {expandedMonths[year+month] && (
                                           <div className="ml-6 grid gap-2 mt-1">
                                               {archiveTree[year][month].map(job => (
                                                   <div key={job.id} onClick={() => { setActiveJob(job); setIsEditing(true); }} className="flex items-center gap-2 text-xs text-gray-300 hover:text-glr-accent cursor-pointer p-1">
                                                       <FilePlus size={12}/> {job.title}
                                                   </div>
                                               ))}
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               ))}
           </div>
       )}
    </div>
  );
};
