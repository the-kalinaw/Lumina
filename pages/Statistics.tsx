import React, { useMemo, useState } from 'react';
import { AppState, DayLog, Expense } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { BookOpen, DollarSign, Activity, Hash, BarChart3, PieChart as PieIcon, LineChart, X, ArrowUpDown } from 'lucide-react';
import { endOfWeek, endOfMonth, isWithinInterval, endOfYear } from 'date-fns';
import CustomSelect from '../components/CustomSelect';

// Helper functions for missing date-fns exports
const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const subMonths = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() - amount);
  return d;
};
const subDays = (date: Date, amount: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() - amount);
  return d;
};

interface StatisticsProps {
  state: AppState;
}

type TimeRange = 'weekly' | 'monthly' | 'customMonth' | 'prevMonth' | 'yearly';
type ChartType = 'pie' | 'bar' | 'area';
type AnalysisTab = 'activity' | 'expenses' | 'moods';

const Statistics: React.FC<StatisticsProps> = ({ state }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly');
  const [selectedMonth, setSelectedMonth] = useState<string>(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [activeTab, setActiveTab] = useState<AnalysisTab>('activity');
  const [chartType, setChartType] = useState<ChartType>('pie');
  
  // Expenses Modal State
  const [selectedExpenseCategory, setSelectedExpenseCategory] = useState<string | null>(null);
  const [expenseSortBy, setExpenseSortBy] = useState<'date' | 'amount'>('date');
  const [expenseSortOrder, setExpenseSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Filtering Logic
  const relevantLogs = useMemo(() => {
    const today = new Date();
    let start: Date, end: Date;

    if (timeRange === 'weekly') {
        const day = today.getDay();
        const diff = today.getDate() - day;
        start = new Date(today);
        start.setDate(diff);
        start.setHours(0,0,0,0);
        end = endOfWeek(today);
    } else if (timeRange === 'monthly') {
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = endOfMonth(today);
    } else if (timeRange === 'customMonth') {
        const [y, m] = selectedMonth.split('-').map(Number);
        start = new Date(y, m - 1, 1);
        end = endOfMonth(start);
    } else if (timeRange === 'prevMonth') {
        const lastMonth = subMonths(today, 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
    } else { // yearly
        start = startOfYear(today);
        end = endOfYear(today);
    }

    return (Object.values(state.logs) as DayLog[]).filter(log => {
        const [y, m, d] = log.date.split('-').map(Number);
        const logDate = new Date(y, m - 1, d);
        return isWithinInterval(logDate, { start, end });
    });
  }, [state.logs, timeRange, selectedMonth]);

  // Derived Stats for KPIs based on filtered logs
  const kpiStats = useMemo(() => {
    let totalJournals = 0;
    let totalWords = 0;
    let totalExpenses = 0;
    let totalHoursLogged = 0;
    const moodCounts: Record<string, number> = {};
    const categoryHours: Record<string, number> = {};

    relevantLogs.forEach(log => {
        // Moods
        if (log.moods && log.moods.length > 0) {
            const primaryMood = log.moods[0];
            moodCounts[primaryMood] = (moodCounts[primaryMood] || 0) + 1;
        }

        // Hours
        Object.values(log.hours || {}).forEach((catIds: any) => {
            const ids = Array.isArray(catIds) ? catIds : [catIds];
            ids.forEach(catId => {
                categoryHours[catId] = (categoryHours[catId] || 0) + 1;
                totalHoursLogged++;
            });
        });

        // Expenses
        log.expenses?.forEach(exp => {
            totalExpenses += exp.amount;
        });

        // Journals
        log.journalEntries?.forEach(entry => {
            totalJournals++;
            totalWords += entry.text.trim().split(/\s+/).length;
        });
    });

    const topMoodId = Object.keys(moodCounts).sort((a,b) => moodCounts[b] - moodCounts[a])[0];
    const topMood = state.moods.find(m => m.id === topMoodId);

    const topActivityId = Object.keys(categoryHours).sort((a,b) => categoryHours[b] - categoryHours[a])[0];
    const topActivity = state.categories.find(c => c.id === topActivityId);
    const topActivityHours = categoryHours[topActivityId] || 0;

    return {
        totalJournals,
        totalWords,
        totalExpenses,
        totalHoursLogged,
        topMood,
        topActivity,
        topActivityHours
    };
  }, [relevantLogs, state.moods, state.categories]);

  const timeFilteredData = useMemo(() => {
    // Time Distribution
    const hourCounts: Record<string, number> = {};
    let totalHours = 0;

    // Moods
    const moodCounts: Record<string, number> = {};

    // Expense Distribution
    const expenseCounts: Record<string, number> = {};
    const expenseList: Record<string, Expense[]> = {};

    relevantLogs.forEach(log => {
      // Activity
      Object.values(log.hours || {}).forEach((catIds: any) => {
        const ids = Array.isArray(catIds) ? catIds : [catIds];
        ids.forEach(catId => {
          hourCounts[catId] = (hourCounts[catId] || 0) + 1;
          totalHours++;
        });
      });

      // Moods
      if (log.moods && log.moods.length > 0) {
          const primaryMood = log.moods[0];
          moodCounts[primaryMood] = (moodCounts[primaryMood] || 0) + 1;
      }

      // Expenses
      log.expenses?.forEach(exp => {
          expenseCounts[exp.category] = (expenseCounts[exp.category] || 0) + exp.amount;
          if (!expenseList[exp.category]) expenseList[exp.category] = [];
          expenseList[exp.category].push({ ...exp, date: log.date } as any); 
      });
    });

    const hoursData = state.categories.map(cat => ({
      name: cat.label,
      value: hourCounts[cat.id] || 0,
      color: cat.color,
      percentage: totalHours > 0 ? Math.round(((hourCounts[cat.id] || 0) / totalHours) * 100) : 0
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    const expenseData = state.expenditureCategories.map(cat => ({
        id: cat.id,
        name: cat.label,
        value: expenseCounts[cat.id] || 0,
        color: cat.color,
        items: expenseList[cat.id] || []
    })).filter(d => d.value > 0).sort((a,b) => b.value - a.value);

    const moodData = state.moods.map(m => ({
        name: m.label,
        emoji: m.emoji,
        count: moodCounts[m.id] || 0,
    })).filter(d => d.count > 0).sort((a,b) => b.count - a.count);

    return { hoursData, expenseData, moodData };
  }, [relevantLogs, state.categories, state.expenditureCategories, state.moods]);

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

  const timeRangeOptions = [
    { id: 'weekly', label: 'This Week', icon: 'Calendar' },
    { id: 'monthly', label: 'This Month', icon: 'CalendarDays' },
    { id: 'customMonth', label: 'Select Month', icon: 'Calendar' },
    { id: 'prevMonth', label: 'Last Month', icon: 'History' },
    { id: 'yearly', label: 'This Year', icon: 'CalendarRange' }
  ];

  // Tooltips
  const MoodTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm animate-in zoom-in-95 duration-200">
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
        <div className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <p className="font-bold mb-2" style={{ color: categoryColor }}>{data.name}</p>
          <p style={{ color: categoryColor }}>Hours: {data.value}</p>
          <p className="text-pastel-purple/70 mt-1">({data.percentage}%)</p>
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
        <div className="bg-[#18181b] p-4 border border-pastel-purple/30 rounded-2xl shadow-2xl text-white text-xs ring-1 ring-white/5 backdrop-blur-sm animate-in zoom-in-95 duration-200">
          <p className="font-bold mb-2" style={{ color: categoryColor }}>{data.name}</p>
          <p style={{ color: categoryColor }}>₱{data.value.toLocaleString()}</p>
          <p className="text-gray-400 italic mt-2">Click for details</p>
        </div>
      );
    }
    return null;
  };

  const selectedCategoryData = selectedExpenseCategory ? timeFilteredData.expenseData.find(d => d.id === selectedExpenseCategory) : null;

  // Sorting Logic for Expenses Modal
  const sortedExpenseItems = useMemo(() => {
    if (!selectedCategoryData) return [];
    return [...selectedCategoryData.items].sort((a: any, b: any) => {
        let comparison = 0;
        if (expenseSortBy === 'date') {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            comparison = dateA - dateB;
        } else {
            comparison = a.amount - b.amount;
        }
        return expenseSortOrder === 'asc' ? comparison : -comparison;
    });
  }, [selectedCategoryData, expenseSortBy, expenseSortOrder]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative max-w-7xl mx-auto">
      
      {/* Expense Detail Modal */}
      {selectedCategoryData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setSelectedExpenseCategory(null)}>
            <div className="bg-dark-card border border-white/10 p-6 rounded-[2rem] shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex flex-col gap-4 mb-6 pb-4 border-b border-white/5">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${selectedCategoryData.color}`} />
                                {selectedCategoryData.name}
                            </h3>
                            <p className="text-xs text-gray-500 font-mono mt-1">Total: ₱{selectedCategoryData.value.toLocaleString()}</p>
                        </div>
                        <button onClick={() => setSelectedExpenseCategory(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"><X size={18}/></button>
                    </div>
                    
                    {/* Sorting Controls */}
                    <div className="flex gap-2">
                        <div className="flex-grow">
                            <CustomSelect 
                                options={[
                                    { id: 'date', label: 'Sort by Date' },
                                    { id: 'amount', label: 'Sort by Amount' }
                                ]}
                                value={expenseSortBy}
                                onChange={(val) => setExpenseSortBy(val as 'date' | 'amount')}
                                className="w-full"
                            />
                        </div>
                        <button 
                            onClick={() => setExpenseSortOrder(expenseSortOrder === 'asc' ? 'desc' : 'asc')}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 flex items-center justify-center text-gray-300 hover:bg-white/5 transition-colors"
                            title={expenseSortOrder === 'asc' ? 'Ascending' : 'Descending'}
                        >
                            <ArrowUpDown size={16} className={expenseSortOrder === 'asc' ? 'rotate-180 transition-transform' : ''} />
                        </button>
                    </div>
                </div>
                
                <div className="overflow-y-auto custom-scrollbar space-y-3 pr-2">
                {sortedExpenseItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{item.description}</p>
                      <p className="text-[10px] text-gray-500 font-mono">{item.date}</p>
                    </div>
                    <span className="text-pastel-pink font-bold text-xs">₱{item.amount.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
        </div>
      )}

      <header>
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-mint mb-2">Analytics</h2>
        <h1 className="text-4xl font-light tracking-tight">Your Life in Numbers</h1>
      </header>

      {/* KPI Cards (Dynamic based on Filter) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-purple/10 rounded-2xl text-pastel-purple"><BookOpen size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Journals</span>
            </div>
            <div>
                <span className="text-4xl font-light text-white">{kpiStats.totalJournals}</span>
                <p className="text-xs opacity-50 mt-1">{kpiStats.totalWords.toLocaleString()} words written</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-pink/10 rounded-2xl text-pastel-pink"><DollarSign size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Spent</span>
            </div>
            <div>
                <span className="text-4xl font-light text-white">₱{kpiStats.totalExpenses.toLocaleString()}</span>
                <p className="text-xs opacity-50 mt-1">Total for period</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-blue/10 rounded-2xl text-pastel-blue"><Activity size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Top Activity</span>
            </div>
            <div>
                <span className="text-2xl font-light truncate w-full block text-white">{kpiStats.topActivity?.label || "N/A"}</span>
                <p className="text-xs opacity-50 mt-1">{kpiStats.topActivityHours} hours logged</p>
            </div>
        </div>

        <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-between h-40 group hover:bg-white/5 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-3 bg-pastel-yellow/10 rounded-2xl text-pastel-yellow"><Hash size={24} /></div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Top Mood</span>
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <span className="text-4xl">{kpiStats.topMood?.emoji || "-"}</span>
                    <span className="text-xl font-light text-white">{kpiStats.topMood?.label}</span>
                </div>
                <p className="text-xs opacity-50 mt-1">Most frequent</p>
            </div>
        </div>
      </div>

      {/* Unified Analysis Dashboard */}
      <div className="bg-dark-card p-8 rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden min-h-[500px]">
         <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6 border-b border-white/5 pb-6">
            <div>
                <h3 className="text-2xl font-medium text-white mb-1">Deep Dive Analysis</h3>
                <p className="text-sm text-gray-500">Explore trends across your activities, spending, and emotions.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
                {/* Tabs */}
                <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
                    <button 
                        onClick={() => setActiveTab('activity')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'activity' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Activity
                    </button>
                    <button 
                        onClick={() => setActiveTab('expenses')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'expenses' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Expenses
                    </button>
                    <button 
                        onClick={() => setActiveTab('moods')}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'moods' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Moods
                    </button>
                </div>

                {/* Filter Group */}
                <div className="flex items-center gap-2">
                    {timeRange === 'customMonth' && (
                        <input 
                            type="month"
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-pastel-purple outline-none"
                        />
                    )}
                    <div className="w-44">
                        <CustomSelect 
                            options={timeRangeOptions}
                            value={timeRange}
                            onChange={(val) => setTimeRange(val as TimeRange)}
                        />
                    </div>
                </div>
            </div>
         </div>

         {/* Chart Content Area */}
         <div className="h-96 w-full animate-in fade-in slide-in-from-bottom-4 duration-500" key={activeTab}>
            
            {activeTab === 'activity' && (
                <div className="h-full flex flex-col">
                    <div className="flex justify-end mb-4">
                        <div className="bg-white/5 p-1 rounded-xl flex border border-white/5 w-fit">
                            <button onClick={() => setChartType('pie')} className={`p-2 rounded-lg transition-colors ${chartType === 'pie' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><PieIcon size={16}/></button>
                            <button onClick={() => setChartType('bar')} className={`p-2 rounded-lg transition-colors ${chartType === 'bar' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><BarChart3 size={16}/></button>
                            <button onClick={() => setChartType('area')} className={`p-2 rounded-lg transition-colors ${chartType === 'area' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'}`}><LineChart size={16}/></button>
                        </div>
                    </div>
                    <div className="flex-grow">
                        {timeFilteredData.hoursData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                {chartType === 'pie' ? (
                                <PieChart>
                                    <Pie
                                        data={timeFilteredData.hoursData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {timeFilteredData.hoursData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<HoursTooltip />} animationDuration={0} />
                                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }} />
                                </PieChart>
                                ) : chartType === 'bar' ? (
                                <BarChart data={timeFilteredData.hoursData}>
                                    <XAxis dataKey="name" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                                    <Tooltip content={<HoursTooltip />} animationDuration={0} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                        {timeFilteredData.hoursData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={getHex(entry.color)} />
                                        ))}
                                    </Bar>
                                </BarChart>
                                ) : (
                                <AreaChart data={timeFilteredData.hoursData}>
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
            )}

            {activeTab === 'expenses' && (
                <div className="h-full">
                    {timeFilteredData.expenseData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={timeFilteredData.expenseData}
                                onClick={(state: any) => {
                                    if (state?.activeLabel) {
                                        const selectedData = timeFilteredData.expenseData.find(d => d.name === state.activeLabel);
                                        if (selectedData) {
                                            setSelectedExpenseCategory(selectedData.id);
                                        }
                                    }
                                }}
                            >
                                <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis stroke="#71717a" fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip 
                                    content={<ExpensesTooltip />}
                                    cursor={{fill: 'rgba(255, 207, 210, 0.2)'}}
                                    animationDuration={0}
                                />
                                <Bar 
                                    dataKey="value" 
                                    radius={[4, 4, 0, 0]}
                                    style={{ cursor: 'pointer' }}
                                    onClick={(data: any) => {
                                        if (data && data.payload && data.payload.id) {
                                            setSelectedExpenseCategory(data.payload.id);
                                        }
                                    }}
                                >
                                    {timeFilteredData.expenseData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={getHex(entry.color)} style={{ cursor: 'pointer' }} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 italic font-light">
                            <p>No expenses for this period</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'moods' && (
                <div className="h-full">
                    {timeFilteredData.moodData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={timeFilteredData.moodData} layout="vertical" margin={{ left: 20 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip content={<MoodTooltip />} cursor={{fill: 'rgba(207, 186, 240, 0.1)'}} animationDuration={0} />
                                <Bar dataKey="count" fill="#cfbaf0" radius={[0, 4, 4, 0]} barSize={30}>
                                    {timeFilteredData.moodData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill="#cfbaf0" />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-600 italic font-light">
                            <p>No mood data for this period</p>
                        </div>
                    )}
                </div>
            )}

         </div>
      </div>
    </div>
  );
};

export default Statistics;