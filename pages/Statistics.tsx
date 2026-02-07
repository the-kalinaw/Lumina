import React, { useMemo, useState } from 'react';
import { AppState, DayLog } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BookOpen, DollarSign, Activity, Hash, BarChart3, PieChart as PieIcon, LineChart } from 'lucide-react';
import { endOfWeek, endOfMonth, isWithinInterval } from 'date-fns';

interface StatisticsProps {
  state: AppState;
}

type TimeRange = 'daily' | 'weekly' | 'monthly';
type ChartType = 'pie' | 'bar' | 'area';

const Statistics: React.FC<StatisticsProps> = ({ state }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [chartType, setChartType] = useState<ChartType>('pie');
  const stats = useMemo(() => {
    const logs = Object.values(state.logs) as DayLog[];
    
    // Mood Counts
    const moodCounts: Record<string, number> = {};
    let totalEntriesWithMood = 0;
    
    // Category Hours
    const categoryHours: Record<string, number> = {};
    let totalHoursLogged = 0;

    // Expenses
    const categoryExpenses: Record<string, number> = {};
    let totalExpenses = 0;

    // Journals
    let totalJournals = 0;
    let totalWords = 0;

    logs.forEach(log => {
        // Moods
        if (log.moods && log.moods.length > 0) {
            const primaryMood = log.moods[0];
            moodCounts[primaryMood] = (moodCounts[primaryMood] || 0) + 1;
            totalEntriesWithMood++;
        }

        // Hours - now we have arrays of activities per hour
        Object.values(log.hours || {}).forEach((catIds: any) => {
            const ids = Array.isArray(catIds) ? catIds : [catIds];
            ids.forEach(catId => {
                categoryHours[catId] = (categoryHours[catId] || 0) + 1;
                totalHoursLogged++;
            });
        });

        // Expenses
        log.expenses?.forEach(exp => {
            categoryExpenses[exp.category] = (categoryExpenses[exp.category] || 0) + exp.amount;
            totalExpenses += exp.amount;
        });

        // Journals
        log.journalEntries?.forEach(entry => {
            totalJournals++;
            totalWords += entry.text.trim().split(/\s+/).length;
        });
    });

    const moodData = state.moods.map(m => ({
        name: m.label,
        emoji: m.emoji,
        count: moodCounts[m.id] || 0,
        color: '#cfbaf0' // Default purple
    })).filter(d => d.count > 0).sort((a,b) => b.count - a.count);

    // FIXED: Added sort to ensure highest value is first for "Top Activity" card
    const hoursData = state.categories.map(c => ({
        name: c.label,
        value: categoryHours[c.id] || 0,
        color: c.color
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    const expenseData = state.expenditureCategories.map(c => ({
        name: c.label,
        value: categoryExpenses[c.id] || 0,
        color: c.color
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    return {
        moodData,
        hoursData,
        expenseData,
        totalJournals,
        totalWords,
        totalExpenses,
        totalHoursLogged,
        topMood: moodData.length > 0 ? moodData[0] : null
    };
  }, [state.logs, state.moods, state.categories, state.expenditureCategories]);

  // Time-filtered aggregation for Time Distribution chart
  const timeFilteredHours = useMemo(() => {
    let relevantLogs: DayLog[] = [];
    const today = new Date();

    if (timeRange === 'daily') {
      const todayStr = today.toISOString().split('T')[0];
      if (state.logs[todayStr]) relevantLogs = [state.logs[todayStr]];
    } else if (timeRange === 'weekly') {
      const start = new Date(today);
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);

      const end = endOfWeek(today);
      relevantLogs = (Object.values(state.logs) as DayLog[]).filter(log => {
        const [y, m, d] = log.date.split('-').map(Number);
        const logDate = new Date(y, m - 1, d);
        return isWithinInterval(logDate, { start, end });
      });
    } else if (timeRange === 'monthly') {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = endOfMonth(today);
      relevantLogs = (Object.values(state.logs) as DayLog[]).filter(log => {
        const [y, m, d] = log.date.split('-').map(Number);
        const logDate = new Date(y, m - 1, d);
        return isWithinInterval(logDate, { start, end });
      });
    }

    const counts: Record<string, number> = {};
    let totalCount = 0;

    relevantLogs.forEach(log => {
      Object.values(log.hours || {}).forEach((catIds: any) => {
        const ids = Array.isArray(catIds) ? catIds : [catIds];
        ids.forEach(catId => {
          counts[catId] = (counts[catId] || 0) + 1;
          totalCount++;
        });
      });
    });

    return state.categories.map(cat => ({
      name: cat.label,
      value: counts[cat.id] || 0,
      color: cat.color,
      percentage: totalCount > 0 ? Math.round(((counts[cat.id] || 0) / totalCount) * 100) : 0
    })).filter(d => d.value > 0);
  }, [state.logs, state.categories, timeRange]);

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

  const MoodTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div 
          className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm"
          style={{
            animation: 'scaleAndFade 200ms ease-out',
            transformOrigin: 'center'
          }}
        >
          <p className="font-bold mb-2 text-pastel-mint">{data.name} {data.emoji}</p>
          <p className="text-white/80">{`Count: ${data.count}`}</p>
        </div>
      );
    }
    return null;
  };

  const HoursTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryColor = data.color ? getHex(data.color) : '#cfbaf0';
      return (
        <div 
          className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm"
          style={{
            animation: 'scaleAndFade 200ms ease-out',
            transformOrigin: 'center'
          }}
        >
          <p className="font-bold mb-2" style={{ color: categoryColor }}>{data.name}</p>
          <p style={{ color: categoryColor }}>Hours: {data.value}</p>
          <p className="text-pastel-purple/70 mt-1">({((data.value / stats.totalHoursLogged) * 100).toFixed(1)}%)</p>
        </div>
      );
    }
    return null;
  };

  const ExpensesTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const categoryColor = data.color ? getHex(data.color) : '#cfbaf0';
      return (
        <div 
          className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm"
          style={{
            animation: 'scaleAndFade 200ms ease-out',
            transformOrigin: 'center'
          }}
        >
          <p className="font-bold mb-2" style={{ color: categoryColor }}>{data.name}</p>
          <p style={{ color: categoryColor }}>₱{data.value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isMood = data.emoji !== undefined;
      const isExpense = !isMood && !data.count && data.value !== undefined && data.color;
      const isHours = !isMood && data.value !== undefined && data.color;
      
      const categoryColor = data.color ? getHex(data.color) : '#cfbaf0';
      
      return (
        <div className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm">
          <p className="font-bold mb-2" style={{ color: isMood ? '#8eecf5' : categoryColor }}>
            {data.name} {data.emoji || ''}
          </p>
          {isMood ? (
            <p className="text-white/80">{`Count: ${data.count}`}</p>
          ) : isExpense ? (
            <p style={{ color: categoryColor }}>₱{data.value.toLocaleString()}</p>
          ) : (
            <>
              <p style={{ color: categoryColor }}>Hours: {data.value}</p>
              <p className="text-pastel-purple/70 mt-1">({((data.value / stats.totalHoursLogged) * 100).toFixed(1)}%)</p>
            </>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <style>{`
        @keyframes scaleAndFade {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
      <header>
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-mint mb-2">Analytics</h2>
        <h1 className="text-4xl font-light tracking-tight">Your Life in Numbers</h1>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 hover:border-pastel-purple/50 hover:bg-dark-card/50 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-purple/10 rounded-2xl text-pastel-purple group-hover:bg-pastel-purple/20 transition-colors"><BookOpen size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-70">Journals</span>
            </div>
            <div>
                <span className="text-4xl font-light group-hover:text-pastel-purple transition-colors">{stats.totalJournals}</span>
                <p className="text-xs opacity-50 group-hover:opacity-70 mt-1">{stats.totalWords.toLocaleString()} words written</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 hover:border-pastel-pink/50 hover:bg-dark-card/50 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-pink/10 rounded-2xl text-pastel-pink group-hover:bg-pastel-pink/20 transition-colors"><DollarSign size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-70">Spent</span>
            </div>
            <div>
                <span className="text-4xl font-light group-hover:text-pastel-pink transition-colors">₱{stats.totalExpenses.toLocaleString()}</span>
                <p className="text-xs opacity-50 group-hover:opacity-70 mt-1">Total Expenses</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 hover:border-pastel-blue/50 hover:bg-dark-card/50 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-blue/10 rounded-2xl text-pastel-blue group-hover:bg-pastel-blue/20 transition-colors"><Activity size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-70">Top Activity</span>
            </div>
            <div>
                <span className="text-2xl font-light truncate w-full block group-hover:text-pastel-blue transition-colors">{stats.hoursData[0]?.name || "N/A"}</span>
                <p className="text-xs opacity-50 group-hover:opacity-70 mt-1">{stats.hoursData[0]?.value} hours logged</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 hover:border-pastel-yellow/50 hover:bg-dark-card/50 hover:shadow-lg transition-all duration-300 group">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-yellow/10 rounded-2xl text-pastel-yellow group-hover:bg-pastel-yellow/20 transition-colors"><Hash size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50 group-hover:opacity-70">Top Mood</span>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-4xl group-hover:scale-110 transition-transform">{stats.topMood?.emoji || "-"}</span>
                    <span className="text-xl font-light group-hover:text-pastel-yellow transition-colors">{stats.topMood?.name}</span>
                </div>
                <p className="text-xs opacity-50 group-hover:opacity-70 mt-1">Most frequent state</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Mood Chart */}
        <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-pastel-purple/30 transition-all">
            <h3 className="text-lg font-medium mb-6">Mood Frequency</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.moodData} layout="vertical" margin={{ left: 20 }}>
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<MoodTooltip />} cursor={{fill: 'rgba(207, 186, 240, 0.1)'}} animationDuration={0} />
                        <Bar dataKey="count" fill="#cfbaf0" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Hours Chart */}
        <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-pastel-blue/30 transition-all">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
              <h3 className="text-lg font-medium">Time Distribution</h3>
              <div className="flex gap-2 flex-wrap">
                {/* Chart Type Toggle */}
                <div className="bg-white/5 p-1 rounded-xl flex">
                    <button onClick={() => setChartType('pie')} className={`p-2 rounded-lg transition-colors ${chartType === 'pie' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><PieIcon size={16}/></button>
                    <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><BarChart3 size={16}/></button>
                    <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-colors ${chartType === 'area' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><LineChart size={16}/></button>
                </div>
                {/* Time Range Toggle */}
                <div className="bg-white/5 p-1 rounded-xl flex">
                    <button onClick={() => setTimeRange('daily')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${timeRange === 'daily' ? 'bg-pastel-blue text-black' : 'text-gray-500 hover:text-white'}`}>Daily</button>
                    <button onClick={() => setTimeRange('weekly')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${timeRange === 'weekly' ? 'bg-pastel-blue text-black' : 'text-gray-500 hover:text-white'}`}>Weekly</button>
                    <button onClick={() => setTimeRange('monthly')} className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${timeRange === 'monthly' ? 'bg-pastel-blue text-black' : 'text-gray-500 hover:text-white'}`}>Monthly</button>
                </div>
              </div>
            </div>
            <div className="h-64">
                {timeFilteredHours.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'pie' ? (
                      <PieChart>
                        <Pie
                            data={timeFilteredHours}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {timeFilteredHours.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                            ))}
                        </Pie>
                        <Tooltip content={<HoursTooltip />} animationDuration={0} />
                        <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px' }} />
                    </PieChart>
                    ) : chartType === 'bar' ? (
                      <BarChart data={timeFilteredHours}>
                         <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                         <Tooltip content={<HoursTooltip />} animationDuration={0} />
                         <Bar dataKey="value" radius={[4, 4, 0, 0]} fill="#a3c4f3">
                            {timeFilteredHours.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                            ))}
                         </Bar>
                      </BarChart>
                    ) : (
                      <AreaChart data={timeFilteredHours}>
                         <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                         <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                         <Tooltip content={<HoursTooltip />} animationDuration={0} />
                         <Area type="monotone" dataKey="value" stroke="#a3c4f3" fill="rgba(163, 196, 243, 0.2)" />
                      </AreaChart>
                    )}
                </ResponsiveContainer>
                ) : (
                <div className="h-full flex items-center justify-center text-gray-600 italic font-light">
                  <p>No activity recorded for this period</p>
                </div>
                )}
            </div>
        </div>

        {/* Expenses Chart */}
        <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-pastel-pink/30 transition-all lg:col-span-2">
            <h3 className="text-lg font-medium mb-6">Expenses Breakdown</h3>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.expenseData}>
                        <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip 
                            content={<ExpensesTooltip />}
                            cursor={{fill: 'rgba(255, 207, 210, 0.1)'}}
                            animationDuration={0}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                            {stats.expenseData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;