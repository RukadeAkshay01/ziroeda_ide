
import React, { useState } from 'react';
import { 
  Search, Cpu, Zap, Radio, Sliders, ToggleLeft, MoreHorizontal, 
  Gamepad2, Thermometer, Eye, Activity, Monitor, Smartphone, Fan, 
  Keyboard, MousePointerClick, Volume2, 
  Wifi, Disc, ToggleRight, Mic, Flame
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
  onAddComponent: (type: ComponentType) => void;
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
    title: 'INPUTS & CONTROLS',
    items: [
      { id: 'wokwi-pushbutton', name: 'Pushbutton (12mm)', icon: <MousePointerClick className="w-4 h-4" /> },
      { id: 'wokwi-slide-switch', name: 'Slide Switch', icon: <ToggleLeft className="w-4 h-4" /> },
      { id: 'wokwi-tilt-switch', name: 'Tilt Switch', icon: <ToggleRight className="w-4 h-4" /> },
      { id: 'wokwi-potentiometer', name: 'Potentiometer', icon: <Sliders className="w-4 h-4" /> },
      { id: 'wokwi-slide-potentiometer', name: 'Slide Potentiometer', icon: <Sliders className="w-4 h-4 rotate-90" /> },
      { id: 'wokwi-analog-joystick', name: 'Analog Joystick', icon: <Gamepad2 className="w-4 h-4" /> },
      { id: 'wokwi-membrane-keypad', name: 'Membrane Keypad', icon: <Keyboard className="w-4 h-4" /> },
      { id: 'wokwi-rotary-dialer', name: 'Rotary Dialer', icon: <Disc className="w-4 h-4" /> },
      { id: 'wokwi-ky-040', name: 'Rotary Encoder (KY-040)', icon: <Disc className="w-4 h-4" /> },
    ]
  },
  {
    title: 'SENSORS',
    items: [
      { id: 'wokwi-dht22', name: 'DHT22 Temp/Hum', icon: <Thermometer className="w-4 h-4" /> },
      { id: 'wokwi-ntc-temperature-sensor', name: 'NTC Thermistor', icon: <Thermometer className="w-4 h-4" /> },
      { id: 'wokwi-hc-sr04', name: 'Ultrasonic Distance', icon: <Activity className="w-4 h-4" /> },
      { id: 'wokwi-pir-motion-sensor', name: 'PIR Motion', icon: <Eye className="w-4 h-4" /> },
      { id: 'wokwi-photoresistor-sensor', name: 'Photoresistor (LDR)', icon: <Zap className="w-4 h-4" /> },
      { id: 'wokwi-gas-sensor', name: 'Gas Sensor (MQ-2)', icon: <Fan className="w-4 h-4" /> },
      { id: 'wokwi-mpu6050', name: 'MPU6050 Accel/Gyro', icon: <Activity className="w-4 h-4" /> },
      { id: 'wokwi-ds1307', name: 'DS1307 RTC', icon: <Disc className="w-4 h-4" /> },
      { id: 'wokwi-flame-sensor', name: 'Flame Sensor', icon: <Flame className="w-4 h-4" /> },
      { id: 'wokwi-big-sound-sensor', name: 'Big Sound Sensor', icon: <Mic className="w-4 h-4" /> },
      { id: 'wokwi-small-sound-sensor', name: 'Small Sound Sensor', icon: <Mic className="w-4 h-4" /> },
      { id: 'wokwi-heart-beat-sensor', name: 'Heart Beat Sensor', icon: <Activity className="w-4 h-4" /> },
    ]
  },
  {
      title: 'OUTPUTS & LEDS',
      items: [
          { id: 'wokwi-led', name: 'LED', icon: <Radio className="w-4 h-4" /> },
          { id: 'wokwi-neopixel', name: 'NeoPixel', icon: <Radio className="w-4 h-4 text-purple-500" /> },
          { id: 'wokwi-neopixel-matrix', name: 'NeoPixel Matrix', icon: <Radio className="w-4 h-4 text-purple-500" /> },
          { id: 'wokwi-led-ring', name: 'LED Ring', icon: <Disc className="w-4 h-4 text-red-500" /> },
          { id: 'wokwi-7segment', name: '7-Segment Display', icon: <Monitor className="w-4 h-4" /> },
          { id: 'wokwi-buzzer', name: 'Buzzer', icon: <Volume2 className="w-4 h-4" /> },
      ]
  },
  {
      title: 'DISPLAYS',
      items: [
          { id: 'wokwi-lcd1602', name: 'LCD 16x2', icon: <Monitor className="w-4 h-4" /> },
          { id: 'wokwi-lcd2004', name: 'LCD 20x4', icon: <Monitor className="w-4 h-4" /> },
          { id: 'wokwi-ssd1306', name: 'OLED SSD1306', icon: <Smartphone className="w-4 h-4" /> },
      ]
  },
  {
      title: 'MOTORS',
      items: [
          { id: 'wokwi-servo', name: 'Servo Motor', icon: <MoreHorizontal className="w-4 h-4" /> },
      ]
  },
  {
      title: 'BASIC & COMMS',
      items: [
          { id: 'wokwi-resistor', name: 'Resistor', icon: <Zap className="w-4 h-4 rotate-90" /> },
          { id: 'wokwi-ir-receiver', name: 'IR Receiver', icon: <Wifi className="w-4 h-4" /> },
          { id: 'wokwi-ir-remote', name: 'IR Remote', icon: <Wifi className="w-4 h-4" /> },
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
    <div className="w-64 h-full bg-[#13161c] flex flex-col">
      {/* Search Header */}
      <div className="p-4 space-y-4 border-b border-[#1e2229]">
        <h2 className="text-xs font-bold text-[#4a5568] uppercase tracking-widest">Components</h2>
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5568] group-focus-within:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0b0d11] border border-[#2d3748] rounded-md py-1.5 pl-10 pr-3 text-sm text-[#cbd5e0] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
        </div>
      </div>

      {/* Library Content */}
      <div className="flex-1 overflow-y-auto px-2 space-y-6 pb-10 pt-4 scrollbar-hide">
        {filteredCategories.map((cat) => (
          <div key={cat.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-bold text-[#4a5568] tracking-widest uppercase py-2">
              {cat.title}
            </h3>
            <div className="space-y-0.5">
              {cat.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onAddComponent(item.id)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-[#a0aec0] hover:text-white hover:bg-[#2d3748] group transition-all"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0b0d11] flex items-center justify-center text-[#4a5568] group-hover:text-cyan-400 border border-[#2d3748] group-hover:border-cyan-500/30 transition-all shadow-sm">
                    {item.icon}
                  </div>
                  <span className="font-medium truncate">{item.name}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
        {filteredCategories.length === 0 && (
          <div className="p-4 text-center text-xs text-[#4a5568]">
            No components found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ComponentLibrary;
