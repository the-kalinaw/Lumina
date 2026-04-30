import React, { useState, useEffect } from 'react';
import { AppState, CategoryId, DayLog, Expense, JournalEntry, Task, StreakData } from '../types';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Image as ImageIcon, Flame, X } from 'lucide-react';
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
        newStreak = streaks.currentStreak + 1;
      } else if (daysSinceLast > 1) {
        newStreak = 1;
      } else if (daysSinceLast === 0) {
        return;
      }

      const newLongest = Math.max(newStreak, streaks.longestStreak);
      
      updateStreaks({
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastLogDate: today
      });

      if ([7, 14, 30, 50, 100].includes(newStreak)) {
        setCelebrationMessage(`${newStreak} day streak`);
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
        dayName: format(date, 'EEE')
      });
    }
    return days;
  };

  const weeklyData = getWeeklyConsistency();
  const daysLogged = weeklyData.filter(d => d.logged).length;

  // Mood selection
  const selectMood = (moodId: string) => {
    playPopSound();
    // Single mood selection for simplicity (like Daylio)
    const moods = currentLog.moods.includes(moodId) ? [] : [moodId];
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
        setCelebrationMessage('All tasks done');
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
  const selectedMood = state.moods.find(m => currentLog.moods.includes(m.id));

  return (
    <div className="min-h-screen pb-24">
      {/* Celebration Overlay */}
      {showCelebration && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={() => setShowCelebration(false)}
        >
          <div className="text-center animate-in zoom-in-95 fade-in duration-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
              <Flame className="text-white" size={36} />
            </div>
            <h2 className="text-4xl font-bold mb-2 text-white">{celebrationMessage}</h2>
            <p className="text-gray-400">Keep going, you&apos;re doing great</p>
          </div>
        </div>
      )}

      {/* Minimal Header */}
      <header className="pt-8 pb-12 text-center">
        <p className="text-sm text-gray-500 mb-1">{format(new Date(), 'EEEE')}</p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {format(new Date(), 'MMMM d')}
        </h1>
        
        {/* Streak - subtle */}
        {streaks.currentStreak > 0 && (
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-white/5">
            <Flame className="text-amber-400" size={16} />
            <span className="text-sm text-gray-300">{streaks.currentStreak} day streak</span>
          </div>
        )}
      </header>

      <div className="max-w-lg mx-auto px-4 space-y-12">
        
        {/* Mood Selection - Large, centered like Daylio */}
        <section className="text-center">
          <p className="text-sm text-gray-500 mb-6">How are you?</p>
          <div className="flex justify-center gap-4">
            {state.moods.map(mood => {
              const isSelected = currentLog.moods.includes(mood.id);
              return (
                <button
                  key={mood.id}
                  onClick={() => selectMood(mood.id)}
                  className={`
                    flex flex-col items-center gap-2 p-4 rounded-2xl transition-all duration-300
                    ${isSelected 
                      ? 'bg-white/10 scale-110 ring-2 ring-white/20' 
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <span className={`text-4xl transition-transform duration-300 ${isSelected ? 'scale-110' : ''}`}>
                    {mood.emoji}
                  </span>
                  <span className={`text-xs transition-colors ${isSelected ? 'text-white' : 'text-gray-500'}`}>
                    {mood.label}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Activities - Clean pills */}
        <section>
          <p className="text-sm text-gray-500 mb-4 text-center">What have you been up to?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {state.categories.map(cat => {
              const isSelected = (currentLog.activities || []).includes(cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => toggleActivity(cat.id)}
                  className={`
                    px-4 py-2 rounded-full text-sm transition-all duration-200
                    ${isSelected 
                      ? 'bg-white/15 text-white ring-1 ring-white/20' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300'
                    }
                  `}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* Journal - Clean writing space */}
        <section>
          <div className="bg-white/[0.03] rounded-3xl p-6 border border-white/5">
            <textarea
              value={journalText}
              onChange={(e) => setJournalText(e.target.value)}
              placeholder="Write something..."
              className="w-full bg-transparent resize-none focus:outline-none text-base placeholder-gray-600 min-h-[140px] leading-relaxed"
            />
            
            {/* Photo Preview */}
            {journalPhotos.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-white/5">
                {journalPhotos.map((photo, i) => (
                  <div key={i} className="relative group">
                    <img src={photo} alt="" className="w-20 h-20 object-cover rounded-xl" />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <label className="cursor-pointer p-2 rounded-xl hover:bg-white/5 transition-colors">
                <ImageIcon size={20} className={isUploading ? 'text-gray-600' : 'text-gray-500'} />
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
                className="px-5 py-2 bg-white/10 text-white text-sm rounded-full disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/15 transition-colors"
              >
                {editingJournalId ? 'Update' : 'Save'}
              </button>
            </div>
          </div>

          {/* Journal Entries */}
          {currentLog.journalEntries.length > 0 && (
            <div className="mt-6 space-y-4">
              {currentLog.journalEntries.map(entry => (
                <div key={entry.id} className="bg-white/[0.02] rounded-2xl p-5 group border border-white/5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs text-gray-500">{entry.timestamp}</span>
                    <div className="opacity-0 group-hover:opacity-100 flex gap-3 transition-opacity">
                      <button onClick={() => editJournalEntry(entry)} className="text-gray-500 hover:text-white text-xs">Edit</button>
                      <button onClick={() => deleteJournalEntry(entry.id)} className="text-gray-500 hover:text-red-400 text-xs">Delete</button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-gray-300">{entry.text}</p>
                  {entry.photos && entry.photos.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {entry.photos.map((photo, i) => (
                        <img key={i} src={photo} alt="" className="w-20 h-20 object-cover rounded-xl" />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Weekly Overview - Subtle */}
        <section className="py-6 border-t border-white/5">
          <div className="flex justify-between items-center">
            {weeklyData.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <span className="text-[10px] text-gray-500 uppercase">{day.dayName}</span>
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all
                    ${day.logged 
                      ? 'bg-white/10' 
                      : 'bg-transparent border border-white/10'
                    }
                    ${day.date === todayStr ? 'ring-2 ring-white/20 ring-offset-2 ring-offset-[#09090b]' : ''}
                  `}
                >
                  {day.logged && <Check size={14} className="text-white/70" />}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-500 mt-4">{daysLogged} of 7 days logged</p>
        </section>

        {/* Optional Sections - Collapsible */}
        <div className="space-y-2 border-t border-white/5 pt-6">
          
          {/* Tasks */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setTasksExpanded(!tasksExpanded)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Tasks</span>
                {tasks.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {tasks.filter(t => t.completed).length}/{tasks.length}
                  </span>
                )}
              </div>
              {tasksExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            
            {tasksExpanded && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addTask()}
                    placeholder="Add task..."
                    className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600"
                  />
                  <button
                    onClick={addTask}
                    disabled={!newTaskTitle.trim()}
                    className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-30 hover:bg-white/15 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                
                <div className="space-y-1">
                  {tasks.map(task => (
                    <div 
                      key={task.id} 
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 group transition-colors"
                    >
                      <button 
                        onClick={() => toggleTask(task.id)} 
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                          ${task.completed 
                            ? 'bg-white/20 border-white/20' 
                            : 'border-gray-600 hover:border-gray-400'
                          }
                        `}
                      >
                        {task.completed && <Check size={12} className="text-white" />}
                      </button>
                      <span className={`flex-1 text-sm ${task.completed ? 'line-through text-gray-500' : 'text-gray-300'}`}>
                        {task.title}
                      </span>
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      >
                        <Trash2 size={14} className="text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Spending */}
          <div className="bg-white/[0.02] rounded-2xl border border-white/5 overflow-hidden">
            <button
              onClick={() => setExpensesExpanded(!expensesExpanded)}
              className="w-full flex items-center justify-between p-4"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-400">Spending</span>
                {currentLog.expenses.length > 0 && (
                  <span className="text-xs text-gray-500">P{totalExpenses.toLocaleString()}</span>
                )}
              </div>
              {expensesExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
            </button>
            
            {expensesExpanded && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-1 duration-150">
                {/* Category chips */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {state.expenditureCategories.slice(0, 6).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setExpenseCategory(cat.id)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                        expenseCategory === cat.id 
                          ? 'bg-white/15 text-white' 
                          : 'bg-white/5 text-gray-500 hover:bg-white/10'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0"
                    className="w-24 bg-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600"
                  />
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addExpense()}
                    placeholder="Note (optional)"
                    className="flex-1 bg-white/5 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder-gray-600"
                  />
                  <button
                    onClick={addExpense}
                    disabled={!expenseAmount || parseFloat(expenseAmount) <= 0}
                    className="px-4 py-2 bg-white/10 rounded-xl disabled:opacity-30 hover:bg-white/15 transition-colors"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="space-y-1">
                  {currentLog.expenses.map(expense => {
                    const cat = state.expenditureCategories.find(c => c.id === expense.category);
                    return (
                      <div key={expense.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-300">P{expense.amount.toLocaleString()}</span>
                          {expense.description && (
                            <span className="text-xs text-gray-500">{expense.description}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">{cat?.label}</span>
                          <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                          >
                            <Trash2 size={14} className="text-gray-500" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Today;
