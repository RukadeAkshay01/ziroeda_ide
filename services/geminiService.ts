
/**
 * @file geminiService.ts
 * @description Handles the high-level circuit architecture logic using Google Gemini.
 */

import { GoogleGenAI, Type, Schema } from "@google/genai";
import { DesignResponse, ChatMessage, CircuitComponent, WokwiConnection } from "../types";
import { optimizePlacement } from "./placementAgent";

/**
 * System instructions for the Architect agent.
 * Defines strict rules for incremental design and component preservation.
 */
const ARCHITECT_INSTRUCTION = `
You are a proactive, expert Electronics Engineer specializing in DIRECT INCREMENTAL CIRCUIT DESIGN and FIRMWARE DEVELOPMENT. 

**CORE DIRECTIVE: NO UNAUTHORIZED DELETIONS**
- You are working on a persistent project canvas. 
- **DO NOT** delete existing components unless explicitly asked.
- ALWAYS provide the updated 'components' and 'connections' arrays.

**FIRMWARE DIRECTIVE:**
- For every circuit design, you MUST provide functional Arduino C++ code in the 'arduinoCode' field.
- The code must correctly reference the pin connections you have established in the 'connections' array.
- Include helpful comments in the code.

**TECHNICAL RULES:**
- **Available Components:** 
  - Microcontrollers: 'wokwi-arduino-uno', 'wokwi-arduino-nano', 'wokwi-arduino-mega'.
  - Inputs: 'wokwi-pushbutton', 'wokwi-slide-switch', 'wokwi-potentiometer', 'wokwi-slide-potentiometer', 'wokwi-membrane-keypad', 'wokwi-rotary-dialer', 'wokwi-analog-joystick', 'wokwi-ky-040' (Rotary Encoder), 'wokwi-tilt-switch'.
  - Sensors: 'wokwi-dht22', 'wokwi-hc-sr04', 'wokwi-pir-motion-sensor', 'wokwi-photoresistor-sensor', 'wokwi-ntc-temperature-sensor', 'wokwi-gas-sensor', 'wokwi-ds1307' (RTC), 'wokwi-mpu6050' (Accel/Gyro), 'wokwi-flame-sensor', 'wokwi-heart-beat-sensor', 'wokwi-big-sound-sensor', 'wokwi-small-sound-sensor'.
  - Outputs: 'wokwi-led', 'wokwi-7segment', 'wokwi-led-ring', 'wokwi-neopixel', 'wokwi-neopixel-matrix', 'wokwi-buzzer', 'wokwi-servo'.
  - Displays: 'wokwi-lcd1602', 'wokwi-lcd2004', 'wokwi-ssd1306' (OLED).
  - Comms: 'wokwi-ir-receiver', 'wokwi-ir-remote'.
  - Basic: 'wokwi-resistor'.

- **Connection Format:** ["sourceID:pin", "targetID:pin", "color"].
- **Output:** Valid JSON. 
`;

/**
 * Response schema for structured JSON output from Gemini.
 */
const circuitSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING },
    arduinoCode: { type: Type.STRING, description: "Full Arduino C++ code for the circuit" },
    components: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          x: { type: Type.NUMBER },
          y: { type: Type.NUMBER },
          rotation: { type: Type.NUMBER },
          label: { type: Type.STRING },
          attributes: {
            type: Type.OBJECT,
            properties: {
              color: { type: Type.STRING },
              value: { type: Type.STRING },
              bounce: { type: Type.STRING }
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

export const generateCircuitDesign = async (
  history: ChatMessage[], 
  currentComponents: CircuitComponent[],
  currentConnections: WokwiConnection[]
): Promise<DesignResponse> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key is missing.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const stateContext = `CURRENT CIRCUIT STATE:
Components: ${JSON.stringify(currentComponents.map(c => ({ id: c.id, type: c.type, x: c.x, y: c.y, rotation: c.rotation })))}
Connections: ${JSON.stringify(currentConnections)}
---`;

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

    const logicData = JSON.parse(text) as DesignResponse;

    if (logicData.components && logicData.components.length > 0) {
      // Use the new deterministic placement engine
      const placedComponents = await optimizePlacement(
        logicData.components, 
        logicData.connections, 
        currentComponents 
      );
      return {
          ...logicData,
          components: placedComponents
      };
    }

    return logicData;

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};
