
import React, { useState } from 'react';
import { Location } from '../types';
import { MapPin, Phone, Zap, Network, Truck, Monitor, Plus, Edit3, Trash2, Save, X, ExternalLink, Speaker, Box, FileText, Ruler, Eye } from 'lucide-react';

interface LocationsProps {
  locations: Location[];
  onAddLocation: (loc: Location) => void;
  onUpdateLocation: (loc: Location) => void;
  onDeleteLocation: (id: string) => void;
  currentUser?: { role: 'ADMIN' | 'MANAGER' | 'TECH' };
}

export const Locations: React.FC<LocationsProps> = ({ locations, onAddLocation, onUpdateLocation, onDeleteLocation, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [activeLoc, setActiveLoc] = useState<Location | null>(null);

  // PERMISSION CHECK: Everyone has full access to Locations now
  const canEdit = true;

  const handleNew = () => {
    const newLoc: Location = {
      id: Date.now().toString(),
      name: '',
      address: '',
      hallSizeMQ: 0,
      mapsLink: '',
      isZtl: false,
      contactName: '',
      contactPhone: '',
      accessHours: '',
      power: {
        type: 'CIVILE',
        industrialSockets: [],
        hasPerimeterSockets: true,
        requiresGenerator: false,
        distanceFromPanel: 0,
        notes: ''
      },
      network: {
        hasWired: false,
        hasWifi: true,
        addressing: 'DHCP',
        staticDetails: '',
        firewallProxyNotes: ''
      },
      logistics: {
        loadFloor: 'Piano Terra',
        hasParking: false,
        hasLift: false,
        stairsDetails: '',
        hasEmptyStorage: false,
        emptyStorageNotes: ''
      },
      equipment: {
        audio: {
          present: false,
          hasPA: false,
          paNotes: '',
          hasMics: false,
          micsNotes: '',
          hasMixerOuts: false,
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
        hasLights: false,
        lightsNotes: ''
      },
      generalSurveyNotes: ''
    };
    setActiveLoc(newLoc);
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!activeLoc) return;
    const exists = locations.find(l => l.id === activeLoc.id);
    if (exists) {
      onUpdateLocation(activeLoc);
    } else {
      onAddLocation(activeLoc);
    }
    setIsEditing(false);
    setActiveLoc(null);
  };

  // Helper for checkboxes in arrays
  const toggleArrayItem = (arr: string[], item: string): string[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  if (isEditing && activeLoc) {
    return (
      <div className="bg-glr-800 rounded-xl p-6 border border-glr-700 animate-fade-in shadow-2xl max-w-5xl mx-auto mb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-glr-accent" />
            {locations.find(l => l.id === activeLoc.id) ? 'Modifica Location' : 'Nuova Location'}
          </h2>
          <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-white"><X size={24}/></button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* SEZIONE 1: GENERALE & CONTATTI */}
          <div className="space-y-4">
            <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2">Dati Generali & Accesso</h3>
            
            <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Nome Location</label>
                    <input type="text" value={activeLoc.name} onChange={e => setActiveLoc({...activeLoc, name: e.target.value})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" placeholder="Es. Teatro Nazionale" />
                </div>
                <div className="grid grid-cols-4 gap-2">
                    <div className="col-span-3">
                         <label className="block text-xs text-gray-400 mb-1">Indirizzo</label>
                         <input type="text" value={activeLoc.address} onChange={e => setActiveLoc({...activeLoc, address: e.target.value})} 
                            className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                    </div>
                    <div className="col-span-1">
                         <label className="block text-xs text-gray-400 mb-1">MQ Sala</label>
                         <input type="number" value={activeLoc.hallSizeMQ} onChange={e => setActiveLoc({...activeLoc, hallSizeMQ: parseInt(e.target.value) || 0})} 
                            className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-center" />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Link Google Maps</label>
                    <input type="text" value={activeLoc.mapsLink} onChange={e => setActiveLoc({...activeLoc, mapsLink: e.target.value})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                    <input type="checkbox" checked={activeLoc.isZtl} onChange={e => setActiveLoc({...activeLoc, isZtl: e.target.checked})} 
                        className="w-4 h-4 rounded bg-glr-900 border-glr-700 text-glr-accent focus:ring-glr-accent" />
                    <span className="text-sm text-gray-300">Zona ZTL</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Referente</label>
                    <input type="text" value={activeLoc.contactName} onChange={e => setActiveLoc({...activeLoc, contactName: e.target.value})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                </div>
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Telefono</label>
                    <input type="text" value={activeLoc.contactPhone} onChange={e => setActiveLoc({...activeLoc, contactPhone: e.target.value})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                </div>
            </div>
            <div>
                 <label className="block text-xs text-gray-400 mb-1">Orari Accesso & Pause</label>
                 <textarea value={activeLoc.accessHours} onChange={e => setActiveLoc({...activeLoc, accessHours: e.target.value})} 
                    className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white h-20 text-sm" />
            </div>
          </div>

          {/* SEZIONE 2: ELETTRICITÀ */}
          <div className="space-y-4">
            <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2">
                <Zap size={16}/> Corrente Elettrica
            </h3>
            
            <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="powerType" checked={activeLoc.power.type === 'CIVILE'} 
                        onChange={() => setActiveLoc({...activeLoc, power: {...activeLoc.power, type: 'CIVILE'}})} />
                    <span className="text-sm text-white">Civile</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="powerType" checked={activeLoc.power.type === 'INDUSTRIALE'} 
                        onChange={() => setActiveLoc({...activeLoc, power: {...activeLoc.power, type: 'INDUSTRIALE'}})} />
                    <span className="text-sm text-white">Industriale</span>
                </label>
            </div>

            {activeLoc.power.type === 'INDUSTRIALE' && (
                <div className="bg-glr-900/50 p-3 rounded border border-glr-700">
                    <span className="text-xs text-gray-400 block mb-2">Prese Industriali Disponibili:</span>
                    <div className="flex flex-wrap gap-3">
                        {['16A', '32A', '63A', '128A'].map(amp => (
                            <label key={amp} className="flex items-center gap-1 cursor-pointer">
                                <input type="checkbox" checked={activeLoc.power.industrialSockets.includes(amp)}
                                    onChange={() => setActiveLoc({...activeLoc, power: {...activeLoc.power, industrialSockets: toggleArrayItem(activeLoc.power.industrialSockets, amp)}})} />
                                <span className="text-sm text-gray-300">{amp}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                {activeLoc.power.type === 'CIVILE' && (
                    <label className="flex items-center gap-2 cursor-pointer mt-2 col-span-2">
                        <input type="checkbox" checked={activeLoc.power.hasPerimeterSockets} 
                            onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, hasPerimeterSockets: e.target.checked}})} />
                        <span className="text-sm text-gray-300">Prese a muro perimetrali presenti</span>
                    </label>
                )}
                
                <div>
                     <label className="block text-xs text-gray-400 mb-1">Distanza Quadro (metri)</label>
                     <div className="flex items-center gap-2">
                         <Ruler size={16} className="text-gray-500"/>
                         <input type="number" value={activeLoc.power.distanceFromPanel} onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, distanceFromPanel: parseInt(e.target.value) || 0}})} 
                            className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white" />
                     </div>
                </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-2 p-2 bg-red-900/20 border border-red-900/50 rounded">
                <input type="checkbox" checked={activeLoc.power.requiresGenerator} 
                    onChange={e => setActiveLoc({...activeLoc, power: {...activeLoc.power, requiresGenerator: e.target.checked}})} />
                <span className="text-sm text-red-200 font-bold">Necessario Generatore</span>
            </label>
          </div>

          {/* SEZIONE 3: RETE & IT */}
          <div className="space-y-4">
            <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2">
                <Network size={16}/> Rete & IT
            </h3>
            <div className="flex gap-4">
                 <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.network.hasWired} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, hasWired: e.target.checked}})} /><span className="text-sm text-gray-300">Cablata</span></label>
                 <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.network.hasWifi} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, hasWifi: e.target.checked}})} /><span className="text-sm text-gray-300">Wi-Fi</span></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                     <label className="block text-xs text-gray-400 mb-1">Indirizzamento IP</label>
                     <select value={activeLoc.network.addressing} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, addressing: e.target.value as any}})}
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm">
                         <option value="DHCP">DHCP</option>
                         <option value="STATIC">Statico</option>
                     </select>
                </div>
                {activeLoc.network.addressing === 'STATIC' && (
                     <div>
                        <label className="block text-xs text-gray-400 mb-1">Dettagli IP</label>
                        <input type="text" value={activeLoc.network.staticDetails} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, staticDetails: e.target.value}})} 
                            className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Gateway, Subnet..." />
                     </div>
                )}
            </div>
             <div>
                <label className="block text-xs text-gray-400 mb-1">Firewall / Proxy</label>
                <input type="text" value={activeLoc.network.firewallProxyNotes} onChange={e => setActiveLoc({...activeLoc, network: {...activeLoc.network, firewallProxyNotes: e.target.value}})} 
                    className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Note su blocchi o accessi..." />
             </div>
          </div>

          {/* SEZIONE 4: LOGISTICA */}
          <div className="space-y-4">
             <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2">
                <Truck size={16}/> Logistica
            </h3>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Piano Scarico</label>
                    <input type="text" value={activeLoc.logistics.loadFloor} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, loadFloor: e.target.value}})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" />
                </div>
                 <div>
                    <label className="block text-xs text-gray-400 mb-1">Dettagli Scale</label>
                    <input type="text" value={activeLoc.logistics.stairsDetails} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, stairsDetails: e.target.value}})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Larghezza, rampe..." />
                </div>
            </div>
             <div className="flex flex-wrap gap-4">
                 <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasParking} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasParking: e.target.checked}})} /><span className="text-sm text-gray-300">Parcheggio Furgoni</span></label>
                 <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasLift} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasLift: e.target.checked}})} /><span className="text-sm text-gray-300">Montacarichi</span></label>
                 <label className="flex items-center gap-2"><input type="checkbox" checked={activeLoc.logistics.hasEmptyStorage} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, hasEmptyStorage: e.target.checked}})} /><span className="text-sm text-gray-300">Stipaggio Vuoti (Bauli)</span></label>
            </div>
            {activeLoc.logistics.hasEmptyStorage && (
                <div>
                    <label className="block text-xs text-gray-400 mb-1">Note Stipaggio</label>
                    <input type="text" value={activeLoc.logistics.emptyStorageNotes} onChange={e => setActiveLoc({...activeLoc, logistics: {...activeLoc.logistics, emptyStorageNotes: e.target.value}})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm" placeholder="Dove vanno messi i vuoti?" />
                </div>
            )}
          </div>

           {/* SEZIONE 5: DOTAZIONI DI SALA */}
           <div className="col-span-1 lg:col-span-2 space-y-6">
             <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2">
                <Monitor size={16}/> Dotazioni Residenti
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Audio Column */}
                <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50">
                    <label className="flex items-center gap-2 font-bold text-white mb-3">
                        <input type="checkbox" checked={activeLoc.equipment.audio.present} 
                            onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, present: e.target.checked}}})} 
                            className="w-5 h-5 rounded bg-glr-800 border-glr-600 text-glr-accent"/>
                        <Speaker size={18} /> Audio Presente
                    </label>

                    {activeLoc.equipment.audio.present && (
                        <div className="ml-7 space-y-4 animate-fade-in">
                            {/* IMPIANTO */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                                    <input type="checkbox" checked={activeLoc.equipment.audio.hasPA} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasPA: e.target.checked}}})} />
                                    Impianto Residente
                                </label>
                                {activeLoc.equipment.audio.hasPA && (
                                    <input 
                                        type="text" 
                                        placeholder="Specifiche Impianto (es. L-Acoustics K2)" 
                                        value={activeLoc.equipment.audio.paNotes}
                                        onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, paNotes: e.target.value}}})}
                                        className="w-full mt-1 bg-glr-800 border border-glr-700 rounded px-2 py-1 text-white text-xs"
                                    />
                                )}
                            </div>

                            {/* MICROFONIA */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                                    <input type="checkbox" checked={activeLoc.equipment.audio.hasMics} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasMics: e.target.checked}}})} />
                                    Microfonia Residente
                                </label>
                                {activeLoc.equipment.audio.hasMics && (
                                    <input 
                                        type="text" 
                                        placeholder="Specifiche Microfoni (es. 4x Shure SM58)" 
                                        value={activeLoc.equipment.audio.micsNotes}
                                        onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, micsNotes: e.target.value}}})}
                                        className="w-full mt-1 bg-glr-800 border border-glr-700 rounded px-2 py-1 text-white text-xs"
                                    />
                                )}
                            </div>

                            {/* MIXER */}
                            <div>
                                <label className="flex items-center gap-2 text-sm text-gray-300 font-bold">
                                    <input type="checkbox" checked={activeLoc.equipment.audio.hasMixerOuts} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, hasMixerOuts: e.target.checked}}})} />
                                    Uscite Mixer / Consolle
                                </label>
                                {activeLoc.equipment.audio.hasMixerOuts && (
                                    <input 
                                        type="text" 
                                        placeholder="Specifiche Mixer/Uscite (es. Yamaha QL1, XLR Left/Right)" 
                                        value={activeLoc.equipment.audio.mixerNotes}
                                        onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, audio: {...activeLoc.equipment.audio, mixerNotes: e.target.value}}})}
                                        className="w-full mt-1 bg-glr-800 border border-glr-700 rounded px-2 py-1 text-white text-xs"
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Video Column */}
                <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50">
                    <label className="flex items-center gap-2 font-bold text-white mb-3">
                        <input type="checkbox" checked={activeLoc.equipment.video.present} 
                            onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, present: e.target.checked}}})} 
                            className="w-5 h-5 rounded bg-glr-800 border-glr-600 text-glr-accent"/>
                        <Monitor size={18} /> Video Presente
                    </label>

                    {activeLoc.equipment.video.present && (
                        <div className="ml-7 space-y-3 animate-fade-in">
                            <div className="grid grid-cols-2 gap-2">
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input type="checkbox" checked={activeLoc.equipment.video.hasTV} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasTV: e.target.checked}}})} />
                                    TV
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input type="checkbox" checked={activeLoc.equipment.video.hasProjector} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasProjector: e.target.checked}}})} />
                                    Proiettore
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input type="checkbox" checked={activeLoc.equipment.video.hasLedwall} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasLedwall: e.target.checked}}})} />
                                    Ledwall
                                </label>
                                <label className="flex items-center gap-2 text-sm text-gray-300">
                                    <input type="checkbox" checked={activeLoc.equipment.video.hasMonitorGobo} 
                                     onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, hasMonitorGobo: e.target.checked}}})} />
                                    Monitor Gobo
                                </label>
                            </div>

                            {/* Signal Type - Only if hardware is selected */}
                            {(activeLoc.equipment.video.hasTV || activeLoc.equipment.video.hasProjector || activeLoc.equipment.video.hasLedwall || activeLoc.equipment.video.hasMonitorGobo) && (
                                <div className="mt-2 pt-2 border-t border-glr-800">
                                    <span className="text-xs text-gray-500 block mb-1">Segnali Accettati:</span>
                                    <div className="flex gap-3 mb-2">
                                        {['HDMI', 'VGA', 'SDI'].map(sig => (
                                            <label key={sig} className="flex items-center gap-1 cursor-pointer">
                                                <input type="checkbox" checked={activeLoc.equipment.video.signals.includes(sig)}
                                                    onChange={() => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, signals: toggleArrayItem(activeLoc.equipment.video.signals, sig)}}})} />
                                                <span className="text-xs text-gray-300">{sig}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <textarea 
                                        placeholder="Note Video (Risoluzioni, connettori...)" 
                                        value={activeLoc.equipment.video.notes}
                                        onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, video: {...activeLoc.equipment.video, notes: e.target.value}}})}
                                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white text-sm h-16"
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Lights & Others */}
             <div className="bg-glr-900/30 p-4 rounded-lg border border-glr-700/50">
                <label className="flex items-center gap-2 font-bold text-white mb-2">
                     <input type="checkbox" checked={activeLoc.equipment.hasLights} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, hasLights: e.target.checked}})} 
                     className="w-5 h-5 rounded bg-glr-800 border-glr-600 text-glr-accent"/>
                     <Zap size={18} /> Luci Residenti
                 </label>
                 {activeLoc.equipment.hasLights && (
                     <textarea value={activeLoc.equipment.lightsNotes} onChange={e => setActiveLoc({...activeLoc, equipment: {...activeLoc.equipment, lightsNotes: e.target.value}})} 
                        className="w-full bg-glr-900 border border-glr-700 rounded p-2 text-white h-16 text-sm ml-7 w-[calc(100%-1.75rem)]" placeholder="Descrizione luci residenti..." />
                 )}
            </div>
           </div>
           
           {/* SEZIONE 6: NOTE GENERALI */}
            <div className="col-span-1 lg:col-span-2">
                <h3 className="text-glr-accent font-semibold uppercase text-sm border-b border-glr-700 pb-2 flex items-center gap-2 mb-2">
                    <FileText size={16}/> Note Generali Sopralluogo
                </h3>
                <textarea 
                    value={activeLoc.generalSurveyNotes} 
                    onChange={e => setActiveLoc({...activeLoc, generalSurveyNotes: e.target.value})} 
                    className="w-full bg-glr-900 border border-glr-700 rounded p-4 text-white h-32 text-sm" 
                    placeholder="Impressioni generali, criticità, accessibilità del personale, etc..." 
                />
            </div>

        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-glr-700">
            <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-300 hover:bg-glr-700 rounded">
                Annulla
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2 bg-glr-accent text-glr-900 font-bold rounded hover:bg-amber-400">
                <Save size={18} /> Salva Location
            </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Database Locations</h2>
        <button onClick={handleNew} className="flex items-center gap-2 bg-glr-accent text-glr-900 font-bold px-4 py-2 rounded-lg hover:bg-amber-400 transition-colors">
            <Plus size={20} /> Nuova Location
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map(loc => (
          <div key={loc.id} className="bg-glr-800 rounded-xl border border-glr-700 flex flex-col hover:border-glr-accent transition-colors group">
            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-white group-hover:text-glr-accent transition-colors">{loc.name}</h3>
                    {loc.isZtl && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800">ZTL</span>}
                </div>
                <p className="text-sm text-gray-400 flex items-start gap-1 mb-3">
                    <MapPin size={14} className="mt-0.5 shrink-0" /> {loc.address}
                </p>

                <div className="space-y-2 mt-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                         <Phone size={14} className="text-glr-accent" />
                         <span>{loc.contactName} - {loc.contactPhone}</span>
                    </div>
                     <div className="flex items-center gap-2 text-gray-300">
                         <Zap size={14} className={loc.power.requiresGenerator ? "text-red-400" : "text-green-400"} />
                         <span>{loc.power.requiresGenerator ? 'Serve Generatore' : `${loc.power.type} ${loc.power.type === 'INDUSTRIALE' ? `(${loc.power.industrialSockets.join(', ')})` : ''}`}</span>
                    </div>
                     <div className="flex items-center gap-2 text-gray-300">
                        <Ruler size={14} className="text-gray-400"/>
                        <span>{loc.power.distanceFromPanel}m dal quadro ({loc.hallSizeMQ}mq)</span>
                     </div>
                    {loc.logistics.hasEmptyStorage && (
                        <div className="flex items-center gap-2 text-gray-300">
                            <Box size={14} className="text-blue-400" />
                            <span>Stipaggio Vuoti OK</span>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="bg-glr-900 p-3 border-t border-glr-700 flex justify-between items-center text-xs">
                {loc.mapsLink && (
                    <a href={loc.mapsLink} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                        <ExternalLink size={12} /> Maps
                    </a>
                )}
                <div className="flex gap-2 ml-auto">
                    <button onClick={() => { setActiveLoc(loc); setIsEditing(true); }} className="text-gray-400 hover:text-white p-1" title="Modifica">
                        <Edit3 size={16} />
                    </button>
                    <button onClick={() => onDeleteLocation(loc.id)} className="text-gray-400 hover:text-red-400 p-1" title="Elimina"><Trash2 size={16} /></button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
