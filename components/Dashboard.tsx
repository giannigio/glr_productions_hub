

import React, { useState } from 'react';
import { Job, JobStatus, CrewMember } from '../types';
import { calculateMissedRestDays } from '../services/api';
import { ChevronLeft, ChevronRight, Briefcase, AlertCircle, Truck, Users, List, AlertTriangle, Calendar as CalIcon, Clock } from 'lucide-react';

interface DashboardProps {
  jobs: Job[];
  crew?: CrewMember[]; // Optional for now until passed in App.tsx
}

export const Dashboard: React.FC<DashboardProps> = ({ jobs, crew = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // KPI Stats
  const stats = {
    active: jobs.filter(j => j.status === JobStatus.IN_PROGRESS || j.status === JobStatus.CONFIRMED).length,
    drafts: jobs.filter(j => j.status === JobStatus.DRAFT).length,
    completed: jobs.filter(j => j.status === JobStatus.COMPLETED).length,
  };

  // Calendar Helpers
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay(); // 0 = Sun
  
  // Navigation
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));

  // Calendar Grid Data
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getFirstDayOfMonth(year, month);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: adjustedStartDay }, (_, i) => i);

  // Data Filtering
  const getJobsForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return jobs.filter(j => {
          if (j.status === JobStatus.CANCELLED) return false;
          return j.startDate <= dateStr && j.endDate >= dateStr;
      });
  };

  const upcomingJobs = jobs
    .filter(j => (j.status === JobStatus.CONFIRMED || j.status === JobStatus.IN_PROGRESS) && new Date(j.startDate) >= new Date())
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const priorityTasks = jobs.filter(j => 
    j.status === JobStatus.CONFIRMED && (j.materialList.length === 0 || j.assignedCrew.length === 0)
  );

  const monthNames = ["Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno", "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre"];

  return (
    <div className="space-y-6 animate-fade-in h-full flex flex-col overflow-y-auto">
       {/* KPI Cards Row */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-blue-500/20 rounded-full text-blue-400 mr-4"><Briefcase size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Attivi</p><p className="text-2xl font-bold text-white">{stats.active}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-amber-500/20 rounded-full text-amber-400 mr-4"><AlertCircle size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Bozze</p><p className="text-2xl font-bold text-white">{stats.drafts}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-green-500/20 rounded-full text-green-400 mr-4"><Truck size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Completati</p><p className="text-2xl font-bold text-white">{stats.completed}</p></div>
        </div>
        <div className="bg-glr-800 p-4 rounded-xl border border-glr-700 shadow-lg flex items-center">
          <div className="p-3 bg-purple-500/20 rounded-full text-purple-400 mr-4"><Users size={24} /></div>
          <div><p className="text-gray-400 text-xs uppercase">Crew Totale</p><p className="text-2xl font-bold text-white">{crew.length}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
        
        {/* LEFT COLUMN: CALENDAR */}
        <div className="lg:col-span-2 bg-glr-800 border border-glr-700 rounded-xl flex flex-col overflow-hidden shadow-2xl h-[600px]">
            {/* Header */}
            <div className="p-4 border-b border-glr-700 flex justify-between items-center bg-glr-900/50">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    {monthNames[month]} <span className="text-glr-accent">{year}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={prevMonth} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronLeft/></button>
                    <button onClick={nextMonth} className="p-2 hover:bg-glr-700 rounded text-gray-300"><ChevronRight/></button>
                </div>
            </div>

            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-glr-700 bg-glr-900 text-center py-2 shrink-0">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                    <div key={d} className="text-xs font-bold text-gray-500 uppercase">{d}</div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr overflow-y-auto">
                {blanks.map(b => <div key={`blank-${b}`} className="border-b border-r border-glr-700/50 bg-glr-900/30"></div>)}
                
                {daysArray.map(day => {
                    const dayJobs = getJobsForDay(day);
                    const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();
                    
                    return (
                        <div key={day} className={`min-h-[80px] border-b border-r border-glr-700/50 p-2 flex flex-col gap-1 relative transition-colors hover:bg-glr-700/20 ${isToday ? 'bg-glr-accent/5' : ''}`}>
                            <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-glr-accent text-glr-900' : 'text-gray-400'}`}>
                                {day}
                            </span>
                            
                            {/* Jobs Indicators */}
                            <div className="flex-1 flex flex-col gap-1 overflow-y-auto mt-1 custom-scrollbar">
                                {dayJobs.map(job => (
                                    <div key={job.id} className={`text-[10px] px-1.5 py-1 rounded truncate border-l-2 cursor-pointer
                                      ${job.status === JobStatus.CONFIRMED ? 'bg-green-900/40 border-green-500 text-green-200' : 
                                        job.status === JobStatus.DRAFT ? 'bg-gray-700/50 border-gray-500 text-gray-300' : 
                                        'bg-blue-900/40 border-blue-500 text-blue-200'}`}>
                                        {job.title}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>

        {/* RIGHT COLUMN: LISTS & ALERTS */}
        <div className="flex flex-col gap-6 h-[600px] overflow-y-auto pr-2">
            
            {/* 1. UPCOMING JOBS */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg">
                <h3 className="text-glr-accent font-bold uppercase text-xs mb-3 flex items-center gap-2">
                    <CalIcon size={14}/> Lavori in Programma
                </h3>
                <div className="space-y-3">
                    {upcomingJobs.length === 0 && <p className="text-gray-500 text-sm italic">Nessun lavoro imminente.</p>}
                    {upcomingJobs.map(job => (
                        <div key={job.id} className="border-l-2 border-glr-accent pl-3 py-1">
                            <h4 className="text-white font-bold text-sm truncate">{job.title}</h4>
                            <p className="text-gray-400 text-xs">{job.startDate} • {job.location || 'N/D'}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 2. PRIORITY TASKS */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg">
                <h3 className="text-red-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                    <AlertTriangle size={14}/> Task Aperti & Priorità
                </h3>
                <div className="space-y-2">
                    {priorityTasks.length === 0 && <p className="text-gray-500 text-sm italic">Nessuna criticità rilevata.</p>}
                    {priorityTasks.map(job => (
                        <div key={job.id} className="bg-red-900/20 border border-red-900/50 p-2 rounded text-xs text-gray-300">
                            <span className="text-red-300 font-bold block mb-1">{job.title}</span>
                            {job.materialList.length === 0 && <div className="flex items-center gap-1"><AlertCircle size={10}/> Manca Lista Materiale</div>}
                            {job.assignedCrew.length === 0 && <div className="flex items-center gap-1"><Users size={10}/> Manca Crew</div>}
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. REST DAY ANALYSIS */}
            <div className="bg-glr-800 border border-glr-700 rounded-xl p-4 shadow-lg flex-1">
                <h3 className="text-blue-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                    <Clock size={14}/> Monitoraggio Riposi ({monthNames[month]})
                </h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="text-gray-500 border-b border-glr-700">
                            <tr>
                                <th className="pb-1">Tecnico</th>
                                <th className="pb-1 text-center">GG Lav.</th>
                                <th className="pb-1 text-center">No Riposo</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-glr-700/50">
                            {crew.map(c => {
                                const analysis = calculateMissedRestDays(c.id, year, month);
                                return (
                                    <tr key={c.id}>
                                        <td className="py-2 text-white font-medium">{c.name}</td>
                                        <td className="py-2 text-center text-gray-400">{analysis.totalWorked}</td>
                                        <td className={`py-2 text-center font-bold ${analysis.missedRest > 0 ? 'text-red-400' : 'text-green-500'}`}>
                                            {analysis.missedRest > 0 ? `+${analysis.missedRest}` : 'OK'}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};