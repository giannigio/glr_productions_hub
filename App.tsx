import React, { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { Jobs } from './components/Jobs';
import { Crew } from './components/Crew';
import { Locations } from './components/Locations';
import { Inventory } from './components/Inventory'; 
import { ExpensesDashboard } from './components/ExpensesDashboard';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { Job, CrewMember, Location, InventoryItem, Notification, SystemRole, AppSettings } from './types';
import { api } from './services/api'; 
import { LayoutDashboard, ClipboardList, Users, Settings as SettingsIcon, LogOut, Menu, X, Loader2, MapPin, Package, Bell, Info, AlertTriangle, CheckCircle, FileText } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'JOBS' | 'CREW' | 'LOCATIONS' | 'INVENTORY' | 'EXPENSES' | 'SETTINGS'>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  // Data State
  const [jobs, setJobs] = useState<Job[]>([]);
  const [crew, setCrew] = useState<CrewMember[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ id: string, name: string; role: SystemRole } | null>(null);

  useEffect(() => {
    // Check local storage for session
    const savedUser = localStorage.getItem('glr_user');
    const savedToken = localStorage.getItem('glr_token');
    
    if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
    }
    setIsLoading(false); // Finished checking auth
  }, []);

  // Data Fetching Effect - Only if logged in
  useEffect(() => {
    if (!currentUser) return;

    const loadData = async () => {
      // Small delay to ensure render
      try {
        const [fetchedJobs, fetchedCrew, fetchedLocations, fetchedInventory, fetchedNotifs, fetchedSettings] = await Promise.all([
          api.getJobs(),
          api.getCrew(),
          api.getLocations(),
          api.getInventory(),
          api.getNotifications(),
          api.getSettings()
        ]);
        setJobs(fetchedJobs);
        setCrew(fetchedCrew);
        setLocations(fetchedLocations);
        setInventory(fetchedInventory);
        setNotifications(fetchedNotifs);
        setSettings(fetchedSettings);
      } catch (error) {
        console.error("Failed to load data", error);
      }
    };

    loadData();
  }, [currentUser]);

  // Logout Handler
  const handleLogout = () => {
      localStorage.removeItem('glr_user');
      localStorage.removeItem('glr_token');
      setCurrentUser(null);
  };

  // CRUD Handlers
  const handleAddJob = async (job: Job) => {
    const savedJob = await api.createJob(job);
    setJobs(prev => [...prev, savedJob]);
  };

  const handleUpdateJob = async (updatedJob: Job) => {
    await api.updateJob(updatedJob);
    setJobs(prev => prev.map(j => j.id === updatedJob.id ? updatedJob : j));
  };

  const handleDeleteJob = async (id: string) => {
    await api.deleteJob(id);
    setJobs(prev => prev.filter(j => j.id !== id));
  };

  const handleAddLocation = async (loc: Location) => {
      const savedLoc = await api.createLocation(loc);
      setLocations(prev => [...prev, savedLoc]);
  };

  const handleUpdateLocation = async (loc: Location) => {
      await api.updateLocation(loc);
      setLocations(prev => prev.map(l => l.id === loc.id ? loc : l));
  };

  const handleDeleteLocation = async (id: string) => {
      await api.deleteLocation(id);
      setLocations(prev => prev.filter(l => l.id !== id));
  };

  // Inventory CRUD
  const handleAddInventory = async (item: InventoryItem) => {
      const savedItem = await api.createInventoryItem(item);
      setInventory(prev => [...prev, savedItem]);
  };

  const handleUpdateInventory = async (item: InventoryItem) => {
      await api.updateInventoryItem(item);
      setInventory(prev => prev.map(i => i.id === item.id ? item : i));
  };

  const handleDeleteInventory = async (id: string) => {
      await api.deleteInventoryItem(id);
      setInventory(prev => prev.filter(i => i.id !== id));
  };

  // Crew Update (for workflow state changes)
  const handleUpdateCrew = async (member: CrewMember) => {
      const updated = await api.updateCrewMember(member);
      setCrew(prev => prev.map(c => c.id === updated.id ? updated : c));
  }

  const handleUpdateSettings = async (newSettings: AppSettings) => {
      const updated = await api.updateSettings(newSettings);
      setSettings(updated);
  };

  const NavItem = ({ id, icon: Icon, label, visible = true }: { id: typeof activeTab, icon: any, label: string, visible?: boolean }) => {
    if (!visible) return null;
    return (
      <button 
        onClick={() => { setActiveTab(id); setIsMobileMenuOpen(false); }}
        className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200 ${
          activeTab === id 
          ? 'bg-glr-accent text-glr-900 font-bold shadow-lg shadow-amber-500/20' 
          : 'text-gray-400 hover:bg-glr-800 hover:text-white'
        }`}
      >
        <Icon size={20} />
        <span>{label}</span>
      </button>
    );
  };

  // --- RENDER ---

  if (isLoading) {
      return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white"><Loader2 className="animate-spin"/></div>
  }

  if (!currentUser) {
      return <Login onLoginSuccess={setCurrentUser} />;
  }

  return (
    <div className="flex h-screen bg-glr-900 text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-glr-900 border-r border-glr-800 p-4 shrink-0 z-20">
        <div className="flex items-center gap-3 mb-8 px-2">
          {settings?.logoUrl ? (
               <img src={settings.logoUrl} className="w-10 h-10 object-contain brightness-0 invert" alt="GLR" />
          ) : (
            <div className="w-10 h-10 bg-glr-accent rounded-lg flex items-center justify-center font-bold text-xl text-glr-900 shadow-lg shadow-amber-500/20">
                GLR
            </div>
          )}
          <h1 className="text-xl font-bold tracking-tight">HUB</h1>
        </div>

        <nav className="flex-1 space-y-2">
          <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
          <NavItem id="JOBS" icon={ClipboardList} label="Schede Lavoro" />
          <NavItem id="INVENTORY" icon={Package} label="Magazzino" />
          <NavItem id="LOCATIONS" icon={MapPin} label="Locations" />
          
          {/* Permissions Logic */}
          <NavItem id="CREW" icon={Users} label="Crew & Tecnici" visible={currentUser.role !== 'TECH'} />
          <NavItem id="EXPENSES" icon={FileText} label="Rimborsi" visible={currentUser.role === 'ADMIN'} />
        </nav>

        <div className="border-t border-glr-800 pt-4 mt-auto space-y-2">
          <button 
            onClick={() => setActiveTab('SETTINGS')}
            className={`flex items-center gap-3 w-full p-3 rounded-lg transition-all ${activeTab === 'SETTINGS' ? 'bg-glr-accent text-glr-900 font-bold' : 'text-gray-400 hover:text-white'}`}
          >
            <SettingsIcon size={20} />
            <span>Impostazioni</span>
          </button>
          
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full p-3 rounded-lg text-gray-400 hover:bg-glr-800 hover:text-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-white">
                {currentUser.name.charAt(0)}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-white">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Header (Desktop & Mobile) */}
        <header className="h-16 bg-glr-900 border-b border-glr-800 flex items-center justify-between px-4 md:px-8 shrink-0 z-30">
             {/* Mobile Toggle */}
             <div className="md:hidden flex items-center gap-3">
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                    {isMobileMenuOpen ? <X /> : <Menu />}
                </button>
                <span className="font-bold text-lg">GLR HUB</span>
             </div>

             {/* Spacer for desktop alignment */}
             <div className="hidden md:block"></div>

             {/* Right Actions */}
             <div className="flex items-center gap-4 relative">
                 {/* Notifications */}
                 <button 
                    onClick={() => setIsNotifOpen(!isNotifOpen)}
                    className="relative text-gray-400 hover:text-white transition-colors"
                 >
                     <Bell size={22} />
                     {notifications.some(n => !n.read) && (
                         <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-glr-900"></span>
                     )}
                 </button>

                 {/* Notification Dropdown */}
                 {isNotifOpen && (
                     <div className="absolute top-10 right-0 w-80 bg-glr-800 border border-glr-700 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                         <div className="p-3 border-b border-glr-700 flex justify-between items-center bg-glr-900">
                             <h4 className="font-bold text-sm text-white">Notifiche</h4>
                             <button className="text-xs text-glr-accent hover:underline">Segna lette</button>
                         </div>
                         <div className="max-h-80 overflow-y-auto">
                             {notifications.map(n => (
                                 <div key={n.id} className={`p-3 border-b border-glr-700/50 hover:bg-glr-700 transition-colors cursor-pointer ${!n.read ? 'bg-glr-700/20' : ''}`}
                                      onClick={() => {
                                          if (n.linkTo) setActiveTab(n.linkTo as any);
                                          setIsNotifOpen(false);
                                      }}
                                 >
                                     <div className="flex gap-3">
                                         <div className={`mt-1 ${
                                             n.type === 'WARNING' ? 'text-amber-500' :
                                             n.type === 'SUCCESS' ? 'text-green-500' : 
                                             n.type === 'ERROR' ? 'text-red-500' : 'text-blue-500'
                                         }`}>
                                             {n.type === 'WARNING' ? <AlertTriangle size={16}/> : 
                                              n.type === 'SUCCESS' ? <CheckCircle size={16}/> : <Info size={16}/>}
                                         </div>
                                         <div>
                                             <p className="text-sm font-semibold text-gray-200">{n.title}</p>
                                             <p className="text-xs text-gray-400 mt-1 leading-relaxed">{n.message}</p>
                                             <p className="text-[10px] text-gray-500 mt-2 text-right">{new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                         </div>
                                     </div>
                                 </div>
                             ))}
                             {notifications.length === 0 && (
                                 <div className="p-6 text-center text-gray-500 text-sm">Nessuna notifica.</div>
                             )}
                         </div>
                     </div>
                 )}
             </div>
        </header>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
            <div className="md:hidden fixed inset-0 top-16 bg-glr-900 z-40 p-4 space-y-2">
            <NavItem id="DASHBOARD" icon={LayoutDashboard} label="Dashboard" />
            <NavItem id="JOBS" icon={ClipboardList} label="Schede Lavoro" />
            <NavItem id="INVENTORY" icon={Package} label="Magazzino" />
            <NavItem id="LOCATIONS" icon={MapPin} label="Locations" />
            {currentUser.role !== 'TECH' && <NavItem id="CREW" icon={Users} label="Crew & Tecnici" />}
            <NavItem id="SETTINGS" icon={SettingsIcon} label="Impostazioni" />
            <button onClick={handleLogout} className="flex items-center gap-3 w-full p-3 text-gray-400 bg-gray-800 rounded-lg mt-4">
                <LogOut size={20}/> Logout
            </button>
            </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 overflow-auto p-4 md:p-8 bg-[#0b1120]">
            <div className="max-w-7xl mx-auto h-full">
            {activeTab === 'DASHBOARD' && (
                <Dashboard 
                    jobs={jobs} 
                    crew={crew} 
                    currentUser={currentUser}
                    onUpdateCrew={handleUpdateCrew}
                />
            )}
            {activeTab === 'JOBS' && (
                <Jobs 
                jobs={jobs} 
                crew={crew}
                locations={locations}
                inventory={inventory}
                onAddJob={handleAddJob} 
                onUpdateJob={handleUpdateJob} 
                onDeleteJob={handleDeleteJob}
                currentUser={currentUser}
                settings={settings} 
                />
            )}
            {activeTab === 'INVENTORY' && (
                <Inventory 
                    inventory={inventory}
                    onAddItem={handleAddInventory}
                    onUpdateItem={handleUpdateInventory}
                    onDeleteItem={handleDeleteInventory}
                />
            )}
            {activeTab === 'LOCATIONS' && (
                <Locations 
                    locations={locations}
                    onAddLocation={handleAddLocation}
                    onUpdateLocation={handleUpdateLocation}
                    onDeleteLocation={handleDeleteLocation}
                    currentUser={currentUser}
                />
            )}
            {activeTab === 'CREW' && currentUser.role !== 'TECH' && <Crew crew={crew} onUpdateCrew={handleUpdateCrew} jobs={jobs} settings={settings} />}
            {activeTab === 'EXPENSES' && currentUser.role === 'ADMIN' && <ExpensesDashboard crew={crew} jobs={jobs} />}
            {activeTab === 'SETTINGS' && settings && <Settings settings={settings} onUpdateSettings={handleUpdateSettings} />}
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;