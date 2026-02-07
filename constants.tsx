import { Category, HighlightCategory, MoodConfig } from './types';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'sleep', label: 'Sleep', color: 'bg-pastel-purple', icon: 'Moon' },
  { id: 'work', label: 'Work/School', color: 'bg-pastel-blue', icon: 'Briefcase' },
  { id: 'leisure', label: 'Leisure', color: 'bg-pastel-yellow', icon: 'Film' },
  { id: 'social', label: 'Social', color: 'bg-pastel-pink', icon: 'Users' },
  { id: 'transit', label: 'Transit', color: 'bg-pastel-mint', icon: 'Plane' },
];

export const DEFAULT_EXPENDITURE_CATEGORIES: Category[] = [
  { id: 'food', label: 'Food & Dining', color: 'bg-pastel-green', icon: 'Utensils' },
  { id: 'transpo', label: 'Transport', color: 'bg-pastel-blue', icon: 'Car' },
  { id: 'shopping', label: 'Shopping', color: 'bg-pastel-pink', icon: 'ShoppingBag' },
  { id: 'bills', label: 'Bills & Utilities', color: 'bg-pastel-purple', icon: 'Receipt' },
  { id: 'health', label: 'Health', color: 'bg-pastel-rose', icon: 'HeartPulse' },
  { id: 'other', label: 'Other', color: 'bg-pastel-cyan', icon: 'Tag' },
];

export const DEFAULT_HIGHLIGHT_CATEGORIES: HighlightCategory[] = [
  { id: 'movie', label: 'Movie/TV', color: 'bg-pastel-blue', icon: 'Film' },
  { id: 'book', label: 'Book', color: 'bg-pastel-yellow', icon: 'Book' },
  { id: 'purchase', label: 'Big Purchase', color: 'bg-pastel-rose', icon: 'ShoppingBag' },
  { id: 'food', label: 'Great Meal', color: 'bg-pastel-green', icon: 'Utensils' },
  { id: 'milestone', label: 'Milestone', color: 'bg-pastel-purple', icon: 'Flag' },
];

export const DEFAULT_MOODS: MoodConfig[] = [
  { id: 'great', emoji: '🤩', label: 'Great' },
  { id: 'good', emoji: '😊', label: 'Good' },
  { id: 'eh', emoji: '😐', label: 'Eh' },
  { id: 'bad', emoji: '🥱', label: 'Bad' },
  { id: 'worst', emoji: '😢', label: 'Worst' },
];

const getPreferences = () => {
  try {
    const user = localStorage.getItem('lumina_current_session');
    if (!user) return null;
    const dataStr = localStorage.getItem('lumina_data_' + user);
    if (!dataStr) return null;
    return JSON.parse(dataStr).preferences;
  } catch (e) {
    return null;
  }
};

export const playPopSound = () => {
  const prefs = getPreferences();
  if (prefs?.sounds?.pop === false) return;

  // Custom Audio
  if (prefs?.customAudio?.pop) {
    try {
      const audio = new Audio(prefs.customAudio.pop);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play failed", e));
      return;
    } catch (e) {}
  }

  // Fallback Synthetic
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {}
};

export const playSuccessSound = () => {
  const prefs = getPreferences();
  if (prefs?.sounds?.celebration === false) return;

  // Custom Audio
  if (prefs?.customAudio?.celebration) {
    try {
      const audio = new Audio(prefs.customAudio.celebration);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn("Audio play failed", e));
      return;
    } catch (e) {}
  }

  // Fallback Synthetic
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const audioCtx = new AudioContext();
    const now = audioCtx.currentTime;
    
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, i) => {
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, now + (i * 0.1));
        
        gainNode.gain.setValueAtTime(0, now + (i * 0.1));
        gainNode.gain.linearRampToValueAtTime(0.05, now + (i * 0.1) + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.1) + 0.5);
        
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        oscillator.start(now + (i * 0.1));
        oscillator.stop(now + (i * 0.1) + 0.6);
    });
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// Optimized Image Compression
export const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Increased max width for better quality on larger screens
        const MAX_WIDTH = 1280; 
        let scaleSize = 1;
        
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }

        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject('Canvas context missing');
          return;
        }
        
        // High quality smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // JPEG Quality set to 0.8 (Good balance)
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

export const processAudio = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
  });
};