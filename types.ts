export type CategoryId = string;

export interface Category {
  id: CategoryId;
  label: string;
  color: string;
  icon: string;
}

export interface Expense {
  id: string;
  amount: number;
  category: string; 
  description: string;
}

export interface HighlightCategory {
  id: string;
  label: string;
  color: string;
  icon: string; // Icon name
}

export interface Highlight {
  id: string;
  date: string;
  type: string; // References HighlightCategory ID
  title: string;
  rating?: number; 
  notes?: string;
  photos?: string[]; // Base64 strings
}

export interface MoodConfig {
  id: string;
  emoji: string;
  label: string;
}

export interface JournalEntry {
  id: string;
  text: string;
  timestamp: string;
  photos?: string[]; // Base64 strings
}

export interface Task {
  id: string;
  title: string;
  time: string; 
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
}

export interface DayLog {
  date: string; 
  hours: Record<number, CategoryId[]>; 
  expenses: Expense[];
  weight?: number;
  moods: string[]; 
  journalEntries: JournalEntry[];
  tasks: Task[]; 
}

export interface ThemeConfig {
  mode: 'custom';
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  cardColor: string;
  backgroundImage?: string; // Base64
}

export interface CustomSounds {
  pop?: string; // Base64 audio
  celebration?: string; // Base64 audio
}

export interface UserPreferences {
  theme?: 'mystic' | 'forest' | 'sunset' | 'ocean'; // Legacy
  customTheme?: ThemeConfig;
  sounds?: {
    enabled: boolean;
    pop: boolean;
    celebration: boolean;
  };
  customAudio?: CustomSounds;
}

export interface UserData {
  logs: Record<string, DayLog>;
  highlights: Highlight[];
  categories: Category[];
  expenditureCategories: Category[];
  highlightCategories: HighlightCategory[]; // New field
  moods: MoodConfig[];
  preferences?: UserPreferences;
  displayName?: string;
}

export interface UserAccount {
  username: string;
  passwordHash: string; 
}

export interface AppState extends UserData {
  currentUser: string | null;
}