import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, DayLog } from '../types';
import { Search, ArrowUpDown, Image as ImageIcon, X, BookOpen, Calendar, Clock, ChevronRight } from 'lucide-react';
import { format, parseISO, isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';

interface TimelineProps {
  state: AppState;
}

// Group entries by time period
const groupByPeriod = (dates: string[]): Record<string, string[]> => {
  const groups: Record<string, string[]> = {
    'Today': [],
    'Yesterday': [],
    'This Week': [],
    'This Month': [],
    'Earlier': []
  };

  dates.forEach(dateStr => {
    const date = parseISO(dateStr);
    if (isToday(date)) {
      groups['Today'].push(dateStr);
    } else if (isYesterday(date)) {
      groups['Yesterday'].push(dateStr);
    } else if (isThisWeek(date, { weekStartsOn: 0 })) {
      groups['This Week'].push(dateStr);
    } else if (isThisMonth(date)) {
      groups['This Month'].push(dateStr);
    } else {
      groups['Earlier'].push(dateStr);
    }
  });

  return groups;
};

const Timeline: React.FC<TimelineProps> = ({ state }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Viewer States
  const [viewingEntry, setViewingEntry] = useState<{ date: string; log: DayLog } | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Get all dates with logged content
  const loggedDates = useMemo(() => {
    return Object.entries(state.logs)
      .filter(([dateStr, log]) => {
        // Filter by month
        if (selectedMonth && !dateStr.startsWith(selectedMonth)) return false;
        
        // Must have some content
        const hasContent = 
          log.moods.length > 0 ||
          (log.activities?.length || 0) > 0 ||
          log.journalEntries.length > 0;
        
        if (!hasContent) return false;

        // Search filter
        if (searchTerm) {
          const searchLower = searchTerm.toLowerCase();
          const hasMatchingJournal = log.journalEntries.some(e => 
            e.text.toLowerCase().includes(searchLower)
          );
          const hasMatchingMood = log.moods.some(m => {
            const mood = state.moods.find(mood => mood.id === m);
            return mood?.label.toLowerCase().includes(searchLower);
          });
          const hasMatchingActivity = (log.activities || []).some(a => {
            const cat = state.categories.find(c => c.id === a);
            return cat?.label.toLowerCase().includes(searchLower);
          });
          const dateMatches = dateStr.includes(searchTerm) || 
            format(parseISO(dateStr), 'MMMM d, yyyy EEEE').toLowerCase().includes(searchLower);
          
          if (!hasMatchingJournal && !hasMatchingMood && !hasMatchingActivity && !dateMatches) {
            return false;
          }
        }

        return true;
      })
      .map(([dateStr]) => dateStr)
      .sort((a, b) => sortOrder === 'desc' ? b.localeCompare(a) : a.localeCompare(b));
  }, [state.logs, searchTerm, sortOrder, selectedMonth, state.moods, state.categories]);

  const groupedDates = useMemo(() => groupByPeriod(loggedDates), [loggedDates]);

  // Get preview data for a day
  const getDayPreview = (log: DayLog) => {
    const moodEmojis = log.moods.map(m => state.moods.find(mood => mood.id === m)?.emoji).filter(Boolean);
    const activities = (log.activities || [])
      .map(a => state.categories.find(c => c.id === a))
      .filter(Boolean)
      .slice(0, 4);
    const firstJournal = log.journalEntries[0];
    const photoCount = log.journalEntries.reduce((sum, e) => sum + (e.photos?.length || 0), 0);
    
    return { moodEmojis, activities, firstJournal, photoCount, entryCount: log.journalEntries.length };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-3xl mx-auto">
      
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#09090b]/95 backdrop-blur-xl py-6 -mx-4 px-4 border-b border-white/5">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Timeline</h1>
            <p className="text-sm text-gray-500 mt-1">{loggedDates.length} entries</p>
          </div>

          <div className="flex gap-3">
            {/* Search */}
            <div className="relative group flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-pastel-purple transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search your timeline..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-10 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-pastel-purple/50 transition-all placeholder-gray-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>
            
            {/* Month Filter */}
            <input 
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-sm text-gray-400 focus:outline-none focus:text-white focus:border-white/30 transition-all cursor-pointer hover:bg-white/10 w-36"
            />
            
            {/* Sort */}
            <button 
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="aspect-square h-11 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title={`Sort ${sortOrder === 'desc' ? 'Oldest First' : 'Newest First'}`}
            >
              <ArrowUpDown size={18} className={sortOrder === 'asc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
            </button>
          </div>
        </div>
      </header>

      {/* Timeline Feed */}
      {loggedDates.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
          <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center">
            <BookOpen size={32} className="text-gray-600" />
          </div>
          <div className="space-y-1">
            <p className="text-lg font-medium text-gray-300">No entries found</p>
            <p className="text-sm text-gray-500">Start logging your days to see them here</p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedDates).map(([period, dates]) => {
            if (dates.length === 0) return null;
            
            return (
              <div key={period}>
                <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4 sticky top-[140px] bg-[#09090b]/95 backdrop-blur-sm py-2 -mx-4 px-4">
                  {period}
                </h2>
                
                <div className="space-y-4">
                  {dates.map(dateStr => {
                    const log = state.logs[dateStr];
                    const preview = getDayPreview(log);
                    
                    return (
                      <div
                        key={dateStr}
                        onClick={() => setViewingEntry({ date: dateStr, log })}
                        className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/[0.07] hover:border-white/10 transition-all cursor-pointer group"
                      >
                        {/* Date Header */}
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl font-black text-pastel-purple">
                              {format(parseISO(dateStr), 'd')}
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                {format(parseISO(dateStr), 'EEEE')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(parseISO(dateStr), 'MMMM yyyy')}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Mood Emojis */}
                            {preview.moodEmojis.length > 0 && (
                              <div className="flex -space-x-1">
                                {preview.moodEmojis.slice(0, 3).map((emoji, i) => (
                                  <span key={i} className="text-xl">{emoji}</span>
                                ))}
                              </div>
                            )}
                            <ChevronRight size={18} className="text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                        </div>

                        {/* Activities */}
                        {preview.activities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {preview.activities.map(cat => (
                              <span
                                key={cat!.id}
                                className={`px-2 py-0.5 rounded-lg text-xs ${cat!.color} text-black`}
                              >
                                {cat!.label}
                              </span>
                            ))}
                            {(log.activities?.length || 0) > 4 && (
                              <span className="px-2 py-0.5 rounded-lg text-xs bg-white/10">
                                +{(log.activities?.length || 0) - 4}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Journal Preview */}
                        {preview.firstJournal && (
                          <div className="flex gap-3">
                            {preview.firstJournal.photos?.[0] && (
                              <img 
                                src={preview.firstJournal.photos[0]} 
                                alt="" 
                                className="w-16 h-16 object-cover rounded-xl flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-300 line-clamp-2">
                                {preview.firstJournal.text}
                              </p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                {preview.entryCount > 1 && (
                                  <span>{preview.entryCount} entries</span>
                                )}
                                {preview.photoCount > 0 && (
                                  <span className="flex items-center gap-1">
                                    <ImageIcon size={12} /> {preview.photoCount}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Entry Detail Modal */}
      {viewingEntry && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setViewingEntry(null)}
        >
          <div 
            className="bg-[#18181b] border border-white/10 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 bg-[#18181b] border-b border-white/5 p-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">
                  {format(parseISO(viewingEntry.date), 'MMMM d, yyyy')}
                </h2>
                <p className="text-sm text-gray-500">{format(parseISO(viewingEntry.date), 'EEEE')}</p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    setViewingEntry(null);
                    navigate(`/today?date=${viewingEntry.date}`);
                  }}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors"
                >
                  Edit
                </button>
                <button 
                  onClick={() => setViewingEntry(null)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Moods */}
              {viewingEntry.log.moods.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Feeling</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingEntry.log.moods.map(moodId => {
                      const mood = state.moods.find(m => m.id === moodId);
                      return mood && (
                        <span key={moodId} className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl">
                          <span className="text-xl">{mood.emoji}</span>
                          <span className="text-sm">{mood.label}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Activities */}
              {(viewingEntry.log.activities?.length || 0) > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Activities</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewingEntry.log.activities?.map(actId => {
                      const cat = state.categories.find(c => c.id === actId);
                      return cat && (
                        <span key={actId} className={`px-3 py-1.5 rounded-xl text-sm ${cat.color} text-black`}>
                          {cat.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Journal Entries */}
              {viewingEntry.log.journalEntries.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Journal</h3>
                  <div className="space-y-4">
                    {viewingEntry.log.journalEntries.map(entry => (
                      <div key={entry.id} className="bg-white/5 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                          <Clock size={12} />
                          <span>{entry.timestamp}</span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-3">
                            {entry.photos.map((photo, i) => (
                              <img 
                                key={i} 
                                src={photo} 
                                alt="" 
                                className="w-24 h-24 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => setExpandedImage(photo)}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tasks Summary */}
              {(viewingEntry.log.tasks?.length || 0) > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Tasks</h3>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="text-sm">
                      {viewingEntry.log.tasks?.filter(t => t.completed).length} of {viewingEntry.log.tasks?.length} completed
                    </div>
                  </div>
                </div>
              )}

              {/* Expenses Summary */}
              {viewingEntry.log.expenses.length > 0 && (
                <div>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Spending</h3>
                  <div className="bg-white/5 rounded-2xl p-4">
                    <div className="text-lg font-bold">
                      ₱{viewingEntry.log.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">{viewingEntry.log.expenses.length} transactions</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4"
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
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
