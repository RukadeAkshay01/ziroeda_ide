
import React, { forwardRef } from 'react';
import { CircuitComponent } from '../types';

interface Props {
  component: CircuitComponent;
}

const ComponentRenderer = forwardRef<HTMLElement, Props>(({ component }, ref) => {
  const { type, attributes, label } = component;
  
  // Attribute mapping fixes
  const mappedAttributes: Record<string, any> = { ...attributes };
  
  // Wokwi LED uses 'lightColor', AI often sends 'color'
  if (type.includes('led') && mappedAttributes.color) {
    mappedAttributes.lightColor = mappedAttributes.color;
  }
  
  const commonProps = {
    ...mappedAttributes,
    title: label || component.id,
    id: component.id,
    // Critical: Force the Wokwi custom element to fill the parent div
    style: { width: '100%', height: '100%', display: 'block' } 
  };

  // Dynamically render the component to bypass JSX.IntrinsicElements strict typing
  if (type.startsWith('wokwi-')) {
    const Element = type as any;
    return <Element {...commonProps} ref={ref} />;
  }

  return (
    <div ref={ref as any} className="w-full h-full bg-red-500 flex items-center justify-center text-xs text-white border border-red-400">
      Unknown
    </div>
  );
});

ComponentRenderer.displayName = 'ComponentRenderer';

export default ComponentRenderer;
