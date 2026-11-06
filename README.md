# QMind AI Platform – React frontend

Plain React 18 (Create React App). The only dependencies are `react`, `react-dom` and `react-scripts`.
No UI kit, no icon library, no router, no state library. Icons are inline SVG in `src/components/icons.jsx`; styling is one CSS file.

## Run
```bash
npm install
npm start        # http://localhost:3000
npm run build    # production build in /build
```

## Structure
- `src/index.js`                 – entry point
- `src/App.jsx`                  – layout, sidebar navigation, top bar, organisation switcher, toasts
- `src/store.jsx`                – React Context + hooks state (connections, KPIs, widgets, pipelines, theme)
- `src/data/connectors.js`       – the 22 connectors. **Each connector defines its own credential fields** (API key, OAuth, service-account JSON, access keys, SAS token, connection string, file upload…). Add a connector by adding one object.
- `src/pages/Connectors.jsx`     – connector gallery, per-connector credential form, test connection, Your Connections table
- `src/pages/*`                  – Home, KPI Studio, Dashboards, Intelligence, Copilot, Operations, Administration, Architecture, Phase 2 placeholders
- `src/components/Charts.jsx`    – line, bar, donut and sparkline charts drawn with SVG
- `src/data/seed.js`             – sample data

## Where to connect the backend
- `Connectors.jsx → runTest()`  : replace the simulated test with `POST /api/connections/test`
- `Connectors.jsx → save()`     : replace with `POST /api/connections` (secrets go to the server only; the UI never stores them)
- `Copilot.jsx → answer()`      : replace the scripted replies with the Copilot endpoint

Sample data and Copilot replies are simulated.
