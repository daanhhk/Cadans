import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ComingSoon } from "./pages/ComingSoon";
import { Instellingen } from "./pages/Instellingen";
import { Niveau } from "./pages/Niveau";
import { Schema } from "./pages/Schema";
import { Vorm } from "./pages/Vorm";
import { Weekplanner } from "./pages/Weekplanner";

// App-shell: same-origin mount + react-router + bottom-nav. Schema/Trainingen zijn
// "binnenkort"-placeholders; Vorm (5.1b, Vorm-lite) en Niveau (5.2, Vermogen-
// snapshot + Progressie; engine client-side) zijn gevuld uit de /api-routes.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* default-tab = Schema (volgt de prototype-default `useState('schema')`) */}
          <Route index element={<Navigate to="/schema" replace />} />
          <Route path="/schema" element={<Schema />} />
          <Route path="/vorm" element={<Vorm />} />
          <Route path="/trainingen" element={<ComingSoon tab="Trainingen" />} />
          <Route path="/niveau" element={<Niveau />} />
          <Route path="*" element={<Navigate to="/schema" replace />} />
        </Route>
        {/* Instellingen = full-screen (eigen terug-knop, geen bottom-nav) → sibling
            van de shell-layout; het tandwiel in de AppShell-header navigeert hierheen. */}
        <Route path="/instellingen" element={<Instellingen />} />
        {/* Weekplanner-editor = full-screen; bereikbaar via het kalender-icoon op de
            Schema-tab (WeekLoad). Sibling van de shell-layout. */}
        <Route path="/weekplanner" element={<Weekplanner />} />
      </Routes>
    </BrowserRouter>
  );
}
