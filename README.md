# ZiroEDA

An intelligent, web-based electronic circuit design platform that uses Google Gemini AI to translate natural language descriptions into functional visual circuits using Wokwi elements.

## 🚀 Features

- **Natural Language Design**: Describe a circuit (e.g., "Connect an LED to pin 13 with a 220-ohm resistor") and watch Ziro, the AI Engineer, build it.
- **Incremental Editing**: Add or remove components without losing your current progress.
- **Interactive Canvas**: Pan, zoom, and manually adjust component positions or wire routes.
- **Manhattan Routing**: Automatic orthogonal wiring with "dogleg" support and corner smoothing.
- **Component Library**: Manually add microcontrollers, sensors, and passive components.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS.
- **AI Engine**: Google Gemini API (@google/genai).
- **Hardware Simulation**: [Wokwi Elements](https://elements.wokwi.com/).
- **Icons**: Lucide React.

## 📂 Project Structure

- `/components`: UI building blocks (Canvas, Chat, Toolbars).
- `/services`: Gemini API integration and the Placement Optimization agent.
- `/utils`: Geometric algorithms for routing and coordinate transforms.
- `/types`: Centralized TypeScript definitions.

## 🔑 AI Configuration

The application requires a valid Gemini API key provided via `process.env.API_KEY`. It utilizes the `gemini-3-flash-preview` model for high-speed circuit reasoning and placement optimization.
