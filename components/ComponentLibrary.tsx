
import React, { useState } from 'react';
import {
  Search, Cpu, Radio, Sliders, ToggleLeft,
  Gamepad2, Thermometer, Eye, Activity, Monitor, Smartphone,
  Keyboard, MousePointerClick, Volume2,
  Disc, Zap
} from 'lucide-react';
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
  onAddComponent: (type: string) => void;
  isReadOnly?: boolean;
}

const CATEGORIES: Category[] = [
  {
    title: 'MICROCONTROLLERS',
    items: [
      { id: 'wokwi-arduino-uno', name: 'Arduino Uno', icon: <Cpu className="w-4 h-4" /> },
      { id: 'wokwi-arduino-nano', name: 'Arduino Nano', icon: <Cpu className="w-4 h-4" /> },
      { id: 'wokwi-arduino-mega', name: 'Arduino Mega', icon: <Cpu className="w-4 h-4" /> },
    ]
  },
  {
    title: 'INPUTS',
    items: [
      { id: 'wokwi-pushbutton', name: 'Pushbutton', icon: <MousePointerClick className="w-4 h-4" /> },
      { id: 'wokwi-slide-switch', name: 'Slide Switch', icon: <ToggleLeft className="w-4 h-4" /> },
      { id: 'wokwi-potentiometer', name: 'Potentiometer', icon: <Sliders className="w-4 h-4" /> },
      { id: 'wokwi-membrane-keypad', name: 'Keypad 4x4', icon: <Keyboard className="w-4 h-4" /> },
    ]
  },
  {
    title: 'SENSORS',
    items: [
      { id: 'wokwi-dht22', name: 'DHT22 Temp/Hum', icon: <Thermometer className="w-4 h-4" /> },
      { id: 'wokwi-hc-sr04', name: 'Ultrasonic', icon: <Activity className="w-4 h-4" /> },
      { id: 'wokwi-pir-motion-sensor', name: 'PIR Motion', icon: <Eye className="w-4 h-4" /> },
      { id: 'wokwi-photoresistor-sensor', name: 'LDR Sensor', icon: <Zap className="w-4 h-4" /> },
      { id: 'wokwi-mpu6050', name: 'MPU6050 Gyro', icon: <Activity className="w-4 h-4" /> },
    ]
  },
  {
    title: 'OUTPUTS',
    items: [
      { id: 'wokwi-led', name: 'LED', icon: <Radio className="w-4 h-4" /> },
      { id: 'wokwi-neopixel', name: 'NeoPixel', icon: <Radio className="w-4 h-4" /> },
      { id: 'wokwi-7segment', name: '7-Segment', icon: <Monitor className="w-4 h-4" /> },
      { id: 'wokwi-buzzer', name: 'Buzzer', icon: <Volume2 className="w-4 h-4" /> },
      { id: 'wokwi-servo', name: 'Servo Motor', icon: <Gamepad2 className="w-4 h-4" /> },
    ]
  },
  {
    title: 'DISPLAYS',
    items: [
      { id: 'wokwi-lcd1602', name: 'LCD 16x2', icon: <Monitor className="w-4 h-4" /> },
      { id: 'wokwi-ssd1306', name: 'OLED SSD1306', icon: <Smartphone className="w-4 h-4" /> },
    ]
  },
  {
    title: 'BASIC',
    items: [
      { id: 'wokwi-resistor', name: 'Resistor', icon: <Zap className="w-4 h-4 rotate-90" /> },
    ]
  }
];

const ComponentLibrary: React.FC<ComponentLibraryProps> = ({ onAddComponent, isReadOnly = false }) => {
  const [search, setSearch] = useState('');

  const filteredCategories = CATEGORIES.map(cat => ({
    ...cat,
    items: cat.items.filter(item => item.name.toLowerCase().includes(search.toLowerCase()))
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="w-64 h-full bg-dark-900 flex flex-col">
      {/* Search Header */}
      <div className="p-4 space-y-4 border-b border-dark-700">
        <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Essentials</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-brand-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-dark-800 border border-dark-700 rounded-md py-1.5 pl-10 pr-3 text-sm text-gray-300 focus:outline-none focus:border-brand-500/50 focus:ring-1 focus:ring-brand-500/20 transition-all"
            disabled={isReadOnly}
          />
        </div>
      </div>

      {/* Library Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-10 pt-4 scrollbar-hide">
        {filteredCategories.map((cat) => (
          <div key={cat.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-gray-500 tracking-widest uppercase py-2">
              {cat.title}
            </h3>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => !isReadOnly && onAddComponent(item.id)}
                  draggable={!isReadOnly}
                  onDragStart={(e) => {
                    if (isReadOnly) {
                      e.preventDefault();
                      return;
                    }
                    e.dataTransfer.setData('componentType', item.id);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-gray-400 group transition-all ${isReadOnly ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'hover:text-white hover:bg-dark-800 cursor-grab active:cursor-grabbing'}`}
                  disabled={isReadOnly}
                >
                  <div className={`w-8 h-8 rounded-lg bg-dark-800 flex items-center justify-center text-gray-500 border border-dark-700 transition-all shadow-sm ${isReadOnly ? '' : 'group-hover:text-brand-400 group-hover:border-brand-500/30'}`}>
                    {item.icon}
                  </div>
                  <span className="font-medium truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="p-4 text-center text-xs text-gray-500">
            No components found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
