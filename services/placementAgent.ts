
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { CircuitComponent, WokwiConnection } from "../types";
import { getComponentDimensions } from "../utils/static-component-data";

const PLACEMENT_INSTRUCTION = `
You are a Senior PCB Layout Engineer. Your task is to arrange electronic components on a 2D canvas.

**CORE GOALS:**
1. **NO OVERLAPS**: Use the provided 'width' and 'height' to ensure no component bounding boxes intersect.
2. **GRID ALIGNMENT**: All (x, y) coordinates MUST be multiples of 20.
3. **SCHEMATIC FLOW**: 
   - Place Microcontrollers (e.g., Arduino) on the far LEFT or CENTER.
   - Place Inputs (Buttons, Potentiometers, Sensors) to the LEFT or TOP of the MCU.
   - Place Outputs (LEDs, LCDs, Servos, Buzzers) to the RIGHT of the MCU.
   - Passive components (Resistors) should be placed directly between the pins they connect.

**CONSTRAINTS:**
- **EXISTING COMPONENTS**: If a component's ID is in 'existing_components', you MUST use its EXACT 'x', 'y', and 'rotation'. DO NOT MOVE THEM.
- **SPACING**: Maintain at least 60px of clear space between component edges.
- **BOUNDARIES**: Keep everything within a 1200x800 area.

**OUTPUT:**
Return a 'layout' array containing every ID from 'new_components' with its calculated 'x', 'y', and 'rotation'.
`;

const placementSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    layout: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          rotation: { type: Type.NUMBER },
        },
        required: ["id", "x", "y", "rotation"],
      }
    }
  },
  required: ["layout"]
};

export const optimizePlacement = async (
  components: CircuitComponent[],
  connections: WokwiConnection[],
  existingComponents: CircuitComponent[]
): Promise<CircuitComponent[]> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Enrich payload with physical dimensions
  const payload = {
    new_components: components.map(c => ({ 
      id: c.id, 
      type: c.type, 
      ...getComponentDimensions(c.type) 
    })),
    existing_components: existingComponents.map(c => ({ 
      id: c.id, 
      x: c.x, 
      y: c.y, 
      rotation: c.rotation,
      ...getComponentDimensions(c.type)
    })),
    connections: connections
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: JSON.stringify(payload),
      config: {
        systemInstruction: PLACEMENT_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: placementSchema,
      },
    });

    const text = response.text;
    if (!text) return components;

    const result = JSON.parse(text) as { layout: { id: string, x: number, y: number, rotation: number }[] };
    const layoutMap = new Map(result.layout.map(item => [item.id, item]));
    
    return components.map(comp => {
        const update = layoutMap.get(comp.id);
        if (update) {
            // Ensure snap to grid just in case AI missed it
            const snap = (val: number) => Math.round(val / 20) * 20;
            return { 
              ...comp, 
              x: snap(update.x), 
              y: snap(update.y), 
              rotation: update.rotation 
            };
        }
        return comp;
    });

  } catch (error) {
    console.warn("Placement optimization failed. Falling back to default layout.", error);
    return components;
  }
};
