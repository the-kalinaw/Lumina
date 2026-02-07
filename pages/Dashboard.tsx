import React, { useState, useMemo } from 'react';
import { AppState, DayLog } from '../types';
import { Sparkles, Calendar, ArrowRight, Activity, BarChart3, ListTodo, Circle, CheckCircle2 } from 'lucide-react';

interface DashboardProps {
  state: AppState;
  onNavigate: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ state, onNavigate }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const todayLog = state.logs[todayStr];
  
  const pendingTasks = todayLog?.tasks?.filter(t => !t.completed).length || 0;

  const formatTime = (time24: string) => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
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
      <section className="space-y-6">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-purple mb-2">Daily Focus</h2>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-gray-500 font-medium uppercase tracking-widest text-xs">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
        </div>

        {/* Daily Focus - Top Row: Tracker Button + Mood */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => onNavigate('tracker')}
            className="group bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-pastel-purple/50 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-64 shadow-2xl active:scale-95 duration-200"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <Calendar size={120} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-pastel-purple mb-4">
                <Sparkles size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">Priority Task</span>
              </div>
              <h3 className="text-3xl font-light text-white leading-tight">Record your day's journey</h3>
            </div>
            <div className="flex items-center gap-2 text-gray-500 group-hover:text-white transition-colors">
              <span className="font-medium">Open Daily Tracker</span>
              <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
            </div>
          </div>

          {/* Mood Card */}
          <div className="bg-dark-card p-6 rounded-[2rem] border border-white/5 flex flex-col justify-center">
             <div className="flex justify-between items-center mb-2">
               <div className="flex items-center gap-2 text-pastel-green">
                  <Activity size={16} />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Mood</span>
               </div>
               <span className="text-[10px] text-gray-600 font-black uppercase tracking-widest">Today</span>
             </div>
             <div className="flex gap-2 text-3xl overflow-x-auto pb-1 scrollbar-hide">
                {todayLog?.moods?.length ? todayLog.moods.map(id => (
                  <span key={id} className="drop-shadow-lg hover:scale-125 transition-transform cursor-default">{state.moods.find(m => m.id === id)?.emoji || '✨'}</span>
                )) : <span className="text-gray-700 italic text-sm font-light">Not logged yet</span>}
             </div>
          </div>
        </div>

        {/* Daily Focus - Daily Tasks Card */}
        <div className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:border-pastel-mint/30 transition-all">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-pastel-mint/10 rounded-xl text-pastel-mint font-bold"><ListTodo size={18} /></div>
            <div>
              <h3 className="text-lg font-medium opacity-90">Daily Tasks</h3>
              <p className="text-xs opacity-50 text-pastel-mint/70">{pendingTasks} pending • {(todayLog?.tasks?.filter(t => t.completed).length || 0)} completed</p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {(!todayLog?.tasks || todayLog.tasks.length === 0) ? (
              <div className="text-center opacity-60 py-8 italic text-sm font-light bg-black/20 rounded-2xl border border-white/5 border-dashed">
                <p>No tasks yet. Head to the Tracker to start planning!</p>
                <button 
                  onClick={() => onNavigate('tracker')} 
                  className="mt-3 text-xs font-bold uppercase tracking-widest text-pastel-mint hover:underline"
                >
                  Open Tracker →
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
                  <button 
                    onClick={() => onNavigate('tracker')}
                    className="text-gray-600 hover:text-pastel-mint opacity-0 group-hover:opacity-100 transition-opacity p-1"
                    title="Edit in Tracker"
                  >
                    <ArrowRight size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
          
          <button 
            onClick={() => onNavigate('tracker')}
            className="w-full mt-6 py-3 bg-gradient-to-r from-pastel-mint/10 to-pastel-mint/5 hover:from-pastel-mint/20 hover:to-pastel-mint/10 border border-pastel-mint/30 rounded-xl text-xs font-bold uppercase tracking-widest text-pastel-mint transition-all"
          >
            Manage All Tasks →
          </button>
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-pastel-blue mb-2">Summary Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Statistics Button */}
          <div 
            onClick={() => onNavigate('statistics')}
            className="group bg-gradient-to-br from-white/10 to-white/5 p-8 rounded-[2.5rem] border border-white/10 hover:border-pastel-blue/50 transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between h-64 shadow-2xl active:scale-95 duration-200"
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
            <div className="text-4xl font-light text-white">₱ {
              (Object.values(state.logs) as DayLog[]).reduce((total, log) => 
                total + (log.expenses?.reduce((acc, curr) => acc + curr.amount, 0) || 0)
              , 0).toLocaleString()
            }</div>
          </div>

          {/* Journal Database */}
          <div 
            onClick={() => onNavigate('database')}
            className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 hover:bg-white/5 transition-all cursor-pointer group active:scale-95 duration-200"
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