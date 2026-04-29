import React, { useState, useEffect } from 'react';
import { AppState, CategoryId, DayLog, Expense, Category, MoodConfig, JournalEntry, Task, StreakData } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Circle, CheckCircle2, Image as ImageIcon, Flame, Sparkles, X } from 'lucide-react';
import { playPopSound, playSuccessSound, processImage } from '../constants';
import { format, differenceInDays, parseISO } from 'date-fns';

interface TodayProps {
  state: AppState;
  updateLog: (date: string, log: DayLog) => void;
  updateStreaks: (streaks: StreakData) => void;
}

const Today: React.FC<TodayProps> = ({ state, updateLog, updateStreaks }) => {
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  
  const currentLog: DayLog = state.logs[todayStr] || {
    date: todayStr,
    hours: {},
    activities: [],
    expenses: [],
    moods: [],
    journalEntries: [],
    tasks: []
  };

  // Journal state
  const [journalText, setJournalText] = useState('');
  const [journalPhotos, setJournalPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);

  // Collapsible sections
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [expensesExpanded, setExpensesExpanded] = useState(false);

  // Task state
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Expense state
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState(state.expenditureCategories[0]?.id || '');
  const [expenseDescription, setExpenseDescription] = useState('');

  // Celebration
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');

  // Calculate streak
  const streaks = state.streaks || { currentStreak: 0, longestStreak: 0, lastLogDate: '' };

  // Check if day has any logged content
  const hasLoggedToday = (log: DayLog): boolean => {
    return (
      log.moods.length > 0 ||
      (log.activities?.length || 0) > 0 ||
      log.journalEntries.length > 0
    );
  };

  // Update streak on mount and when log changes
  useEffect(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const lastLog = streaks.lastLogDate;
    
    if (hasLoggedToday(currentLog) && lastLog !== today) {
      const daysSinceLast = lastLog ? differenceInDays(parseISO(today), parseISO(lastLog)) : 999;
      
      let newStreak = streaks.currentStreak;
      if (daysSinceLast === 1) {
        // Consecutive day
        newStreak = streaks.currentStreak + 1;
      } else if (daysSinceLast > 1) {
        // Streak broken
        newStreak = 1;
      } else if (daysSinceLast === 0) {
        // Same day, don't change
        return;
      }

      const newLongest = Math.max(newStreak, streaks.longestStreak);
      
      updateStreaks({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLogDate: today
      });

      // Celebrate milestones
      if ([7, 14, 30, 50, 100].includes(newStreak)) {
        setCelebrationMessage(`${newStreak} day streak!`);
        setShowCelebration(true);
        playSuccessSound();
      }
    }
  }, [currentLog.moods, currentLog.activities, currentLog.journalEntries]);

  // Weekly consistency calculation
  const getWeeklyConsistency = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = format(date, 'yyyy-MM-dd');
      const log = state.logs[dateStr];
      days.push({
        date: dateStr,
        logged: log ? hasLoggedToday(log) : false,
        dayName: format(date, 'EEEEE') // Single letter day
      });
    }
    return days;
  };

  const weeklyData = getWeeklyConsistency();
  const daysLogged = weeklyData.filter(d => d.logged).length;

  // Mood selection
  const toggleMood = (moodId: string) => {
    playPopSound();
    const moods = currentLog.moods.includes(moodId)
      ? currentLog.moods.filter(id => id !== moodId)
      : [...currentLog.moods, moodId];
    updateLog(todayStr, { ...currentLog, moods });
  };

  // Activity selection
  const toggleActivity = (actId: CategoryId) => {
    playPopSound();
    const activities = currentLog.activities || [];
    const newActivities = activities.includes(actId)
      ? activities.filter(id => id !== actId)
      : [...activities, actId];
    updateLog(todayStr, { ...currentLog, activities: newActivities });
  };

  // Journal
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploading(true);
      try {
        const base64 = await processImage(e.target.files[0]);
        setJournalPhotos(prev => [...prev, base64]);
      } catch (err) {
        console.error("Image upload failed", err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removePhoto = (index: number) => {
    setJournalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const saveJournalEntry = () => {
    if (!journalText.trim() && journalPhotos.length === 0) return;
    playPopSound();
    
    let updatedEntries;
    if (editingJournalId) {
      updatedEntries = currentLog.journalEntries.map(e => 
        e.id === editingJournalId ? { ...e, text: journalText, photos: journalPhotos } : e
      );
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: journalText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        photos: journalPhotos
      };
      updatedEntries = [...currentLog.journalEntries, newEntry];
    }
    
    updateLog(todayStr, { ...currentLog, journalEntries: updatedEntries });
    setJournalText('');
    setJournalPhotos([]);
    setEditingJournalId(null);
  };

  const editJournalEntry = (entry: JournalEntry) => {
    setJournalText(entry.text);
    setJournalPhotos(entry.photos || []);
    setEditingJournalId(entry.id);
  };

  const deleteJournalEntry = (id: string) => {
    updateLog(todayStr, { 
      ...currentLog, 
      journalEntries: currentLog.journalEntries.filter(e => e.id !== id) 
    });
  };

  // Tasks
  const tasks = currentLog.tasks || [];
  
  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    playPopSound();
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      time: '',
      completed: false
    };
    updateLog(todayStr, { ...currentLog, tasks: [...tasks, task] });
    setNewTaskTitle('');
  };

  const toggleTask = (taskId: string) => {
    playPopSound();
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateLog(todayStr, { ...currentLog, tasks: updatedTasks });

    const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
    const justCompleted = updatedTasks.find(t => t.id === taskId)?.completed;
    
    if (allCompleted && justCompleted) {
      setTimeout(() => {
        setCelebrationMessage('All tasks done!');
        setShowCelebration(true);
        playSuccessSound();
      }, 300);
    }
  };

  const deleteTask = (taskId: string) => {
    updateLog(todayStr, { ...currentLog, tasks: tasks.filter(t => t.id !== taskId) });
  };

  // Expenses
  const addExpense = () => {
    if (!expenseAmount || parseFloat(expenseAmount) <= 0) return;
    playPopSound();
    const expense: Expense = {
      id: Date.now().toString(),
      amount: parseFloat(expenseAmount),
      category: expenseCategory || state.expenditureCategories[0]?.id || 'other',
      description: expenseDescription
    };
    updateLog(todayStr, { ...currentLog, expenses: [expense, ...currentLog.expenses] });
    setExpenseAmount('');
    setExpenseDescription('');
  };

  const deleteExpense = (id: string) => {
    updateLog(todayStr, { ...currentLog, expenses: currentLog.expenses.filter(e => e.id !== id) });
  };

  const totalExpenses = currentLog.expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="max-w-2xl mx-auto pb-20">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setShowCelebration(false)}
        >
          <div className="bg-gradient-to-br from-pastel-purple/20 to-pastel-pink/20 border border-white/10 rounded-[3rem] p-12 text-center animate-in zoom-in-95 duration-500">
            <div className="text-6xl mb-4 animate-bounce">
              <Sparkles className="inline text-pastel-yellow" size={64} />
            </div>
            <h2 className="text-3xl font-black mb-2">{celebrationMessage}</h2>
            <p className="text-gray-400 text-sm">Keep up the amazing work!</p>
          </div>
        </div>
      )}

      {/* Header with Date & Streak */}
      <div className="mb-8">
        <h1 className="text-3xl font-black mb-2">
          {format(new Date(), 'EEEE')}
          <span className="text-gray-500 font-normal ml-2 text-xl">
            {format(new Date(), 'MMMM d')}
          </span>
        </h1>
        
        {/* Streak & Weekly Ring */}
        <div className="flex items-center gap-6 mt-4">
          {/* Streak Counter */}
          <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl px-4 py-2">
            <Flame className={`${streaks.currentStreak > 0 ? 'text-orange-400' : 'text-gray-500'}`} size={20} />
            <span className="font-black text-lg">{streaks.currentStreak}</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider">day streak</span>
          </div>

          {/* Weekly Ring */}
          <div className="flex items-center gap-1">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center text-[10px] font-bold
                    ${day.logged 
                      ? 'bg-pastel-purple border-pastel-purple text-black' 
                      : 'border-gray-700 text-gray-600'
                    }
                    ${day.date === todayStr ? 'ring-2 ring-pastel-purple/50 ring-offset-2 ring-offset-[#09090b]' : ''}
                  `}
                >
                  {day.logged && '✓'}
                </div>
                <span className="text-[9px] text-gray-500">{day.dayName}</span>
              </div>
            ))}
          </div>
          <span className="text-xs text-gray-500">{daysLogged}/7</span>
        </div>
      </div>

      {/* Mood Selection */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
          How are you feeling?
        </h2>
        <div className="flex flex-wrap gap-3">
          {state.moods.map(mood => {
            const isSelected = currentLog.moods.includes(mood.id);
            return (
              <button
                key={mood.id}
                onClick={() => toggleMood(mood.id)}
                className={`
                  flex items-center gap-2 px-5 py-3 rounded-2xl text-base transition-all duration-200 
                  ${isSelected 
                    ? 'bg-pastel-purple text-black scale-105 shadow-[0_0_20px_rgba(207,186,240,0.4)]' 
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                  }
                `}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span className="font-medium">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Activity Pills */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
          What did you do today?
        </h2>
        <div className="flex flex-wrap gap-2">
          {state.categories.map(cat => {
            const isSelected = (currentLog.activities || []).includes(cat.id);
            return (
              <button
                key={cat.id}
                onClick={() => toggleActivity(cat.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all duration-200
                  ${isSelected 
                    ? `${cat.color} text-black font-semibold scale-105` 
                    : 'bg-white/5 hover:bg-white/10 border border-white/5'
                  }
                `}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Journal - Prominent */}
      <section className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-4">
          Journal
        </h2>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Write about your day..."
            className="w-full bg-transparent resize-none focus:outline-none text-base placeholder-gray-600 min-h-[120px]"
          />
          
          {/* Photo Preview */}
          {journalPhotos.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4 mb-4">
              {journalPhotos.map((photo, i) => (
                <div key={i} className="relative group">
                  <img src={photo} alt="" className="w-20 h-20 object-cover rounded-xl" />
                  <button
                    onClick={() => removePhoto(i)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
            <label className="cursor-pointer flex items-center gap-2 text-gray-500 hover:text-gray-300 transition-colors">
              <ImageIcon size={18} />
              <span className="text-xs uppercase tracking-wider">
                {isUploading ? 'Uploading...' : 'Add Photo'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
            </label>
            <button
              onClick={saveJournalEntry}
              disabled={!journalText.trim() && journalPhotos.length === 0}
              className="px-6 py-2 bg-pastel-purple text-black font-bold text-xs uppercase tracking-wider rounded-xl disabled:opacity-30 hover:bg-pastel-pink transition-colors"
            >
              {editingJournalId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>

        {/* Journal Entries */}
        {currentLog.journalEntries.length > 0 && (
          <div className="mt-4 space-y-3">
            {currentLog.journalEntries.map(entry => (
              <div key={entry.id} className="bg-white/5 border border-white/5 rounded-2xl p-4 group">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500">{entry.timestamp}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-2 transition-opacity">
                    <button onClick={() => editJournalEntry(entry)} className="text-gray-500 hover:text-white text-xs">Edit</button>
                    <button onClick={() => deleteJournalEntry(entry.id)} className="text-red-400 hover:text-red-300 text-xs">Delete</button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{entry.text}</p>
                {entry.photos && entry.photos.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {entry.photos.map((photo, i) => (
                      <img key={i} src={photo} alt="" className="w-16 h-16 object-cover rounded-lg" />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasks - Collapsible */}
      <section className="mb-6">
        <button
          onClick={() => setTasksExpanded(!tasksExpanded)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              Tasks
            </h2>
            {tasks.length > 0 && (
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                {tasks.filter(t => t.completed).length}/{tasks.length}
              </span>
            )}
          </div>
          {tasksExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>
        
        {tasksExpanded && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
            {/* Add Task */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTask()}
                placeholder="Add a task..."
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pastel-purple/50"
              />
              <button
                onClick={addTask}
                disabled={!newTaskTitle.trim()}
                className="px-4 py-2 bg-pastel-purple text-black rounded-xl disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </div>
            
            {/* Task List */}
            <div className="space-y-2">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all group ${task.completed ? 'bg-pastel-green/10' : 'bg-white/5'}`}
                >
                  <button onClick={() => toggleTask(task.id)} className="flex-shrink-0">
                    {task.completed 
                      ? <CheckCircle2 className="text-pastel-green" size={22} />
                      : <Circle className="text-gray-500" size={22} />
                    }
                  </button>
                  <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : ''}`}>
                    {task.title}
                  </span>
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No tasks for today</p>
              )}
            </div>
          </div>
        )}
      </section>

      {/* Expenses - Collapsible */}
      <section className="mb-6">
        <button
          onClick={() => setExpensesExpanded(!expensesExpanded)}
          className="w-full flex items-center justify-between py-3 text-left"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
              Spending
            </h2>
            {currentLog.expenses.length > 0 && (
              <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs">
                ₱{totalExpenses.toLocaleString()}
              </span>
            )}
          </div>
          {expensesExpanded ? <ChevronUp size={18} className="text-gray-500" /> : <ChevronDown size={18} className="text-gray-500" />}
        </button>
        
        {expensesExpanded && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 animate-in slide-in-from-top-2 duration-200">
            {/* Quick Add */}
            <div className="flex flex-wrap gap-2 mb-4">
              {state.expenditureCategories.slice(0, 6).map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setExpenseCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs transition-all ${
                    expenseCategory === cat.id 
                      ? `${cat.color} text-black font-bold` 
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="number"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder="₱ Amount"
                className="w-28 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pastel-purple/50"
              />
              <input
                type="text"
                value={expenseDescription}
                onChange={(e) => setExpenseDescription(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                placeholder="Description (optional)"
                className="flex-1 bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-pastel-purple/50"
              />
              <button
                onClick={addExpense}
                disabled={!expenseAmount || parseFloat(expenseAmount) <= 0}
                className="px-4 py-2 bg-pastel-purple text-black rounded-xl disabled:opacity-30"
              >
                <Plus size={18} />
              </button>
            </div>

            {/* Expense List */}
            <div className="space-y-2">
              {currentLog.expenses.map(expense => {
                const cat = state.expenditureCategories.find(c => c.id === expense.category);
                return (
                  <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${cat?.color || 'bg-gray-500'}`} />
                      <div>
                        <span className="text-sm font-medium">₱{expense.amount.toLocaleString()}</span>
                        {expense.description && (
                          <span className="text-gray-500 text-sm ml-2">{expense.description}</span>
                        )}
                      </div>
                    </div>
                    <button 
                      onClick={() => deleteExpense(expense.id)}
                      className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
              {currentLog.expenses.length === 0 && (
                <p className="text-center text-gray-500 text-sm py-4">No expenses logged</p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Today;
