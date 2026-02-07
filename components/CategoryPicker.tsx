import React from 'react';
import { playPopSound } from '../constants';
import { Category, CategoryId } from '../types';
import * as LucideIcons from 'lucide-react';

interface CategoryPickerProps {
  categories: Category[];
  selected: CategoryId;
  onSelect: (id: CategoryId) => void;
  onAddInline?: () => void;
}

const CategoryPicker: React.FC<CategoryPickerProps> = ({ categories, selected, onSelect, onAddInline }) => {
  return (
    <div className="flex flex-wrap gap-3 justify-center mb-6">
      {categories.map((cat) => {
        const Icon = ((LucideIcons as unknown) as Record<string, React.ComponentType<any>>)[cat.icon] || LucideIcons.Circle;
        const isSelected = selected === cat.id;

        return (
          <button
            key={cat.id}
            onClick={() => {
              playPopSound();
              onSelect(cat.id);
            }}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all duration-300
              ${isSelected 
                ? `${cat.color} text-gray-900 ring-2 ring-white/50 ring-offset-2 ring-offset-black scale-105 shadow-[0_0_15px_rgba(255,255,255,0.2)]` 
                : 'bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700 hover:scale-105 border border-white/5'}
            `}
          >
            <Icon size={14} />
            <span>{cat.label}</span>
          </button>
        );
      })}
      {onAddInline && (
        <button
          onClick={onAddInline}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold bg-white/5 text-gray-500 hover:text-white border border-dashed border-white/20 transition-all"
        >
          <LucideIcons.Plus size={14} />
          <span>New Category</span>
        </button>
      )}
    </div>
  );
};

export default CategoryPicker;