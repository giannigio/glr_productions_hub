


import React, { useState, useRef } from 'react';
import { CrewMember, CrewRole, CrewType, CrewExpense, CrewAbsence, ApprovalStatus, WorkflowLog, Job, CrewDocument } from '../types';
import { User, Phone, MapPin, DollarSign, Calendar, FileText, CheckCircle, XCircle, Clock, MessageSquare, AlertCircle, Plus, ChevronRight, LayoutGrid, FileDown, Upload, Trash2, Download } from 'lucide-react';

interface CrewProps {
  crew: CrewMember[];
  onUpdateCrew?: (member: CrewMember) => void;
  // In a real app, jobs would be passed here or via context to check availability
  jobs?: Job[]; 
}

// NOTE: Since I cannot change App.tsx interface easily in this prompt step without breaking, 
// I will assume for the Planning view that we would normally have jobs. 
// For now, I will mock a job lookup helper or use a passed prop if updated.
// To make it work visually, I will mock the jobs data availability in the planning component or just use visual placeholders
// but ideally 'jobs' should be passed.

// --- SUB COMPONENTS MOVED OUTSIDE FOR PERFORMANCE & STABILITY ---

const StatusBadge = ({ status }: { status: ApprovalStatus }) => {
    let color = 'bg-gray-600';
    if (status === ApprovalStatus.PENDING) color = 'bg-yellow-600/50 text-yellow-200 border-yellow-600';
    if (status === ApprovalStatus.APPROVED_MANAGER) color = 'bg-blue-600/50 text-blue-200 border-blue-600';
    if (status === ApprovalStatus.COMPLETED) color = 'bg-green-600/50 text-green-200 border-green-600';
    if (status === ApprovalStatus.REJECTED) color = 'bg-red-600/50 text-red-200 border-red-600';
    
    return (
        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${color}`}>
            {status}
        </span>
    );
};

const WorkflowTimeline = ({ logs }: { logs: WorkflowLog[] }) => (
    <div className="mt-2 pl-2 border-l border-glr-700 space-y-2">
        {(logs || []).map(log => (
            <div key={log.id} className="text-xs text-gray-400">
                <span className="font-bold text-gray-300">{log.user}</span> 
                <span className="opacity-70"> - {new Date(log.date).toLocaleString()}</span>
                <div className="text-glr-accent">{log.action}</div>
                {log.note && <div className="italic mt-0.5 bg-glr-800 p-1 rounded">"{log.note}"</div>}
            </div>
        ))}
    </div>
);

export const Crew: React.FC<CrewProps> = ({ crew, onUpdateCrew }) => {
  const [filter, setFilter] = useState<'ALL' | 'INTERNAL' | 'FREELANCE'>('ALL');
  const [viewMode, setViewMode] = useState<'CARDS' | 'PLANNING'>('CARDS');
  const [selectedMember, setSelectedMember] = useState<CrewMember | null>(null);
  const [activeTab, setActiveTab] = useState<'INFO' | 'ABSENCES' | 'EXPENSES' | 'DOCS'>('INFO');
  
  // States for new items
  const [newExpenseAmount, setNewExpenseAmount] = useState(0);
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseCat, setNewExpenseCat] = useState('Viaggio');
  const [selectedJobId, setSelectedJobId] = useState('');
  
  const [newAbsenceType, setNewAbsenceType] = useState('Ferie');
  const [newAbsenceStart, setNewAbsenceStart] = useState('');
  const [newAbsenceEnd, setNewAbsenceEnd] = useState('');

  // Doc States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('Certificazione');
  const [newDocExpiry, setNewDocExpiry] = useState('');

  // Workflow states
  const [workflowNote, setWorkflowNote] = useState('');

  const filteredCrew = crew.filter(c => {
    if (filter === 'INTERNAL') return c.type === CrewType.INTERNAL;
    if (filter === 'FREELANCE') return c.type === CrewType.FREELANCE;
    return true;
  });

  // --- ACTIONS ---

  const handleAddExpense = () => {
      if (!selectedMember || !onUpdateCrew) return;
      const newExpense: CrewExpense = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          jobId: selectedJobId || undefined, // Assuming we had a job list selector, keeping simple for now
          amount: newExpenseAmount,
          description: newExpenseDesc,
          category: newExpenseCat as any,
          status: ApprovalStatus.PENDING,
          workflowLog: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: selectedMember.name,
              action: 'Richiesta creata'
          }]
      };
      
      const updatedMember = {
          ...selectedMember,
          expenses: [...(selectedMember.expenses || []), newExpense]
      };
      
      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
      // Reset
      setNewExpenseAmount(0);
      setNewExpenseDesc('');
  };

  const handleAddAbsence = () => {
      if (!selectedMember || !onUpdateCrew) return;
      const newAbsence: CrewAbsence = {
          id: Date.now().toString(),
          type: newAbsenceType as any,
          startDate: newAbsenceStart,
          endDate: newAbsenceEnd,
          status: ApprovalStatus.PENDING,
          workflowLog: [{
              id: Date.now().toString(),
              date: new Date().toISOString(),
              user: selectedMember.name,
              action: 'Richiesta creata'
          }]
      };

      const updatedMember = {
          ...selectedMember,
          absences: [...(selectedMember.absences || []), newAbsence]
      };

      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
      setNewAbsenceStart('');
      setNewAbsenceEnd('');
  };

  const handleAddDocument = () => {
      if(!selectedMember || !onUpdateCrew || !fileInputRef.current?.files?.[0]) return;
      
      const file = fileInputRef.current.files[0];
      const newDoc: CrewDocument = {
          id: Date.now().toString(),
          name: newDocName || file.name,
          type: newDocType as any,
          expiryDate: newDocExpiry || undefined,
          uploadDate: new Date().toISOString().split('T')[0],
          fileUrl: '#' // Mock URL
      };

      const updatedMember = {
          ...selectedMember,
          documents: [...(selectedMember.documents || []), newDoc]
      };

      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
      
      // Reset
      setNewDocName('');
      setNewDocExpiry('');
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeleteDocument = (docId: string) => {
      if(!selectedMember || !onUpdateCrew) return;
      const updatedMember = {
          ...selectedMember,
          documents: (selectedMember.documents || []).filter(d => d.id !== docId)
      };
      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
  };

  const updateExpenseStatus = (expId: string, newStatus: ApprovalStatus) => {
      if (!selectedMember || !onUpdateCrew) return;
      
      const updatedExpenses = (selectedMember.expenses || []).map(e => {
          if (e.id === expId) {
              const log: WorkflowLog = {
                  id: Date.now().toString(),
                  date: new Date().toISOString(),
                  user: 'Admin/Manager', // In real app, current user
                  action: `Stato cambiato in: ${newStatus}`,
                  note: workflowNote
              };
              return { ...e, status: newStatus, workflowLog: [...e.workflowLog, log] };
          }
          return e;
      });

      const updatedMember = { ...selectedMember, expenses: updatedExpenses };
      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
      setWorkflowNote('');
  };

  const updateAbsenceStatus = (absId: string, newStatus: ApprovalStatus) => {
      if (!selectedMember || !onUpdateCrew) return;

      const updatedAbsences = (selectedMember.absences || []).map(a => {
          if (a.id === absId) {
               const log: WorkflowLog = {
                  id: Date.now().toString(),
                  date: new Date().toISOString(),
                  user: 'Admin/Manager',
                  action: `Stato cambiato in: ${newStatus}`,
                  note: workflowNote
              };
              return { ...a, status: newStatus, workflowLog: [...a.workflowLog, log] };
          }
          return a;
      });

      const updatedMember = { ...selectedMember, absences: updatedAbsences };
      onUpdateCrew(updatedMember);
      setSelectedMember(updatedMember);
      setWorkflowNote('');
  };

  const exportPDF = () => {
      alert("Esportazione PDF in corso... (Funzionalità mock)");
  };

  // Helper for Planning View dates
  const getNext7Days = () => {
      const dates = [];
      for(let i=0; i<7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          dates.push(d);
      }
      return dates;
  };
  const weekDates = getNext7Days();

  // Mock checking job assignment (In real implementation, pass jobs prop)
  const getAssignmentForDay = (crewId: string, date: Date) => {
      // Logic would be: jobs.find(j => j.assignedCrew.includes(crewId) && date >= startDate && date <= endDate)
      // Since we don't have full jobs prop here, we return null (Magazzino) effectively. 
      // To visualize, I'll mock one for Mario Rossi today.
      const dateStr = date.toISOString().split('T')[0];
      if (crewId === '1' && dateStr === new Date().toISOString().split('T')[0]) {
          return "Festival Jazz";
      }
      return null; // Null implies "Magazzino"
  };

  // --- MAIN VIEW ---
  return (
      <div className="space-y-6 animate-fade-in relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-white">Gestione Crew & Tecnici</h2>
            <div className="flex gap-4">
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    <button onClick={() => setViewMode('CARDS')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'CARDS' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><User size={16}/> Schede</button>
                    <button onClick={() => setViewMode('PLANNING')} className={`px-3 py-1 rounded text-sm transition-colors flex items-center gap-2 ${viewMode === 'PLANNING' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}><LayoutGrid size={16}/> Planning Settimanale</button>
                </div>
                {viewMode === 'CARDS' && (
                    <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                        <button onClick={() => setFilter('ALL')} className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'ALL' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}>Tutti</button>
                        <button onClick={() => setFilter('INTERNAL')} className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'INTERNAL' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}>Interni</button>
                        <button onClick={() => setFilter('FREELANCE')} className={`px-3 py-1 rounded text-sm transition-colors ${filter === 'FREELANCE' ? 'bg-glr-700 text-white' : 'text-gray-400'}`}>Esterni</button>
                    </div>
                )}
                {viewMode === 'PLANNING' && (
                    <button onClick={exportPDF} className="bg-glr-accent text-glr-900 font-bold px-3 py-1 rounded-lg hover:bg-amber-400 flex items-center gap-2 text-sm">
                        <FileDown size={18}/> Esporta PDF
                    </button>
                )}
            </div>
        </div>

        {viewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCrew.map(member => (
                <div key={member.id} className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 flex items-center justify-center text-xl font-bold text-glr-accent border border-glr-600">
                            {member.name.charAt(0)}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white leading-tight">{member.name}</h3>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${member.type === CrewType.INTERNAL ? 'bg-indigo-900 text-indigo-300' : 'bg-orange-900 text-orange-300'}`}>
                            {member.type}
                            </span>
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-sm font-mono text-gray-400 flex items-center justify-end gap-1">
                            <DollarSign size={12}/>{member.dailyRate}
                        </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-1 mb-4">
                        {member.roles.map(role => (
                        <span key={role} className="text-xs bg-glr-700 text-gray-300 px-2 py-1 rounded">
                            {role}
                        </span>
                        ))}
                    </div>

                    <div className="space-y-2 text-sm text-gray-400">
                        <div className="flex items-center gap-2">
                        <Phone size={14} /> {member.phone}
                        </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {(member.expenses || []).some(e => e.status === ApprovalStatus.PENDING) && (
                            <span className="flex items-center gap-1 text-[10px] bg-yellow-900/40 text-yellow-300 px-2 py-1 rounded border border-yellow-800">
                                <AlertCircle size={10} /> Rimborsi in attesa
                            </span>
                        )}
                        {(member.documents || []).some(d => d.expiryDate && new Date(d.expiryDate) < new Date()) && (
                            <span className="flex items-center gap-1 text-[10px] bg-red-900/40 text-red-300 px-2 py-1 rounded border border-red-800">
                                <AlertCircle size={10} /> Doc Scaduti
                            </span>
                        )}
                    </div>
                    </div>
                    
                    <div className="bg-glr-900 p-3 border-t border-glr-700 flex justify-between text-xs">
                        <button onClick={() => { setSelectedMember(member); setActiveTab('ABSENCES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><Calendar size={12}/> Ferie</button>
                        <button onClick={() => { setSelectedMember(member); setActiveTab('EXPENSES'); }} className="text-gray-400 hover:text-white hover:underline flex items-center gap-1"><FileText size={12}/> Note Spese</button>
                        <button onClick={() => { setSelectedMember(member); setActiveTab('INFO'); }} className="text-glr-accent hover:text-amber-400 hover:underline flex items-center gap-1">Dettagli <ChevronRight size={12}/></button>
                    </div>
                </div>
                ))}
            </div>
        ) : (
            // PLANNING VIEW
            <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-glr-900 text-gray-300 text-xs uppercase border-b border-glr-700">
                                <th className="p-4 w-48 sticky left-0 bg-glr-900 z-10">Tecnico</th>
                                {weekDates.map(d => (
                                    <th key={d.toString()} className="p-4 text-center min-w-[120px]">
                                        {d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700">
                            {filteredCrew.map(c => (
                                <tr key={c.id} className="hover:bg-glr-700/30">
                                    <td className="p-4 font-bold text-white sticky left-0 bg-glr-800 z-10 border-r border-glr-700">
                                        {c.name}
                                        <div className="text-[10px] font-normal text-gray-400">{c.roles[0]}</div>
                                    </td>
                                    {weekDates.map(d => {
                                        const assignedJob = getAssignmentForDay(c.id, d);
                                        return (
                                            <td key={d.toString()} className="p-2 border-r border-glr-700/50">
                                                {assignedJob ? (
                                                    <div className="bg-blue-600/20 border border-blue-500 text-blue-200 text-xs p-2 rounded text-center font-bold truncate">
                                                        {assignedJob}
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-700/20 text-gray-500 text-[10px] p-2 rounded text-center border border-dashed border-gray-700">
                                                        Magazzino
                                                    </div>
                                                )}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* MODAL */}
        {selectedMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
              <div className="bg-glr-900 rounded-xl border border-glr-600 w-full max-w-4xl shadow-2xl animate-fade-in flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-6 border-b border-glr-700 flex justify-between items-center bg-glr-800 rounded-t-xl shrink-0">
                      <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-gradient-to-br from-glr-700 to-glr-900 flex items-center justify-center text-xl font-bold text-glr-accent border border-glr-600">
                                {selectedMember.name.charAt(0)}
                           </div>
                           <div>
                               <h3 className="text-xl font-bold text-white">{selectedMember.name}</h3>
                               <p className="text-sm text-gray-400">{selectedMember.type} • {selectedMember.roles.join(', ')}</p>
                           </div>
                      </div>
                      <button onClick={() => setSelectedMember(null)} className="text-gray-400 hover:text-white p-2"><XCircle size={28}/></button>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-glr-700 shrink-0 overflow-x-auto">
                      <button onClick={() => setActiveTab('INFO')} className={`flex-1 py-3 text-sm font-bold whitespace-nowrap ${activeTab === 'INFO' ? 'bg-glr-800 text-white border-b-2 border-glr-accent' : 'text-gray-400 hover:bg-glr-800/50'}`}>Dati & Tariffe</button>
                      <button onClick={() => setActiveTab('DOCS')} className={`flex-1 py-3 text-sm font-bold whitespace-nowrap ${activeTab === 'DOCS' ? 'bg-glr-800 text-white border-b-2 border-glr-accent' : 'text-gray-400 hover:bg-glr-800/50'}`}>Documenti</button>
                      <button onClick={() => setActiveTab('ABSENCES')} className={`flex-1 py-3 text-sm font-bold whitespace-nowrap ${activeTab === 'ABSENCES' ? 'bg-glr-800 text-white border-b-2 border-glr-accent' : 'text-gray-400 hover:bg-glr-800/50'}`}>Ferie & Assenze</button>
                      <button onClick={() => setActiveTab('EXPENSES')} className={`flex-1 py-3 text-sm font-bold whitespace-nowrap ${activeTab === 'EXPENSES' ? 'bg-glr-800 text-white border-b-2 border-glr-accent' : 'text-gray-400 hover:bg-glr-800/50'}`}>Note Spese</button>
                  </div>

                  {/* Content */}
                  <div className="flex-1 overflow-y-auto p-6 bg-[#0b1120]">
                      
                      {activeTab === 'INFO' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                  <h4 className="text-glr-accent font-bold mb-4 flex items-center gap-2"><DollarSign size={18}/> Dati Economici</h4>
                                  <div className="space-y-3">
                                      <div className="flex justify-between border-b border-glr-700 pb-2">
                                          <span className="text-gray-400">Tariffa Giornaliera</span>
                                          <span className="text-white font-mono font-bold">€ {selectedMember.dailyRate}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-glr-700 pb-2">
                                          <span className="text-gray-400">Tariffa Straordinario /h</span>
                                          <span className="text-white font-mono font-bold">€ {selectedMember.overtimeRate || '-'}</span>
                                      </div>
                                      <div className="flex justify-between border-b border-glr-700 pb-2">
                                          <span className="text-gray-400">Indennità Trasferta</span>
                                          <span className="text-white font-mono font-bold">€ {selectedMember.travelIndemnity || '-'}</span>
                                      </div>
                                  </div>
                              </div>
                              <div className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                  <h4 className="text-glr-accent font-bold mb-4 flex items-center gap-2"><User size={18}/> Anagrafica</h4>
                                  <div className="space-y-3">
                                      <div className="flex justify-between">
                                          <span className="text-gray-400">Telefono</span>
                                          <span className="text-white">{selectedMember.phone}</span>
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}

                      {activeTab === 'DOCS' && (
                          <div className="space-y-6">
                              {/* New Doc Form */}
                              <div className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                  <h4 className="text-white font-bold mb-3 text-sm flex items-center gap-2"><Upload size={16}/> Carica Nuovo Documento</h4>
                                  <div className="flex flex-col gap-3">
                                      <div className="flex gap-2 items-end">
                                           <div className="flex-1">
                                                <label className="text-xs text-gray-400 block mb-1">File</label>
                                                <input type="file" ref={fileInputRef} className="w-full bg-glr-900 border border-glr-600 rounded p-1.5 text-xs text-gray-300" />
                                           </div>
                                           <div className="flex-1">
                                               <label className="text-xs text-gray-400 block mb-1">Nome Documento</label>
                                               <input type="text" value={newDocName} onChange={e => setNewDocName(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Unilav 2024" />
                                           </div>
                                      </div>
                                      <div className="flex gap-2 items-end">
                                          <div className="flex-1">
                                               <label className="text-xs text-gray-400 block mb-1">Tipo</label>
                                               <select value={newDocType} onChange={e => setNewDocType(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                                   <option>Unilav</option>
                                                   <option>Certificazione</option>
                                                   <option>Visita Medica</option>
                                                   <option>Patente</option>
                                                   <option>Altro</option>
                                               </select>
                                          </div>
                                          <div className="flex-1">
                                               <label className="text-xs text-gray-400 block mb-1">Scadenza (opzionale)</label>
                                               <input type="date" value={newDocExpiry} onChange={e => setNewDocExpiry(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" />
                                          </div>
                                          <button onClick={handleAddDocument} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded text-sm hover:bg-amber-400 shrink-0">
                                              Carica
                                          </button>
                                      </div>
                                  </div>
                              </div>

                              {/* Docs List */}
                              <div className="space-y-2">
                                  {(selectedMember.documents || []).map(doc => {
                                      const isExpired = doc.expiryDate && new Date(doc.expiryDate) < new Date();
                                      const isExpiringSoon = doc.expiryDate && new Date(doc.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                                      
                                      return (
                                          <div key={doc.id} className="bg-glr-800 p-3 rounded-lg border border-glr-700 flex items-center justify-between">
                                              <div className="flex items-center gap-3">
                                                  <div className="p-2 bg-glr-900 rounded text-gray-300">
                                                      <FileText size={20} />
                                                  </div>
                                                  <div>
                                                      <h5 className="text-white font-bold text-sm">{doc.name}</h5>
                                                      <div className="text-xs text-gray-400 flex items-center gap-2">
                                                          <span>{doc.type}</span>
                                                          <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                                          <span>Caricato il {new Date(doc.uploadDate).toLocaleDateString()}</span>
                                                      </div>
                                                  </div>
                                              </div>

                                              <div className="flex items-center gap-4">
                                                  {doc.expiryDate && (
                                                      <div className={`text-xs px-2 py-1 rounded border ${
                                                          isExpired ? 'bg-red-900/50 border-red-800 text-red-300' : 
                                                          isExpiringSoon ? 'bg-yellow-900/50 border-yellow-800 text-yellow-300' : 
                                                          'bg-green-900/50 border-green-800 text-green-300'
                                                      }`}>
                                                          Scade: {new Date(doc.expiryDate).toLocaleDateString()}
                                                      </div>
                                                  )}
                                                  <button className="text-blue-400 hover:text-blue-300 p-1" title="Scarica"><Download size={16}/></button>
                                                  <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-500 hover:text-red-400 p-1" title="Elimina"><Trash2 size={16}/></button>
                                              </div>
                                          </div>
                                      );
                                  })}
                                  {(selectedMember.documents || []).length === 0 && (
                                      <p className="text-gray-500 italic text-center py-8">Nessun documento caricato.</p>
                                  )}
                              </div>
                          </div>
                      )}

                      {activeTab === 'ABSENCES' && (
                          <div className="space-y-6">
                              {/* New Absence Form */}
                              <div className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                  <h4 className="text-white font-bold mb-3 text-sm">Richiedi Nuova Assenza</h4>
                                  <div className="flex gap-3 items-end">
                                      <div className="flex-1">
                                          <label className="text-xs text-gray-400">Tipo</label>
                                          <select value={newAbsenceType} onChange={e => setNewAbsenceType(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                              <option>Ferie</option>
                                              <option>Permesso</option>
                                              <option>Malattia</option>
                                          </select>
                                      </div>
                                      <div className="flex-1">
                                          <label className="text-xs text-gray-400">Dal</label>
                                          <input type="date" value={newAbsenceStart} onChange={e => setNewAbsenceStart(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/>
                                      </div>
                                      <div className="flex-1">
                                          <label className="text-xs text-gray-400">Al</label>
                                          <input type="date" value={newAbsenceEnd} onChange={e => setNewAbsenceEnd(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/>
                                      </div>
                                      <button onClick={handleAddAbsence} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded text-sm hover:bg-amber-400">Richiedi</button>
                                  </div>
                              </div>

                              {/* List */}
                              <div className="space-y-3">
                                  {(selectedMember.absences || []).map(abs => (
                                      <div key={abs.id} className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                          <div className="flex justify-between items-start mb-2">
                                              <div>
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-white font-bold">{abs.type}</span>
                                                      <StatusBadge status={abs.status} />
                                                  </div>
                                                  <div className="text-sm text-gray-400 mt-1 flex items-center gap-2">
                                                      <Calendar size={14}/> {abs.startDate} <ChevronRight size={12}/> {abs.endDate}
                                                  </div>
                                              </div>
                                              
                                              {/* Actions */}
                                              {abs.status === ApprovalStatus.PENDING && (
                                                  <div className="flex gap-2">
                                                       <input type="text" placeholder="Note approvazione..." value={workflowNote} onChange={e => setWorkflowNote(e.target.value)} className="bg-glr-900 border border-glr-600 rounded px-2 text-xs text-white w-32"/>
                                                       <button onClick={() => updateAbsenceStatus(abs.id, ApprovalStatus.APPROVED_MANAGER)} className="bg-green-600 hover:bg-green-500 text-white p-1 rounded"><CheckCircle size={18}/></button>
                                                       <button onClick={() => updateAbsenceStatus(abs.id, ApprovalStatus.REJECTED)} className="bg-red-600 hover:bg-red-500 text-white p-1 rounded"><XCircle size={18}/></button>
                                                  </div>
                                              )}
                                          </div>
                                          
                                          {/* Workflow Toggle/View */}
                                          <details className="mt-2 text-xs">
                                              <summary className="cursor-pointer text-gray-500 hover:text-gray-300">Vedi Cronologia Approvazione</summary>
                                              <WorkflowTimeline logs={abs.workflowLog} />
                                          </details>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      {activeTab === 'EXPENSES' && (
                           <div className="space-y-6">
                              {/* New Expense Form */}
                              <div className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                  <h4 className="text-white font-bold mb-3 text-sm">Nuova Nota Spese</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                                      <div className="col-span-1">
                                          <label className="text-xs text-gray-400">Categoria</label>
                                          <select value={newExpenseCat} onChange={e => setNewExpenseCat(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm">
                                              <option>Viaggio</option>
                                              <option>Pasto</option>
                                              <option>Alloggio</option>
                                              <option>Materiale</option>
                                              <option>Altro</option>
                                          </select>
                                      </div>
                                      <div className="col-span-1">
                                          <label className="text-xs text-gray-400">Importo (€)</label>
                                          <input type="number" step="0.01" value={newExpenseAmount} onChange={e => setNewExpenseAmount(parseFloat(e.target.value))} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm"/>
                                      </div>
                                      <div className="col-span-2 flex gap-2">
                                          <div className="flex-1">
                                              <label className="text-xs text-gray-400">Descrizione</label>
                                              <input type="text" value={newExpenseDesc} onChange={e => setNewExpenseDesc(e.target.value)} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="Es. Pranzo Milano"/>
                                          </div>
                                          <button onClick={handleAddExpense} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded text-sm hover:bg-amber-400 self-end">Aggiungi</button>
                                      </div>
                                  </div>
                              </div>

                               {/* Expenses List */}
                               <div className="space-y-3">
                                  {(selectedMember.expenses || []).map(exp => (
                                      <div key={exp.id} className="bg-glr-800 p-4 rounded-lg border border-glr-700">
                                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-glr-900 p-3 rounded text-glr-accent font-bold text-lg border border-glr-600 min-w-[80px] text-center">
                                                        € {exp.amount}
                                                    </div>
                                                    <div>
                                                        <h5 className="font-bold text-white text-sm">{exp.description}</h5>
                                                        <p className="text-xs text-gray-400">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-2">
                                                    <StatusBadge status={exp.status} />
                                                </div>
                                           </div>

                                           {/* APPROVAL WORKFLOW ACTIONS */}
                                           <div className="mt-3 pt-3 border-t border-glr-700/50 flex flex-col sm:flex-row gap-2 items-center bg-glr-900/30 p-2 rounded">
                                                <span className="text-xs text-gray-500 mr-auto flex items-center gap-1"><MessageSquare size={12}/> Workflow:</span>
                                                
                                                {/* INPUT NOTE */}
                                                {(exp.status === ApprovalStatus.PENDING || exp.status === ApprovalStatus.APPROVED_MANAGER) && (
                                                    <input type="text" placeholder="Note interne..." value={workflowNote} onChange={e => setWorkflowNote(e.target.value)} 
                                                        className="bg-glr-800 border border-glr-600 rounded px-2 py-1 text-xs text-white w-full sm:w-48"/>
                                                )}

                                                {/* STAGE 1: MANAGER APPROVAL */}
                                                {exp.status === ApprovalStatus.PENDING && (
                                                    <>
                                                        <button onClick={() => updateExpenseStatus(exp.id, ApprovalStatus.APPROVED_MANAGER)} 
                                                            className="flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs">
                                                            Approva (Manager)
                                                        </button>
                                                        <button onClick={() => updateExpenseStatus(exp.id, ApprovalStatus.REJECTED)} 
                                                            className="flex items-center gap-1 bg-red-600 hover:bg-red-500 text-white px-2 py-1 rounded text-xs">
                                                            Rifiuta
                                                        </button>
                                                    </>
                                                )}

                                                {/* STAGE 2: ADMIN PAYMENT */}
                                                {exp.status === ApprovalStatus.APPROVED_MANAGER && (
                                                    <button onClick={() => updateExpenseStatus(exp.id, ApprovalStatus.COMPLETED)} 
                                                        className="flex items-center gap-1 bg-green-600 hover:bg-green-500 text-white px-2 py-1 rounded text-xs">
                                                        Segna Pagato
                                                    </button>
                                                )}
                                           </div>

                                            <details className="mt-2 text-xs">
                                              <summary className="cursor-pointer text-gray-500 hover:text-gray-300">Vedi Cronologia Workflow</summary>
                                              <WorkflowTimeline logs={exp.workflowLog} />
                                          </details>
                                      </div>
                                  ))}
                                  {(selectedMember.expenses || []).length === 0 && <p className="text-gray-500 italic text-center py-4">Nessuna spesa registrata.</p>}
                               </div>
                           </div>
                      )}

                  </div>
              </div>
          </div>
        )}
      </div>
  );
};
