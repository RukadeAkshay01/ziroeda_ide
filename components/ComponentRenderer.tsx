
import React, { forwardRef } from 'react';
import { CircuitComponent } from '../types';

interface Props {
  component: CircuitComponent;
}

const ComponentRenderer = forwardRef<HTMLElement, Props>(({ component }, ref) => {
  const { type, attributes, label } = component;

  // Attribute mapping fixes
  const mappedAttributes: Record<string, any> = { ...attributes };

  // Ensure critical attributes are present for rendering
  if (type === 'wokwi-neopixel' && !mappedAttributes.pixels) {
    mappedAttributes.pixels = "1";
  }

  const commonProps = {
    ...mappedAttributes,
    title: label || component.id,
    id: component.id,
    // Allow the Wokwi element to define its own dimensions
    style: { display: 'block' }
  };

  // Dynamically render the component to bypass JSX.IntrinsicElements strict typing
  if (type.startsWith('wokwi-')) {
    const Element = type as any;
    return <Element {...commonProps} ref={ref} />;
  }

  return (
    <div ref={ref as any} className="w-24 h-24 bg-red-500 flex items-center justify-center text-xs text-white border border-red-400 p-2 text-center break-words">
      {type}
    </div>
  );
});

ComponentRenderer.displayName = 'ComponentRenderer';

export default ComponentRenderer;
