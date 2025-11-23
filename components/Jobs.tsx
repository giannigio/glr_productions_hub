
import React, { useState, useMemo } from 'react';
import { Job, JobStatus, MaterialItem, CrewMember, Location, InventoryItem, JobPhase, JobVehicle, VehicleType, OutfitType } from '../types';
import { generateEquipmentList } from '../services/geminiService';
import { checkAvailability } from '../services/api';
import { Plus, Calendar, MapPin, Trash2, Edit3, Wand2, UserPlus, Package, Check, Plane, Clock, X, Truck, AlertTriangle, StickyNote, Building2, Shirt, AlertOctagon, Info, ClipboardList, Speaker, Monitor, Zap, Box, Cable, ChevronRight, Sparkles, Search, Radio, ArrowRightCircle } from 'lucide-react';

interface JobsProps {
  jobs: Job[];
  crew: CrewMember[];
  locations: Location[];
  inventory: InventoryItem[]; 
  onAddJob: (job: Job) => void;
  onUpdateJob: (job: Job) => void;
  onDeleteJob: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

export const Jobs: React.FC<JobsProps> = ({ jobs, crew, locations, inventory, onAddJob, onUpdateJob, onDeleteJob, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeJob, setActiveJob] = useState<Job | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'PHASES' | 'MATERIAL' | 'CREW' | 'PLAN' | 'BUDGET'>('DETAILS');

  // Manual material add state
  const [matSource, setMatSource] = useState<'INVENTORY' | 'EXTERNAL'>('INVENTORY');
  const [newMatInventoryId, setNewMatInventoryId] = useState('');
  const [newMatName, setNewMatName] = useState('');
  const [newMatCategory, setNewMatCategory] = useState('Audio');
  const [newMatType, setNewMatType] = useState(''); 
  const [newMatQty, setNewMatQty] = useState(1);
  const [newMatSupplier, setNewMatSupplier] = useState('');
  const [newMatCost, setNewMatCost] = useState(0);
  const [newMatNotes, setNewMatNotes] = useState('');
  
  // Inventory Search State
  const [invSearchTerm, setInvSearchTerm] = useState('');
  const [invCategoryFilter, setInvCategoryFilter] = useState('ALL');

  // Vehicle add state
  const [newVehicleType, setNewVehicleType] = useState<VehicleType>(VehicleType.DUCATO);
  const [newVehicleQty, setNewVehicleQty] = useState(1);
  const [isVehicleRental, setIsVehicleRental] = useState(false);
  const [rentalCompany, setRentalCompany] = useState('');
  const [rentalCost, setRentalCost] = useState(0);
  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  const canEdit = currentUser?.role === 'ADMIN' || currentUser?.role === 'MANAGER';
  const showBudget = currentUser?.role === 'ADMIN';

  const handleNewJob = () => {
    const newJob: Job = {
      id: Date.now().toString(),
      title: '',
      client: '',
      location: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      status: JobStatus.DRAFT,
      description: '',
      departments: [],
      isAwayJob: false,
      isSubcontracted: false,
      outfitNoLogo: false,
      phases: [],
      vehicles: [],
      materialList: [],
      assignedCrew: [],
      notes: ''
    };
    setActiveJob(newJob);
    setIsEditing(true);
    setActiveTab('DETAILS');
  };

  const handleDuplicateJob = (jobToDuplicate: Job) => {
      const newJob: Job = {
          ...jobToDuplicate,
          id: Date.now().toString(),
          title: `${jobToDuplicate.title} (Copia)`,
          status: JobStatus.DRAFT,
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          assignedCrew: [], // Reset crew for safety
          phases: [] // Reset phases as dates change
      };
      onAddJob(newJob);
  };

  const handleSave = () => {
    if (activeJob) {
      const exists = jobs.find(j => j.id === activeJob.id);
      if (exists) {
        onUpdateJob(activeJob);
      } else {
        onAddJob(activeJob);
      }
      setIsEditing(false);
      setActiveJob(null);
    }
  };

  const handleAIGenerate = async () => {
    if (!activeJob?.description) return;
    setIsGenerating(true);
    const materials = await generateEquipmentList(activeJob.description, activeJob.title);
    const processedMats = materials.map(m => ({
        ...m,
        isExternal: false,
        notes: ''
    }));
    setActiveJob(prev => prev ? { ...prev, materialList: [...prev.materialList, ...processedMats] } : null);
    setIsGenerating(false);
  };

  // Helper to add item to list (reusable for suggestions)
  const addItemToList = (itemData: MaterialItem) => {
      setActiveJob(prev => {
          if (!prev) return null;
          return { ...prev, materialList: [...prev.materialList, itemData] };
      });
  };

  const addManualMaterial = () => {
      if (!activeJob) return;
      
      let newItem: MaterialItem;

      if (matSource === 'INVENTORY') {
          const invItem = inventory.find(i => i.id === newMatInventoryId);
          if (invItem) {
              newItem = {
                  id: Date.now().toString(),
                  inventoryId: invItem.id,
                  name: invItem.name,
                  category: invItem.category,
                  type: invItem.type,
                  quantity: newMatQty,
                  isExternal: false,
                  notes: newMatNotes
              };
          } else return;
      } else {
          // External
          newItem = {
              id: Date.now().toString(),
              name: newMatName || 'Materiale Esterno',
              category: newMatCategory as any,
              type: newMatType,
              quantity: newMatQty,
              isExternal: true,
              supplier: newMatSupplier,
              cost: newMatCost,
              notes: newMatNotes
          };
      }

      addItemToList(newItem);
      
      // Reset fields
      setNewMatInventoryId('');
      setNewMatName('');
      setNewMatType('');
      setNewMatQty(1);
      setNewMatSupplier('');
      setNewMatCost(0);
      setNewMatNotes('');
      setInvSearchTerm(''); 
  };

  const toggleCrewAssignment = (crewId: string) => {
    if (!activeJob) return;
    const current = activeJob.assignedCrew;
    const updated = current.includes(crewId) 
      ? current.filter(id => id !== crewId)
      : [...current, crewId];
    setActiveJob({ ...activeJob, assignedCrew: updated });
  };

  const toggleDepartment = (dept: string) => {
      if (!activeJob) return;
      const current = activeJob.departments || [];
      const updated = current.includes(dept) ? current.filter(d => d !== dept) : [...current, dept];
      setActiveJob({...activeJob, departments: updated});
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const locId = e.target.value;
      if (!activeJob) return;

      if (locId === "custom") {
          setActiveJob({...activeJob, locationId: undefined, location: ''});
      } else {
          const selectedLoc = locations.find(l => l.id === locId);
          if (selectedLoc) {
              setActiveJob({...activeJob, locationId: selectedLoc.id, location: selectedLoc.name});
          }
      }
  };

  const addPhase = () => {
      if (!activeJob) return;
      const newPhase: JobPhase = {
          id: Date.now().toString(),
          name: '',
          start: `${activeJob.startDate}T09:00`,
          end: `${activeJob.startDate}T18:00`
      };
      setActiveJob({...activeJob, phases: [...activeJob.phases, newPhase]});
  };

  const removePhase = (phaseId: string) => {
      if(!activeJob) return;
      setActiveJob({...activeJob, phases: activeJob.phases.filter(p => p.id !== phaseId)});
  }

  const updatePhase = (phaseId: string, field: keyof JobPhase, value: any) => {
      if(!activeJob) return;
      setActiveJob({...activeJob, phases: activeJob.phases.map(p => p.id === phaseId ? {...p, [field]: value} : p)});
  }

  const addVehicle = () => {
      if (!activeJob) return;
      const vehicle: JobVehicle = {
          id: Date.now().toString(),
          type: newVehicleType,
          quantity: newVehicleQty,
          isRental: isVehicleRental,
          rentalCompany: isVehicleRental ? rentalCompany : undefined,
          pickupDate: isVehicleRental ? pickupDate : undefined,
          returnDate: isVehicleRental ? returnDate : undefined,
          cost: isVehicleRental ? rentalCost : undefined
      };
      setActiveJob({...activeJob, vehicles: [...(activeJob.vehicles || []), vehicle]});
      
      setNewVehicleQty(1);
      setRentalCompany('');
      setRentalCost(0);
      setIsVehicleRental(false);
  };

  // Availability Check Helper
  const inventoryStatus = useMemo(() => {
      if (!activeJob || !newMatInventoryId || matSource !== 'INVENTORY') return null;
      
      const item = inventory.find(i => i.id === newMatInventoryId);
      if(!item) return null;

      const check = checkAvailability(newMatInventoryId, activeJob.startDate, activeJob.endDate, activeJob.id);
      
      return {
          ...check,
          itemTotal: item.quantityOwned,
          itemName: item.name
      };
  }, [newMatInventoryId, activeJob, matSource, inventory]);

  // Filter Inventory for Dropdown
  const filteredInventory = useMemo(() => {
      const s = invSearchTerm.toLowerCase();
      return inventory.filter(i => {
          const matchSearch = i.name.toLowerCase().includes(s) || 
                              (i.type && i.type.toLowerCase().includes(s)) ||
                              (i.serialNumber && i.serialNumber.toLowerCase().includes(s));
          const matchCat = invCategoryFilter === 'ALL' || i.category === invCategoryFilter;
          return matchSearch && matchCat;
      });
  }, [inventory, invSearchTerm, invCategoryFilter]);
  
  // SUGGESTIONS ENGINE
  const suggestions = useMemo(() => {
      if (matSource !== 'INVENTORY' || !newMatInventoryId) return [];
      const selected = inventory.find(i => i.id === newMatInventoryId);
      if (!selected || !selected.accessories) return [];

      // Split CSV accessories
      const relatedTerms = selected.accessories.split(/[,;]/).map(t => t.trim()).filter(t => t.length > 2);
      return relatedTerms;
  }, [newMatInventoryId, inventory, matSource]);

  // SMART SUGGESTION LOGIC
  const handleAcceptSuggestion = (suggestionTerm: string) => {
      if (!activeJob) return;

      // 1. First, ensure the MAIN selected item is added to the list (if not already added manually)
      const mainItem = inventory.find(i => i.id === newMatInventoryId);
      if (mainItem) {
          // Check if already in list to avoid duplicates in the same click action (basic check)
          // We force add it because user clicked a "bundle" action effectively
          const newItem: MaterialItem = {
              id: Date.now().toString(),
              inventoryId: mainItem.id,
              name: mainItem.name,
              category: mainItem.category,
              type: mainItem.type,
              quantity: newMatQty,
              isExternal: false,
              notes: newMatNotes
          };
          addItemToList(newItem);
      }

      // 2. Now handle the suggestion
      // Search inventory for the suggested term
      const matches = inventory.filter(i => 
          i.name.toLowerCase().includes(suggestionTerm.toLowerCase()) || 
          (i.type && i.type.toLowerCase().includes(suggestionTerm.toLowerCase()))
      );

      if (matches.length === 1) {
          // Exact/Single match found? ADD IT AUTOMATICALLY!
          const suggestionItem = matches[0];
          const newSugItem: MaterialItem = {
              id: (Date.now() + 1).toString(), // Offset ID
              inventoryId: suggestionItem.id,
              name: suggestionItem.name,
              category: suggestionItem.category,
              type: suggestionItem.type,
              quantity: 1, // Default to 1 for suggestion
              isExternal: false,
              notes: 'Suggerimento automatico'
          };
          addItemToList(newSugItem);
          
          // Reset Main Item selection to allow fresh start or keep it?
          // Let's reset to clean up UI
          setNewMatInventoryId('');
          setInvSearchTerm('');
          
      } else if (matches.length > 1) {
          // Multiple matches (e.g. "Cavo" -> 50 types). 
          // Filter the dropdown to show these matches so user can pick the specific one.
          setInvSearchTerm(suggestionTerm);
          setInvCategoryFilter('ALL');
          // Reset the main item selection so they can pick the suggestion now
          setNewMatInventoryId('');
      }
  };

  // Grouped Material Logic
  const materialByCategory = useMemo(() => {
    if (!activeJob) return {};
    const groups: Record<string, MaterialItem[]> = {
        'Audio': [], 'Video': [], 'Luci': [], 'Strutture': [], 'Cavi': []
    };
    activeJob.materialList.forEach(item => {
        if (groups[item.category]) {
            groups[item.category].push(item);
        } else {
             if(!groups['Altro']) groups['Altro'] = [];
             groups['Altro'].push(item);
        }
    });
    return groups;
  }, [activeJob?.materialList]);

  // Budget Calculations
  const budget = useMemo(() => {
      if (!activeJob) return { crew: 0, materials: 0, vehicles: 0, expenses: 0, total: 0 };
      const jobDays = (new Date(activeJob.endDate).getTime() - new Date(activeJob.startDate).getTime()) / (1000 * 3600 * 24) + 1;
      const crewCost = activeJob.assignedCrew.reduce((acc, crewId) => {
          const c = crew.find(m => m.id === crewId);
          if(c?.type === 'Esterno') { 
              return acc + (c.dailyRate * jobDays);
          }
          return acc;
      }, 0);
      const materialsCost = activeJob.materialList.reduce((acc, item) => acc + (item.cost || 0), 0);
      const vehiclesCost = activeJob.vehicles.reduce((acc, v) => acc + (v.cost || 0), 0);
      const expensesCost = crew.reduce((acc, c) => {
          const jobExpenses = (c.expenses || []).filter(e => e.jobId === activeJob.id && e.status !== 'Rifiutato');
          return acc + jobExpenses.reduce((sum, e) => sum + e.amount, 0);
      }, 0);

      return {
          crew: crewCost,
          materials: materialsCost,
          vehicles: vehiclesCost,
          expenses: expensesCost,
          total: crewCost + materialsCost + vehiclesCost + expensesCost
      };
  }, [activeJob, crew]);

  const getCategoryIcon = (cat: string) => {
    switch(cat) {
        case 'Audio': return <Speaker size={16}/>;
        case 'Video': return <Monitor size={16}/>;
        case 'Luci': return <Zap size={16}/>;
        case 'Strutture': return <Box size={16}/>;
        case 'Cavi': return <Cable size={16}/>;
        case 'Rulle': return <Radio size={16}/>;
        default: return <Package size={16}/>;
    }
  };

  // List Filtering Logic
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'GRID' | 'MONTHLY' | 'ANNUAL'>('GRID');

  const filteredJobs = useMemo(() => {
      return jobs.filter(j => {
          const matchSearch = j.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              j.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              j.location.toLowerCase().includes(searchTerm.toLowerCase());
          const matchStatus = statusFilter === 'ALL' || j.status === statusFilter;
          return matchSearch && matchStatus;
      });
  }, [jobs, searchTerm, statusFilter]);

  const groupedJobs = useMemo(() => {
      const groups: Record<string, Job[]> = {};
      filteredJobs.forEach(j => {
          const d = new Date(j.startDate);
          let key = '';
          if (viewMode === 'MONTHLY') {
              key = d.toLocaleString('it-IT', { month: 'long', year: 'numeric' });
          } else if (viewMode === 'ANNUAL') {
              key = d.getFullYear().toString();
          } else {
              key = 'All';
          }
          if (!groups[key]) groups[key] = [];
          groups[key].push(j);
      });
      return groups;
  }, [filteredJobs, viewMode]);

  const generateGCalLink = (job: Job) => {
      const details = `Location: ${job.location}\nCliente: ${job.client}\n---\nFasi:\n${job.phases.map(p => `${p.name}: ${p.start.split('T')[1]} - ${p.end.split('T')[1]}`).join('\n')}\n---\nCrew:\n${job.assignedCrew.map(cid => crew.find(c => c.id === cid)?.name).join(', ')}\n---\nNote: ${job.notes}`;
      const start = job.startDate.replace(/-/g, '') + 'T090000';
      const end = job.endDate.replace(/-/g, '') + 'T180000'; 
      const url = new URL("https://calendar.google.com/calendar/render");
      url.searchParams.append("action", "TEMPLATE");
      url.searchParams.append("text", job.title);
      url.searchParams.append("dates", `${start}/${end}`);
      url.searchParams.append("details", details);
      url.searchParams.append("location", job.location);
      return url.toString();
  };

  if (isEditing && activeJob) {
    return (
      <div className="bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl h-[calc(100vh-140px)] flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
          <h2 className="text-xl font-bold text-white">
            {jobs.find(j => j.id === activeJob.id) ? 'Modifica Scheda Lavoro' : 'Nuova Scheda Lavoro'}
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">Annulla</button>
            {canEdit && (
                <button onClick={handleSave} className="px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400">Salva</button>
            )}
          </div>
        </div>

        <div className="flex border-b border-glr-700 mb-4 shrink-0 overflow-x-auto">
             {['DETAILS', 'PHASES', 'MATERIAL', 'CREW', 'PLAN', ...(showBudget ? ['BUDGET'] : [])].map(tab => (
                 <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors whitespace-nowrap ${
                        activeTab === tab 
                        ? 'border-glr-accent text-white' 
                        : 'border-transparent text-gray-400 hover:text-gray-200'
                    }`}
                 >
                     {tab === 'DETAILS' ? 'Dettagli Evento' : 
                      tab === 'PHASES' ? 'Fasi & Logistica' : 
                      tab === 'MATERIAL' ? 'Materiale' : 
                      tab === 'CREW' ? 'Crew' : 
                      tab === 'PLAN' ? 'Piano Produzione' : 'Budget'}
                 </button>
             ))}
        </div>

        <div className="overflow-y-auto flex-1 pr-2">
            {activeTab === 'DETAILS' && (
                <div className="space-y-4 max-w-3xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Titolo Evento</label>
                            <input disabled={!canEdit} type="text" value={activeJob.title} onChange={e => setActiveJob({...activeJob, title: e.target.value})}
                                className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white focus:border-glr-accent outline-none disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Cliente</label>
                            <input disabled={!canEdit} type="text" value={activeJob.client} onChange={e => setActiveJob({...activeJob, client: e.target.value})}
                                className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white outline-none disabled:opacity-50" />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-400 mb-1">Stato</label>
                            <select disabled={!canEdit} value={activeJob.status} onChange={e => setActiveJob({...activeJob, status: e.target.value as JobStatus})}
                                className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white outline-none disabled:opacity-50">
                                {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2">
                            <label className="block text-sm text-gray-400 mb-1">Location</label>
                            <div className="flex gap-2">
                                <select disabled={!canEdit} value={activeJob.locationId || "custom"} onChange={handleLocationChange}
                                    className="w-1/3 bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm outline-none disabled:opacity-50">
                                    <option value="custom">Manuale...</option>
                                    {locations.map(l => (<option key={l.id} value={l.id}>{l.name}</option>))}
                                </select>
                                <input disabled={!canEdit} type="text" value={activeJob.location} onChange={e => setActiveJob({...activeJob, location: e.target.value, locationId: undefined})}
                                    placeholder="Indirizzo o Nome Location" className="w-2/3 bg-glr-900 border border-glr-700 rounded p-2 text-white outline-none disabled:opacity-50" />
                            </div>
                        </div>
                        <div>
                             <label className="block text-sm text-gray-400 mb-1">Inizio Evento</label>
                             <input disabled={!canEdit} type="date" value={activeJob.startDate} onChange={e => setActiveJob({...activeJob, startDate: e.target.value})}
                                className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white outline-none disabled:opacity-50" />
                        </div>
                        <div>
                             <label className="block text-sm text-gray-400 mb-1">Fine Evento</label>
                             <input disabled={!canEdit} type="date" value={activeJob.endDate} onChange={e => setActiveJob({...activeJob, endDate: e.target.value})}
                                className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white outline-none disabled:opacity-50" />
                        </div>
                    </div>
                    <div className="border-t border-glr-700 pt-4 mt-4">
                        <label className="block text-sm text-gray-400 mb-2">Settori Coinvolti</label>
                        <div className="flex gap-4">
                             {['Audio', 'Video', 'Luci'].map(dept => (
                                 <button disabled={!canEdit} key={dept} onClick={() => toggleDepartment(dept)}
                                    className={`px-4 py-2 rounded border transition-colors disabled:opacity-50 ${activeJob.departments.includes(dept) ? 'bg-glr-accent text-glr-900 border-transparent font-bold' : 'bg-transparent border-glr-600 text-gray-400'}`}>
                                     {dept}
                                 </button>
                             ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-4 bg-glr-900/50 rounded border border-glr-700">
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                 <input disabled={!canEdit} type="checkbox" checked={activeJob.isAwayJob} onChange={e => setActiveJob({...activeJob, isAwayJob: e.target.checked})}
                                    className="w-4 h-4 rounded text-glr-accent bg-glr-800 border-glr-600 disabled:opacity-50"/>
                                 <span className="flex items-center gap-2 text-white text-sm"><Plane size={16}/> Lavoro in Trasferta</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                 <input disabled={!canEdit} type="checkbox" checked={activeJob.isSubcontracted} onChange={e => setActiveJob({...activeJob, isSubcontracted: e.target.checked})}
                                    className="w-4 h-4 rounded text-glr-accent bg-glr-800 border-glr-600 disabled:opacity-50"/>
                                 <span className="flex items-center gap-2 text-white text-sm"><Building2 size={16}/> Lavoro in Subappalto</span>
                            </label>
                            {activeJob.isSubcontracted && (
                                <input disabled={!canEdit} type="text" placeholder="Nome Service Committente" value={activeJob.subcontractorName || ''} 
                                    onChange={e => setActiveJob({...activeJob, subcontractorName: e.target.value})}
                                    className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-1 text-sm text-white mt-1 disabled:opacity-50"/>
                            )}
                        </div>
                        <div className="border-l border-glr-700 pl-4">
                            <div className="flex items-center gap-2 text-gray-400 mb-2 text-sm">
                                <Shirt size={16} /> Outfit Richiesto
                            </div>
                            <div className="flex flex-col gap-2">
                                <div className="flex gap-2">
                                    {['Polo', 'Camicia', 'Abito'].map(opt => (
                                        <label key={opt} className="flex items-center gap-1 cursor-pointer">
                                            <input disabled={!canEdit} type="radio" name="outfit" checked={activeJob.outfit === opt} 
                                                onChange={() => setActiveJob({...activeJob, outfit: opt as OutfitType})}
                                                className="bg-glr-800 border-glr-600 disabled:opacity-50"/>
                                            <span className="text-sm text-gray-300">{opt}</span>
                                        </label>
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer mt-1">
                                    <input disabled={!canEdit} type="checkbox" checked={activeJob.outfitNoLogo} onChange={e => setActiveJob({...activeJob, outfitNoLogo: e.target.checked})}
                                        className="w-4 h-4 rounded bg-glr-800 border-glr-600 disabled:opacity-50"/>
                                    <span className="text-xs text-red-300 font-bold border border-red-900 bg-red-900/20 px-1 rounded">NO LOGO</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm text-gray-400 mb-1">Descrizione / Note Generali</label>
                        <textarea disabled={!canEdit} value={activeJob.description} onChange={e => setActiveJob({...activeJob, description: e.target.value})}
                            className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white h-24 text-sm outline-none disabled:opacity-50" 
                            placeholder="Descrizione dell'evento per il team..." />
                    </div>
                </div>
            )}

            {activeTab === 'PHASES' && (
                <div className="space-y-8">
                     <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-white font-bold flex items-center gap-2"><Clock size={18}/> Fasi Operative & Convocazioni</h3>
                            {canEdit && (
                                <button onClick={addPhase} className="bg-glr-700 hover:bg-glr-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1">
                                    <Plus size={16}/> Aggiungi Fase
                                </button>
                            )}
                        </div>
                        <div className="space-y-4">
                            {activeJob.phases.map((phase, idx) => (
                                <div key={phase.id} className="bg-glr-900 border border-glr-700 p-4 rounded-lg flex flex-col gap-4">
                                    <div className="flex flex-col md:flex-row gap-4 items-start md:items-end">
                                        <div className="flex-1 w-full">
                                            <label className="text-xs text-gray-400 mb-1 block">Nome Fase</label>
                                            <input disabled={!canEdit} type="text" value={phase.name} onChange={e => updatePhase(phase.id, 'name', e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-3 py-2 text-white text-sm disabled:opacity-50" placeholder="Es. Montaggio, Prove..."/>
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <label className="text-xs text-gray-400 mb-1 block">Inizio</label>
                                            <input disabled={!canEdit} type="datetime-local" value={phase.start} onChange={e => updatePhase(phase.id, 'start', e.target.value)}
                                                className="bg-glr-800 border border-glr-600 rounded px-3 py-2 text-white text-sm disabled:opacity-50" />
                                        </div>
                                        <div className="w-full md:w-auto">
                                            <label className="text-xs text-gray-400 mb-1 block">Fine</label>
                                            <input disabled={!canEdit} type="datetime-local" value={phase.end} onChange={e => updatePhase(phase.id, 'end', e.target.value)}
                                                className="bg-glr-800 border border-glr-600 rounded px-3 py-2 text-white text-sm disabled:opacity-50" />
                                        </div>
                                        {canEdit && (
                                            <button onClick={() => removePhase(phase.id)} className="text-gray-500 hover:text-red-400 p-2">
                                                <X size={18}/>
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex flex-col md:flex-row gap-4 pt-3 border-t border-glr-800">
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-2"><MapPin size={10}/> Convocazione Magazzino</label>
                                            <input disabled={!canEdit} type="datetime-local" value={phase.callTimeWarehouse || ''} onChange={e => updatePhase(phase.id, 'callTimeWarehouse', e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-3 py-1.5 text-white text-xs disabled:opacity-50" />
                                        </div>
                                        <div className="flex-1">
                                            <label className="text-xs text-gray-400 mb-1 block flex items-center gap-2"><MapPin size={10}/> Convocazione In Loco</label>
                                            <input disabled={!canEdit} type="datetime-local" value={phase.callTimeSite || ''} onChange={e => updatePhase(phase.id, 'callTimeSite', e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-3 py-1.5 text-white text-xs disabled:opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {activeJob.phases.length === 0 && <p className="text-gray-500 italic text-sm text-center py-4">Nessuna fase operativa definita.</p>}
                        </div>
                     </div>

                     <div className="border-t border-glr-700 pt-6">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="text-white font-bold flex items-center gap-2"><Truck size={18}/> Logistica Mezzi</h3>
                         </div>
                         {canEdit && (
                            <div className="bg-glr-900 border border-glr-700 p-4 rounded-lg mb-4">
                                <div className="flex flex-wrap gap-3 items-end">
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-gray-400">Tipo Mezzo</label>
                                        <select value={newVehicleType} onChange={e => {
                                            setNewVehicleType(e.target.value as VehicleType);
                                            if(e.target.value === VehicleType.RENTAL) setIsVehicleRental(true);
                                            else setIsVehicleRental(false);
                                        }}
                                            className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm w-40">
                                            {Object.values(VehicleType).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 w-16">
                                        <label className="text-xs text-gray-400">Quantità</label>
                                        <input type="number" min="1" value={newVehicleQty} onChange={e => setNewVehicleQty(parseInt(e.target.value))}
                                            className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                    </div>
                                    {isVehicleRental && (
                                        <>
                                            <div className="flex flex-col gap-1 flex-1 min-w-[150px]">
                                                <label className="text-xs text-gray-400">Azienda Noleggio</label>
                                                <input type="text" value={rentalCompany} onChange={e => setRentalCompany(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" placeholder="Es. Hertz" />
                                            </div>
                                            <div className="flex flex-col gap-1 w-20">
                                                <label className="text-xs text-gray-400">Costo (€)</label>
                                                <input type="number" value={rentalCost} onChange={e => setRentalCost(parseFloat(e.target.value))}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">Ritiro</label>
                                                <input type="datetime-local" value={pickupDate} onChange={e => setPickupDate(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <label className="text-xs text-gray-400">Riconsegna</label>
                                                <input type="datetime-local" value={returnDate} onChange={e => setReturnDate(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                            </div>
                                        </>
                                    )}
                                    <button onClick={addVehicle} className="bg-glr-accent text-glr-900 font-bold px-3 py-1.5 rounded text-sm hover:bg-amber-400 flex items-center gap-1">
                                        <Plus size={16}/> Aggiungi
                                    </button>
                                </div>
                            </div>
                         )}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             {(activeJob.vehicles || []).map((v, idx) => (
                                 <div key={idx} className="bg-glr-900 border border-glr-700 p-3 rounded flex justify-between items-start group">
                                     <div>
                                         <div className="flex items-center gap-2">
                                             <span className="font-bold text-white text-sm">{v.type}</span>
                                             <span className="bg-glr-800 text-gray-300 text-xs px-1.5 rounded">x{v.quantity}</span>
                                             {v.isRental && <span className="bg-orange-900/50 text-orange-300 border border-orange-800 text-[10px] px-1 rounded">NOLEGGIO</span>}
                                         </div>
                                         {v.isRental && (
                                             <div className="text-xs text-gray-400 mt-1 space-y-0.5">
                                                 <p><span className="text-gray-500">Fornitore:</span> {v.rentalCompany} (€{v.cost})</p>
                                                 <p><span className="text-gray-500">Dal:</span> {v.pickupDate?.replace('T', ' ')}</p>
                                                 <p><span className="text-gray-500">Al:</span> {v.returnDate?.replace('T', ' ')}</p>
                                             </div>
                                         )}
                                     </div>
                                     {canEdit && (
                                         <button onClick={() => {
                                             const updated = [...(activeJob.vehicles || [])];
                                             updated.splice(idx, 1);
                                             setActiveJob({...activeJob, vehicles: updated});
                                         }} className="text-gray-600 hover:text-red-400"><X size={16}/></button>
                                     )}
                                 </div>
                             ))}
                             {(activeJob.vehicles?.length === 0) && <p className="text-gray-500 italic text-sm py-2">Nessun mezzo assegnato.</p>}
                         </div>
                     </div>
                </div>
            )}

            {activeTab === 'MATERIAL' && (
                <div className="space-y-6">
                    {canEdit && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* AI Generator */}
                            <div className="bg-gradient-to-br from-indigo-900/40 to-glr-900 border border-indigo-500/30 p-4 rounded-xl">
                                <h4 className="text-indigo-300 font-semibold mb-2 flex items-center gap-2"><Wand2 size={16}/> Generazione AI</h4>
                                <p className="text-xs text-gray-400 mb-3">Descrivi l'evento nei dettagli per generare una bozza.</p>
                                <button 
                                    onClick={handleAIGenerate}
                                    disabled={isGenerating || !activeJob.description}
                                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded transition-colors disabled:opacity-50 text-sm"
                                >
                                    {isGenerating ? 'Analisi in corso...' : 'Genera Lista da Descrizione'}
                                </button>
                            </div>

                            {/* Manual Add */}
                            <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl relative">
                                <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><Package size={16}/> Aggiungi Materiale</h4>
                                
                                <div className="flex gap-2 mb-3">
                                    <button onClick={() => setMatSource('INVENTORY')} 
                                        className={`flex-1 text-xs py-1 rounded ${matSource === 'INVENTORY' ? 'bg-glr-700 text-white' : 'bg-glr-800 text-gray-400'}`}>Magazzino</button>
                                    <button onClick={() => setMatSource('EXTERNAL')} 
                                        className={`flex-1 text-xs py-1 rounded ${matSource === 'EXTERNAL' ? 'bg-orange-900/50 text-orange-200 border border-orange-800' : 'bg-glr-800 text-gray-400'}`}>Esterno / Noleggio</button>
                                </div>

                                <div className="space-y-3">
                                    {matSource === 'INVENTORY' ? (
                                        <>
                                            {/* Filter Inventory */}
                                            <div className="flex gap-2 mb-1">
                                                <div className="relative w-1/2">
                                                    <Search className="absolute left-2 top-1.5 text-gray-500" size={14}/>
                                                    <input 
                                                        type="text" 
                                                        placeholder="Cerca nome, tipo, seriale..." 
                                                        value={invSearchTerm}
                                                        onChange={e => setInvSearchTerm(e.target.value)}
                                                        className="w-full bg-glr-800 border border-glr-600 rounded pl-7 pr-2 py-1 text-xs text-white"
                                                    />
                                                </div>
                                                <select 
                                                    value={invCategoryFilter}
                                                    onChange={e => setInvCategoryFilter(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1 text-xs text-white w-1/2"
                                                >
                                                    <option value="ALL">Tutte le Categorie</option>
                                                    {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <select 
                                                value={newMatInventoryId}
                                                onChange={e => setNewMatInventoryId(e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm outline-none"
                                            >
                                                <option value="">Seleziona Articolo...</option>
                                                {filteredInventory.map(i => (
                                                    <option key={i.id} value={i.id}>
                                                        [{i.category}] {i.name} {i.type ? `(${i.type})` : ''} - Disp: {i.quantityOwned}
                                                    </option>
                                                ))}
                                            </select>
                                            
                                            {/* SUGGESTIONS PANEL (Related Items) */}
                                            {suggestions.length > 0 && (
                                                <div className="bg-blue-900/20 border border-blue-800 p-2 rounded text-xs">
                                                    <span className="flex items-center gap-1 text-blue-300 font-bold mb-1">
                                                        <Sparkles size={12}/> Inserisci anche:
                                                    </span>
                                                    <div className="flex flex-wrap gap-1">
                                                        {suggestions.map((s, idx) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={() => handleAcceptSuggestion(s)}
                                                                className="flex items-center gap-1 px-2 py-0.5 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 rounded text-blue-200"
                                                                title="Clicca per aggiungere suggerimento + articolo selezionato"
                                                            >
                                                                <Plus size={10}/> {s}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Availability Warning */}
                                            {inventoryStatus && (
                                                <div className={`p-3 rounded border text-xs mt-2 ${
                                                    inventoryStatus.available < newMatQty 
                                                    ? 'bg-red-900/30 border-red-700 text-red-200' 
                                                    : inventoryStatus.conflicts.length > 0 
                                                        ? 'bg-yellow-900/30 border-yellow-700 text-yellow-200'
                                                        : 'hidden'
                                                }`}>
                                                    <div className="font-bold flex items-center gap-2 mb-1">
                                                        {inventoryStatus.available < newMatQty 
                                                            ? <><AlertOctagon size={14}/> Disponibilità Insufficiente!</>
                                                            : <><AlertTriangle size={14}/> Attenzione: Materiale Impegnato</>
                                                        }
                                                    </div>
                                                    <div className="flex justify-between items-center text-[10px] uppercase opacity-70 mb-1 border-b border-white/10 pb-1">
                                                        <span>Totale: {inventoryStatus.itemTotal}</span>
                                                        <span>Impegnati: {inventoryStatus.itemTotal - inventoryStatus.available}</span>
                                                        <span className="font-bold">Liberi: {inventoryStatus.available}</span>
                                                    </div>
                                                    {inventoryStatus.available < newMatQty && (
                                                        <p className="font-bold mb-2">
                                                            Stai richiedendo {newMatQty}pz ma ne rimangono solo {inventoryStatus.available}.
                                                        </p>
                                                    )}
                                                    {inventoryStatus.conflicts.length > 0 && (
                                                        <div className="mt-2">
                                                            <span className="block mb-1 opacity-80">Dettaglio Impegni:</span>
                                                            <ul className="list-disc list-inside space-y-0.5 opacity-80 max-h-20 overflow-y-auto">
                                                                {inventoryStatus.conflicts.map((c, i) => (
                                                                    <li key={i}>{c.quantity}pz su "{c.jobName}"</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="space-y-2">
                                            <input type="text" placeholder="Nome Materiale Esterno" value={newMatName} onChange={e => setNewMatName(e.target.value)}
                                                className="w-full bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                            <div className="flex gap-2">
                                                <select value={newMatCategory} onChange={e => setNewMatCategory(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm flex-1">
                                                    {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi'].map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                                <input type="text" placeholder="Tipologia (es. Mixer)" value={newMatType} onChange={e => setNewMatType(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm flex-1" />
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="text" placeholder="Azienda Fornitrice" value={newMatSupplier} onChange={e => setNewMatSupplier(e.target.value)}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm flex-1" />
                                                <input type="number" placeholder="Costo €" value={newMatCost} onChange={e => setNewMatCost(parseFloat(e.target.value))}
                                                    className="bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm flex-1" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2">
                                        <input type="number" min="1" value={newMatQty} onChange={e => setNewMatQty(parseInt(e.target.value))}
                                            className="w-16 bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm text-center" placeholder="Q.tà"/>
                                        <input type="text" placeholder="Note / Specifiche" value={newMatNotes} onChange={e => setNewMatNotes(e.target.value)}
                                            className="flex-1 bg-glr-800 border border-glr-600 rounded px-2 py-1.5 text-white text-sm" />
                                        <button onClick={addManualMaterial} disabled={matSource === 'INVENTORY' && !newMatInventoryId} className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-3 py-1 rounded">
                                            <Plus size={18}/>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-glr-900 rounded-xl border border-glr-700 overflow-hidden">
                        {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Altro'].map(cat => {
                            const items = materialByCategory[cat];
                            if (!items || items.length === 0) return null;

                            return (
                                <div key={cat} className="border-b border-glr-800 last:border-b-0">
                                    <div className="bg-glr-800 px-4 py-2 flex items-center gap-2 text-sm font-bold text-glr-accent uppercase tracking-wider">
                                        {getCategoryIcon(cat)} {cat}
                                    </div>
                                    <table className="w-full text-left text-sm">
                                        <tbody className="divide-y divide-glr-800/50">
                                            {items.map((item, idx) => (
                                                <tr key={item.id} className="hover:bg-glr-800/50">
                                                    <td className="p-3 font-medium text-white w-2/3 pl-8">
                                                        <div className="flex items-center gap-2">
                                                            {item.name}
                                                            {item.type && (
                                                                <span className="text-[10px] bg-blue-900/50 text-blue-200 px-1.5 py-0.5 rounded border border-blue-800 font-bold uppercase">{item.type}</span>
                                                            )}
                                                            {item.isExternal ? (
                                                                <span className="px-1.5 py-0.5 bg-orange-900/50 text-orange-300 text-[10px] rounded border border-orange-800 whitespace-nowrap">
                                                                    EXT: {item.supplier || 'Noleggio'}
                                                                </span>
                                                            ) : item.inventoryId && (
                                                                <span className="px-1.5 py-0.5 bg-green-900/50 text-green-400 text-[10px] rounded border border-green-800">INV</span>
                                                            )}
                                                        </div>
                                                        {item.notes && <div className="text-gray-500 text-xs italic mt-0.5 flex items-center gap-1"><StickyNote size={10}/> {item.notes}</div>}
                                                    </td>
                                                    <td className="p-3 text-center text-glr-accent font-bold w-16">{item.quantity}</td>
                                                    <td className="p-3 text-right w-12">
                                                        {canEdit && (
                                                            <button 
                                                                onClick={() => setActiveJob({...activeJob, materialList: activeJob.materialList.filter(m => m.id !== item.id)})}
                                                                className="text-gray-500 hover:text-red-400"
                                                            >
                                                                <X size={16}/>
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            );
                        })}
                        {activeJob.materialList.length === 0 && (
                            <div className="p-6 text-center text-gray-500 italic">Lista vuota</div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'CREW' && (
                <div>
                    <h3 className="text-glr-accent font-semibold uppercase text-sm tracking-wider mb-4 flex items-center gap-2">
                        <UserPlus size={16}/> Assegnazione Tecnici
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {crew.map(c => {
                            const isAssigned = activeJob.assignedCrew.includes(c.id);
                            return (
                                <button 
                                    key={c.id}
                                    onClick={() => canEdit && toggleCrewAssignment(c.id)}
                                    disabled={!canEdit}
                                    className={`p-3 rounded border text-left transition-all ${
                                        isAssigned 
                                        ? 'bg-green-600/20 border-green-500 text-green-100' 
                                        : 'bg-glr-900 border-glr-700 text-gray-400 hover:border-gray-500'
                                    } ${!canEdit && 'cursor-default opacity-80'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-sm">{c.name}</span>
                                        {isAssigned && <Check size={16} />}
                                    </div>
                                    <div className="text-xs opacity-70 mt-1 flex flex-wrap gap-1">
                                        {c.roles.map(r => <span key={r}>{r}</span>)}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {activeTab === 'PLAN' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-white font-bold flex items-center gap-2"><ClipboardList size={18}/> Piano di Produzione</h3>
                        <div className="flex gap-2">
                            <a 
                                href={generateGCalLink(activeJob)} 
                                target="_blank" 
                                rel="noreferrer"
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded text-sm flex items-center gap-2"
                            >
                                <Calendar size={16}/> Aggiungi a GCal
                            </a>
                            <button 
                                onClick={() => alert("Funzione Export PDF Mockup")} 
                                className="bg-glr-accent text-glr-900 font-bold px-3 py-1.5 rounded text-sm flex items-center gap-2 hover:bg-amber-400"
                            >
                                <Package size={16}/> Esporta PDF
                            </button>
                        </div>
                    </div>

                    <div className="flex flex-col gap-8 items-center bg-gray-200/50 p-6 rounded-xl">
                        
                        <div className="bg-white text-gray-900 p-8 shadow-xl w-full max-w-4xl min-h-[1100px] font-sans relative">
                            <div className="flex justify-between border-b-2 border-gray-800 pb-4 mb-6">
                                <div>
                                    <h1 className="text-3xl font-bold uppercase tracking-tight">{activeJob.title}</h1>
                                    <p className="text-lg text-gray-600 font-semibold">{activeJob.client}</p>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-bold bg-gray-900 text-white px-3 py-1 inline-block mb-1">PIANO DI PRODUZIONE</div>
                                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div>
                                    <h4 className="font-bold text-xs text-gray-500 uppercase mb-2 border-b border-gray-300 pb-1">Location & Orari</h4>
                                    <p className="font-bold">{activeJob.location}</p>
                                    <p className="text-sm text-gray-600 mb-2">{locations.find(l => l.id === activeJob.locationId)?.address}</p>
                                    <div className="flex gap-4 text-sm mt-2">
                                        <div><span className="text-gray-500 block text-xs">INIZIO</span> <b>{new Date(activeJob.startDate).toLocaleDateString()}</b></div>
                                        <div><span className="text-gray-500 block text-xs">FINE</span> <b>{new Date(activeJob.endDate).toLocaleDateString()}</b></div>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="font-bold text-xs text-gray-500 uppercase mb-2 border-b border-gray-300 pb-1">Logistica & Note</h4>
                                    <div className="text-sm space-y-1">
                                        {locations.find(l => l.id === activeJob.locationId)?.isZtl && <span className="inline-block bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded font-bold mr-2">ZTL ATTIVA</span>}
                                        {activeJob.isAwayJob && <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded font-bold">TRASFERTA</span>}
                                        <p className="mt-2 text-gray-600 italic">"{activeJob.description || 'Nessuna descrizione particolare.'}"</p>
                                    </div>
                                    <div className="mt-3">
                                        <span className="text-xs text-gray-500 block">OUTFIT RICHIESTO:</span>
                                        <span className="font-bold text-sm">{activeJob.outfit || 'Standard'} {activeJob.outfitNoLogo ? '(NO LOGO)' : ''}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 border-b border-gray-300 pb-1">Call Sheet (Fasi Operative)</h4>
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-100 text-gray-600 text-xs uppercase">
                                        <tr>
                                            <th className="p-2 text-left">Fase</th>
                                            <th className="p-2 text-left">Orario</th>
                                            <th className="p-2 text-center">Magazzino</th>
                                            <th className="p-2 text-center">In Loco</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {activeJob.phases.map(p => (
                                            <tr key={p.id}>
                                                <td className="p-2 font-bold">{p.name}</td>
                                                <td className="p-2">
                                                    {new Date(p.start).toLocaleDateString()} <br/> 
                                                    <span className="text-gray-500">{p.start.split('T')[1]} - {p.end.split('T')[1]}</span>
                                                </td>
                                                <td className="p-2 text-center font-mono bg-gray-50">
                                                    {p.callTimeWarehouse ? p.callTimeWarehouse.split('T')[1] : '-'}
                                                </td>
                                                <td className="p-2 text-center font-mono bg-gray-50">
                                                    {p.callTimeSite ? p.callTimeSite.split('T')[1] : '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mb-8">
                                <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 border-b border-gray-300 pb-1">Personale Tecnico</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    {activeJob.assignedCrew.map(cid => {
                                        const c = crew.find(mem => mem.id === cid);
                                        if(!c) return null;
                                        return (
                                            <div key={cid} className="border border-gray-200 p-2 rounded">
                                                <p className="font-bold text-sm">{c.name}</p>
                                                <p className="text-xs text-gray-500">{c.roles[0]}</p>
                                                <p className="text-xs text-gray-400 mt-1">{c.phone}</p>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {activeJob.vehicles && activeJob.vehicles.length > 0 && (
                                <div className="mb-8">
                                    <h4 className="font-bold text-xs text-gray-500 uppercase mb-3 border-b border-gray-300 pb-1">Mezzi & Trasporti</h4>
                                    <ul className="list-disc list-inside text-sm">
                                        {activeJob.vehicles.map((v, i) => (
                                            <li key={i}>
                                                <b>{v.quantity}x {v.type}</b> 
                                                {v.isRental && <span className="text-orange-600 ml-2">(Noleggio: {v.rentalCompany})</span>}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="absolute bottom-6 right-8 text-[10px] text-gray-400">
                                Pagina 1 di 2
                            </div>
                        </div>

                        <div className="w-full flex items-center gap-4 opacity-50">
                            <div className="h-px bg-gray-400 flex-1 border-t border-dashed"></div>
                            <span className="text-xs font-mono uppercase text-gray-500">Allegato: Lista Materiali</span>
                            <div className="h-px bg-gray-400 flex-1 border-t border-dashed"></div>
                        </div>

                        <div className="bg-white text-gray-900 p-8 shadow-xl w-full max-w-4xl min-h-[1100px] font-sans relative">
                            <div className="border-b-2 border-gray-800 pb-4 mb-6">
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h1 className="text-2xl font-bold uppercase tracking-tight mb-1">{activeJob.title}</h1>
                                        <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                                            <MapPin size={16}/>
                                            <span>{locations.find(l => l.id === activeJob.locationId)?.address || activeJob.location}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold bg-black text-white px-3 py-1 inline-block mb-1">PACKING LIST</div>
                                        <p className="text-xs text-gray-500">Data Stampa: {new Date().toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                {['Audio', 'Video', 'Luci', 'Strutture', 'Cavi', 'Altro'].map(cat => {
                                    const items = materialByCategory[cat];
                                    if (!items || items.length === 0) return null;

                                    return (
                                        <div key={cat} className="mb-6 break-inside-avoid">
                                            <div className="bg-gray-100 px-3 py-1.5 text-xs font-bold uppercase text-gray-800 border-l-4 border-gray-800 mb-2 flex items-center gap-2">
                                                {getCategoryIcon(cat)} {cat}
                                            </div>
                                            <table className="w-full text-sm border-collapse">
                                                <thead className="text-[10px] text-gray-400 uppercase border-b border-gray-200">
                                                    <tr>
                                                        <th className="p-2 text-left w-2/3">Articolo / Tipologia</th>
                                                        <th className="p-2 text-center w-12">Q.tà</th>
                                                        <th className="p-2 text-left">Note</th>
                                                        <th className="p-2 text-center w-10">Check</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {items.map((item) => (
                                                        <tr key={item.id} className="hover:bg-gray-50">
                                                            <td className="p-2 font-medium">
                                                                {item.name}
                                                                {item.type && <span className="text-[10px] text-gray-500 ml-2 border border-gray-300 rounded px-1">{item.type}</span>}
                                                                {item.isExternal && <span className="text-[10px] ml-2 text-white bg-orange-600 px-1 rounded">(EXT)</span>}
                                                            </td>
                                                            <td className="p-2 text-center font-bold text-lg">{item.quantity}</td>
                                                            <td className="p-2 text-xs text-gray-500 italic">{item.notes}</td>
                                                            <td className="p-2 text-center align-middle">
                                                                <div className="w-5 h-5 border-2 border-gray-400 mx-auto rounded-sm"></div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })}
                                {activeJob.materialList.length === 0 && <p className="text-sm italic text-gray-500 text-center py-10">Nessun materiale in lista.</p>}
                            </div>
                             <div className="absolute bottom-6 right-8 text-[10px] text-gray-400">
                                Pagina 2 di 2 (Allegato)
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'BUDGET' && showBudget && (
                <div className="space-y-6">
                    <h3 className="text-glr-accent font-semibold uppercase text-sm tracking-wider mb-4">Budget & Costi Evento</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                            <p className="text-xs text-gray-400 uppercase">Costo Personale (Esterno)</p>
                            <p className="text-2xl font-bold text-white">€ {budget.crew}</p>
                        </div>
                        <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                            <p className="text-xs text-gray-400 uppercase">Noleggi Materiale</p>
                            <p className="text-2xl font-bold text-white">€ {budget.materials}</p>
                        </div>
                        <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                            <p className="text-xs text-gray-400 uppercase">Logistica & Mezzi</p>
                            <p className="text-2xl font-bold text-white">€ {budget.vehicles}</p>
                        </div>
                         <div className="bg-glr-900 border border-glr-700 p-4 rounded-xl">
                            <p className="text-xs text-gray-400 uppercase">Rimborsi Spese</p>
                            <p className="text-2xl font-bold text-white">€ {budget.expenses}</p>
                        </div>
                    </div>
                    <div className="bg-glr-900 border-t-4 border-glr-accent p-6 rounded-xl flex justify-between items-center">
                        <span className="text-lg font-bold text-white uppercase">Totale Costi Vivi</span>
                        <span className="text-4xl font-bold text-glr-accent">€ {budget.total}</span>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-4 text-center">
                        * I costi interni (personale assunto, materiale di proprietà) non sono inclusi in questo calcolo.
                    </p>
                </div>
            )}
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-white">Schede Lavoro & Sopralluoghi</h2>
            <div className="flex gap-2 mt-2">
                 {['GRID', 'MONTHLY', 'ANNUAL'].map(v => (
                     <button key={v} onClick={() => setViewMode(v as any)} className={`text-xs px-2 py-1 rounded ${viewMode === v ? 'bg-glr-accent text-glr-900 font-bold' : 'text-gray-400 bg-glr-800'}`}>
                         {v === 'GRID' ? 'Griglia' : v === 'MONTHLY' ? 'Mensile' : 'Annuale'}
                     </button>
                 ))}
            </div>
        </div>
        <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <input type="text" placeholder="Cerca lavoro..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
                className="bg-glr-800 border border-glr-700 rounded px-3 py-2 text-white text-sm outline-none"/>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} 
                className="bg-glr-800 border border-glr-700 rounded px-3 py-2 text-white text-sm outline-none">
                <option value="ALL">Tutti gli stati</option>
                {Object.values(JobStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            {canEdit && (
                <button 
                    onClick={handleNewJob}
                    className="flex items-center justify-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors"
                >
                    <Plus size={20} /> Nuova
                </button>
            )}
        </div>
      </div>

      {viewMode === 'GRID' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredJobs.map(job => (
            <div key={job.id} className="bg-glr-800 rounded-xl border border-glr-700 p-5 hover:border-glr-accent transition-colors flex flex-col justify-between h-full group">
                <div>
                <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 text-xs font-bold rounded uppercase 
                    ${job.status === JobStatus.DRAFT ? 'bg-gray-600 text-gray-200' : 
                        job.status === JobStatus.CONFIRMED ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {job.status}
                    </span>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canEdit && <button onClick={() => handleDuplicateJob(job)} className="text-gray-400 hover:text-white" title="Duplica"><UserPlus size={18} /></button>}
                    <button onClick={() => { setActiveJob(job); setIsEditing(true); }} className="text-gray-400 hover:text-white"><Edit3 size={18} /></button>
                    {canEdit && <button onClick={() => onDeleteJob(job.id)} className="text-gray-400 hover:text-red-400"><Trash2 size={18} /></button>}
                    </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-1 truncate">{job.title}</h3>
                <p className="text-sm text-gray-400 mb-4 truncate">{job.client}</p>
                
                <div className="space-y-2 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-glr-accent"/> 
                    <span>{job.startDate}</span>
                    </div>
                    <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-glr-accent"/> 
                    <span className="truncate">{job.location || 'Location TBD'}</span>
                    </div>
                    {job.departments && job.departments.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            {job.departments.map(d => (
                                <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-glr-700 border border-glr-600 text-gray-300">{d}</span>
                            ))}
                        </div>
                    )}
                </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-glr-700 flex justify-between items-center text-xs text-gray-500">
                <div className="flex gap-3">
                    <span className="flex items-center gap-1"><Package size={12}/> {job.materialList.length}</span>
                    <span className="flex items-center gap-1"><UserPlus size={12}/> {job.assignedCrew.length}</span>
                    {job.isAwayJob && <span className="flex items-center gap-1 text-orange-400"><Plane size={12}/> Trasf.</span>}
                </div>
                </div>
            </div>
            ))}
        </div>
      ) : (
          <div className="space-y-8">
              {Object.keys(groupedJobs).map(groupKey => (
                  <div key={groupKey}>
                      <h3 className="text-xl font-bold text-glr-accent border-b border-glr-700 pb-2 mb-4">{groupKey}</h3>
                      <div className="space-y-2">
                          {groupedJobs[groupKey].map(job => (
                              <div key={job.id} onClick={() => { setActiveJob(job); setIsEditing(true); }} className="bg-glr-800 border border-glr-700 p-4 rounded-lg flex justify-between items-center hover:bg-glr-700/50 cursor-pointer">
                                  <div className="flex items-center gap-4">
                                      <div className={`w-2 h-12 rounded ${job.status === JobStatus.CONFIRMED ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                                      <div>
                                          <h4 className="font-bold text-white">{job.title}</h4>
                                          <p className="text-sm text-gray-400">{job.client} • {job.startDate}</p>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-4">
                                       <span className="text-xs bg-glr-900 px-2 py-1 rounded text-gray-300">{job.location}</span>
                                       <div className="flex gap-2">
                                           {canEdit && <button onClick={(e) => {e.stopPropagation(); handleDuplicateJob(job);}} className="text-gray-500 hover:text-white p-1" title="Duplica"><UserPlus size={16}/></button>}
                                            <ChevronRight size={16} className="text-gray-500"/>
                                       </div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              ))}
          </div>
      )}
    </div>
  );
};
