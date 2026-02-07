import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, DayLog } from '../types';
import { Search, ArrowUpDown, Image as ImageIcon, X, MoreVertical, BookOpen, Calendar, Clock, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

interface DatabaseProps {
  state: AppState;
  onNavigate: (date: string) => void;
}

const Database: React.FC<DatabaseProps> = ({ state, onNavigate }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Viewer States
  const [viewingNote, setViewingNote] = useState<any | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Filter & Sort Logic for Journal Entries
  const notes = useMemo(() => {
    let allItems: any[] = [];

    Object.values(state.logs).forEach((log: DayLog) => {
      // Filter by Month
      if (selectedMonth && !log.date.startsWith(selectedMonth)) return;

      // Journal Entries
      log.journalEntries?.forEach(entry => {
        if (
            !searchTerm || 
            entry.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
            log.date.includes(searchTerm)
        ) {
            allItems.push({
                type: 'journal',
                id: entry.id,
                content: entry.text,
                date: log.date,
                timestamp: entry.timestamp,
                photos: entry.photos
            });
        }
      });
    });

    return allItems.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        
        // Secondary sort by timestamp if available for stability
        if (dateA === dateB && a.timestamp && b.timestamp) {
             return sortOrder === 'desc' ? b.timestamp.localeCompare(a.timestamp) : a.timestamp.localeCompare(b.timestamp);
        }

        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

  }, [state.logs, searchTerm, sortOrder, selectedMonth]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-7xl mx-auto">
      
      {/* Header Section */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-6 sticky top-0 z-30 bg-dark-bg/95 backdrop-blur-xl py-6 -mx-4 px-4 border-b border-white/5 md:static md:bg-transparent md:p-0 md:border-none transition-all">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-blue mb-2">Archives</h2>
          <h1 className="text-4xl font-light tracking-tight text-white">Journal Notes</h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           {/* Search */}
           <div className="relative group flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pastel-blue transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search memories..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-pastel-blue/50 transition-all placeholder-gray-600 text-gray-200 hover:bg-white/10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"><X size={14} /></button>
              )}
           </div>
           
           {/* Filters */}
           <div className="flex gap-2 h-11">
             <div className="relative h-full">
                <input 
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="h-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-gray-400 focus:outline-none focus:text-white focus:border-white/30 transition-all cursor-pointer hover:bg-white/10"
                />
             </div>
             <button 
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                className="aspect-square h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                title={`Sort ${sortOrder === 'desc' ? 'Oldest' : 'Newest'}`}
             >
                <ArrowUpDown size={18} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
             </button>
           </div>
        </div>
      </header>

      {/* Masonry Layout (Google Keep Style) */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
        {notes.length === 0 ? (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-6 text-center animate-in fade-in zoom-in-95 duration-500 break-inside-avoid">
             <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <BookOpen size={32} className="text-gray-600" />
             </div>
             <div className="space-y-1">
                <p className="text-lg font-medium text-gray-300">No notes found</p>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
             </div>
          </div>
        ) : (
            notes.map((note) => (
                <div 
                    key={note.id}
                    onClick={() => setViewingNote(note)}
                    className="break-inside-avoid mb-6 group relative bg-dark-card border border-white/5 rounded-[2rem] hover:border-white/20 transition-all duration-300 hover:shadow-2xl cursor-pointer overflow-hidden animate-in slide-in-from-bottom-8 hover:-translate-y-1"
                >
                    {/* Image Header */}
                    {note.photos && note.photos.length > 0 && (
                        <div className="w-full relative group-hover:opacity-90 transition-opacity">
                            <img src={note.photos[0]} alt="Note attachment" className="w-full h-auto object-cover max-h-72" />
                            <div className="absolute inset-0 bg-gradient-to-t from-dark-card to-transparent opacity-60"></div>
                            {note.photos.length > 1 && (
                                <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border border-white/10">
                                    <ImageIcon size={10} /> +{note.photos.length - 1}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="p-6 flex flex-col gap-4">
                        {/* Header */}
                        <div className="flex justify-between items-start">
                             <div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-pastel-blue opacity-80 mb-1">{format(new Date(note.date), 'MMMM d, yyyy')}</h3>
                                <div className="flex items-center gap-2 text-xs text-gray-500 font-medium">
                                    <span>{format(new Date(note.date), 'EEEE')}</span>
                                    {note.timestamp && (
                                        <>
                                            <span className="w-1 h-1 rounded-full bg-gray-700"></span>
                                            <span>{note.timestamp}</span>
                                        </>
                                    )}
                                </div>
                             </div>
                        </div>

                        {/* Content */}
                        <p className="text-sm text-gray-300 font-light leading-relaxed whitespace-pre-wrap line-clamp-[12] group-hover:line-clamp-none transition-all">
                            {note.content}
                        </p>
                    </div>
                </div>
            ))
        )}
      </div>

      {/* Entry Viewer Modal */}
      {viewingNote && (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={() => setViewingNote(null)}
        >
            <div 
                className="bg-[#18181b] border border-white/10 p-8 rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar relative flex flex-col gap-6"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-start border-b border-white/5 pb-6">
                    <div>
                        <h2 className="text-2xl font-light text-white tracking-tight">{format(new Date(viewingNote.date), 'MMMM d, yyyy')}</h2>
                        <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                            <span className="flex items-center gap-1.5"><Calendar size={14}/> {format(new Date(viewingNote.date), 'EEEE')}</span>
                            {viewingNote.timestamp && (
                                <>
                                    <span className="w-1 h-1 rounded-full bg-gray-600"/>
                                    <span className="flex items-center gap-1.5"><Clock size={14}/> {viewingNote.timestamp}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => navigate(`/tracker?date=${viewingNote.date}`)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                            title="Go to Tracker"
                        >
                            <ExternalLink size={20} />
                        </button>
                        <button 
                            onClick={() => setViewingNote(null)}
                            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="text-base text-gray-200 font-light leading-relaxed whitespace-pre-wrap">
                    {viewingNote.content}
                </div>

                {/* Photos Grid */}
                {viewingNote.photos && viewingNote.photos.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/5">
                        {viewingNote.photos.map((photo: string, idx: number) => (
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

    </div>
  );
};

export default Database;