import React, { useMemo } from 'react';
import { AppState, DayLog } from '../types';
import { Sparkles, Calendar, ArrowRight, Activity, BarChart3, ListTodo, Circle, CheckCircle2, PieChart as PieIcon, Clock } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.slice(0, 7); // YYYY-MM
  const todayLog = state.logs[todayStr];
  
  const pendingTasks = todayLog?.tasks?.filter(t => !t.completed).length || 0;

  const formatTime = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Prepare data for Daily Distribution Chart
  const dailyDistributionData = useMemo(() => {
    if (!todayLog || !todayLog.hours) return [];
    
    const counts: Record<string, number> = {};
    let total = 0;
    
    Object.values(todayLog.hours).forEach((val: any) => {
        // Handle cases where value might be an array (multiple activities) or single string
        const catIds = Array.isArray(val) ? val : [val];
        
        catIds.forEach((catId: string) => {
            counts[catId] = (counts[catId] || 0) + 1;
            total++;
        });
    });

    return Object.entries(counts).map(([catId, val]) => {
        const cat = state.categories.find(c => c.id === catId);
        return {
            name: cat?.label || catId,
            value: val,
            color: cat?.color || 'bg-gray-500',
            percentage: total > 0 ? Math.round((val / total) * 100) : 0
        };
    }).sort((a,b) => b.value - a.value);
  }, [todayLog, state.categories]);

  // Calculate Current Month Expenses
  const currentMonthExpenses = useMemo(() => {
    return (Object.values(state.logs) as DayLog[])
      .filter(log => log.date.startsWith(currentMonthStr))
      .reduce((total, log) => 
        total + (log.expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0)
      , 0);
  }, [state.logs, currentMonthStr]);

  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const colors: Record<string, string> = {
    'bg-pastel-pink': '#ffcfd2',
    'bg-pastel-rose': '#f1c0e8',
    'bg-pastel-purple': '#cfbaf0',
    'bg-pastel-blue': '#a3c4f3',
    'bg-pastel-cyan': '#90dbf4',
    'bg-pastel-mint': '#8eecf5',
    'bg-pastel-green': '#98f5e1',
    'bg-pastel-yellow': '#fbf8cc',
    'bg-orange-200': '#fed7aa',
    'bg-red-400': '#f87171',
    'bg-indigo-400': '#818cf8',
    'bg-emerald-400': '#34d399',
  };
  const getHex = (twClass: string) => colors[twClass] || '#cbd5e1';

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-purple mb-2">Daily Focus</h2>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Top Row: Main Tracker CTA + Today's Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Tracker Card */}
          <div 
            onClick={() => onNavigate('tracker')}
            className="lg:col-span-2 group bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-pastel-purple/50 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[280px] shadow-2xl active:scale-[0.98] duration-200"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={180} />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-pastel-purple mb-4">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Priority Task</span>
              </div>
              <h3 className="text-4xl font-light text-white leading-tight mb-2">Record your day's journey</h3>
              <p className="text-gray-400 max-w-md">Log your activities, expenses, and moods to gain insights into your life.</p>
            </div>
            <div className="flex items-center gap-3 text-gray-500 group-hover:text-white transition-colors relative z-10 mt-8">
              <span className="font-bold uppercase tracking-wider text-sm">Open Daily Tracker</span>
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-pastel-purple group-hover:text-black transition-all">
                 <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Daily Distribution Chart */}
          <div className="bg-dark-card p-6 rounded-[2.5rem] border border-white/5 flex flex-col relative overflow-hidden h-[280px]">
             <div className="flex justify-between items-center mb-2 z-10">
               <div className="flex items-center gap-2 text-pastel-blue">
                  <PieIcon size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Day at a glance</span>
               </div>
             </div>
             
             {dailyDistributionData.length > 0 ? (
                <div className="flex-grow relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={dailyDistributionData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={70}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {dailyDistributionData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                                ))}
                            </Pie>
                            <Tooltip 
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                      const data = payload[0].payload;
                                      const categoryColor = data.color ? getHex(data.color) : '#cfbaf0';
                                      return (
                                        <div className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm animate-in zoom-in-95 duration-200">
                                          <p className="font-bold mb-2" style={{ color: categoryColor }}>{data.name}</p>
                                          <p style={{ color: categoryColor }}>Hours: {data.value}</p>
                                          <p className="text-pastel-purple/70 mt-1">({data.percentage}%)</p>
                                        </div>
                                      );
                                    }
                                    return null;
                                }}
                                animationDuration={0}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
             ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center opacity-40">
                    <Clock size={32} className="mb-2" />
                    <p className="text-xs">No activity logged yet</p>
                </div>
             )}
          </div>
        </div>

        {/* Middle Row: Tasks & Mood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Tasks Card */}
            <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-pastel-mint/30 transition-all flex flex-col h-full">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-pastel-mint/10 rounded-xl text-pastel-mint font-bold"><ListTodo size={18} /></div>
                <div>
                <h3 className="text-lg font-medium opacity-90">Daily Tasks</h3>
                <p className="text-xs opacity-50 text-pastel-mint/70">{pendingTasks} pending • {(todayLog?.tasks?.filter(t => t.completed).length || 0)} completed</p>
                </div>
            </div>
            
            <div className="space-y-2 flex-grow overflow-y-auto max-h-60 pr-2 custom-scrollbar">
                {(!todayLog?.tasks || todayLog.tasks.length === 0) ? (
                <div className="text-center opacity-60 py-8 italic text-sm font-light bg-black/20 rounded-2xl border border-white/5 border-dashed h-full flex flex-col items-center justify-center">
                    <p>No tasks yet.</p>
                    <button 
                    onClick={() => onNavigate('tracker')} 
                    className="mt-3 text-xs font-bold uppercase tracking-widest text-pastel-mint hover:underline"
                    >
                    Create Plan →
                    </button>
                </div>
                ) : (
                todayLog.tasks.map((task) => (
                    <div 
                    key={task.id}
                    className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all group"
                    >
                    <button 
                        onClick={() => onNavigate('tracker')}
                        className={`cursor-pointer transition-all duration-300 flex-shrink-0 ${task.completed ? 'text-pastel-mint scale-110' : 'text-gray-600 hover:text-white'}`}
                    >
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div className={`flex-grow flex flex-col min-w-0 ${task.completed ? 'opacity-40' : ''}`}>
                        <span className={`text-sm font-medium truncate ${task.completed ? 'line-through opacity-50' : 'opacity-90'}`}>{task.title}</span>
                        {task.time && <span className="text-[10px] text-pastel-mint font-black tracking-widest">{formatTime(task.time)}</span>}
                    </div>
                    </div>
                ))
                )}
            </div>
            </div>

            {/* Mood Card */}
            <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col justify-center h-full">
                <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2 text-pastel-green">
                    <Activity size={18} />
                    <h3 className="text-lg font-medium opacity-90">Mood</h3>
                </div>
                <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Today</span>
                </div>
                
                {todayLog?.moods?.length ? (
                    <div className="flex flex-wrap gap-4 items-center justify-center">
                        {todayLog.moods.map(id => (
                            <div key={id} className="flex flex-col items-center gap-2 animate-in zoom-in duration-300">
                                <span className="text-5xl drop-shadow-xl hover:scale-110 transition-transform cursor-default filter grayscale-0">
                                    {state.moods.find(m => m.id === id)?.emoji || '✨'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">
                                    {state.moods.find(m => m.id === id)?.label}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center opacity-40 py-8 border-2 border-dashed border-white/5 rounded-3xl">
                        <span className="text-sm font-light">How are you feeling?</span>
                        <button onClick={() => onNavigate('tracker')} className="block mx-auto mt-2 text-pastel-green text-xs font-bold uppercase tracking-widest hover:underline">Log Mood</button>
                    </div>
                )}
            </div>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-blue mb-2">Summary Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Statistics Button */}
          <div 
            onClick={() => onNavigate('stats')}
            className="group bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-pastel-blue/50 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-64 shadow-2xl active:scale-[0.98] duration-200"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <BarChart3 size={120} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-pastel-blue mb-4">
                <BarChart3 size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Analytics</span>
              </div>
              <h3 className="text-3xl font-light text-white leading-tight">Explore your insights</h3>
            </div>
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors">
              <span className="font-medium">View Statistics</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Monthly Expenses */}
          <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center gap-3 mb-4 text-gray-500">
              <BarChart3 className="w-5 h-5 text-pastel-pink" />
              <h3 className="text-xs font-bold uppercase tracking-[0.2em]">Monthly Expenses</h3>
            </div>
            <div className="text-4xl font-light text-white mb-2">₱ {currentMonthExpenses.toLocaleString()}</div>
            <p className="text-xs opacity-40">Total accumulation for {currentMonthName}.</p>
          </div>

          {/* Journal Database */}
          <div 
            onClick={() => onNavigate('database')}
            className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/5 transition-all cursor-pointer group active:scale-[0.98] duration-200"
          >
            <h3 className="text-lg font-light text-white mb-2">Journal Database</h3>
            <p className="text-sm text-gray-500 mb-4 leading-relaxed font-light">Explore your reflections and patterns.</p>
            <div className="flex items-center gap-2 text-pastel-pink text-xs font-bold uppercase tracking-widest">
              Explore <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Dashboard;