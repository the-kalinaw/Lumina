import React from 'react';
import { playPopSound } from '../constants';
import { Category, CategoryId } from '../types';

interface HourlyGridProps {
  categories: Category[];
  hours: Record<number, CategoryId[]>;
  onChange: (hour: number, categoryId: CategoryId) => void;
  onRemove: (hour: number, categoryId: CategoryId) => void;
  selectedCategory: CategoryId;
}

const HourlyGrid: React.FC<HourlyGridProps> = ({ categories, hours, onChange, onRemove, selectedCategory }) => {
  const handleHourClick = (hour: number, e: React.MouseEvent) => {
    const rawData = hours[hour];
    const catIds = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
    
    playPopSound();
    
    if (catIds.includes(selectedCategory)) {
      // Selected category is in this hour, remove it
      onRemove(hour, selectedCategory);
    } else {
      // Selected category is not in this hour, add it
      onChange(hour, selectedCategory);
    }
  };

  const handleMouseEnter = (hour: number, e: React.MouseEvent) => {
    // Support drag-to-fill: if mouse is held down, add the selected category
    if (e.buttons === 1) {
      const rawData = hours[hour];
      const catIds = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
      
      if (!catIds.includes(selectedCategory)) {
        onChange(hour, selectedCategory);
      }
    }
  };

  // Custom order: 1am (1) to 12pm (12), then 1pm (13) to 12am (0)
  const hourOrder = [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0
  ];

  const formatHour = (h: number) => {
    let displayH = h % 12;
    if (displayH === 0) displayH = 12;
    const suffix = h < 12 ? 'am' : 'pm';
    return `${displayH}${suffix}`;
  };

  return (
    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-1.5 w-full">
      {hourOrder.map((hourValue) => {
        const rawData = hours[hourValue];
        const catIds = Array.isArray(rawData) ? rawData : (rawData ? [rawData] : []);
        
        return (
          <div
            key={hourValue}
            className={`
              aspect-square rounded-lg cursor-pointer transition-all duration-200 transform hover:scale-105
              flex items-center justify-center text-[10px] font-bold select-none
              border border-white/5 shadow-sm
            `}
            onClick={(e) => handleHourClick(hourValue, e)}
            onMouseEnter={(e) => handleMouseEnter(hourValue, e)}
          >
            {catIds.length === 0 ? (
              <div className="bg-white/5 hover:bg-white/10 w-full h-full rounded-lg flex items-center justify-center text-gray-600 transition-colors">
                {formatHour(hourValue)}
              </div>
            ) : catIds.length === 1 ? (
              (() => {
                const cat = categories.find(c => c.id === catIds[0]);
                const colorClass = cat ? cat.color : 'bg-white/5';
                const textClass = cat ? 'text-gray-900' : 'text-gray-600';
                return (
                  <div className={`w-full h-full rounded-lg flex items-center justify-center ${colorClass} ${textClass}`}>
                    {formatHour(hourValue)}
                  </div>
                );
              })()
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-0.5 p-1">
                {catIds.map((catId, idx) => {
                  const cat = categories.find(c => c.id === catId);
                  const colorClass = cat ? cat.color : 'bg-white/5';
                  const textClass = cat ? 'text-gray-900' : 'text-gray-600';
                  return (
                    <div key={idx} className={`flex-1 w-full rounded-sm flex items-center justify-center text-[7px] font-bold ${colorClass} ${textClass}`} title={cat?.label}>
                      <span className="truncate">{cat?.label?.charAt(0) || '?'}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default HourlyGrid;