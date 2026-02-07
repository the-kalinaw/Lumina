import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Option {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  iconOnly?: boolean; // If true, only shows icon when selected (good for compact layouts)
}

const CustomSelect: React.FC<CustomSelectProps> = ({ options, value, onChange, placeholder, className, iconOnly = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => o.id === value);
  const SelectedIcon = selectedOption?.icon ? (LucideIcons as any)[selectedOption.icon] : null;

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm text-left text-gray-300 flex items-center justify-between outline-none focus:ring-1 focus:ring-pastel-pink transition-all hover:bg-white/5 min-h-[46px]"
      >
        <div className="flex items-center gap-3 overflow-hidden">
            {selectedOption && (
                <>
                    {selectedOption.color && <div className={`w-2 h-2 rounded-full ${selectedOption.color} shadow-[0_0_8px_currentColor]`} />}
                    {SelectedIcon && <SelectedIcon size={16} className={selectedOption.color ? 'text-white' : 'text-gray-400'} />}
                </>
            )}
            {!iconOnly && (
                <span className={`truncate ${selectedOption ? 'text-gray-200 font-medium' : 'text-gray-500'}`}>
                {selectedOption ? selectedOption.label : placeholder || 'Select...'}
                </span>
            )}
        </div>
        <ChevronDown size={14} className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#18181b] border border-white/10 rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-50 max-h-60 overflow-y-auto custom-scrollbar p-1 ring-1 ring-white/5">
          {options.map((option) => {
            const Icon = option.icon ? (LucideIcons as any)[option.icon] : null;
            return (
                <div
                key={option.id}
                onClick={() => {
                    onChange(option.id);
                    setIsOpen(false);
                }}
                className={`
                    px-3 py-2.5 hover:bg-white/10 cursor-pointer flex items-center gap-3 transition-colors rounded-lg mb-0.5 last:mb-0
                    ${option.id === value ? 'bg-white/5' : ''}
                `}
                >
                {option.color && (
                    <div className={`w-2 h-2 rounded-full ${option.color} shadow-sm`} />
                )}
                {Icon && <Icon size={16} className="text-gray-400" />}
                <span className={`text-xs ${option.id === value ? 'text-white font-bold' : 'text-gray-400'}`}>
                    {option.label}
                </span>
                </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomSelect;