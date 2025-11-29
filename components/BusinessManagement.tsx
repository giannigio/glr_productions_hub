import React, { useState, useEffect, useMemo } from 'react';
import { 
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Job, CrewMember, CompanyExpense, RecurringPayment, PersonnelCost, JobStatus, CrewType, ApprovalStatus } from '../types';
import { api } from '../services/api';
import { 
    DollarSign, TrendingUp, TrendingDown, Calendar, FileText, Plus, Trash2, Edit3, Save, X, 
    PieChart as PieIcon, BarChart as BarIcon, Briefcase, Users, AlertTriangle, CheckCircle 
} from 'lucide-react';

interface BusinessManagementProps {
    jobs: Job[];
    crew: CrewMember[];
}

export const BusinessManagement: React.FC<BusinessManagementProps> = ({ jobs, crew }) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'EXPENSES' | 'RECURRING' | 'PERSONNEL' | 'JOBS_ANALYSIS'>('DASHBOARD');
    const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
    const [recurring, setRecurring] = useState<RecurringPayment[]>([]);
    const [personnelCosts, setPersonnelCosts] = useState<PersonnelCost[]>([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());

    // Editor States
    const [isEditingExp, setIsEditingExp] = useState(false);
    const [activeExp, setActiveExp] = useState<CompanyExpense | null>(null);
    const [isEditingRec, setIsEditingRec] = useState(false);
    const [activeRec, setActiveRec] = useState<RecurringPayment | null>(null);
    const [isEditingPers, setIsEditingPers] = useState(false);
    const [activePers, setActivePers] = useState<PersonnelCost | null>(null);

    useEffect(() => {
        const loadFinancials = async () => {
            try {
                const [exp, rec, pers] = await Promise.all([
                    api.getCompanyExpenses(),
                    api.getRecurringPayments(),
                    api.getPersonnelCosts()
                ]);
                setExpenses(exp);
                setRecurring(rec);
                setPersonnelCosts(pers);
            } finally {
                setLoading(false);
            }
        };
        loadFinancials();
    }, []);

    // --- ANALYTICS HELPERS ---

    const getJobFinancials = (job: Job) => {
        const days = Math.max(1, Math.ceil((new Date(job.endDate).getTime() - new Date(job.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1);
        
        // Crew Costs
        const crewCost = job.assignedCrew.reduce((acc, crewId) => {
            const member = crew.find(c => c.id === crewId);
            return acc + (member && member.type === CrewType.FREELANCE ? member.dailyRate * days : 0);
        }, 0);

        // Internal Per Diem
        const internalCrewIds = job.assignedCrew.filter(id => crew.find(c => c.id === id)?.type === CrewType.INTERNAL);
        const perDiemCost = job.isAwayJob ? internalCrewIds.length * days * 50 : 0; // Assuming 50 euro standard

        // Material & Vehicles
        const matCost = job.materialList.reduce((acc, m) => acc + (m.isExternal ? (m.cost || 0) * m.quantity : 0), 0);
        const vehCost = job.vehicles.reduce((acc, v) => acc + (v.isRental ? (v.cost || 0) : 0), 0);
        
        // Expenses
        const expCost = crew.reduce((acc, c) => {
            const jobExpenses = c.expenses?.filter(e => e.jobId === job.id && (e.status === ApprovalStatus.APPROVED_MANAGER || e.status === ApprovalStatus.COMPLETED)) || [];
            return acc + jobExpenses.reduce((sum, e) => sum + e.amount, 0);
        }, 0);

        const ztlCost = job.location.includes('ZTL') ? 70 : 0; // Simplified check

        const totalDirectCost = crewCost + perDiemCost + matCost + vehCost + expCost + (job.extraCharges || 0) + ztlCost;
        const margin = (job.totalInvoiced || 0) - totalDirectCost;

        return {
            revenue: job.totalInvoiced || 0,
            directCosts: totalDirectCost,
            margin: margin,
            marginPercent: job.totalInvoiced ? (margin / job.totalInvoiced) * 100 : 0
        };
    };

    // --- DASHBOARD DATA PREPARATION ---

    const dashboardData = useMemo(() => {
        const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'];
        
        // 1. Revenue per month
        const revenueByMonth = new Array(12).fill(0);
        jobs.filter(j => new Date(j.endDate).getFullYear() === yearFilter && (j.status === JobStatus.COMPLETED || j.status === JobStatus.CONFIRMED)).forEach(j => {
            const m = new Date(j.endDate).getMonth();
            revenueByMonth[m] += (j.totalInvoiced || 0);
        });

        // 2. Costs per month (Direct + Overhead)
        const costsByMonth = new Array(12).fill(0);
        
        // Job Direct Costs
        jobs.filter(j => new Date(j.endDate).getFullYear() === yearFilter && (j.status === JobStatus.COMPLETED || j.status === JobStatus.CONFIRMED)).forEach(j => {
            const m = new Date(j.endDate).getMonth();
            costsByMonth[m] += getJobFinancials(j).directCosts;
        });

        // Company Expenses
        expenses.filter(e => new Date(e.date).getFullYear() === yearFilter).forEach(e => {
            const m = new Date(e.date).getMonth();
            costsByMonth[m] += e.amount;
        });

        // Personnel Costs
        personnelCosts.filter(p => new Date(p.date).getFullYear() === yearFilter).forEach(p => {
            const m = new Date(p.date).getMonth();
            costsByMonth[m] += p.amount;
        });

        // Recurring (Simulated for the year)
        recurring.filter(r => r.isActive).forEach(r => {
            // Simplified: Add to every month if Monthly
            if (r.frequency === 'Monthly') {
                for(let i=0; i<12; i++) costsByMonth[i] += r.amount;
            } else if (r.frequency === 'Yearly') {
                const m = new Date(r.nextDueDate).getMonth(); // Just add to due month
                if(new Date(r.nextDueDate).getFullYear() === yearFilter) costsByMonth[m] += r.amount;
            }
        });

        const chartData = months.map((name, i) => ({
            name,
            Ricavi: revenueByMonth[i],
            Costi: costsByMonth[i],
            Utile: revenueByMonth[i] - costsByMonth[i]
        }));

        const totalRevenue = revenueByMonth.reduce((a,b) => a+b, 0);
        const totalCosts = costsByMonth.reduce((a,b) => a+b, 0);

        return { chartData, totalRevenue, totalCosts, netProfit: totalRevenue - totalCosts };
    }, [jobs, expenses, recurring, personnelCosts, yearFilter]);

    const costBreakdownData = useMemo(() => {
        let fixed = 0; // Recurring + Expenses
        let personnel = 0; // F24
        let jobDirect = 0; // Job specific

        expenses.filter(e => new Date(e.date).getFullYear() === yearFilter).forEach(e => fixed += e.amount);
        
        recurring.filter(r => r.isActive).forEach(r => {
             if (r.frequency === 'Monthly') fixed += (r.amount * 12);
             else if (new Date(r.nextDueDate).getFullYear() === yearFilter) fixed += r.amount;
        });

        personnelCosts.filter(p => new Date(p.date).getFullYear() === yearFilter).forEach(p => personnel += p.amount);

        jobs.filter(j => new Date(j.endDate).getFullYear() === yearFilter && (j.status === JobStatus.COMPLETED || j.status === JobStatus.CONFIRMED)).forEach(j => {
            jobDirect += getJobFinancials(j).directCosts;
        });

        return [
            { name: 'Costi Fissi/Generali', value: fixed },
            { name: 'Personale (F24/Tasse)', value: personnel },
            { name: 'Costi Diretti Commesse', value: jobDirect }
        ];
    }, [jobs, expenses, recurring, personnelCosts, yearFilter]);

    const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'];

    // --- CRUD HANDLERS ---

    const saveExpense = async () => {
        if (!activeExp) return;
        if (activeExp.id) {
            const updated = await api.updateCompanyExpense(activeExp);
            setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
        } else {
            const saved = await api.createCompanyExpense(activeExp);
            setExpenses(prev => [...prev, saved]);
        }
        setIsEditingExp(false); setActiveExp(null);
    };

    const deleteExpense = async (id: string) => {
        await api.deleteCompanyExpense(id);
        setExpenses(prev => prev.filter(e => e.id !== id));
    };

    const saveRecurring = async () => {
        if (!activeRec) return;
        if (activeRec.id) {
            const updated = await api.updateRecurringPayment(activeRec);
            setRecurring(prev => prev.map(r => r.id === updated.id ? updated : r));
        } else {
            const saved = await api.createRecurringPayment(activeRec);
            setRecurring(prev => [...prev, saved]);
        }
        setIsEditingRec(false); setActiveRec(null);
    };

    const deleteRecurring = async (id: string) => {
        await api.deleteRecurringPayment(id);
        setRecurring(prev => prev.filter(r => r.id !== id));
    };

    const savePersonnel = async () => {
        if (!activePers) return;
        if (activePers.id) {
            const updated = await api.updatePersonnelCost(activePers);
            setPersonnelCosts(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else {
            const saved = await api.createPersonnelCost(activePers);
            setPersonnelCosts(prev => [...prev, saved]);
        }
        setIsEditingPers(false); setActivePers(null);
    };

    const deletePersonnel = async (id: string) => {
        await api.deletePersonnelCost(id);
        setPersonnelCosts(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className="space-y-6 animate-fade-in h-full flex flex-col">
            <div className="flex justify-between items-center shrink-0">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2"><Briefcase /> Gestione Azienda & Controllo</h2>
                <div className="flex bg-glr-800 rounded-lg p-1 border border-glr-700">
                    {['DASHBOARD', 'JOBS_ANALYSIS', 'EXPENSES', 'RECURRING', 'PERSONNEL'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-4 py-2 rounded text-sm font-bold transition-colors ${activeTab === tab ? 'bg-glr-accent text-glr-900' : 'text-gray-400 hover:text-white'}`}>
                            {tab === 'DASHBOARD' ? 'Dashboard' : tab === 'JOBS_ANALYSIS' ? 'Analisi Commesse' : tab === 'EXPENSES' ? 'Costi Generali' : tab === 'RECURRING' ? 'Scadenziario' : 'Personale'}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- DASHBOARD TAB --- */}
            {activeTab === 'DASHBOARD' && (
                <div className="space-y-6 overflow-y-auto pr-2">
                    <div className="flex justify-end">
                        <select value={yearFilter} onChange={e => setYearFilter(parseInt(e.target.value))} className="bg-glr-800 text-white border border-glr-600 rounded p-2 text-sm font-bold">
                            {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>

                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg">
                            <p className="text-xs text-gray-400 uppercase font-bold">Fatturato Annuo</p>
                            <p className="text-2xl font-bold text-white">€ {dashboardData.totalRevenue.toLocaleString()}</p>
                        </div>
                        <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg">
                            <p className="text-xs text-gray-400 uppercase font-bold">Totale Costi</p>
                            <p className="text-2xl font-bold text-red-400">€ {dashboardData.totalCosts.toLocaleString()}</p>
                        </div>
                        <div className={`bg-glr-800 p-6 rounded-xl border shadow-lg ${dashboardData.netProfit >= 0 ? 'border-green-600/50' : 'border-red-600/50'}`}>
                            <p className="text-xs text-gray-400 uppercase font-bold">Utile Netto</p>
                            <p className={`text-2xl font-bold ${dashboardData.netProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>€ {dashboardData.netProfit.toLocaleString()}</p>
                        </div>
                        <div className="bg-glr-800 p-6 rounded-xl border border-glr-700 shadow-lg">
                            <p className="text-xs text-gray-400 uppercase font-bold">Margine %</p>
                            <p className="text-2xl font-bold text-blue-400">
                                {dashboardData.totalRevenue > 0 ? ((dashboardData.netProfit / dashboardData.totalRevenue) * 100).toFixed(1) : 0}%
                            </p>
                        </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[400px]">
                        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><BarIcon size={16}/> Andamento Mensile</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={dashboardData.chartData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={12}/>
                                    <YAxis stroke="#94a3b8" fontSize={12}/>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                    <Legend />
                                    <Bar dataKey="Ricavi" fill="#3b82f6" />
                                    <Bar dataKey="Costi" fill="#ef4444" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2"><PieIcon size={16}/> Ripartizione Costi</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <PieChart>
                                    <Pie data={costBreakdownData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                                        {costBreakdownData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* --- JOBS ANALYSIS TAB --- */}
            {activeTab === 'JOBS_ANALYSIS' && (
                <div className="bg-glr-800 border border-glr-700 rounded-xl overflow-hidden shadow-lg flex-1 flex flex-col">
                    <div className="p-4 bg-glr-900 border-b border-glr-700 flex justify-between">
                        <h3 className="text-white font-bold flex items-center gap-2"><Briefcase size={18}/> Analisi Redditività Commesse</h3>
                        <button className="text-sm bg-glr-700 text-white px-3 py-1 rounded hover:bg-glr-600">Esporta Excel</button>
                    </div>
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-glr-900 text-gray-400 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="p-4">Commessa</th>
                                    <th className="p-4">Cliente</th>
                                    <th className="p-4 text-right">Fatturato</th>
                                    <th className="p-4 text-right">Costi Diretti</th>
                                    <th className="p-4 text-right">Margine (€)</th>
                                    <th className="p-4 text-center">Margine (%)</th>
                                    <th className="p-4 text-center">Stato</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glr-700">
                                {jobs.filter(j => j.status === JobStatus.COMPLETED || j.status === JobStatus.CONFIRMED).map(job => {
                                    const financials = getJobFinancials(job);
                                    return (
                                        <tr key={job.id} className="hover:bg-glr-700/50">
                                            <td className="p-4 font-bold text-white">{job.title}</td>
                                            <td className="p-4 text-gray-300">{job.client}</td>
                                            <td className="p-4 text-right font-mono">€ {financials.revenue.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-red-300">€ {financials.directCosts.toLocaleString()}</td>
                                            <td className={`p-4 text-right font-mono font-bold ${financials.margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>€ {financials.margin.toLocaleString()}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${financials.marginPercent > 30 ? 'bg-green-900/50 text-green-300' : financials.marginPercent > 10 ? 'bg-yellow-900/50 text-yellow-300' : 'bg-red-900/50 text-red-300'}`}>
                                                    {financials.marginPercent.toFixed(1)}%
                                                </span>
                                            </td>
                                            <td className="p-4 text-center"><span className="text-[10px] bg-glr-900 px-2 py-1 rounded border border-glr-600">{job.status}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- EXPENSES TAB --- */}
            {activeTab === 'EXPENSES' && (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                            <select className="bg-glr-800 border border-glr-700 rounded p-2 text-white text-sm">
                                <option>2024</option>
                            </select>
                        </div>
                        <button onClick={() => { setActiveExp({ id: '', date: new Date().toISOString().split('T')[0], category: 'Affitto', description: '', amount: 0, isPaid: false }); setIsEditingExp(true); }} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-400"><Plus size={18}/> Nuova Spesa</button>
                    </div>
                    
                    <div className="bg-glr-800 border border-glr-700 rounded-xl overflow-hidden flex-1 flex flex-col shadow-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-glr-900 text-gray-400 uppercase text-xs sticky top-0">
                                <tr>
                                    <th className="p-4">Data</th>
                                    <th className="p-4">Categoria</th>
                                    <th className="p-4">Descrizione</th>
                                    <th className="p-4 text-right">Importo</th>
                                    <th className="p-4 text-center">Pagato</th>
                                    <th className="p-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glr-700">
                                {expenses.map(e => (
                                    <tr key={e.id} className="hover:bg-glr-700/50">
                                        <td className="p-4 text-gray-300">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="p-4"><span className="bg-blue-900/30 text-blue-200 px-2 py-1 rounded text-xs border border-blue-800">{e.category}</span></td>
                                        <td className="p-4 text-white font-medium">{e.description}</td>
                                        <td className="p-4 text-right font-mono font-bold">€ {e.amount.toFixed(2)}</td>
                                        <td className="p-4 text-center">{e.isPaid ? <CheckCircle size={16} className="text-green-500 mx-auto"/> : <AlertTriangle size={16} className="text-red-500 mx-auto"/>}</td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setActiveExp(e); setIsEditingExp(true); }} className="p-1.5 bg-glr-900 rounded hover:bg-glr-700 text-gray-400"><Edit3 size={16}/></button>
                                                <button onClick={() => deleteExpense(e.id)} className="p-1.5 bg-glr-900 rounded hover:bg-red-900/50 text-red-400"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- RECURRING TAB --- */}
            {activeTab === 'RECURRING' && (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-end">
                        <button onClick={() => { setActiveRec({ id: '', name: '', category: 'Leasing', amount: 0, frequency: 'Monthly', nextDueDate: new Date().toISOString().split('T')[0], isActive: true }); setIsEditingRec(true); }} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-400"><Plus size={18}/> Nuovo Canone</button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {recurring.map(r => (
                            <div key={r.id} className="bg-glr-800 border border-glr-700 p-5 rounded-xl shadow-lg relative group hover:border-glr-500 transition-colors">
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => { setActiveRec(r); setIsEditingRec(true); }} className="p-1.5 bg-glr-900 rounded hover:bg-glr-700 text-gray-300"><Edit3 size={14}/></button>
                                    <button onClick={() => deleteRecurring(r.id)} className="p-1.5 bg-glr-900 rounded hover:bg-red-900/50 text-red-400"><Trash2 size={14}/></button>
                                </div>
                                <div className="mb-4">
                                    <span className="text-[10px] uppercase font-bold text-blue-400 tracking-wider bg-blue-900/20 px-2 py-1 rounded border border-blue-900">{r.category}</span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-1">{r.name}</h3>
                                <p className="text-sm text-gray-400 mb-4">{r.provider || '-'}</p>
                                <div className="flex justify-between items-end border-t border-glr-700 pt-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase">Prossima Scadenza</p>
                                        <p className="text-white font-bold flex items-center gap-2"><Calendar size={14} className="text-glr-accent"/> {new Date(r.nextDueDate).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500 uppercase">{r.frequency === 'Monthly' ? 'Mensile' : 'Annuale'}</p>
                                        <p className="text-xl font-mono font-bold text-white">€ {r.amount}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- PERSONNEL TAB --- */}
            {activeTab === 'PERSONNEL' && (
                <div className="flex-1 flex flex-col gap-4">
                    <div className="flex justify-end">
                        <button onClick={() => { setActivePers({ id: '', title: '', date: new Date().toISOString().split('T')[0], amount: 0, type: 'F24', status: 'UNPAID' }); setIsEditingPers(true); }} className="bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded flex items-center gap-2 hover:bg-amber-400"><Plus size={18}/> Nuovo F24 / Contributo</button>
                    </div>
                    
                    <div className="bg-glr-800 border border-glr-700 rounded-xl overflow-hidden shadow-lg">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-glr-900 text-gray-400 uppercase text-xs">
                                <tr>
                                    <th className="p-4">Scadenza</th>
                                    <th className="p-4">Descrizione</th>
                                    <th className="p-4">Tipo</th>
                                    <th className="p-4 text-right">Importo</th>
                                    <th className="p-4 text-center">Stato</th>
                                    <th className="p-4 text-right">Azioni</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-glr-700">
                                {personnelCosts.map(p => (
                                    <tr key={p.id} className="hover:bg-glr-700/50">
                                        <td className="p-4 text-gray-300">{new Date(p.date).toLocaleDateString()}</td>
                                        <td className="p-4 text-white font-bold">{p.title}</td>
                                        <td className="p-4"><span className="bg-purple-900/30 text-purple-200 px-2 py-1 rounded text-xs border border-purple-800">{p.type}</span></td>
                                        <td className="p-4 text-right font-mono font-bold">€ {p.amount.toFixed(2)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${p.status === 'PAID' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>
                                                {p.status === 'PAID' ? 'PAGATO' : 'DA PAGARE'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => { setActivePers(p); setIsEditingPers(true); }} className="p-1.5 bg-glr-900 rounded hover:bg-glr-700 text-gray-400"><Edit3 size={16}/></button>
                                                <button onClick={() => deletePersonnel(p.id)} className="p-1.5 bg-glr-900 rounded hover:bg-red-900/50 text-red-400"><Trash2 size={16}/></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MODALS (Simplified for brevity, structure repeated) --- */}
            {/* Expense Modal */}
            {isEditingExp && activeExp && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Gestione Spesa</h3>
                        <div className="space-y-4">
                            <input type="date" value={activeExp.date} onChange={e => setActiveExp({...activeExp, date: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <input type="text" placeholder="Descrizione" value={activeExp.description} onChange={e => setActiveExp({...activeExp, description: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <select value={activeExp.category} onChange={e => setActiveExp({...activeExp, category: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                <option>Affitto Locali</option><option>Utenze</option><option>Assicurazioni</option><option>Consulenze</option><option>Manutenzioni</option><option>Altro</option>
                            </select>
                            <input type="number" placeholder="Importo" value={activeExp.amount} onChange={e => setActiveExp({...activeExp, amount: parseFloat(e.target.value)})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={activeExp.isPaid} onChange={e => setActiveExp({...activeExp, isPaid: e.target.checked})}/><span className="text-white">Pagato</span></label>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setIsEditingExp(false)} className="flex-1 bg-glr-700 text-white py-2 rounded">Annulla</button>
                                <button onClick={saveExpense} className="flex-1 bg-glr-accent text-glr-900 font-bold py-2 rounded">Salva</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Recurring Modal */}
            {isEditingRec && activeRec && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Gestione Canone</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome (es. Leasing Ducato)" value={activeRec.name} onChange={e => setActiveRec({...activeRec, name: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <select value={activeRec.category} onChange={e => setActiveRec({...activeRec, category: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                <option>Leasing</option><option>Abbonamenti</option><option>Software</option><option>Servizi</option>
                            </select>
                            <input type="number" placeholder="Importo" value={activeRec.amount} onChange={e => setActiveRec({...activeRec, amount: parseFloat(e.target.value)})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <select value={activeRec.frequency} onChange={e => setActiveRec({...activeRec, frequency: e.target.value as any})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                <option value="Monthly">Mensile</option><option value="Yearly">Annuale</option>
                            </select>
                            <div><label className="text-xs text-gray-400">Prossima Scadenza</label><input type="date" value={activeRec.nextDueDate} onChange={e => setActiveRec({...activeRec, nextDueDate: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/></div>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setIsEditingRec(false)} className="flex-1 bg-glr-700 text-white py-2 rounded">Annulla</button>
                                <button onClick={saveRecurring} className="flex-1 bg-glr-accent text-glr-900 font-bold py-2 rounded">Salva</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Personnel Modal */}
            {isEditingPers && activePers && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-glr-800 rounded-xl border border-glr-600 w-full max-w-md p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-4">Gestione Costo Personale</h3>
                        <div className="space-y-4">
                            <input type="text" placeholder="Titolo (es. F24 Gennaio)" value={activePers.title} onChange={e => setActivePers({...activePers, title: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <select value={activePers.type} onChange={e => setActivePers({...activePers, type: e.target.value as any})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                <option>F24</option><option>INPS</option><option>INAIL</option><option>TFR</option>
                            </select>
                            <input type="number" placeholder="Importo" value={activePers.amount} onChange={e => setActivePers({...activePers, amount: parseFloat(e.target.value)})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            <div><label className="text-xs text-gray-400">Data Scadenza</label><input type="date" value={activePers.date} onChange={e => setActivePers({...activePers, date: e.target.value})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/></div>
                            <select value={activePers.status} onChange={e => setActivePers({...activePers, status: e.target.value as any})} className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white">
                                <option value="UNPAID">Da Pagare</option><option value="PAID">Pagato</option>
                            </select>
                            <div className="flex gap-2 pt-4">
                                <button onClick={() => setIsEditingPers(false)} className="flex-1 bg-glr-700 text-white py-2 rounded">Annulla</button>
                                <button onClick={savePersonnel} className="flex-1 bg-glr-accent text-glr-900 font-bold py-2 rounded">Salva</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};