import React, { useState } from 'react';
import { AppState, Category, HighlightCategory, MoodConfig, ThemeConfig, UserData, UserPreferences } from '../types';
import { Plus, Trash2, Palette, Smile, DollarSign, Volume2, Upload, Star, Layout, Music, HardDrive, Download, AlertCircle, Edit2, Check, X, ChevronDown, ChevronUp } from 'lucide-react';
import { processImage, processAudio } from '../constants';
import * as LucideIcons from 'lucide-react';

interface SettingsProps {
  state: AppState;
  updateCategories: (categories: Category[]) => void;
  updateExpenditureCategories: (categories: Category[]) => void;
  updateHighlightCategories: (categories: HighlightCategory[]) => void;
  updateMoods: (moods: MoodConfig[]) => void;
  updatePreferences: (prefs: UserPreferences) => void;
  importUserData: (data: UserData) => void;
}

const COLORS = [
  'bg-pastel-pink', 'bg-pastel-rose', 'bg-pastel-purple', 'bg-pastel-blue',
  'bg-pastel-cyan', 'bg-pastel-mint', 'bg-pastel-green', 'bg-pastel-yellow',
  'bg-orange-200', 'bg-red-400', 'bg-indigo-400', 'bg-emerald-400'
];

const ICONS = ['Film', 'Book', 'Music', 'Gamepad', 'Coffee', 'Heart', 'Star', 'Trophy', 'MapPin', 'Camera', 'ShoppingBag', 'Utensils', 'Smartphone', 'Monitor', 'Headphones', 'Gift', 'Plane', 'Flag', 'Zap', 'Briefcase', 'Moon', 'Users', 'Car', 'Receipt', 'HeartPulse', 'Tag', 'Sun', 'Cloud', 'Umbrella', 'Watch', 'Pen', 'Mic', 'Video', 'Globe', 'Anchor', 'Feather', 'Key', 'Lock'];

type SettingsTab = 'appearance' | 'activities' | 'expenses' | 'highlights' | 'moods' | 'data';

// --- Icon Grid Picker Component ---
const IconPicker: React.FC<{
    currentIcon: string;
    onSelect: (icon: string) => void;
}> = ({ currentIcon, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const CurrentIconComp = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[currentIcon] || LucideIcons.Circle;

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-black/40 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
                title="Select Icon"
            >
                <CurrentIconComp size={20} className="text-white" />
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-[#18181b] border border-white/10 rounded-2xl p-4 shadow-2xl w-64 grid grid-cols-5 gap-2 max-h-64 overflow-y-auto custom-scrollbar">
                        {ICONS.map(iconName => {
                            const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[iconName];
                            if (!Icon) return null;
                            return (
                                <button 
                                    key={iconName}
                                    onClick={() => { onSelect(iconName); setIsOpen(false); }}
                                    className={`p-2 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors ${currentIcon === iconName ? 'bg-pastel-purple text-black' : 'text-gray-400'}`}
                                >
                                    <Icon size={18} />
                                </button>
                            )
                        })}
                    </div>
                </>
            )}
        </div>
    );
};

// --- Color Picker Component ---
const ColorPicker: React.FC<{
    currentColor: string;
    onSelect: (color: string) => void;
}> = ({ currentColor, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-12 h-12 bg-black/40 border border-white/20 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors gap-1"
                title="Select Color"
            >
                <div className={`w-4 h-4 rounded-full ${currentColor} shadow-[0_0_5px_rgba(255,255,255,0.3)]`} />
                <ChevronDown size={12} className="text-gray-500" />
            </button>
            
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 z-50 bg-[#18181b] border border-white/10 rounded-2xl p-4 shadow-2xl w-48 grid grid-cols-4 gap-2">
                        {COLORS.map(color => (
                            <button 
                                key={color}
                                onClick={() => { onSelect(color); setIsOpen(false); }}
                                className={`w-8 h-8 rounded-full ${color} ${currentColor === color ? 'ring-2 ring-white scale-110' : 'hover:scale-110 opacity-80 hover:opacity-100'} transition-all`}
                            />
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const Settings: React.FC<SettingsProps> = ({ state, updateCategories, updateExpenditureCategories, updateHighlightCategories, updateMoods, updatePreferences, importUserData }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  // Theme State
  const currentTheme = state.preferences?.customTheme || {
    mode: 'custom',
    backgroundColor: '#09090b',
    textColor: '#e4e4e7',
    cardColor: '#18181b',
    accentColor: '#cfbaf0'
  };

  const updateTheme = (key: keyof ThemeConfig, value: string) => {
    updatePreferences({
      customTheme: { ...currentTheme, [key]: value }
    });
  };

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const base64 = await processImage(e.target.files[0]);
        updateTheme('backgroundImage', base64);
      } catch (err) { console.error(err); }
    }
  };

  const handleAudioUpload = async (type: 'pop' | 'celebration', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      try {
        const base64 = await processAudio(e.target.files[0]);
        updatePreferences({
          customAudio: { ...state.preferences?.customAudio, [type]: base64 }
        });
      } catch (err) { console.error(err); }
    }
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `lumina_backup_${state.currentUser || 'user'}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          if (event.target?.result) {
             const parsedData = JSON.parse(event.target.result as string);
             importUserData(parsedData);
          }
        } catch (err) {
          alert('Failed to parse the backup file.');
        }
      };
    }
  };

  // Generic List Editor for Activities, Expenses, Highlights
  const CategoryListEditor = ({ 
    items, 
    updateItems, 
    hasIcons = false,
    labelPlaceholder = "Category Name"
  }: { 
    items: any[], 
    updateItems: (items: any[]) => void, 
    hasIcons?: boolean,
    labelPlaceholder?: string
  }) => {
    const [newItem, setNewItem] = useState({ label: '', color: COLORS[0], icon: ICONS[0] });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<any>({});

    const handleAdd = () => {
        if (!newItem.label.trim()) return;
        const idPrefix = hasIcons ? 'high' : 'cat';
        const newObj = {
            id: `${idPrefix}_${Date.now()}`,
            label: newItem.label,
            color: newItem.color,
            ...(hasIcons ? { icon: newItem.icon } : { icon: 'Circle' }) // Default icon if not used
        };
        updateItems([...items, newObj]);
        setNewItem({ label: '', color: COLORS[0], icon: ICONS[0] });
    };

    const startEdit = (item: any) => {
        setEditingId(item.id);
        setEditValues(item);
    };

    const saveEdit = () => {
        updateItems(items.map(i => i.id === editingId ? editValues : i));
        setEditingId(null);
    };

    const deleteItem = (id: string) => {
        if (confirm('Are you sure you want to delete this category?')) {
            updateItems(items.filter(i => i.id !== id));
        }
    };

    return (
        <div className="space-y-8">
             {/* Add New Form - Prominent Top placement for better UX on "create" focus */}
             <div className="bg-gradient-to-br from-white/10 to-white/5 p-6 rounded-3xl border border-white/10 shadow-lg relative z-20">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4 flex items-center gap-2">
                    <Plus size={14} /> Create New
                </h4>
                <div className="flex flex-col sm:flex-row gap-4 items-stretch">
                    <div className="flex-grow flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus-within:ring-1 focus-within:ring-pastel-purple transition-all">
                        <input 
                            type="text" 
                            placeholder={labelPlaceholder}
                            className="bg-transparent text-white outline-none w-full placeholder-gray-600"
                            value={newItem.label}
                            onChange={(e) => setNewItem({...newItem, label: e.target.value})}
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {hasIcons && (
                            <IconPicker 
                                currentIcon={newItem.icon} 
                                onSelect={(icon) => setNewItem({...newItem, icon})} 
                            />
                        )}
                        <ColorPicker 
                            currentColor={newItem.color}
                            onSelect={(color) => setNewItem({...newItem, color})}
                        />
                    </div>

                    <button 
                        onClick={handleAdd}
                        disabled={!newItem.label.trim()}
                        className="bg-white text-black font-bold px-6 rounded-2xl hover:bg-pastel-purple transition-all disabled:opacity-50 shadow-md min-h-[48px]"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="space-y-3">
                {items.map(item => {
                    const isEditing = editingId === item.id;
                    const Icon = hasIcons 
                        ? (((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[isEditing ? editValues.icon : item.icon] || LucideIcons.Circle)
                        : null;

                    return (
                        <div 
                            key={item.id} 
                            className={`group relative transition-all duration-200 ${isEditing ? 'z-30' : 'z-auto'}`}
                        >
                            <div className={`
                                flex flex-col sm:flex-row items-center gap-4 bg-dark-card border p-4 rounded-2xl transition-all duration-300
                                ${isEditing ? 'border-pastel-purple/50 bg-white/5 shadow-lg scale-[1.02]' : 'border-white/5 hover:border-white/10 hover:bg-white/5'}
                            `}>
                                {isEditing ? (
                                    <>
                                        <div className="flex items-center gap-4 w-full sm:w-auto">
                                            {hasIcons && (
                                                <IconPicker 
                                                    currentIcon={editValues.icon} 
                                                    onSelect={(icon) => setEditValues({...editValues, icon})} 
                                                />
                                            )}
                                            <ColorPicker 
                                                currentColor={editValues.color}
                                                onSelect={(color) => setEditValues({...editValues, color})}
                                            />
                                        </div>
                                        <input 
                                            className="flex-grow bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white outline-none w-full sm:w-auto focus:ring-1 focus:ring-pastel-purple"
                                            value={editValues.label}
                                            onChange={(e) => setEditValues({...editValues, label: e.target.value})}
                                            autoFocus
                                        />
                                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                                            <button onClick={saveEdit} className="p-3 bg-pastel-green/20 text-pastel-green rounded-xl hover:bg-pastel-green/30 transition-colors"><Check size={18}/></button>
                                            <button onClick={() => setEditingId(null)} className="p-3 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"><X size={18}/></button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-4 flex-grow w-full">
                                            <div className={`w-10 h-10 rounded-xl ${item.color} flex items-center justify-center text-black shadow-inner`}>
                                                {Icon && <Icon size={18} />}
                                            </div>
                                            <span className="text-gray-200 font-medium text-lg">{item.label}</span>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute right-4 sm:static bg-dark-card sm:bg-transparent p-1 sm:p-0 rounded-lg shadow-lg sm:shadow-none border sm:border-none border-white/10">
                                            <button onClick={() => startEdit(item)} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><Edit2 size={16}/></button>
                                            <button onClick={() => deleteItem(item.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"><Trash2 size={16}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
  };

  const tabs: { id: SettingsTab, label: string, icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'activities', label: 'Activities', icon: Layout },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'highlights', label: 'Highlights', icon: Star },
    { id: 'moods', label: 'Moods', icon: Smile },
    { id: 'data', label: 'Data & Sync', icon: HardDrive },
  ];

  return (
    <div className="max-w-6xl mx-auto pb-32 animate-in fade-in duration-500">
      <header className="mb-8">
        <h1 className="text-4xl font-light text-white mb-2 tracking-tight">Settings</h1>
        <p className="text-gray-500">Tailor your experience and visual rhythm.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Sidebar Navigation */}
        <div className="md:col-span-1 space-y-2">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                        w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-sm font-medium transition-all
                        ${activeTab === tab.id 
                            ? 'bg-dark-card border border-white/10 text-white shadow-lg' 
                            : 'text-gray-500 hover:text-white hover:bg-white/5'}
                    `}
                >
                    <tab.icon size={18} className={activeTab === tab.id ? 'text-pastel-purple' : ''} />
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-dark-card border border-white/5 rounded-[3rem] p-8 md:p-12 shadow-2xl min-h-[600px] animate-in slide-in-from-right-4 duration-300 key={activeTab}">
            
            {activeTab === 'appearance' && (
                <div className="space-y-12">
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-medium text-gray-200">Visual Theme</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Background</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={currentTheme.backgroundColor} onChange={(e) => updateTheme('backgroundColor', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                                    <span className="text-sm font-mono text-gray-400">{currentTheme.backgroundColor}</span>
                                </div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">Cards</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={currentTheme.cardColor} onChange={(e) => updateTheme('cardColor', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                                    <span className="text-sm font-mono text-gray-400">{currentTheme.cardColor}</span>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Text</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={currentTheme.textColor} onChange={(e) => updateTheme('textColor', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                                    <span className="text-sm font-mono text-gray-400">{currentTheme.textColor}</span>
                                </div>
                                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">Accent</label>
                                <div className="flex items-center gap-3">
                                    <input type="color" value={currentTheme.accentColor} onChange={(e) => updateTheme('accentColor', e.target.value)} className="w-12 h-12 rounded-xl cursor-pointer bg-transparent border-none" />
                                    <span className="text-sm font-mono text-gray-400">{currentTheme.accentColor}</span>
                                </div>
                            </div>
                        </div>
                        <div className="pt-4">
                           <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Background Image</label>
                           <div className="flex items-center gap-4">
                             <label className="bg-white/5 hover:bg-white/10 px-6 py-3 rounded-2xl text-sm cursor-pointer border border-white/10 flex items-center gap-2 transition-all">
                                <Upload size={16} /> Upload Wallpaper
                                <input type="file" accept="image/*" className="hidden" onChange={handleBgImageUpload} />
                             </label>
                             {currentTheme.backgroundImage && (
                                <button onClick={() => updateTheme('backgroundImage', '')} className="text-xs text-red-400 hover:text-red-300 underline">Remove</button>
                             )}
                           </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                         <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                            <h3 className="text-xl font-medium text-gray-200">Audio Experience</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                     <Volume2 size={18} className="text-gray-400" />
                                     <h4 className="text-gray-200 font-medium">Click Sound</h4>
                                   </div>
                                   <label className="bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                                      <Upload size={14} className="text-gray-400" />
                                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload('pop', e)} />
                                   </label>
                                </div>
                                <p className="text-xs text-gray-500">Short sound for buttons.</p>
                                {state.preferences?.customAudio?.pop && <span className="text-[9px] text-green-400 uppercase font-bold tracking-widest">Custom Audio Active</span>}
                           </div>

                           <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                              <div className="flex justify-between items-center">
                                   <div className="flex items-center gap-2">
                                     <Music size={18} className="text-gray-400" />
                                     <h4 className="text-gray-200 font-medium">Celebration</h4>
                                   </div>
                                   <label className="bg-black/30 p-2 rounded-lg cursor-pointer hover:bg-black/50 transition-colors">
                                      <Upload size={14} className="text-gray-400" />
                                      <input type="file" accept="audio/*" className="hidden" onChange={(e) => handleAudioUpload('celebration', e)} />
                                   </label>
                                </div>
                                <p className="text-xs text-gray-500">Task completion sound.</p>
                                {state.preferences?.customAudio?.celebration && <span className="text-[9px] text-green-400 uppercase font-bold tracking-widest">Custom Audio Active</span>}
                           </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'activities' && (
                <CategoryListEditor 
                    items={state.categories} 
                    updateItems={updateCategories} 
                    labelPlaceholder="Activity Name (e.g. Coding)" 
                />
            )}

            {activeTab === 'expenses' && (
                <CategoryListEditor 
                    items={state.expenditureCategories} 
                    updateItems={updateExpenditureCategories} 
                    labelPlaceholder="Expense Category (e.g. Food)" 
                />
            )}

            {activeTab === 'highlights' && (
                 <CategoryListEditor 
                    items={state.highlightCategories} 
                    updateItems={updateHighlightCategories} 
                    hasIcons={true}
                    labelPlaceholder="Type (e.g. Movie, Game)"
                />
            )}

            {activeTab === 'moods' && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-xl font-medium text-gray-200">Mood Definitions</h3>
                    </div>

                    {/* Add Mood Button - Moved Top */}
                    <button 
                        onClick={() => updateMoods([...state.moods, { id: `mood_${Date.now()}`, emoji: '✨', label: 'New Mood' }])}
                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl py-4 flex items-center justify-center gap-2 text-pastel-green font-bold text-sm uppercase tracking-wider transition-all hover:scale-[1.01]"
                    >
                        <Plus size={16} /> Add New Mood
                    </button>

                    <div className="grid grid-cols-1 gap-4">
                        {state.moods.map((mood) => (
                            <div key={mood.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors">
                                <input 
                                    type="text"
                                    value={mood.emoji}
                                    onChange={(e) => updateMoods(state.moods.map(m => m.id === mood.id ? { ...m, emoji: e.target.value } : m))}
                                    className="w-16 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-2xl text-center outline-none focus:ring-2 focus:ring-pastel-green"
                                />
                                <input 
                                    type="text"
                                    value={mood.label}
                                    onChange={(e) => updateMoods(state.moods.map(m => m.id === mood.id ? { ...m, label: e.target.value } : m))}
                                    className="flex-grow bg-black/40 border border-white/10 rounded-xl px-6 py-3 text-white outline-none focus:ring-2 focus:ring-pastel-green"
                                />
                                <button 
                                    onClick={() => { if(confirm('Delete mood?')) updateMoods(state.moods.filter(m => m.id !== mood.id)); }}
                                    className="p-3 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'data' && (
                <div className="space-y-8">
                     <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                        <h3 className="text-xl font-medium text-gray-200">Data Management</h3>
                    </div>
                    
                    <div className="bg-pastel-blue/10 border border-pastel-blue/20 rounded-2xl p-6 flex items-start gap-4">
                        <AlertCircle className="text-pastel-blue flex-shrink-0" />
                        <div className="space-y-2">
                             <h4 className="text-pastel-blue font-bold text-sm uppercase tracking-wide">Device Storage Active</h4>
                             <p className="text-gray-400 text-sm leading-relaxed">
                                 Lumina is running in local mode. Your data is stored on this device. 
                                 To move data between devices, please use the <strong>Export</strong> and <strong>Import</strong> buttons below.
                             </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                             <div className="w-16 h-16 rounded-full bg-pastel-mint/20 flex items-center justify-center text-pastel-mint mb-2">
                                 <Download size={32} />
                             </div>
                             <div>
                                 <h4 className="text-white font-medium mb-2">Export Backup</h4>
                                 <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Download your entire history, settings, and logs as a JSON file.</p>
                             </div>
                             <button 
                               onClick={handleExportData}
                               className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-pastel-mint transition-colors w-full"
                             >
                                 Download Data
                             </button>
                        </div>

                        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 space-y-6 flex flex-col items-center text-center hover:bg-white/10 transition-colors">
                             <div className="w-16 h-16 rounded-full bg-pastel-purple/20 flex items-center justify-center text-pastel-purple mb-2">
                                 <Upload size={32} />
                             </div>
                             <div>
                                 <h4 className="text-white font-medium mb-2">Import Backup</h4>
                                 <p className="text-xs text-gray-500 max-w-[200px] mx-auto">Restore your history from a previous backup file.</p>
                             </div>
                             <label className="bg-white text-black font-bold px-8 py-3 rounded-xl hover:bg-pastel-purple transition-colors w-full cursor-pointer">
                                 Upload File
                                 <input type="file" accept=".json" className="hidden" onChange={handleImportData} />
                             </label>
                        </div>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default Settings;