import React, { useState, useMemo } from 'react';
import { AppState, DayLog } from '../types';
import { Search, Image as ImageIcon, X, BookOpen, Clock, ChevronLeft } from 'lucide-react';
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  
  // Viewer States
  const [viewingEntry, setViewingEntry] = useState<{ date: string; log: DayLog } | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Get all dates with logged content
  const loggedDates = useMemo(() => {
    return Object.entries(state.logs)
      .filter(([dateStr, log]) => {
        if (selectedMonth && !dateStr.startsWith(selectedMonth)) return false;
        
        const hasContent = 
          log.moods.length > 0 ||
          (log.activities?.length || 0) > 0 ||
          log.journalEntries.length > 0;
        
        if (!hasContent) return false;

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
      .sort((a, b) => b.localeCompare(a));
  }, [state.logs, searchTerm, selectedMonth, state.moods, state.categories]);

  const groupedDates = useMemo(() => groupByPeriod(loggedDates), [loggedDates]);

  // Get preview data for a day
  const getDayPreview = (log: DayLog) => {
    const moodEmoji = log.moods[0] ? state.moods.find(mood => mood.id === log.moods[0])?.emoji : null;
    const activities = (log.activities || [])
      .map(a => state.categories.find(c => c.id === a))
      .filter(Boolean)
      .slice(0, 3);
    const firstJournal = log.journalEntries[0];
    const photoCount = log.journalEntries.reduce((sum, e) => sum + (e.photos?.length || 0), 0);
    
    return { moodEmoji, activities, firstJournal, photoCount, entryCount: log.journalEntries.length };
  };

  return (
    <div className="min-h-screen pb-24">
      
      {/* Header */}
      <header className="pt-8 pb-6 px-4 max-w-2xl mx-auto">
        <h1 className="text-2xl font-semibold mb-6">Timeline</h1>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
            <input 
              type="text" 
              placeholder="Search..."
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white p-1">
                <X size={14} />
              </button>
            )}
          </div>
          
          {/* Month Filter */}
          <input 
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm text-gray-400 focus:outline-none focus:text-white cursor-pointer hover:bg-white/10 transition-colors"
          />
        </div>
        
        <p className="text-xs text-gray-500 mt-4">{loggedDates.length} entries</p>
      </header>

      {/* Timeline Feed */}
      <div className="max-w-2xl mx-auto px-4">
        {loggedDates.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
              <BookOpen size={24} className="text-gray-600" />
            </div>
            <p className="text-gray-400">No entries yet</p>
            <p className="text-sm text-gray-600 mt-1">Start logging to see your timeline</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedDates).map(([period, dates]) => {
              if (dates.length === 0) return null;
              
              return (
                <div key={period}>
                  <h2 className="text-xs text-gray-500 uppercase tracking-wider mb-4 sticky top-0 bg-[#09090b] py-2">
                    {period}
                  </h2>
                  
                  <div className="space-y-3">
                    {dates.map(dateStr => {
                      const log = state.logs[dateStr];
                      const preview = getDayPreview(log);
                      
                      return (
                        <button
                          key={dateStr}
                          onClick={() => setViewingEntry({ date: dateStr, log })}
                          className="w-full text-left bg-white/[0.02] border border-white/5 rounded-2xl p-5 hover:bg-white/[0.04] transition-colors group"
                        >
                          {/* Date Row */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              {preview.moodEmoji && (
                                <span className="text-2xl">{preview.moodEmoji}</span>
                              )}
                              <div>
                                <p className="font-medium">{format(parseISO(dateStr), 'EEEE, MMMM d')}</p>
                                <p className="text-xs text-gray-500">{format(parseISO(dateStr), 'yyyy')}</p>
                              </div>
                            </div>
                          </div>

                          {/* Activities */}
                          {preview.activities.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                              {preview.activities.map(cat => (
                                <span
                                  key={cat!.id}
                                  className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-gray-400"
                                >
                                  {cat!.label}
                                </span>
                              ))}
                              {(log.activities?.length || 0) > 3 && (
                                <span className="px-2.5 py-1 rounded-full text-xs bg-white/5 text-gray-500">
                                  +{(log.activities?.length || 0) - 3}
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
                                  className="w-14 h-14 object-cover rounded-xl flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                                  {preview.firstJournal.text}
                                </p>
                                {(preview.entryCount > 1 || preview.photoCount > 0) && (
                                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                                    {preview.entryCount > 1 && <span>{preview.entryCount} entries</span>}
                                    {preview.photoCount > 0 && (
                                      <span className="flex items-center gap-1">
                                        <ImageIcon size={10} /> {preview.photoCount}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Entry Detail Modal */}
      {viewingEntry && (
        <div 
          className="fixed inset-0 z-50 bg-[#09090b]"
          style={{ overflowY: 'auto' }}
        >
          {/* Modal Header */}
          <div className="sticky top-0 bg-[#09090b]/95 backdrop-blur-sm border-b border-white/5 px-4 py-4 flex items-center justify-between">
            <button 
              onClick={() => setViewingEntry(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm">Back</span>
            </button>
            <span className="text-sm text-gray-500">
              {format(parseISO(viewingEntry.date), 'MMM d, yyyy')}
            </span>
          </div>

          <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
            {/* Date Header */}
            <header className="text-center pb-8 border-b border-white/5">
              <p className="text-sm text-gray-500 mb-1">{format(parseISO(viewingEntry.date), 'EEEE')}</p>
              <h2 className="text-3xl font-semibold">
                {format(parseISO(viewingEntry.date), 'MMMM d, yyyy')}
              </h2>
              
              {/* Mood */}
              {viewingEntry.log.moods.length > 0 && (
                <div className="flex justify-center gap-4 mt-6">
                  {viewingEntry.log.moods.map(moodId => {
                    const mood = state.moods.find(m => m.id === moodId);
                    return mood && (
                      <div key={moodId} className="flex flex-col items-center gap-1">
                        <span className="text-4xl">{mood.emoji}</span>
                        <span className="text-xs text-gray-500">{mood.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </header>

            {/* Activities */}
            {(viewingEntry.log.activities?.length || 0) > 0 && (
              <section>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Activities</p>
                <div className="flex flex-wrap gap-2">
                  {viewingEntry.log.activities?.map(actId => {
                    const cat = state.categories.find(c => c.id === actId);
                    return cat && (
                      <span key={actId} className="px-3 py-1.5 rounded-full text-sm bg-white/5 text-gray-300">
                        {cat.label}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Journal Entries */}
            {viewingEntry.log.journalEntries.length > 0 && (
              <section>
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">Journal</p>
                <div className="space-y-6">
                  {viewingEntry.log.journalEntries.map(entry => (
                    <div key={entry.id}>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                        <Clock size={12} />
                        <span>{entry.timestamp}</span>
                      </div>
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-gray-300">{entry.text}</p>
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {entry.photos.map((photo, i) => (
                            <img 
                              key={i} 
                              src={photo} 
                              alt="" 
                              className="w-32 h-32 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setExpandedImage(photo)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Tasks & Expenses Summary */}
            {((viewingEntry.log.tasks?.length || 0) > 0 || viewingEntry.log.expenses.length > 0) && (
              <section className="pt-6 border-t border-white/5">
                <div className="grid grid-cols-2 gap-4">
                  {(viewingEntry.log.tasks?.length || 0) > 0 && (
                    <div className="bg-white/[0.02] rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Tasks</p>
                      <p className="text-lg font-medium">
                        {viewingEntry.log.tasks?.filter(t => t.completed).length}/{viewingEntry.log.tasks?.length}
                      </p>
                      <p className="text-xs text-gray-500">completed</p>
                    </div>
                  )}
                  {viewingEntry.log.expenses.length > 0 && (
                    <div className="bg-white/[0.02] rounded-xl p-4">
                      <p className="text-xs text-gray-500 mb-1">Spending</p>
                      <p className="text-lg font-medium">
                        P{viewingEntry.log.expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{viewingEntry.log.expenses.length} transactions</p>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {expandedImage && (
        <div 
          className="fixed inset-0 z-[100] bg-black flex items-center justify-center p-4"
          onClick={() => setExpandedImage(null)}
        >
          <button 
            onClick={() => setExpandedImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={20} />
          </button>
          <img 
            src={expandedImage} 
            alt="Full screen" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Timeline;
