# Developer Guide

## Adding New Components

To add a new Wokwi element to the architect:

1.  **Register Type**: Add the tag name to the `ComponentType` union in `types.ts`.
2.  **Define Specs**: Add the component's physical dimensions and pin locations to `utils/static-component-data.ts`.
    - `width`/`height`: The pixel size of the SVG element.
    - `pins`: An array of `{ name, x, y }` relative to the component's top-left.
3.  **Define Exit Vectors**: In `utils/circuitUtils.ts`, update `getPinExitVector`. This tells the router which way wires should "pop out" of the component (e.g., left, right, top, or bottom).
4.  **Update Library**: Add the component to the `CATEGORIES` array in `components/ComponentLibrary.tsx` so it appears in the sidebar.

## Customizing the AI

The AI's behavior is governed by the `ARCHITECT_INSTRUCTION` in `services/geminiService.ts`. 
- To change how the AI talks, edit the "You are a..." section.
- To enforce new electrical rules, add them to the "TECHNICAL RULES" section.

## Routing Logic
If wires are overlapping too much, adjust the constants in `utils/circuitUtils.ts`:
- `STUB_BASE`: The minimum distance a wire travels before turning.
- `STUB_STEP`: The gap between parallel "bus" wires.
