
import React, { useState } from 'react';
import { Search, Cpu, Zap, Radio, Sliders, ToggleLeft, Layers, MoreHorizontal } from 'lucide-react';
import { ComponentType } from '../types';

interface LibraryItem {
  id: ComponentType;
  name: string;
  icon: React.ReactNode;
}

interface Category {
  title: string;
  items: LibraryItem[];
}

interface ComponentLibraryProps {
  onAddComponent: (type: ComponentType) => void;
}

const CATEGORIES: Category[] = [
  {
    title: 'MICROCONTROLLERS',
    items: [
      { id: 'wokwi-arduino-uno', name: 'Arduino Uno', icon: <Cpu className="w-4 h-4" /> },
      { id: 'wokwi-arduino-uno' as any, name: 'Arduino Nano', icon: <Cpu className="w-4 h-4" /> },
      { id: 'wokwi-arduino-uno' as any, name: 'Arduino Mega', icon: <Cpu className="w-4 h-4" /> },
    ]
  },
  {
    title: 'BASIC COMPONENTS',
    items: [
      { id: 'wokwi-resistor', name: 'Resistor', icon: <Zap className="w-4 h-4 rotate-90" /> },
      { id: 'wokwi-led', name: 'LED', icon: <Radio className="w-4 h-4" /> },
      { id: 'wokwi-led' as any, name: 'RGB LED', icon: <Radio className="w-4 h-4 text-pink-500" /> },
      { id: 'wokwi-pushbutton', name: 'Pushbutton', icon: <Layers className="w-4 h-4" /> },
      { id: 'wokwi-potentiometer', name: 'Potentiometer', icon: <Sliders className="w-4 h-4" /> },
      { id: 'wokwi-servo', name: 'Servo Motor', icon: <MoreHorizontal className="w-4 h-4" /> },
    ]
  },
  {
      title: 'SENSORS & DISPLAYS',
      items: [
          { id: 'wokwi-hc-sr04', name: 'Ultrasonic', icon: <Radio className="w-4 h-4" /> },
          { id: 'wokwi-dht22', name: 'Temp/Humidity', icon: <Zap className="w-4 h-4" /> },
          { id: 'wokwi-lcd1602', name: 'LCD 16x2', icon: <Layers className="w-4 h-4" /> },
      ]
  }
];

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddComponent }) => {
  const [search, setSearch] = useState('');

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="w-64 h-full bg-[#0f1115] border-r border-[#1e2229] flex flex-col z-40">
      {/* Search Header */}
      <div className="p-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568] group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search components..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#1a1d24] border border-[#2d3748] rounded-md py-1.5 pl-10 pr-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      {/* Library Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-10 scrollbar-hide">
        {filteredCategories.map((cat) => (
          <div key={cat.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-[#4a5568] tracking-widest uppercase py-2">
              {cat.title}
            </h3>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.name}
                  onClick={() => onAddComponent(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#a0aec0] hover:text-white hover:bg-[#1a1d24] group transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#1a1d24] flex items-center justify-center text-[#4a5568] group-hover:text-cyan-400 border border-[#2d3748] group-hover:border-cyan-500/30 transition-all">
                    {item.icon}
                  </div>
                  <span className="font-medium">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComponentLibrary;
