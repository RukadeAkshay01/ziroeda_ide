
/**
 * @file geminiService.ts
 * @description Handles the high-level circuit architecture logic using Google Gemini.
 */

import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { DesignResponse, ChatMessage, CircuitComponent, WokwiConnection } from "../types";
import { optimizePlacement } from "./placementAgent";
import { optimizeSmartConnections } from "./wiringOptimizer";
import { STATIC_COMPONENT_DATA } from "../utils/static-component-data";

/**
 * Generates a documentation string of all available components and their exact pin names.
 * This prevents the AI from hallucinating pins (e.g. connecting to "ADC1" instead of "A1").
 * Note: We strictly strip coordinates and visual data here to save tokens.
 */
const COMPONENT_DOCS = Object.entries(STATIC_COMPONENT_DATA).map(([type, spec]) => {
  const pinList = spec.pins.map(p => p.name).join(', ');
  return `- "${type}": Valid Pins: [${pinList}]`;
}).join('\n');

/**
 * System instructions for the Architect agent.
 * Defines strict rules for incremental design and component preservation.
 */
const ARCHITECT_INSTRUCTION = `
You are a proactive, expert Electronics Engineer specializing in DIRECT INCREMENTAL CIRCUIT DESIGN and FIRMWARE DEVELOPMENT. 

**CORE DIRECTIVE: NO UNAUTHORIZED DELETIONS & TOTAL CONNECTIVITY**
- You are working on a persistent project canvas. 
- **DO NOT** delete existing components unless explicitly asked.
- **CRITICAL**: EVERY component in the list MUST have at least one valid connection in the 'connections' array. Do not generate "floating" components.
- ALWAYS provide the updated 'components' and 'connections' arrays including BOTH old and new items.

**FIRMWARE DIRECTIVE:**
- For every circuit design, you MUST provide functional Arduino C++ code in the 'arduinoCode' field.
- The code must correctly reference the pin connections you have established in the 'connections' array.
- Include helpful comments in the code.

**STRICT COMPONENT & PIN DATABASE:**
You must ONLY use the following components and their exact pin names. Do not invent pin names.
${COMPONENT_DOCS}

**TECHNICAL RULES:**
- **Connection Format:** ["sourceID:pin", "targetID:pin", "color"].
- **Wiring Standards:** 
  - Use Red for VCC/5V/3.3V.
  - Use Black for GND.
  - Use Green/Blue/Yellow for signals.
- **Placement:** Do not worry about X/Y coordinates. The layout engine will handle spatial arrangement.
- **Output:** Valid JSON. 
- **Project Name:** Generate a short, creative, and relevant name for the project based on the circuit design (e.g., "Blinking LED", "Smart Home Sensor").
`;

/**
 * Response schema for structured JSON output from Gemini.
 * Note: X and Y coordinates are removed to save tokens and rely on the deterministic layout engine.
 */
const circuitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING },
    projectName: { type: Type.STRING, description: "A short, creative name for the project" },
    arduinoCode: { type: Type.STRING, description: "Full Arduino C++ code for the circuit" },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          // X and Y are strictly removed to enforce separation of concerns
          rotation: { type: Type.NUMBER },
          label: { type: Type.STRING },
          attributes: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              value: { type: Type.STRING },
              bounce: { type: Type.STRING },
              flipX: { type: Type.BOOLEAN },
              flipY: { type: Type.BOOLEAN }
            }
          }
        },
        required: ["id", "type"],
      }
    },
    connections: {
      type: Type.ARRAY,
      items: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      }
    }
  },
  required: ["explanation", "arduinoCode", "components", "connections"]
};

export interface ServiceResult {
  design: DesignResponse;
  rawRequest: any;
  rawResponse: string;
}

export const generateCircuitDesign = async (
  history: ChatMessage[],
  currentComponents: CircuitComponent[],
  currentConnections: WokwiConnection[]
): Promise<ServiceResult> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("API Key is missing. Please set VITE_GEMINI_API_KEY in .env.local");
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });

  // Optimized context:
  // 1. Strip X/Y coordinates to save tokens (AI doesn't need them).
  // 2. Include attributes (e.g., resistor values, LED colors) as they are semantically important.
  const stateContext = `CURRENT CIRCUIT STATE:
Components: ${JSON.stringify(currentComponents.map(c => ({
    id: c.id,
    type: c.type,
    label: c.label,
    attributes: c.attributes
  })))}
Connections: ${JSON.stringify(currentConnections)}
---`;

  // Construct the prompt manually to return it for debugging
  const contents = history.map((msg, idx) => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: idx === history.length - 1 && msg.role === 'user' ? `${stateContext}\n\nUser Request: ${msg.text}` : msg.text }]
  }));

  try {
    const logicResponse = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: contents as any,
      config: {
        systemInstruction: ARCHITECT_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: circuitSchema,
      },
    });

    const text = logicResponse.text;
    if (!text) throw new Error("No response from AI");

    const logicData = JSON.parse(text) as Partial<DesignResponse>;

    // Hydrate the components with default coordinates before passing to placement agent
    // This bridges the gap between the Coordinate-less AI response and the coordinate-dependent App state
    let finalComponents = (logicData.components || []).map(c => ({
      ...c,
      x: 0,
      y: 0,
      rotation: c.rotation || 0,
      attributes: c.attributes || {}
    })) as CircuitComponent[];

    let finalConnections = logicData.connections || [];

    if (finalComponents.length > 0) {
      // 1. Use the deterministic placement engine to assign X/Y based on logical flow
      finalComponents = await optimizePlacement(
        finalComponents,
        finalConnections,
        currentComponents
      );

      // 2. Run Wiring Optimizer to swap pins on symmetric components (Resistors, Pushbuttons)
      //    to prevent wires from crossing over the component body.
      const smartResult = optimizeSmartConnections(finalComponents, finalConnections);
      finalComponents = smartResult.components;
      finalConnections = smartResult.connections;
    }

    return {
      design: {
        explanation: logicData.explanation || "",
        projectName: logicData.projectName,
        arduinoCode: logicData.arduinoCode || "",
        connections: finalConnections,
        components: finalComponents
      },
      rawRequest: contents,
      rawResponse: text
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
