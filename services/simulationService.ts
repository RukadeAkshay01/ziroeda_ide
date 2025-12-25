
/**
 * @file simulationService.ts
 * @description Wrapper around the ported CircuitSimulator from ZiroEDA_final.
 */

import { CircuitSimulator } from '../simulator/core/Simulator';
import { CircuitComponent, WokwiConnection, CircuitDesign, Connection } from '../types';

export interface SimulationUpdate {
  pinStates: Record<string, number>;
  serialOutput: string;
}

export class SimulationService {
  private simulator: CircuitSimulator;
  private isRunning: boolean = false;
  private animationFrame: number | null = null;
  private lastTimestamp: number = 0;
  private onUpdate: (update: SimulationUpdate) => void;
  private onTick?: (simulator: CircuitSimulator) => void;

  constructor(onUpdate: (update: SimulationUpdate) => void, onTick?: (simulator: CircuitSimulator) => void) {
    this.simulator = new CircuitSimulator();
    this.onUpdate = onUpdate;
    this.onTick = onTick;

    // Hook into serial output
    this.simulator.onSerialOutput = (char) => {
      this.onUpdate({
        pinStates: {}, // Pin states are handled in the update loop
        serialOutput: char
      });
    };
  }

  async start(components: CircuitComponent[], connections: WokwiConnection[], arduinoCode: string) {
    // Convert current project types to Simulator types
    const design: CircuitDesign = {
      components: components.map(c => ({
        ...c,
        name: c.label || c.id,
        code: c.type.includes('arduino') ? arduinoCode : undefined,
        attrs: c.attributes
      })),
      connections: connections.map(conn => {
        const [from, to, color] = conn;
        const [fromId, fromPort] = from.split(':');
        const [toId, toPort] = to.split(':');
        return {
          from: fromId,
          fromPort: fromPort,
          to: toId,
          toPort: toPort,
          color: color
        };
      })
    };

    await this.simulator.load(design);
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.animationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  private tick(timestamp: number) {
    if (!this.isRunning) return;

    const deltaTime = timestamp - this.lastTimestamp;
    this.lastTimestamp = timestamp;

    // Advance simulation
    this.simulator.update(deltaTime);

    // Run visual updates
    if (this.onTick) {
      this.onTick(this.simulator);
    }

    // Capture Pin States from Arduino
    const pinStates: Record<string, number> = {};
    const runner = this.simulator.runner;
    if (runner) {
      // Capture D0-D7
      for (let i = 0; i < 8; i++) {
        pinStates[i.toString()] = runner.getPinState('D', i);
      }
      // Capture B0-B5 (D8-D13)
      for (let i = 0; i < 6; i++) {
        pinStates[(i + 8).toString()] = runner.getPinState('B', i);
      }
      // Capture C0-C5 (A0-A5)
      for (let i = 0; i < 6; i++) {
        pinStates[(i + 14).toString()] = runner.getPinState('C', i);
      }
    }

    // Send update to UI
    this.onUpdate({
      pinStates,
      serialOutput: "" // Serial output is handled via onSerialOutput callback
    });

    this.animationFrame = requestAnimationFrame(this.tick.bind(this));
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.simulator.stop();
  }

  serialWrite(data: string) {
    this.simulator.serialWrite(data);
  }

  getSimulator() {
    return this.simulator;
  }

  handleComponentEvent(id: string, name: string, detail: any) {
    this.simulator.handleComponentEvent(id, name, detail);
  }
}

// For backward compatibility with useSimulationRunner hook
export { compileSketch as compileArduinoCode } from '../simulator/core/Avr8jsService';
