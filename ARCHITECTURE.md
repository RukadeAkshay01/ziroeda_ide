# System Architecture

The AI Circuit Architect operates on a "Dual-Agent" pipeline to ensure both electrical correctness and visual clarity.

## 1. The AI Pipeline

### Phase A: The Architect (Logic)
- **File**: `services/geminiService.ts`
- **Role**: Interprets user intent. It receives the current circuit state and determines what electrical changes are needed.
- **Output**: A logical list of components and their required pin-to-pin connections.

### Phase B: The Placement Agent (Layout)
- **File**: `services/placementAgent.ts`
- **Role**: An "Incremental Layout Engineer." It takes the Architect's output and determines optimal (x, y) coordinates.
- **Constraint**: It is strictly forbidden from moving existing components to preserve the user's mental map of the workspace.

## 2. Interactive Canvas Engine

### Coordinate Systems
The canvas uses a 2D transform system (x, y, scale).
- **World Space**: The absolute coordinates where components live.
- **Screen Space**: The pixel coordinates on the user's monitor.
- Translation is handled via `getCanvasCoords` to map mouse interactions back to the circuit grid.

### Manhattan Routing Algorithm
- **File**: `utils/circuitUtils.ts`
- **Strategy**: 
    1. **Stub Generation**: Every pin has an "exit vector" (e.g., Arduino top pins go UP).
    2. **Bus Spacing**: Parallel wires are assigned different stub lengths to prevent overlap at component boundaries.
    3. **Orthogonal Pathing**: Routes are forced into horizontal and vertical segments.
    4. **Corner Smoothing**: Quadratic Bezier curves are applied to corners for a professional "PCB-like" aesthetic.

## 3. State Synchronization
Circuit state is managed in `App.tsx` and passed down as immutable props to the `Canvas`. Updates are triggered by:
- **AI Responses**: Replacing the entire state.
- **Manual Drag**: Updating individual component coordinates.
- **Manual Wiring**: Appending to the connections array.
