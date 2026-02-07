import React, { useState, useRef, useLayoutEffect } from 'react';
import { AppState, Highlight, HighlightCategory } from '../types';
import { Plus, Trash2, Image as ImageIcon, X, Pencil, Filter, Settings as SettingsIcon, ChevronDown, ChevronUp, Star, Calendar, Tag } from 'lucide-react';
import CustomSelect from '../components/CustomSelect';
import { processImage } from '../constants';
import * as LucideIcons from 'lucide-react';

interface HighlightsProps {
  state: AppState;
  addHighlight: (h: Highlight) => void;
  removeHighlight: (id: string) => void;
  editHighlight: (h: Highlight) => void;
  updateHighlightCategories: (categories: HighlightCategory[]) => void;
}

const COLORS = [
  'bg-pastel-pink', 'bg-pastel-rose', 'bg-pastel-purple', 'bg-pastel-blue',
  'bg-pastel-cyan', 'bg-pastel-mint', 'bg-pastel-green', 'bg-pastel-yellow',
  'bg-orange-200', 'bg-red-400', 'bg-indigo-400', 'bg-emerald-400'
];

const ICONS = ['Film', 'Book', 'Music', 'Gamepad', 'Coffee', 'Heart', 'Star', 'Trophy', 'MapPin', 'Camera', 'ShoppingBag', 'Utensils', 'Smartphone', 'Monitor', 'Headphones', 'Gift', 'Plane', 'Flag', 'Zap'];

// --- Auto Expanding Text Area ---
const AutoTextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'inherit';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(scrollHeight, 100)}px`;
    }
  }, [props.value]);

  return <textarea ref={textareaRef} {...props} />;
};

// --- Smart Truncation Component ---
const TruncatedText: React.FC<{ text: string }> = ({ text }) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!text) return null;

  const paragraphs = text.split('\n');
  const firstParagraph = paragraphs[0];
  const hasLineBreaks = paragraphs.length > 1;
  const isLong = firstParagraph.length > 250;
  const shouldTruncate = hasLineBreaks || isLong;

  return (
    <div className="space-y-2">
      <div className={`text-sm text-gray-300 font-light leading-relaxed whitespace-pre-wrap ${!expanded && shouldTruncate ? 'line-clamp-6' : ''}`}>
        {expanded ? text : firstParagraph}
      </div>
      {shouldTruncate && (
        <button 
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          className="text-[10px] font-bold uppercase tracking-widest text-pastel-blue hover:text-white flex items-center gap-1 mt-1"
        >
          {expanded ? <>Show Less <ChevronUp size={10} /></> : <>Read More <ChevronDown size={10} /></>}
        </button>
      )}
    </div>
  );
};

// --- Category Manager Modal ---
const CategoryManagerModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  categories: HighlightCategory[];
  updateCategories: (cats: HighlightCategory[]) => void;
}> = ({ isOpen, onClose, categories, updateCategories }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState(COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICONS[0]);

  if (!isOpen) return null;

  const handleAdd = () => {
    if (!newLabel.trim()) return;
    const newCat: HighlightCategory = {
      id: `high_${Date.now()}`,
      label: newLabel,
      color: newColor,
      icon: newIcon
    };
    updateCategories([...categories, newCat]);
    setNewLabel('');
  };

  const handleUpdate = (id: string, field: keyof HighlightCategory, value: string) => {
    updateCategories(categories.map(c => c.id === id ? { ...c, [field]: value } : c));
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this category?')) {
        updateCategories(categories.filter(c => c.id !== id));
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#18181b] border border-white/10 p-6 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-hidden flex flex-col">
        <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24}/></button>
        <h3 className="text-2xl font-light mb-6 text-white">Manage Categories</h3>
        
        {/* List */}
        <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
            {categories.map(cat => {
                const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[cat.icon] || LucideIcons.Circle;
                return (
                    <div key={cat.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 group">
                        <div className="flex items-center gap-3 flex-grow w-full sm:w-auto">
                            <div className="relative group/icon">
                                <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center text-black`}>
                                    <Icon size={18} />
                                </div>
                                <select 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    value={cat.icon}
                                    onChange={(e) => handleUpdate(cat.id, 'icon', e.target.value)}
                                >
                                    {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                                </select>
                            </div>
                            <input 
                                type="text"
                                value={cat.label}
                                onChange={(e) => handleUpdate(cat.id, 'label', e.target.value)}
                                className="bg-transparent text-white text-sm font-medium outline-none border-b border-transparent focus:border-white/20 px-2 py-1 flex-grow"
                            />
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <div className="flex gap-1">
                                {COLORS.slice(0, 5).map(c => (
                                    <button 
                                        key={c} 
                                        onClick={() => handleUpdate(cat.id, 'color', c)}
                                        className={`w-4 h-4 rounded-full ${c} ${cat.color === c ? 'ring-2 ring-white' : 'opacity-50'}`} 
                                    />
                                ))}
                            </div>
                            <button onClick={() => handleDelete(cat.id)} className="p-2 text-gray-600 hover:text-red-400"><Trash2 size={16}/></button>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Add New */}
        <div className="bg-black/40 p-4 rounded-2xl border border-white/10 flex flex-col gap-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Add New Category</h4>
            <div className="flex flex-col sm:flex-row gap-3">
                <input 
                    type="text" 
                    placeholder="Category Name" 
                    className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-pastel-purple"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                />
                <select 
                    value={newIcon} 
                    onChange={(e) => setNewIcon(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none text-gray-300"
                >
                    {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
                <div className="flex gap-1 items-center bg-white/5 border border-white/10 rounded-xl px-2">
                    {COLORS.slice(0, 4).map(c => (
                        <button key={c} onClick={() => setNewColor(c)} className={`w-5 h-5 rounded-full ${c} ${newColor === c ? 'ring-2 ring-white' : 'opacity-50'}`} />
                    ))}
                </div>
                <button onClick={handleAdd} disabled={!newLabel.trim()} className="bg-white text-black px-6 py-2 rounded-xl font-bold text-sm hover:bg-pastel-purple disabled:opacity-50">Add</button>
            </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
const Highlights: React.FC<HighlightsProps> = ({ state, addHighlight, removeHighlight, editHighlight, updateHighlightCategories }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Viewer States
  const [viewingHighlight, setViewingHighlight] = useState<Highlight | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Filter State
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const initialFormState = {
    title: '',
    type: state.highlightCategories[0]?.id || 'movie',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    photos: [] as string[]
  };

  const [formData, setFormData] = useState<Partial<Highlight>>(initialFormState);
  const [isUploading, setIsUploading] = useState(false);

  const openAddModal = () => {
    setEditingId(null);
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const openEditModal = (h: Highlight) => {
    setEditingId(h.id);
    setFormData({
      title: h.title,
      type: h.type,
      notes: h.notes,
      date: h.date,
      photos: h.photos || []
    });
    setViewingHighlight(null); // Close viewer if editing
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (formData.title && formData.type) {
      const highlightData = {
        id: editingId || Date.now().toString(),
        date: formData.date || new Date().toISOString().split('T')[0],
        title: formData.title,
        type: formData.type,
        rating: 0, // Simplified for now
        notes: formData.notes || '',
        photos: formData.photos || []
      } as Highlight;

      if (editingId) {
        editHighlight(highlightData);
      } else {
        addHighlight(highlightData);
      }
      setIsModalOpen(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const base64 = await processImage(e.target.files[0]);
        setFormData(prev => ({
          ...prev,
          photos: [...(prev.photos || []), base64]
        }));
      } catch (err) {
        console.error("Image upload failed", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos?.filter((_, i) => i !== index)
    }));
  };

  const getCategory = (id: string) => state.highlightCategories.find(c => c.id === id);

  const filteredHighlights = selectedFilter === 'all' 
    ? state.highlights 
    : state.highlights.filter(h => h.type === selectedFilter);

  // Sorted by date desc
  const sortedHighlights = [...filteredHighlights].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Helper options for CustomSelect Filter
  const filterOptions = [
    { id: 'all', label: 'All Memories', icon: 'LayoutGrid' },
    ...state.highlightCategories.map(c => ({
        id: c.id,
        label: c.label,
        color: c.color,
        icon: c.icon
    }))
  ];

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 mb-8 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-pink mb-2">Memories</h2>
          <h1 className="text-4xl font-light tracking-tight text-white">Highlights Log</h1>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
           {/* Stylized Category Filter */}
           <div className="w-full sm:w-56">
                <CustomSelect 
                    options={filterOptions}
                    value={selectedFilter}
                    onChange={setSelectedFilter}
                    placeholder="Filter Memories"
                />
           </div>

           <div className="flex gap-2 w-full sm:w-auto">
                <button onClick={() => setIsCategoryManagerOpen(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors" title="Manage Categories">
                    <SettingsIcon size={18} />
                </button>

                <button 
                    onClick={openAddModal}
                    className="flex-grow sm:flex-grow-0 bg-white text-black rounded-xl px-6 py-3 flex items-center justify-center gap-2 hover:bg-pastel-pink hover:scale-105 transition-all font-bold text-sm shadow-lg whitespace-nowrap"
                >
                    <Plus size={18} /> New Entry
                </button>
           </div>
        </div>
      </header>

      {/* Grid Layout */}
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
        {sortedHighlights.length === 0 ? (
            <div className="col-span-full py-24 text-center opacity-50 italic font-light border-2 border-dashed border-white/5 rounded-[2rem] flex flex-col items-center justify-center gap-4 break-inside-avoid">
                <Star size={48} className="text-gray-600 mb-2" />
                <p>No highlights found.</p>
                <button onClick={openAddModal} className="text-pastel-pink hover:underline text-sm">Add your first memory</button>
            </div>
        ) : (
            sortedHighlights.map(h => {
                const cat = getCategory(h.type);
                const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[cat?.icon || 'Star'] || LucideIcons.Star;

                return (
                    <div 
                        key={h.id} 
                        onClick={() => setViewingHighlight(h)}
                        className="break-inside-avoid mb-6 bg-dark-card border border-white/5 rounded-[2rem] overflow-hidden hover:border-white/20 transition-all duration-300 group shadow-lg hover:shadow-2xl relative cursor-pointer"
                    >
                        {/* Hover Overlay indicating clickability */}
                        <div className="absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors pointer-events-none" />

                        <div className="p-6 space-y-4">
                            {/* Header */}
                            <div className="flex items-start gap-3">
                                <div className={`p-3 rounded-2xl ${cat?.color || 'bg-gray-800'} text-black shadow-inner flex-shrink-0`}>
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-50 block mb-1">{cat?.label}</span>
                                    <h3 className="text-lg font-medium leading-tight text-white">{h.title}</h3>
                                    <p className="text-xs text-gray-500 mt-1 font-mono">{h.date}</p>
                                </div>
                            </div>

                            {/* Photos */}
                            {h.photos && h.photos.length > 0 && (
                                <div className="-mx-6">
                                    {h.photos.length === 1 ? (
                                        <img src={h.photos[0]} alt="Highlight" className="w-full h-48 object-cover" />
                                    ) : (
                                        <div className="flex overflow-x-auto gap-1 px-6 pb-2 scrollbar-hide snap-x">
                                            {h.photos.map((p, i) => (
                                                <img key={i} src={p} className="h-40 w-auto rounded-lg object-cover border border-white/5 snap-center shrink-0" />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            {h.notes && (
                                <div className="pt-2 border-t border-white/5">
                                    <TruncatedText text={h.notes} />
                                </div>
                            )}
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Viewer Modal */}
      {viewingHighlight && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setViewingHighlight(null)}
        >
            <div 
                className="bg-[#18181b] border border-white/10 p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/5 pb-6">
                    <div className="flex items-start gap-4">
                        {(() => {
                            const cat = getCategory(viewingHighlight.type);
                            const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[cat?.icon || 'Star'] || LucideIcons.Star;
                            return (
                                <div className={`p-4 rounded-2xl ${cat?.color || 'bg-gray-800'} text-black shadow-inner`}>
                                    <Icon size={32} />
                                </div>
                            );
                        })()}
                        <div>
                            <h2 className="text-3xl font-bold text-white tracking-tight leading-tight">{viewingHighlight.title}</h2>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center gap-1.5"><Calendar size={14}/> {viewingHighlight.date}</span>
                                {(() => {
                                    const cat = getCategory(viewingHighlight.type);
                                    return cat && <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 text-xs font-bold uppercase tracking-widest"><Tag size={10}/> {cat.label}</span>
                                })()}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                        <button 
                            onClick={() => openEditModal(viewingHighlight)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Edit"
                        >
                            <Pencil size={20} />
                        </button>
                        <button 
                            onClick={() => { if(confirm('Delete?')) { removeHighlight(viewingHighlight.id); setViewingHighlight(null); } }}
                            className="p-3 rounded-full bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
                            title="Delete"
                        >
                            <Trash2 size={20} />
                        </button>
                        <button 
                            onClick={() => setViewingHighlight(null)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="text-base text-gray-200 font-light leading-relaxed whitespace-pre-wrap">
                    {viewingHighlight.notes}
                </div>

                {/* Photos Grid */}
                {viewingHighlight.photos && viewingHighlight.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        {viewingHighlight.photos.map((photo: string, idx: number) => (
                            <div 
                                key={idx} 
                                className="aspect-square rounded-2xl overflow-hidden cursor-zoom-in border border-white/5 hover:border-white/20 transition-all group relative"
                                onClick={() => setExpandedImage(photo)}
                            >
                                <img src={photo} alt="Memory" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {expandedImage && (
        <div 
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300"
            onClick={() => setExpandedImage(null)}
        >
            <button 
                onClick={() => setExpandedImage(null)}
                className="absolute top-6 right-6 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-50"
            >
                <X size={24} />
            </button>
            <img 
                src={expandedImage} 
                alt="Full screen" 
                className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in zoom-in-90 duration-300"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-[#18181b] border border-white/10 p-8 rounded-[2.5rem] shadow-2xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <div className="flex justify-between items-start">
                  <h3 className="text-2xl font-light text-white">{editingId ? 'Edit Memory' : 'New Memory'}</h3>
                  <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white p-2 hover:bg-white/5 rounded-full"><X size={24}/></button>
              </div>

              <div className="space-y-6">
                  {/* Top Inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Category</label>
                          <div className="flex gap-2">
                            <div className="flex-grow">
                                <CustomSelect 
                                    options={state.highlightCategories}
                                    value={formData.type || ''}
                                    onChange={(val) => setFormData({...formData, type: val})}
                                    placeholder="Select Category"
                                />
                            </div>
                            <button onClick={() => setIsCategoryManagerOpen(true)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-white border border-white/10">
                                <SettingsIcon size={16} />
                            </button>
                          </div>
                      </div>
                      <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Date</label>
                          <input 
                            type="date"
                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-gray-200 outline-none focus:ring-1 focus:ring-pastel-pink transition-all"
                            value={formData.date || ''}
                            onChange={(e) => setFormData({...formData, date: e.target.value})}
                          />
                      </div>
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Title</label>
                      <input 
                        type="text"
                        placeholder="What did you experience?"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-lg font-medium text-white outline-none focus:ring-1 focus:ring-pastel-pink transition-all placeholder-gray-600"
                        value={formData.title || ''}
                        onChange={(e) => setFormData({...formData, title: e.target.value})}
                      />
                  </div>

                  <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Journal Notes</label>
                      <AutoTextArea
                        placeholder="Write about your experience... (This box will expand as you type)"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-sm font-light leading-relaxed text-gray-300 outline-none focus:ring-1 focus:ring-pastel-pink transition-all resize-none min-h-[150px]"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      />
                  </div>

                  {/* Photos */}
                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Photos</label>
                        <label className="cursor-pointer inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest text-pastel-blue transition-all">
                            <ImageIcon size={12} /> Add
                            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={isUploading} />
                        </label>
                     </div>
                     
                     <div className="flex gap-3 overflow-x-auto pb-2 min-h-[80px]">
                        {formData.photos && formData.photos.length > 0 ? (
                            formData.photos.map((photo, idx) => (
                                <div key={idx} className="relative w-24 h-24 flex-shrink-0 rounded-xl overflow-hidden group border border-white/10">
                                    <img src={photo} alt="Memory" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <button 
                                            onClick={() => removePhoto(idx)}
                                            className="bg-red-500/80 p-2 rounded-full text-white hover:bg-red-500"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="w-full h-20 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-gray-600 text-xs italic">No photos added</div>
                        )}
                     </div>
                  </div>

                  <button 
                    onClick={handleSave} 
                    disabled={!formData.title}
                    className="w-full bg-white text-black py-4 rounded-xl font-bold hover:bg-pastel-pink transition-all shadow-lg mt-4 disabled:opacity-50"
                  >
                    {editingId ? 'Update Highlight' : 'Save Memory'}
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Category Manager */}
      <CategoryManagerModal 
        isOpen={isCategoryManagerOpen} 
        onClose={() => setIsCategoryManagerOpen(false)}
        categories={state.highlightCategories}
        updateCategories={updateHighlightCategories}
      />

    </div>
  );
};

export default Highlights;