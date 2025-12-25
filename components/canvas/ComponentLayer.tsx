
import React from 'react';
import { CircuitComponent } from '../../types';
import { LayoutDataMap } from '../../utils/circuitUtils';
import ComponentRenderer from '../ComponentRenderer';

interface ComponentLayerProps {
  components: CircuitComponent[];
  layoutData: LayoutDataMap;
  draggedComponentId: string | null;
  selectedComponentId: string | null;
  onComponentMouseDown: (e: React.MouseEvent, id: string) => void;
  onComponentTouchStart?: (e: React.TouchEvent, id: string) => void;
  setComponentRef: (id: string) => (el: HTMLElement | null) => void;
  isSimulating?: boolean;
  onComponentEvent?: (id: string, name: string, detail: any) => void;
  onSelectComponent?: (id: string) => void;
}

const InteractiveComponentWrapper: React.FC<{
  comp: CircuitComponent;
  isDraggingThis: boolean;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseUp: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
  setComponentRef: (id: string) => (el: HTMLElement | null) => void;
  isSimulating: boolean;
  onComponentEvent?: (id: string, name: string, detail: any) => void;
}> = ({
  comp,
  isDraggingThis,
  isSelected,
  onMouseDown,
  onMouseUp,
  onTouchStart,
  onTouchEnd,
  setComponentRef,
  isSimulating,
  onComponentEvent
}) => {
    const elementRef = React.useRef<HTMLElement | null>(null);

    // Combine parent's ref callback with our local ref
    const handleRef = React.useCallback((el: HTMLElement | null) => {
      elementRef.current = el;
      setComponentRef(comp.id)(el);
    }, [comp.id, setComponentRef]);

    React.useEffect(() => {
      if (!isSimulating || !onComponentEvent || !elementRef.current) return;

      const el = elementRef.current;

      // Define event handlers
      const handleEvent = (name: string) => (e: any) => {
        // console.log(`[ComponentLayer] Captured ${name} from ${comp.id}`, e.detail);
        onComponentEvent(comp.id, name, e.detail !== undefined ? e.detail : {});
      };

      const events = [
        'button-press', 'button-release', // Keypad, Pushbutton
        'input', // Sensors, Potentiomers
        'change', // Switches
        'slide', // Slide Switches
        'rotate', // Rotary Encoder
        'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', // Joystick?
        'color' // Some LED things?
      ];

      const cleanupFns: (() => void)[] = [];

      events.forEach(evtName => {
        const handler = handleEvent(evtName);
        el.addEventListener(evtName, handler);
        cleanupFns.push(() => el.removeEventListener(evtName, handler));
      });

      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName) {
            const attr = mutation.attributeName;
            // Watch for rotation/value changes that might not emit events
            if (['value', 'angle', 'rotation'].includes(attr)) {
              const val = (el as any).getAttribute(attr);
              // console.log(`[ComponentLayer] Attribute ${attr} changed on ${comp.id}:`, val);
              // Send as 'input' or specific event
              onComponentEvent(comp.id, 'attribute-change', { attribute: attr, value: val });
            }
          }
        });
      });

      observer.observe(el, { attributes: true });
      cleanupFns.push(() => observer.disconnect());

      return () => {
        cleanupFns.forEach(fn => fn());
      };
    }, [isSimulating, onComponentEvent, comp.id]);

    const flipX = comp.attributes?.flipX ? -1 : 1;
    const flipY = comp.attributes?.flipY ? -1 : 1;
    const rotation = comp.rotation || 0;

    return (
      <div
        onMouseDown={onMouseDown}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={`absolute group ${isSimulating ? 'cursor-auto' : 'cursor-move'} ${isDraggingThis ? '' : 'transition-all duration-500 ease-in-out'}`}
        style={{
          left: `${comp.x}px`,
          top: `${comp.y}px`,
          transform: `rotate(${rotation}deg) scaleX(${flipX}) scaleY(${flipY})`,
          zIndex: isDraggingThis ? 100 : 20
        }}
      >
        {isSelected && (
          <div
            className="absolute -inset-2 border-2 border-cyan-400 rounded-lg pointer-events-none animate-pulse shadow-[0_0_20px_rgba(34,211,238,0.3)]"
            style={{ zIndex: -1 }}
          />
        )}
        <div
          className="absolute -top-8 left-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none whitespace-nowrap border border-slate-700"
          style={{ transform: `translateX(-50%) rotate(${-rotation}deg) scaleX(${flipX}) scaleY(${flipY})` }}
        >
          {comp.label || comp.type.replace(/^wokwi-/, '')}
        </div>
        <ComponentRenderer ref={handleRef} component={comp} />
      </div>
    );
  };

const ComponentLayer: React.FC<ComponentLayerProps> = ({
  components,
  layoutData,
  draggedComponentId,
  selectedComponentId,
  onComponentMouseDown,
  onComponentTouchStart,
  setComponentRef,
  isSimulating,
  onComponentEvent,
  onSelectComponent
}) => {
  return (
    <>
      {components.map((comp) => {
        const isDraggingThis = draggedComponentId === comp.id;
        const isSelected = selectedComponentId === comp.id;

        const handleMouseDown = (e: React.MouseEvent) => {
          if (isSimulating && onComponentEvent) {
            // e.stopPropagation(); // Maybe don't stop propagation so dragging still implies selection?
            // Actually, we do want to stop propagation if we are interacting with controls.
            // But if we are just selecting...

            // If user clicks on a button in the UI, we want the button event to fire.
            // The wrapper div captures mousedown first.

            // We'll let the event bubble from the inner component if it handles it?
            // React Listeners on wrapper:

            onSelectComponent?.(comp.id);
            // We still send mousedown for generic interactions (like flame sensor click-and-hold)
            // But detailed events come from the listener above.
            onComponentEvent(comp.id, 'mousedown', {});
          } else {
            onComponentMouseDown(e, comp.id);
          }
        };

        const handleMouseUp = (e: React.MouseEvent) => {
          if (isSimulating && onComponentEvent) {
            onComponentEvent(comp.id, 'mouseup', {});
          }
        };

        const handleTouchStart = (e: React.TouchEvent) => {
          if (isSimulating && onComponentEvent) {
            onSelectComponent?.(comp.id);
            onComponentEvent(comp.id, 'mousedown', {});
          } else {
            onComponentTouchStart?.(e, comp.id);
          }
        };

        const handleTouchEnd = (e: React.TouchEvent) => {
          if (isSimulating && onComponentEvent) {
            onComponentEvent(comp.id, 'mouseup', {});
          }
        };

        return (
          <InteractiveComponentWrapper
            key={comp.id}
            comp={comp}
            isDraggingThis={isDraggingThis}
            isSelected={isSelected}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            setComponentRef={setComponentRef}
            isSimulating={!!isSimulating}
            onComponentEvent={onComponentEvent}
          />
        );
      })}
    </>
  );
};

export default ComponentLayer;
