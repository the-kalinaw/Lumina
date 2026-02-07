import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { AppState, CategoryId, DayLog, Expense, Category, MoodConfig, JournalEntry, Task } from '../types';
import HourlyGrid from '../components/HourlyGrid';
import CategoryPicker from '../components/CategoryPicker';
import CustomSelect from '../components/CustomSelect';
import { Plus, Trash2, Calendar, Pencil, Save, X, Clock, ChevronDown, ChevronUp, ListTodo, Circle, CheckCircle2, Trophy, ArrowRight, Image as ImageIcon, GripVertical } from 'lucide-react';
import { playPopSound, playSuccessSound, processImage } from '../constants';

// --- Button Time Picker Component ---
interface TimeColumnProps {
  value: string;
  onIncrement: () => void;
  onDecrement: () => void;
  label?: string;
  width?: string;
}

const TimeColumn: React.FC<TimeColumnProps> = ({ value, onIncrement, onDecrement, label, width = "w-12" }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); playPopSound(); onIncrement(); }}
        className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <ChevronUp size={20} />
      </button>
      <div className={`${width} h-10 bg-white/5 border border-white/5 rounded-xl flex items-center justify-center text-xl font-bold shadow-inner`}>
        {value}
      </div>
      <button 
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); playPopSound(); onDecrement(); }}
        className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <ChevronDown size={20} />
      </button>
      {label && <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{label}</span>}
    </div>
  );
};

const GoogleStyleTimePicker: React.FC<{ value: string, onChange: (val: string) => void, onClose: () => void }> = ({ value, onChange, onClose }) => {
  const parseTime = (t: string) => {
    if (!t) return { h: 12, m: 0, p: 'PM' };
    let [hours, minutes] = t.split(':');
    let hNum = parseInt(hours);
    const p = hNum >= 12 ? 'PM' : 'AM';
    if (hNum > 12) hNum -= 12;
    if (hNum === 0) hNum = 12;
    return { h: hNum, m: parseInt(minutes), p };
  };

  const [current, setCurrent] = useState(parseTime(value));

  const updateParent = (h: number, m: number, p: string) => {
    let hours = h;
    if (p === 'PM' && hours !== 12) hours += 12;
    if (p === 'AM' && hours === 12) hours = 0;
    const timeStr = `${hours.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    onChange(timeStr);
  };

  const incHour = () => {
    let newH = current.h + 1;
    if (newH > 12) newH = 1;
    setCurrent({ ...current, h: newH });
    updateParent(newH, current.m, current.p);
  };

  const decHour = () => {
    let newH = current.h - 1;
    if (newH < 1) newH = 12;
    setCurrent({ ...current, h: newH });
    updateParent(newH, current.m, current.p);
  };

  const incMin = () => {
    let newM = current.m + 5;
    if (newM >= 60) newM = 0;
    setCurrent({ ...current, m: newM });
    updateParent(current.h, newM, current.p);
  };

  const decMin = () => {
    let newM = current.m - 5;
    if (newM < 0) newM = 55;
    setCurrent({ ...current, m: newM });
    updateParent(current.h, newM, current.p);
  };

  const togglePeriod = () => {
    const newP = current.p === 'AM' ? 'PM' : 'AM';
    setCurrent({ ...current, p: newP });
    updateParent(current.h, current.m, newP);
  };

  return (
    <div className="absolute top-full mt-2 left-0 bg-[#18181b] border border-white/10 rounded-3xl p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] z-50 w-auto min-w-[240px] animate-in slide-in-from-top-2 zoom-in-95 ring-1 ring-white/5">
      <div className="flex justify-center gap-4 items-center mb-6">
        <TimeColumn value={current.h.toString()} onIncrement={incHour} onDecrement={decHour} label="Hour" />
        <span className="text-gray-600 font-bold text-xl pb-4">:</span>
        <TimeColumn value={current.m.toString().padStart(2, '0')} onIncrement={incMin} onDecrement={decMin} label="Min" />
        <div className="w-px h-16 bg-white/5 mx-2" />
        <div className="flex flex-col items-center gap-2">
            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); playPopSound(); togglePeriod(); }} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronUp size={20} /></button>
            <div className="w-16 h-10 bg-pastel-mint/10 border border-pastel-mint/20 rounded-xl flex items-center justify-center text-sm font-bold text-pastel-mint cursor-pointer" onClick={togglePeriod}>{current.p}</div>
             <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); playPopSound(); togglePeriod(); }} className="p-1 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"><ChevronDown size={20} /></button>
            <span className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">AM/PM</span>
        </div>
      </div>
      <div className="flex justify-between items-center">
          <button onClick={() => { onChange(''); onClose(); }} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider px-2">Clear Time</button>
          <button onClick={onClose} className="text-xs bg-white text-black font-bold uppercase tracking-wider px-6 py-2 rounded-lg hover:bg-pastel-mint transition-colors shadow-lg">Done</button>
      </div>
    </div>
  );
};

// --- Main Tracker Component ---
interface TrackerProps {
  state: AppState;
  updateLog: (date: string, log: DayLog) => void;
  updateCategories: (categories: Category[]) => void;
  updateExpenditureCategories: (categories: Category[]) => void;
  updateMoods: (moods: MoodConfig[]) => void;
}

const Tracker: React.FC<TrackerProps> = ({ state, updateLog, updateCategories, updateExpenditureCategories, updateMoods }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState<CategoryId>(state.categories[0]?.id || 'sleep');
  
  // States for inline adding
  const [showMoodForm, setShowMoodForm] = useState(false);
  const [newMoodEmoji, setNewMoodEmoji] = useState('✨');
  const [newMoodLabel, setNewMoodLabel] = useState('');
  
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCatLabel, setNewCatLabel] = useState('');
  const [newCatColor, setNewCatColor] = useState('bg-pastel-purple');

  // Expense
  const [draftExpense, setDraftExpense] = useState<Partial<Expense>>({ description: '', amount: 0, category: state.expenditureCategories[0]?.id });
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);

  // Journal
  const [currentJournalText, setCurrentJournalText] = useState('');
  const [currentJournalPhotos, setCurrentJournalPhotos] = useState<string[]>([]);
  const [isUploadingJournal, setIsUploadingJournal] = useState(false);
  const [editingJournalId, setEditingJournalId] = useState<string | null>(null);
  const [showJournalList, setShowJournalList] = useState(false);

  // Planner
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const timePickerRef = useRef<HTMLDivElement>(null);

  // Custom DnD
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null); // Index of original item
  const [dropTargetIdx, setDropTargetIdx] = useState<number | null>(null); // Index where we will drop
  const [floatingPos, setFloatingPos] = useState({ x: 0, y: 0 });
  const [floatingOffset, setFloatingOffset] = useState({ x: 0, y: 0 });
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isDraggingRef = useRef(false);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);
  
  const dateInputRef = useRef<HTMLInputElement>(null);
  const selectedDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

  const currentLog = state.logs[selectedDate] || {
    date: selectedDate,
    hours: {},
    expenses: [],
    moods: [],
    journalEntries: [],
    tasks: []
  };

  const tasks = currentLog.tasks || [];

  const COLORS = [
    'bg-pastel-pink', 'bg-pastel-rose', 'bg-pastel-purple', 'bg-pastel-blue',
    'bg-pastel-cyan', 'bg-pastel-mint', 'bg-pastel-green', 'bg-pastel-yellow'
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (timePickerRef.current && !timePickerRef.current.contains(event.target as Node)) {
        setShowTimePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateChange = (newDate: string) => {
    setSearchParams({ date: newDate });
  };

  const toggleMood = (moodId: string) => {
    const moods = currentLog.moods.includes(moodId)
      ? currentLog.moods.filter(id => id !== moodId)
      : [...currentLog.moods, moodId];
    updateLog(selectedDate, { ...currentLog, moods });
  };

  const handleAddMoodInline = () => {
    if (!newMoodLabel.trim()) return;
    const newMood: MoodConfig = {
      id: `mood_${Date.now()}`,
      emoji: newMoodEmoji,
      label: newMoodLabel
    };
    updateMoods([...state.moods, newMood]);
    setShowMoodForm(false);
    setNewMoodLabel('');
    toggleMood(newMood.id);
  };

  const handleAddCategoryInline = () => {
    if (!newCatLabel.trim()) return;
    const newCat: Category = {
      id: `act_${Date.now()}`,
      label: newCatLabel,
      color: newCatColor,
      icon: 'Circle'
    };
    updateCategories([...state.categories, newCat]);
    setShowCategoryForm(false);
    setNewCatLabel('');
    setActiveCategory(newCat.id);
  };

  const handleHourChange = (hour: number, catId: CategoryId) => {
    const prevHours = currentLog.hours || {};
    const raw = prevHours[hour];
    const existing: CategoryId[] = Array.isArray(raw) ? raw.slice() : (raw ? [raw] : []);
    if (!existing.includes(catId)) {
      const newHours = { ...prevHours, [hour]: [...existing, catId] };
      updateLog(selectedDate, { ...currentLog, hours: newHours });
    }
  };

  const handleHourRemove = (hour: number, catId: CategoryId) => {
    const prevHours = currentLog.hours || {};
    const raw = prevHours[hour];
    const existing: CategoryId[] = Array.isArray(raw) ? raw.slice() : (raw ? [raw] : []);
    const filtered = existing.filter(id => id !== catId);
    const newHours = { ...prevHours };
    if (filtered.length === 0) {
      delete newHours[hour];
    } else {
      newHours[hour] = filtered;
    }
    updateLog(selectedDate, { ...currentLog, hours: newHours });
  };

  const saveExpense = () => {
    if (!draftExpense.description?.trim()) return;
    playPopSound();
    
    let newExpenses;
    if (editingExpenseId) {
      newExpenses = currentLog.expenses.map(e => 
        e.id === editingExpenseId ? { ...e, ...draftExpense } as Expense : e
      );
    } else {
      const newExpense: Expense = {
        id: Date.now().toString(),
        amount: draftExpense.amount || 0,
        category: draftExpense.category || state.expenditureCategories[0]?.id || 'other',
        description: draftExpense.description || ''
      };
      newExpenses = [newExpense, ...currentLog.expenses];
    }

    updateLog(selectedDate, { ...currentLog, expenses: newExpenses });
    setDraftExpense({ description: '', amount: 0, category: state.expenditureCategories[0]?.id });
    setEditingExpenseId(null);
  };

  const deleteExpense = (id: string) => {
    const updated = currentLog.expenses.filter(e => e.id !== id);
    updateLog(selectedDate, { ...currentLog, expenses: updated });
  };

  const editExpense = (expense: Expense) => {
    setDraftExpense(expense);
    setEditingExpenseId(expense.id);
  };

  const handleJournalPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsUploadingJournal(true);
      try {
        const base64 = await processImage(e.target.files[0]);
        setCurrentJournalPhotos(prev => [...prev, base64]);
      } catch (err) {
        console.error("Image upload failed", err);
      } finally {
        setIsUploadingJournal(false);
      }
    }
  };

  const removeJournalPhoto = (index: number) => {
    setCurrentJournalPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const saveJournalEntry = () => {
    if (!currentJournalText.trim() && currentJournalPhotos.length === 0) return;
    
    let updatedEntries;
    if (editingJournalId) {
      updatedEntries = currentLog.journalEntries.map(e => 
        e.id === editingJournalId ? { ...e, text: currentJournalText, photos: currentJournalPhotos } : e
      );
    } else {
      const newEntry: JournalEntry = {
        id: Date.now().toString(),
        text: currentJournalText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        photos: currentJournalPhotos
      };
      updatedEntries = [...currentLog.journalEntries, newEntry];
    }
    
    updateLog(selectedDate, { 
      ...currentLog, 
      journalEntries: updatedEntries 
    });
    setCurrentJournalText('');
    setCurrentJournalPhotos([]);
    setEditingJournalId(null);
  };

  const startEditJournal = (entry: JournalEntry) => {
    setCurrentJournalText(entry.text);
    setCurrentJournalPhotos(entry.photos || []);
    setEditingJournalId(entry.id);
  };

  const deleteJournalEntry = (id: string) => {
    updateLog(selectedDate, { 
      ...currentLog, 
      journalEntries: currentLog.journalEntries.filter(e => e.id !== id) 
    });
  };

  const addTask = () => {
    if (!newTaskTitle.trim()) return;
    playPopSound();
    const task: Task = {
      id: Date.now().toString(),
      title: newTaskTitle,
      time: newTaskTime,
      completed: false
    };
    const updatedTasks = [...tasks, task];
    
    updateLog(selectedDate, { ...currentLog, tasks: updatedTasks });
    setNewTaskTitle('');
  };

  const toggleTask = (taskId: string) => {
    playPopSound();
    const updatedTasks = tasks.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    );
    updateLog(selectedDate, { ...currentLog, tasks: updatedTasks });

    const allCompleted = updatedTasks.length > 0 && updatedTasks.every(t => t.completed);
    const justCompleted = updatedTasks.find(t => t.id === taskId)?.completed;
    
    if (allCompleted && justCompleted) {
        setTimeout(() => {
            setShowCelebration(true);
            playSuccessSound();
        }, 500);
    }
  };

  const deleteTask = (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    updateLog(selectedDate, { ...currentLog, tasks: updatedTasks });
  };

  // --- Drag and Drop Logic with Floating Card & Drop Indicator ---
  
  const handlePointerDown = (e: React.PointerEvent, index: number) => {
    if (!e.isPrimary) return;
    if ((e.target as HTMLElement).closest('button, input')) return;

    const element = e.currentTarget as HTMLElement;
    const rect = element.getBoundingClientRect();
    
    // Store offset so card doesn't jump to cursor center
    setFloatingOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });

    isDraggingRef.current = false;

    // Wait for long press to start drag
    longPressTimer.current = setTimeout(() => {
        isDraggingRef.current = true;
        setDraggingIdx(index);
        setDropTargetIdx(index);
        setFloatingPos({ x: e.clientX, y: e.clientY });
        element.setPointerCapture(e.pointerId);
        if (navigator.vibrate) navigator.vibrate(50);
    }, 200);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || draggingIdx === null) return;
    e.preventDefault();

    setFloatingPos({ x: e.clientX, y: e.clientY });

    // Calculate insertion index based on hover position
    // We check all item refs to see which one we are intersecting
    let newDropIndex = tasks.length; // Default to end

    for (let i = 0; i < tasks.length; i++) {
        const el = itemsRef.current[i];
        if (el) {
            const rect = el.getBoundingClientRect();
            // If overlapping vertically
            if (e.clientY >= rect.top && e.clientY <= rect.bottom) {
                // If in top half, drop before. Bottom half, drop after.
                if (e.clientY < rect.top + rect.height / 2) {
                    newDropIndex = i;
                } else {
                    newDropIndex = i + 1;
                }
                break;
            }
        }
    }
    
    // Clamp
    if (newDropIndex < 0) newDropIndex = 0;
    if (newDropIndex > tasks.length) newDropIndex = tasks.length;

    setDropTargetIdx(newDropIndex);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    
    if (isDraggingRef.current && draggingIdx !== null && dropTargetIdx !== null) {
        const element = e.currentTarget as HTMLElement;
        if (element.hasPointerCapture(e.pointerId)) {
            element.releasePointerCapture(e.pointerId);
        }

        // Reorder Logic
        if (draggingIdx !== dropTargetIdx && draggingIdx !== dropTargetIdx - 1) { // -1 check bcs if we drop after itself, index is +1 but pos is same
            const newTasks = [...tasks];
            const [item] = newTasks.splice(draggingIdx, 1);
            // Adjust drop index if we removed an item from before it
            let actualDropIdx = dropTargetIdx;
            if (draggingIdx < dropTargetIdx) actualDropIdx -= 1;
            
            newTasks.splice(actualDropIdx, 0, item);
            updateLog(selectedDate, { ...currentLog, tasks: newTasks });
        }
    }

    setDraggingIdx(null);
    setDropTargetIdx(null);
    isDraggingRef.current = false;
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m}${ampm}`;
  };

  const formattedDisplayDate = new Date(selectedDate).toLocaleDateString('en-US', { 
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' 
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 relative">
      
      {showCelebration && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-dark-card border border-white/10 p-8 rounded-[3rem] shadow-2xl flex flex-col items-center text-center space-y-6 max-w-sm mx-4 relative animate-in zoom-in-50 duration-500">
                <button onClick={() => setShowCelebration(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={20}/></button>
                <div className="w-24 h-24 bg-pastel-mint/20 rounded-full flex items-center justify-center text-pastel-mint shadow-[0_0_40px_rgba(142,236,245,0.3)]">
                    <Trophy size={48} className="animate-bounce" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold mb-2">Day Complete!</h2>
                    <p className="opacity-60 text-sm leading-relaxed">You've finished everything on your agenda. Take a moment to breathe and appreciate your progress.</p>
                </div>
                <button onClick={() => setShowCelebration(false)} className="bg-white text-black font-bold py-3 px-8 rounded-xl hover:bg-pastel-mint transition-colors w-full flex items-center justify-center gap-2">
                    Continue <ArrowRight size={16} />
                </button>
            </div>
        </div>
      )}

      {/* Floating Card Portal */}
      {draggingIdx !== null && (
        <div 
            className="fixed z-[100] pointer-events-none bg-dark-card/90 backdrop-blur border border-white/20 p-3 rounded-xl flex items-center gap-3 shadow-2xl w-[90%] max-w-[300px] left-0 top-0"
            style={{ 
                transform: `translate(${floatingPos.x - floatingOffset.x}px, ${floatingPos.y - floatingOffset.y}px) rotate(2deg)`,
                width: itemsRef.current[draggingIdx]?.clientWidth
            }}
        >
             <div className="text-pastel-mint scale-110"><Circle size={20} /></div>
             <div className="flex-grow flex flex-col">
               <span className="text-sm font-medium opacity-90">{tasks[draggingIdx].title}</span>
               {tasks[draggingIdx].time && <span className="text-[10px] text-pastel-mint font-black tracking-widest">{formatTime(tasks[draggingIdx].time)}</span>}
             </div>
             <div className="p-2 text-white"><GripVertical size={16} /></div>
        </div>
      )}

      {/* Modals */}
      {showMoodForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-dark-card border border-white/10 p-6 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative">
              <button onClick={() => setShowMoodForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
              <h3 className="text-lg font-bold mb-4 text-center">New Mood</h3>
              <div className="space-y-4">
                 <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="✨" 
                      className="w-16 h-14 text-center text-2xl bg-black/40 border border-white/10 rounded-xl outline-none focus:ring-1 focus:ring-pastel-purple"
                      value={newMoodEmoji}
                      onChange={(e) => setNewMoodEmoji(e.target.value)}
                    />
                    <input 
                      type="text" 
                      placeholder="Mood Name" 
                      className="flex-grow h-14 bg-black/40 border border-white/10 rounded-xl px-4 outline-none focus:ring-1 focus:ring-pastel-purple"
                      value={newMoodLabel}
                      onChange={(e) => setNewMoodLabel(e.target.value)}
                    />
                 </div>
                 <button onClick={handleAddMoodInline} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-pastel-purple transition-colors">Add Mood</button>
              </div>
           </div>
        </div>
      )}

      {showCategoryForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
           <div className="bg-dark-card border border-white/10 p-6 rounded-[2.5rem] shadow-2xl w-full max-w-sm relative">
              <button onClick={() => setShowCategoryForm(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
              <h3 className="text-lg font-bold mb-4 text-center">New Activity Category</h3>
              <div className="space-y-4">
                 <input 
                    type="text" 
                    placeholder="Category Name" 
                    className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 outline-none focus:ring-1 focus:ring-pastel-purple"
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                  />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 mb-2 block">Color</label>
                    <div className="flex flex-wrap gap-2">
                      {COLORS.map(color => (
                        <button 
                          key={color}
                          onClick={() => setNewCatColor(color)}
                          className={`w-8 h-8 rounded-full ${color} transition-all ${newCatColor === color ? 'ring-2 ring-white scale-110' : 'opacity-60'}`}
                        />
                      ))}
                    </div>
                  </div>
                 <button onClick={handleAddCategoryInline} className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-pastel-purple transition-colors">Create Category</button>
              </div>
           </div>
        </div>
      )}

      <header className="text-center space-y-2">
        <h1 className="text-4xl font-bold tracking-tighter">Daily Log</h1>
        <div 
          onClick={() => dateInputRef.current?.showPicker()}
          className="inline-flex items-center gap-2 cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-1.5 rounded-full border border-white/5 transition-all group"
        >
          <Calendar size={14} className="text-theme-accent" />
          <span className="opacity-60 text-sm">Currently viewing: <span className="opacity-100 font-medium">{formattedDisplayDate}</span></span>
          <input 
            ref={dateInputRef}
            type="date" 
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            className="absolute opacity-0 w-0 h-0 pointer-events-none"
          />
        </div>
      </header>

      {/* Planner Section */}
      <section className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pastel-mint/10 rounded-xl text-pastel-mint font-bold"><ListTodo size={18} /></div>
          <div>
            <h3 className="text-lg font-medium opacity-90">Daily Agenda</h3>
            <p className="text-[10px] opacity-50 uppercase tracking-widest font-black">Plan your day ahead</p>
          </div>
        </div>

        <div className="flex gap-2 items-center bg-white/5 p-2 rounded-2xl border border-white/5 relative z-20">
          <div className="relative" ref={timePickerRef}>
            <button 
                onClick={() => setShowTimePicker(!showTimePicker)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${newTaskTime ? 'bg-pastel-mint/20 text-pastel-mint' : 'bg-black/40 opacity-60 hover:opacity-100'}`}
            >
                <Clock size={16} />
                <span>{newTaskTime ? formatTime(newTaskTime) : 'Time'}</span>
            </button>
            
            {showTimePicker && (
               <GoogleStyleTimePicker 
                 value={newTaskTime} 
                 onChange={setNewTaskTime} 
                 onClose={() => setShowTimePicker(false)} 
               />
            )}
          </div>

          <input 
            type="text" 
            placeholder="What needs to be done?"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addTask()}
            className="flex-grow bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-pastel-mint placeholder-gray-600"
          />
          {newTaskTime && (
            <button 
              onClick={() => setNewTaskTime('')}
              className="p-2 rounded-xl bg-white/5 text-gray-500 hover:text-red-400 hover:bg-white/10"
              title="Clear Time"
            >
              <X size={14} />
            </button>
          )}
          <button 
            onClick={addTask} 
            disabled={!newTaskTitle.trim()}
            className="bg-white text-black p-2 rounded-xl hover:bg-pastel-mint transition-colors disabled:opacity-50"
          >
            <Plus size={18} />
          </button>
        </div>

        <div className="space-y-2 relative" onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp}>
          {(!tasks || tasks.length === 0) && (
             <div className="text-center opacity-60 py-6 italic text-xs font-light bg-black/20 rounded-2xl border border-white/5 border-dashed">
                No tasks planned yet. <br/> Start by adding a task above!
             </div>
          )}
          
          {tasks.map((task, index) => {
            const isDragging = draggingIdx === index;
            const isDropTarget = dropTargetIdx === index;
            
            return (
              <React.Fragment key={task.id}>
                  {/* Drop Indicator Line (Before) */}
                  {isDropTarget && dropTargetIdx === index && draggingIdx !== index && (
                      <div className="h-1 bg-pastel-mint rounded-full my-1 animate-in zoom-in duration-200" />
                  )}

                  <div 
                    ref={el => { itemsRef.current[index] = el; }}
                    onPointerDown={(e) => handlePointerDown(e, index)}
                    className={`
                        flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-all select-none touch-pan-y
                        ${isDragging ? 'opacity-20' : 'animate-in slide-in-from-bottom-2'}
                    `}
                  >
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleTask(task.id); }} className={`cursor-pointer transition-all duration-300 ${task.completed ? 'text-pastel-mint scale-110' : 'text-gray-600 hover:text-white'}`}>
                        {task.completed ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                    </button>
                    <div className={`flex-grow flex flex-col ${task.completed ? 'opacity-40 transition-opacity duration-300' : ''}`}>
                    <span className={`text-sm font-medium ${task.completed ? 'line-through opacity-50' : 'opacity-90'}`}>{task.title}</span>
                    {task.time && <span className="text-[10px] text-pastel-mint font-black tracking-widest">{formatTime(task.time)}</span>}
                    </div>
                    
                    {/* Grip Handle */}
                    <div className="p-2 text-gray-600 opacity-20 hover:opacity-50 cursor-grab active:cursor-grabbing">
                        <GripVertical size={16} />
                    </div>
    
                    <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); deleteTask(task.id); }} className="text-gray-600 hover:text-red-400 opacity-0 hover:opacity-100 transition-opacity p-2 cursor-pointer">
                    <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Drop Indicator Line (End of list special case) */}
                  {dropTargetIdx === tasks.length && index === tasks.length - 1 && draggingIdx !== index && (
                      <div className="h-1 bg-pastel-mint rounded-full my-1 animate-in zoom-in duration-200" />
                  )}
              </React.Fragment>
            );
          })}
        </div>
      </section>

      {/* Mood Section */}
      <section className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6 relative overflow-hidden">
        <div className="text-center space-y-1">
          <h3 className="text-2xl font-light tracking-tight">How did today feel?</h3>
          <p className="text-xs opacity-50 italic">Take this time to reflect, and understand your emotions.</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-3">
          {state.moods.map((m) => {
            const isSelected = currentLog.moods.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleMood(m.id)}
                className={`
                  relative flex flex-col items-center gap-2 group transition-all duration-300 p-3 rounded-2xl
                  ${isSelected ? 'bg-white/10 scale-105 shadow-md ring-1 ring-pastel-purple/20' : 'opacity-40 hover:opacity-100 hover:scale-105'}
                `}
              >
                <span className="text-4xl drop-shadow-lg group-active:scale-90 transition-transform">
                  {m.emoji}
                </span>
                <span className={`
                  text-[9px] font-black uppercase tracking-widest transition-all
                  ${isSelected ? 'text-pastel-purple' : 'opacity-60'}
                `}>
                  {m.label}
                </span>
              </button>
            );
          })}
          
          <button
            onClick={() => setShowMoodForm(true)}
            className="flex flex-col items-center justify-center gap-2 w-20 h-20 border border-dashed border-white/10 rounded-2xl opacity-60 hover:opacity-100 hover:border-white/30 transition-all group"
          >
            <Plus size={24} className="group-hover:rotate-90 transition-transform" />
            <span className="text-[9px] font-black uppercase tracking-widest">New</span>
          </button>
        </div>
      </section>

      {/* Activity Section */}
      <section className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 shadow-xl space-y-6">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-medium opacity-90">Activity Grid</h3>
          <span className="text-[10px] opacity-60 uppercase tracking-widest font-black">Paint your rhythm</span>
        </div>
        <CategoryPicker 
          categories={state.categories} 
          selected={activeCategory} 
          onSelect={setActiveCategory}
          onAddInline={() => setShowCategoryForm(true)}
        />
        <HourlyGrid 
          categories={state.categories} 
          hours={currentLog.hours} 
          onChange={handleHourChange} 
          onRemove={handleHourRemove}
          selectedCategory={activeCategory} 
        />
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Expenditure Section */}
        <section className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col h-fit space-y-6 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pastel-pink/10 rounded-xl text-pastel-pink font-bold text-sm">₱</div>
            <h3 className="text-lg font-medium opacity-90">Expenditure</h3>
          </div>
          
          <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 space-y-3">
            <input
              type="text"
              placeholder="Purchase description..."
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-pastel-pink"
              value={draftExpense.description}
              onChange={(e) => setDraftExpense({ ...draftExpense, description: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && saveExpense()}
            />
            <div className="flex gap-2">
              <div className="flex-grow">
                 <CustomSelect 
                    options={state.expenditureCategories}
                    value={draftExpense.category || ''}
                    onChange={(val) => setDraftExpense({...draftExpense, category: val})}
                    placeholder="Category"
                 />
              </div>
              <div className="w-24 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-[10px]">₱</span>
                <input
                  type="number"
                  placeholder="0"
                  className="w-full bg-black/40 border border-white/10 rounded-xl pl-6 pr-3 py-2.5 text-sm text-right outline-none font-mono focus:ring-1 focus:ring-pastel-pink"
                  value={draftExpense.amount || ''}
                  onChange={(e) => setDraftExpense({ ...draftExpense, amount: parseFloat(e.target.value) })}
                  onKeyDown={(e) => e.key === 'Enter' && saveExpense()}
                />
              </div>
            </div>
            <button 
              onClick={saveExpense}
              disabled={!draftExpense.description?.trim()}
              className="w-full bg-pastel-pink text-pink-950 font-bold py-2 rounded-xl text-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {editingExpenseId ? <Save size={14} /> : <Plus size={14} />} 
              {editingExpenseId ? 'Update' : 'Confirm'}
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
            {currentLog.expenses.length === 0 && (
              <div className="text-center opacity-60 py-6 italic font-light text-xs">No transactions</div>
            )}
            {currentLog.expenses.map((expense) => (
              <div key={expense.id} className="group flex flex-col gap-1 bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-all relative">
                <div className="flex items-start justify-between">
                  <div className="max-w-[70%]">
                    <h4 className="opacity-90 text-xs font-medium truncate">{expense.description}</h4>
                    <span className="text-[9px] opacity-60 font-black uppercase tracking-widest">
                      {state.expenditureCategories.find(c => c.id === expense.category)?.label || 'Other'}
                    </span>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <span className="text-pastel-pink font-bold text-xs">₱{expense.amount.toLocaleString()}</span>
                    <div className="flex gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => editExpense(expense)} className="p-1 opacity-50 hover:opacity-100"><Pencil size={12} /></button>
                      <button onClick={() => deleteExpense(expense.id)} className="p-1 opacity-50 hover:text-red-400 hover:opacity-100"><Trash2 size={12} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Journal Section */}
        <section className="bg-dark-card p-8 rounded-[2.5rem] border border-white/5 flex flex-col space-y-6 shadow-xl h-fit">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-pastel-blue/10 rounded-xl text-pastel-blue font-bold"><Clock size={18} /></div>
            <h3 className="text-lg font-medium opacity-90">Daily Journal</h3>
          </div>

          <div className="space-y-4">
            <textarea
              className="w-full h-24 bg-white/5 placeholder-gray-500 rounded-2xl p-4 outline-none focus:ring-1 focus:ring-pastel-purple border border-white/5 transition-all resize-none text-sm font-light leading-relaxed"
              placeholder={editingJournalId ? "Update your thought..." : "Record a moment..."}
              value={currentJournalText}
              onChange={(e) => setCurrentJournalText(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && e.ctrlKey) saveJournalEntry(); }}
            />
            
            {/* Journal Photo Upload */}
            <div className="flex flex-wrap gap-2">
               {currentJournalPhotos.map((photo, idx) => (
                 <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden group border border-white/10">
                   <img src={photo} alt="Journal" className="w-full h-full object-cover" />
                   <button onClick={() => removeJournalPhoto(idx)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} />
                   </button>
                 </div>
               ))}
               <label className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:bg-white/5 transition-colors opacity-50 hover:opacity-100">
                 <ImageIcon size={20} />
                 <input type="file" accept="image/*" className="hidden" onChange={handleJournalPhotoUpload} disabled={isUploadingJournal} />
               </label>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={saveJournalEntry}
                disabled={!currentJournalText.trim() && currentJournalPhotos.length === 0}
                className="flex-grow bg-white text-black font-bold py-2 rounded-xl text-sm hover:bg-pastel-purple transition-all flex items-center justify-center gap-2 disabled:opacity-30"
              >
                <Save size={16} /> {editingJournalId ? 'Update' : 'Save'} Entry
              </button>
              {editingJournalId && (
                <button onClick={() => { setEditingJournalId(null); setCurrentJournalText(''); setCurrentJournalPhotos([]); }} className="bg-white/5 text-gray-500 p-2 rounded-xl hover:text-white"><X size={18} /></button>
              )}
            </div>
          </div>

          <div className="pt-2">
            <button 
              onClick={() => setShowJournalList(!showJournalList)}
              className="w-full flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-widest opacity-60 hover:opacity-100 bg-white/5 rounded-xl transition-all"
            >
              {showJournalList ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {showJournalList ? 'Hide Journals' : `View ${currentLog.journalEntries.length} Journals`}
            </button>
            
            {showJournalList && (
              <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                {currentLog.journalEntries.length === 0 ? (
                   <div className="text-center opacity-60 py-4 italic text-xs font-light">No entries recorded today.</div>
                ) : (
                  currentLog.journalEntries.map((entry) => (
                    <div key={entry.id} className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-2 relative group">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-pastel-blue">
                        <div className="flex items-center gap-1.5"><Clock size={10} /> {entry.timestamp}</div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => startEditJournal(entry)} className="text-gray-500 hover:text-white"><Pencil size={10} /></button>
                          <button onClick={() => deleteJournalEntry(entry.id)} className="text-red-400/50 hover:text-red-400"><Trash2 size={10} /></button>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed font-light whitespace-pre-wrap">{entry.text}</p>
                      {entry.photos && entry.photos.length > 0 && (
                        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                          {entry.photos.map((p, i) => (
                             <img key={i} src={p} className="h-20 w-auto rounded-lg border border-white/5" />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Tracker;