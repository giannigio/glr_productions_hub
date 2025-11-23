
import React, { useState } from 'react';
import { AppSettings } from '../types';
import { Save, Building2, DollarSign, Calendar, Database, AlertCircle, CheckCircle } from 'lucide-react';

interface SettingsProps {
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdateSettings }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'COMPANY' | 'ECONOMICS' | 'INTEGRATIONS' | 'SYSTEM'>('COMPANY');
  const [statusMsg, setStatusMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  const handleSave = () => {
      try {
          onUpdateSettings(localSettings);
          setStatusMsg({ type: 'success', text: 'Impostazioni salvate con successo!' });
          setTimeout(() => setStatusMsg(null), 3000);
      } catch (err) {
          setStatusMsg({ type: 'error', text: 'Errore durante il salvataggio.' });
      }
  };

  const updateField = (field: keyof AppSettings, value: any) => {
      setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6 animate-fade-in pb-10">
       <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Building2 /> Impostazioni Sistema
          </h2>
          <button onClick={handleSave} className="bg-glr-accent text-glr-900 font-bold px-6 py-2 rounded-lg hover:bg-amber-400 flex items-center gap-2 shadow-lg shadow-amber-500/20">
              <Save size={20}/> Salva Modifiche
          </button>
       </div>

       {statusMsg && (
           <div className={`p-3 rounded-lg border flex items-center gap-2 ${statusMsg.type === 'success' ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-red-900/30 border-red-600 text-red-400'}`}>
               {statusMsg.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
               {statusMsg.text}
           </div>
       )}

       <div className="bg-glr-800 rounded-xl border border-glr-700 overflow-hidden">
           {/* Tabs */}
           <div className="flex border-b border-glr-700 bg-glr-900/50">
               <button onClick={() => setActiveTab('COMPANY')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'COMPANY' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Building2 size={16}/> Dati Aziendali
               </button>
               <button onClick={() => setActiveTab('ECONOMICS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'ECONOMICS' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <DollarSign size={16}/> Parametri Economici
               </button>
               <button onClick={() => setActiveTab('INTEGRATIONS')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'INTEGRATIONS' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Calendar size={16}/> Integrazioni & API
               </button>
               <button onClick={() => setActiveTab('SYSTEM')} className={`px-6 py-3 text-sm font-bold flex items-center gap-2 ${activeTab === 'SYSTEM' ? 'bg-glr-800 text-glr-accent border-t-2 border-glr-accent' : 'text-gray-400 hover:text-white'}`}>
                   <Database size={16}/> Backup & Dati
               </button>
           </div>

           <div className="p-8">
               
               {/* TAB: COMPANY */}
               {activeTab === 'COMPANY' && (
                   <div className="max-w-2xl space-y-4">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Intestazione Documenti & Report</h3>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Ragione Sociale</label>
                           <input type="text" value={localSettings.companyName} onChange={e => updateField('companyName', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Partita IVA / Codice Fiscale</label>
                           <input type="text" value={localSettings.pIva} onChange={e => updateField('pIva', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div>
                           <label className="block text-xs text-gray-400 mb-1">Indirizzo Sede Legale</label>
                           <input type="text" value={localSettings.address} onChange={e => updateField('address', e.target.value)} 
                                className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Banca d'Appoggio</label>
                                <input type="text" value={localSettings.bankName} onChange={e => updateField('bankName', e.target.value)} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">IBAN</label>
                                <input type="text" value={localSettings.iban} onChange={e => updateField('iban', e.target.value)} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                       </div>
                   </div>
               )}

               {/* TAB: ECONOMICS */}
               {activeTab === 'ECONOMICS' && (
                   <div className="max-w-2xl space-y-4">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Parametri di Calcolo Automatico</h3>
                       <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Diaria Giornaliera Standard (€)</label>
                                <input type="number" value={localSettings.defaultDailyIndemnity} onChange={e => updateField('defaultDailyIndemnity', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                                <p className="text-[10px] text-gray-500 mt-1">Utilizzata per calcolare in automatico le trasferte dei tecnici interni.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Rimborso Chilometrico (€/km)</label>
                                <input type="number" step="0.01" value={localSettings.kmCost} onChange={e => updateField('kmCost', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                                <p className="text-[10px] text-gray-500 mt-1">Costo ACI standard per rimborsi auto propria.</p>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Aliquota IVA Default (%)</label>
                                <input type="number" value={localSettings.defaultVatRate} onChange={e => updateField('defaultVatRate', parseFloat(e.target.value))} 
                                        className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white"/>
                            </div>
                       </div>
                   </div>
               )}

               {/* TAB: INTEGRATIONS */}
               {activeTab === 'INTEGRATIONS' && (
                   <div className="max-w-2xl space-y-6">
                       <h3 className="text-lg font-bold text-white mb-2 border-b border-glr-700 pb-2 flex items-center gap-2">
                           <Calendar size={20}/> Google Calendar API
                       </h3>
                       <div className="bg-blue-900/20 border border-blue-800 p-4 rounded text-sm text-blue-200 mb-4">
                           <p>Per abilitare la sincronizzazione automatica dei lavori sul calendario aziendale, è necessario creare un progetto su <b>Google Cloud Console</b> e generare le credenziali OAuth 2.0.</p>
                       </div>

                       <div className="space-y-4">
                           <div>
                               <label className="block text-xs text-gray-400 mb-1">Google Client ID</label>
                               <input type="text" value={localSettings.googleCalendarClientId} onChange={e => updateField('googleCalendarClientId', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-mono text-xs" placeholder="xxx-xxx.apps.googleusercontent.com"/>
                           </div>
                           <div>
                               <label className="block text-xs text-gray-400 mb-1">Google Client Secret</label>
                               <input type="password" value={localSettings.googleCalendarClientSecret} onChange={e => updateField('googleCalendarClientSecret', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white font-mono text-xs" placeholder="Inserisci Secret Key"/>
                           </div>
                            <div>
                               <label className="block text-xs text-gray-400 mb-1">ID Calendario Principale</label>
                               <input type="text" value={localSettings.googleCalendarId} onChange={e => updateField('googleCalendarId', e.target.value)} 
                                    className="w-full bg-glr-900 border border-glr-600 rounded p-2 text-white text-sm" placeholder="primary o indirizzo email calendario"/>
                           </div>
                       </div>
                   </div>
               )}

               {/* TAB: SYSTEM */}
               {activeTab === 'SYSTEM' && (
                   <div className="max-w-2xl space-y-6">
                       <h3 className="text-lg font-bold text-white mb-4 border-b border-glr-700 pb-2">Gestione Dati</h3>
                       
                       <div className="grid grid-cols-2 gap-4">
                           <div className="bg-glr-900 p-4 rounded border border-glr-700">
                               <h4 className="font-bold text-white mb-2">Esporta Database</h4>
                               <p className="text-xs text-gray-400 mb-4">Scarica un file JSON completo con tutti i lavori, crew, inventario e location.</p>
                               <button className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded text-sm w-full font-bold transition-colors">
                                   Scarica Backup (.json)
                               </button>
                           </div>
                            <div className="bg-glr-900 p-4 rounded border border-glr-700">
                               <h4 className="font-bold text-white mb-2">Importa Dati</h4>
                               <p className="text-xs text-gray-400 mb-4">Ripristina il database da un file di backup precedente.</p>
                               <button className="bg-glr-700 hover:bg-white hover:text-glr-900 text-white px-4 py-2 rounded text-sm w-full font-bold transition-colors">
                                   Carica Backup
                               </button>
                           </div>
                       </div>
                   </div>
               )}

           </div>
       </div>
    </div>
  );
};
