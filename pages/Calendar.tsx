import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppState, DayLog } from '../types';
import { ChevronLeft, ChevronRight, Plus, Circle, CheckCircle2, LayoutList, Calendar as CalendarIcon, Grid, Info } from 'lucide-react';
import { 
  format, 
  addMonths, 
  addWeeks,
  addYears,
  endOfMonth, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday,
  endOfYear,
  eachMonthOfInterval
} from 'date-fns';

interface CalendarProps {
  state: AppState;
}

type ViewMode = 'week' | 'month' | 'year';

// Helper functions for missing date-fns exports
const getStartOfWeek = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday
  const diff = d.getDate() - day; 
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getStartOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const getStartOfYear = (date: Date) => {
  return new Date(date.getFullYear(), 0, 1);
};

const Calendar: React.FC<CalendarProps> = ({ state }) => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('month');

  const next = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (viewMode === 'year') setCurrentDate(addYears(currentDate, 1));
  };

  const prev = () => {
    if (viewMode === 'week') setCurrentDate(addWeeks(currentDate, -1));
    if (viewMode === 'month') setCurrentDate(addMonths(currentDate, -1));
    if (viewMode === 'year') setCurrentDate(addYears(currentDate, -1));
  };

  const getMoodEmoji = (moodId?: string) => {
    if (!moodId) return null;
    const mood = state.moods.find(m => m.id === moodId);
    return mood ? mood.emoji : '✨';
  };

  const renderHeader = () => (
    <header className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-green mb-2">
          {viewMode === 'year' ? 'Yearly Overview' : viewMode === 'week' ? 'Weekly Agenda' : 'Calendar'}
        </h2>
        <h1 className="text-4xl font-light tracking-tight">
          {viewMode === 'week' 
            ? `Week of ${format(getStartOfWeek(currentDate), 'MMM d, yyyy')}`
            : viewMode === 'year'
              ? format(currentDate, 'yyyy')
              : format(currentDate, 'MMMM yyyy')
          }
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        {/* View Toggles */}
        <div className="bg-white/5 p-1 rounded-xl flex border border-white/5">
            <button 
              onClick={() => setViewMode('week')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'week' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              title="Weekly View"
            >
              <LayoutList size={18} />
            </button>
            <button 
              onClick={() => setViewMode('month')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'month' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              title="Monthly View"
            >
              <CalendarIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('year')} 
              className={`p-2 rounded-lg transition-colors ${viewMode === 'year' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-white'}`}
              title="Yearly View"
            >
              <Grid size={18} />
            </button>
        </div>

        <div className="flex gap-2">
          <button onClick={prev} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
            <ChevronLeft size={20} />
          </button>
          <button onClick={next} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-colors border border-white/5">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </header>
  );

  const renderWeeklyView = () => {
    const days = eachDayOfInterval({
      start: getStartOfWeek(currentDate),
      end: endOfWeek(currentDate)
    });

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = state.logs[dateStr];
          const isTodayDate = isToday(day);
          
          return (
            <div 
              key={dateStr}
              onClick={() => navigate(`/tracker?date=${dateStr}`)}
              className={`
                min-h-[300px] rounded-[2rem] p-4 flex flex-col gap-4 border transition-all cursor-pointer relative group overflow-hidden
                ${isTodayDate 
                  ? 'bg-gradient-to-br from-pastel-purple/10 to-transparent border-pastel-purple/30 shadow-[0_0_30px_rgba(207,186,240,0.1)]' 
                  : 'bg-dark-card border-white/5 hover:bg-white/5 hover:border-white/10'}
              `}
            >
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{format(day, 'EEE')}</span>
                  <span className={`text-2xl font-light ${isTodayDate ? 'text-pastel-purple' : ''}`}>{format(day, 'd')}</span>
                </div>
                {log?.moods?.[0] && <span className="text-2xl">{getMoodEmoji(log.moods[0])}</span>}
              </div>

              {/* Tasks Preview */}
              <div className="flex-grow space-y-2 mt-2">
                {log?.tasks && log.tasks.length > 0 ? (
                  log.tasks.map(task => (
                    <div key={task.id} className="flex items-start gap-2 text-xs group/task">
                       <span className={`mt-0.5 ${task.completed ? 'text-pastel-green' : 'text-gray-500'}`}>
                         {task.completed ? <CheckCircle2 size={12} /> : <Circle size={12} />}
                       </span>
                       <span className={`leading-tight truncate ${task.completed ? 'line-through opacity-50' : 'opacity-80'}`}>{task.title}</span>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex items-center justify-center text-[10px] italic opacity-30">No plans</div>
                )}
              </div>

              {/* Footer Stats */}
              {(log?.expenses?.length || 0) > 0 && (
                <div className="pt-3 border-t border-white/5 flex justify-between items-center text-[10px]">
                   <span className="opacity-50">Spent</span>
                   <span className="font-mono font-bold text-pastel-pink">₱{log?.expenses?.reduce((a,b) => a + b.amount, 0).toLocaleString()}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMonthlyView = () => {
    // startOfMonth replacement
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    
    // startOfWeek replacement (default to Sunday start)
    const day = monthStart.getDay(); // 0 is Sunday
    const start = new Date(monthStart);
    start.setDate(monthStart.getDate() - day);

    const days = eachDayOfInterval({
      start: start,
      end: endOfWeek(endOfMonth(currentDate)),
    });

    return (
      <div className="grid grid-cols-7 border border-white/10 rounded-xl overflow-hidden bg-black/20">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-dark-card p-3 text-center text-[10px] font-black uppercase tracking-[0.3em] opacity-60 border-b border-r border-white/10 last:border-r-0">
            {day}
          </div>
        ))}

        {days.map((day, idx) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const log = state.logs[dateStr];
          const hasData = !!log;
          const currentDayIsToday = isToday(day);
          const sameMonth = isSameMonth(day, currentDate);
          
          // Tasks logic
          const tasks = log?.tasks || [];
          const incompleteCount = tasks.filter(t => !t.completed).length;
          
          // Spending
          const totalSpent = log?.expenses?.reduce((a, b) => a + b.amount, 0) || 0;

          return (
            <div 
              key={idx}
              onClick={() => navigate(`/tracker?date=${dateStr}`)}
              className={`
                min-h-[120px] p-2 border-b border-r border-white/10 relative group transition-all cursor-pointer flex flex-col gap-1
                ${!sameMonth ? 'opacity-20 bg-black/40' : 'bg-dark-card opacity-100'}
                ${hasData ? 'hover:bg-white/[0.02]' : 'hover:bg-white/5'}
                ${(idx + 1) % 7 === 0 ? 'border-r-0' : ''}
              `}
            >
              <div className="flex justify-between items-start">
                 {/* Mood Emoji - Prominent */}
                 <div className="text-xl min-w-[24px]">
                    {hasData ? getMoodEmoji(log.moods?.[0]) : ''}
                 </div>
                 {/* Date */}
                 <span className={`
                  text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                  ${currentDayIsToday ? 'bg-pastel-purple text-black shadow-lg' : 'opacity-60'}
                `}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Tasks List - Spreadsheet Style */}
              <div className="flex-grow flex flex-col gap-0.5 mt-1 overflow-hidden">
                 {tasks.slice(0, 3).map(task => (
                    <div key={task.id} className={`flex items-center gap-1 text-[9px] ${task.completed ? 'text-gray-600 line-through' : 'text-gray-300'}`}>
                        <div className={`w-1 h-1 rounded-full flex-shrink-0 ${task.completed ? 'bg-gray-700' : 'bg-red-400'}`} />
                        <span className="truncate">{task.title}</span>
                    </div>
                 ))}
                 {tasks.length > 3 && <div className="text-[8px] opacity-40 pl-2">+{tasks.length - 3} more</div>}
              </div>

              {/* Bottom Details: Spend */}
              <div className="mt-auto flex justify-between items-end text-[9px]">
                 {incompleteCount > 0 && <span className="text-red-400 font-bold">{incompleteCount} open</span>}
                 {totalSpent > 0 && <span className="text-pastel-pink font-mono ml-auto">₱{totalSpent.toLocaleString()}</span>}
              </div>
              
              {!hasData && sameMonth && (
                <div className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Plus className="opacity-50" size={24} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderYearlyView = () => {
    const months = eachMonthOfInterval({
        start: getStartOfYear(currentDate),
        end: endOfYear(currentDate)
    });

    const yearlyStats = (() => {
        let totalLogged = 0;
        let totalSpent = 0;
        const moodCounts: Record<string, number> = {};
        
        Object.values(state.logs).forEach((log: DayLog) => {
            if (log.date.startsWith(format(currentDate, 'yyyy'))) {
                totalLogged++;
                totalSpent += log.expenses.reduce((a,b) => a+b.amount, 0);
                if (log.moods?.[0]) moodCounts[log.moods[0]] = (moodCounts[log.moods[0]] || 0) + 1;
            }
        });
        
        const topMoodId = Object.keys(moodCounts).sort((a,b) => moodCounts[b] - moodCounts[a])[0];
        const topMood = state.moods.find(m => m.id === topMoodId);
        return { totalLogged, totalSpent, topMood };
    })();

    return (
        <div className="space-y-8">
            {/* Year Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-pastel-blue/20 rounded-xl text-pastel-blue"><CalendarIcon size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Days Logged</p>
                        <p className="text-2xl font-light">{yearlyStats.totalLogged}</p>
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-pastel-yellow/20 rounded-xl text-pastel-yellow"><Info size={20} /></div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Top Mood</p>
                        <p className="text-2xl font-light">{yearlyStats.topMood?.emoji || "-"}</p>
                    </div>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center gap-4">
                    <div className="p-3 bg-pastel-pink/20 rounded-xl text-pastel-pink">₱</div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Total Spent</p>
                        <p className="text-2xl font-light">{(yearlyStats.totalSpent / 1000).toFixed(1)}k</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {months.map(month => {
                    const daysInMonth = eachDayOfInterval({ start: getStartOfMonth(month), end: endOfMonth(month) });
                    const startDay = getStartOfMonth(month).getDay();
                    const paddedDays = Array(startDay).fill(null).concat(daysInMonth);

                    return (
                        <div key={month.toString()} className="bg-dark-card p-4 rounded-3xl border border-white/5 hover:border-white/10 transition-colors">
                            <h3 className="text-sm font-bold text-center mb-3 uppercase tracking-widest opacity-80">{format(month, 'MMMM')}</h3>
                            <div className="grid grid-cols-7 gap-1">
                                {['S','M','T','W','T','F','S'].map(d => (
                                    <div key={d} className="text-[8px] text-center opacity-30 font-bold">{d}</div>
                                ))}
                                {paddedDays.map((day, i) => {
                                    if (!day) return <div key={`pad-${i}`} />;
                                    const dateStr = format(day, 'yyyy-MM-dd');
                                    const log = state.logs[dateStr];
                                    let bgColor = 'bg-white/5';
                                    
                                    // Color logic based on primary mood
                                    if (log?.moods?.[0]) {
                                        const moodId = log.moods[0];
                                        if (moodId === 'great' || moodId === 'good') bgColor = 'bg-pastel-green';
                                        else if (moodId === 'bad' || moodId === 'worst') bgColor = 'bg-red-400';
                                        else bgColor = 'bg-pastel-yellow'; // eh
                                    } else if (log) {
                                        bgColor = 'bg-white/20';
                                    }

                                    return (
                                        <div 
                                            key={dateStr}
                                            onClick={() => navigate(`/tracker?date=${dateStr}`)}
                                            className={`aspect-square rounded-sm ${bgColor} cursor-pointer hover:scale-125 transition-transform`}
                                            title={`${dateStr} ${log?.moods?.[0] ? '- ' + log.moods[0] : ''}`}
                                        />
                                    )
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="bg-dark-card p-6 rounded-3xl border border-white/5">
                <h4 className="text-xs font-bold uppercase tracking-widest mb-4 opacity-60">Mood Color Legend</h4>
                <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-pastel-green"></div>
                        <span className="text-sm">Great / Good</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-pastel-yellow"></div>
                        <span className="text-sm">Eh / Neutral</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-red-400"></div>
                        <span className="text-sm">Bad / Worst</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-white/20"></div>
                        <span className="text-sm">Logged (No Mood)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded bg-white/5 border border-white/10"></div>
                        <span className="text-sm">No Data</span>
                    </div>
                </div>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {renderHeader()}
      
      {viewMode === 'week' && renderWeeklyView()}
      {viewMode === 'month' && renderMonthlyView()}
      {viewMode === 'year' && renderYearlyView()}
    </div>
  );
};

export default Calendar;