# Smart Livestock Weight Monitoring System
## Architectural & Technical Documentation

This document provides a comprehensive overview of the design, system architecture, telemetry workflows, dependencies, and configuration setup of the **Smart Livestock Weight Monitoring System**.

---

## 1. System Architecture

The application is structured as a full-stack, decoupled single-page application (SPA) with real-time hardware simulation. It has three main layers:
1. **IoT Scale Simulator / Hardware Telemetry**: Sends weight measurements (simulating load-cell data) over HTTP POST.
2. **Express & Socket.io Backend Server**: Coordinates device registration, processes raw data stream computations, saves weight logs, and broadcasts real-time telemetry to connected dashboard clients.
3. **React & MUI Frontend Dashboard**: Receives data via HTTP REST endpoints and real-time Socket.io streams to present analytics, manage cattle records, and configure WiFi on scales.

### System Data Flow Diagram

```mermaid
graph TD
    %% Entities
    ESP32[ESP32 Smart Scale / IoT Device]
    Browser[React Web Dashboard Client]
    Express[Express.js API Backend]
    SocketServer[Socket.io WebSocket Server]
    LocalDB[Mock JSON Database (db.json)]

    %% Connections
    ESP32 -- "1. Post Reading /api/weight" --> Express
    Express -- "2. Save online status & stable records" --> LocalDB
    Express -- "3. Emit 'weight_update' & 'new_reading'" --> SocketServer
    SocketServer -- "4. Push real-time telemetry stream" --> Browser
    Browser -- "5. Get master data (Cattle list, Stats)" --> Express
    Browser -- "6. Send WiFi provision /api/devices/:id/wifi" --> Express
    Express -- "7. Broadcast simulated handshake steps via WebSocket" --> SocketServer
```

---

## 2. Technical Stack & Dependencies

The project uses TypeScript across the frontend and backend. Below are the dependency details extracted from `package.json`:

### Frontend Stack (Client-side)
| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **react** | `^19.0.1` | Core UI engine using hooks and declarative component states. |
| **react-dom** | `^19.0.1` | Document object model renderer for React. |
| **@mui/material** | `^9.1.2` | Material UI component framework (customized with rounded corners). |
| **@emotion/react** / **@emotion/styled** | `^11.14.0` / `^11.14.1` | CSS-in-JS styling system utilized by MUI. |
| **tailwindcss** | `^4.1.14` | Styling framework (integrated with `@tailwindcss/vite` plugin). |
| **chart.js** | `^4.5.1` | Charting library for growth rate & trend visualizations. |
| **react-chartjs-2** | `^5.3.1` | React wrapper for Chart.js. |
| **react-router-dom** | `^7.18.0` | Client-side routing engine. |
| **react-resizable-panels** | `^4.11.2` | Interactive resizable grid split panes used in the dashboard layout. |
| **socket.io-client** | `^4.8.3` | Real-time WebSocket connection to the backend. |
| **axios** | `^1.18.0` | Promise-based HTTP client for calling backend REST APIs. |
| **i18next** / **react-i18next** | `^26.3.1` / `^17.0.8` | Internationalization framework (supports English `en` and Khmer `km`). |
| **lucide-react** | `^0.546.0` | Clean vector iconography. |
| **motion** | `^12.23.24` | Animation toolkit (formerly Framer Motion) for fluid transitions. |

### Backend & Dev Tooling Stack (Server-side)
| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **express** | `^4.21.2` | Fast HTTP server for REST endpoints. |
| **socket.io** | `^4.8.3` | WebSocket engine serving real-time channel updates. |
| **dotenv** | `^17.2.3` | Loads environment variables from `.env` files. |
| **vite** | `^6.2.3` | Bundler & dev-server runner. |
| **tsx** | `^4.21.0` | TypeScript execution engine for directly running `server.ts`. |
| **esbuild** | `^0.25.0` | JS/TS transpiler for building deployment targets. |
| **typescript** | `~5.8.2` | Language compiler enforcing type safety. |

---

## 3. Directory Structure

```
├── Dockerfile                  # Container layout for Nginx deployment
├── ARCHITECTURE.md             # Developer architecture reference (this file)
├── README.md                   # Setup instruction booklet
├── db.json                     # Generated JSON database file (Local data storage)
├── metadata.json               # Google AI Studio Applet properties
├── nginx.conf                  # Nginx proxy mapping client assets & backend reverse-proxy
├── package.json                # Project scripts, engines & dependency declarations
├── server                      # Backend Database files
│   └── db.ts                   # In-memory JSON database manager
├── server.ts                   # Entrypoint Express & Socket.io server
├── src                         # React Frontend application root
│   ├── App.tsx                 # Core App layout, Theme definition, and SPA routing
│   ├── api                     # Client API call logic
│   │   └── index.ts            # Client Axios HTTP endpoints
│   ├── components              # Shared component folder
│   │   └── layout              # Shared layout views
│   │       └── Layout.tsx      # Sidebar and Header components
│   ├── hooks                   # React hooks folder
│   │   ├── useMasterData.ts    # Polling & cache loader hook for REST endpoints
│   │   └── useSocket.ts        # Socket.io listener for real-time scale feeds
│   ├── i18n.ts                 # Translation dictionary file (English / Khmer)
│   ├── index.css               # Core global styles (Tailwind imports)
│   ├── main.tsx                # App entry mounting point
│   ├── pages                   # Dashboard screens folder
│   │   ├── AnalyticsView.tsx   # Cattle growth ratios and visual statistics charts
│   │   ├── CattleRecordsView.tsx # Cattle CRUD interface
│   │   ├── CowDetailView.tsx   # Specific cattle profile page & weigh history
│   │   ├── DashboardView.tsx   # Dashboard widgets, latest activity, and system health
│   │   ├── LiveScaleView.tsx   # Real-time weighing scale with Audio synthesizer chime
│   │   ├── ReportsView.tsx     # Tabbed view for Daily, Weekly, and Monthly reports
│   │   ├── SettingsView.tsx    # IoT scale registration, WiFi configs & Theme toggles
│   │   └── WeightHistoryView.tsx # Master weight logs index
│   └── types                   # TS types folder
│       └── index.ts            # Type/Interface declarations
├── tsconfig.json               # TypeScript rules configuration
└── vite.config.ts              # Vite configurations, HMR setups, and proxy rules
```

---

## 4. Key Workflows & Mechanics

### A. Real-Time Telemetry Stream
1. An external hardware weight module (or test client) performs an HTTP POST request to `/api/weight`.
2. The payload contains:
   ```json
   {
     "device_id": "esp32-scale-01",
     "raw": 244.5,
     "median": 245.0,
     "lpf": 245.0,
     "display": 245.0,
     "stable": true
   }
   ```
3. The Express backend marks the scale status as `online` and updates `liveScaleState`.
4. The server broadcasts the JSON telemetry via a Socket.io channel event `weight_update` to all connected clients.
5. If `stable` shifts from `false` to `true` and the weight is significant (> 5 kg), a specific WebSocket trigger event `new_reading` is fired.
6. The React client’s `LiveScaleView.tsx` listens to these events. When a stabilization transition occurs, it generates a custom **high-fidelity dual-tone chime** synthesized on-the-fly using the browser's native **Web Audio API** (`AudioContext`).

### B. WiFi Provisioning Simulation
1. To configure an offline scale's wireless settings, a user submits the configuration form under the **Settings Screen**.
2. The browser fires a POST request to `/api/devices/:deviceId/wifi` with the SSID and passphrase.
3. The server sets the device status to `connecting` and returns an immediate status success.
4. An asynchronous sequence of steps is initiated by the server. Every 1,000ms, it emits the `wifi_provision_status` event:
   - **Step 1**: Waking up WiFi stack on scale module...
   - **Step 2**: Attempting handshake with wireless hub...
   - **Step 3**: Sending configuration payload...
   - **Step 4**: Registering Client node state with DHCP server...
   - **Step 5**: Connected! Assigned IP address. Node active.
5. On the final step, the device is permanently updated to `online` with a simulated IP address and signal percentage. This triggers a `db_changed` socket emit, updating the UI.

### C. Database Architecture (`server/db.ts`)
The project utilizes a simple **JSON database file** (`db.json`) parsed at boot. The `DBManager` class acts as an Object-Relational Mapper (ORM), providing helper functions for data manipulation:
- **Seed Data Generator**: When `db.json` does not exist, the app generates initial Brahman, Holstein, and Angus cattle profiles along with a dynamic 6-month historical progression of weight logs mapping expected growth curves.
- **Auto-save Mechanism**: Every write, update, or deletion synchronously updates the cached structure in memory and persists it to disk via `fs.writeFileSync`.

### D. Analytics & System Alerts Generation
Whenever the `/api/dashboard/stats` endpoint is loaded, a rules-engine runs checks on the database to identify system alerts:
* **Weight Loss Alerts (High Severity)**: Calculated dynamically using the historical weights. If a cow loses more than 2kg compared to its previous weighing, a weight loss alert is generated.
* **Missing Weighing Alerts (Medium Severity)**: Flags any cattle without a weight log or which hasn't been weighed within the past 25 days.
* **Device Offline Alerts (High Severity)**: Flags if a registered load cell scale has not reported in telemetry for a prolonged duration.

---

## 5. Detected Architectural Discrepancies & Bugs

During code analysis, the following architectural inconsistencies and bugs were identified between the Client-side API layer and the Express routes:

### Bug 1: Missing `/api/weights` Endpoint
* **Symptom**: The client-side REST call `api.fetchWeights()` in `src/api/index.ts` calls `axios.get('/api/weights')`. This is triggered inside `useMasterData.ts` to populate the Weight History and render reports.
* **Problem**: In the backend server `server.ts`, there is no `app.get('/api/weights')` endpoint defined. The only retrieval endpoint is `app.get('/api/weights/:deviceId')`.
* **Fix**: Introduce the missing endpoint in `server.ts` to return all records:
  ```typescript
  app.get('/api/weights', (req, res) => {
    res.json(db.getWeightRecords());
  });
  ```

### Bug 2: HTTP Method Mismatch on Cattle Updates (`PATCH` vs `PUT`)
* **Symptom**: Updating cattle records from the Cattle Management screen fails.
* **Problem**: The frontend API client in `src/api/index.ts` sends a `PATCH` request:
  ```typescript
  export const updateCow = async (id: string, data: Partial<Cow>): Promise<Cow> => {
    const response = await axios.patch(`/api/cows/${id}`, data);
    return response.data;
  };
  ```
  However, the backend Express server in `server.ts` listens for a `PUT` request:
  ```typescript
  app.put('/api/cows/:id', (req, res) => { ... })
* **Fix**: Change the backend endpoint in `server.ts` to use `app.patch` (or match the client to make a `PUT` request).

### Bug 3: Server Port Dev Environment Mismatch (`3000` vs `3002`)
* **Symptom**: Telemetry and REST calls fail to connect in the dev environment.
* **Problem**: The Vite server configuration in `vite.config.ts` proxies `/api` and `/socket.io` to `http://localhost:3002` (which is standard for separating backend and frontend ports in development). However, `server.ts` binds hardcoded to port `3000` (`const PORT = 3000;`).
* **Fix**: Allow the backend port to be configured via environment variables or default to `3002` when running in development:
  ```typescript
  const PORT = process.env.PORT || (process.env.NODE_ENV === 'production' ? 3000 : 3002);
  ```

---

## 6. Local Setup & Deployment

### Running Locally (Development Mode)
1. **Install Dependencies**:
   ```bash
   npm install
   ```
2. **Start Backend Server** (using `tsx` to run TypeScript files directly):
   ```bash
   npx tsx server.ts
   ```
   *(Note: Ensure you resolve the Port Mismatch or specify `PORT=3002 npx tsx server.ts` so the Vite proxy connects successfully.)*
3. **Start Vite Dev Server** (in a separate terminal):
   ```bash
   npm run dev
   ```
4. **Access UI**:
   Open browser at `http://localhost:3000` (or the port specified by Vite).

### Production Docker Container Deployment
The project is set up to run as a single container in production:
1. **Build Step**:
   During build, the Docker container copies dependencies, compiles TypeScript files, and generates production assets (`dist/`) using `npm run build`.
2. **Nginx Server**:
   A custom Nginx instance is launched inside the container, configured via `nginx.conf`:
   - Listens on Port `3000`.
   - Serves static assets compiled in `dist`.
   - Implements fallback routing (`try_files`) for SPA react-router routing.
   - Proxies `/api/` and `/socket.io/` queries back to the backend microservice containers located at `http://backend:3002`.
