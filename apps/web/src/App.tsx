import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Events } from "./pages/Events";
import { Instellingen } from "./pages/Instellingen";
import { Niveau } from "./pages/Niveau";
import { Schema } from "./pages/Schema";
import { Trainingen } from "./pages/Trainingen";
import { Vorm } from "./pages/Vorm";
import { Weekplanner } from "./pages/Weekplanner";

// Dev-only preview-loop (fixture-render van de Schema-flow). import.meta.env.DEV is een
// compile-time-constant → in de prod-build wordt deze tak (incl. de dynamic import) ge-DCE'd,
// dus Preview.tsx + de fixtures belanden NIET in de prod-bundel (geverifieerd via bundel-grep).
const PreviewPage = import.meta.env.DEV
  ? lazy(() => import("./pages/Preview").then((m) => ({ default: m.Preview })))
  : null;

// App-shell: same-origin mount + react-router + bottom-nav. Alle vier de tabs zijn nu gevuld uit de
// /api-routes: Schema (weekvoorstel), Vorm (5.1b, Vorm-lite), Trainingen (B2, bibliotheek + inplannen)
// en Niveau (5.2, Vermogen-snapshot + Progressie; engine client-side).
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* default-tab = Schema (volgt de prototype-default `useState('schema')`) */}
          <Route index element={<Navigate to="/schema" replace />} />
          <Route path="/schema" element={<Schema />} />
          <Route path="/vorm" element={<Vorm />} />
          <Route path="/trainingen" element={<Trainingen />} />
          <Route path="/niveau" element={<Niveau />} />
          {import.meta.env.DEV && PreviewPage && (
            <Route
              path="/preview"
              element={
                <Suspense fallback={null}>
                  <PreviewPage />
                </Suspense>
              }
            />
          )}
          <Route path="*" element={<Navigate to="/schema" replace />} />
        </Route>
        {/* Instellingen = full-screen (eigen terug-knop, geen bottom-nav) → sibling
            van de shell-layout; het tandwiel in de AppShell-header navigeert hierheen. */}
        <Route path="/instellingen" element={<Instellingen />} />
        {/* Weekplanner-editor = full-screen; bereikbaar via het kalender-icoon op de
            Schema-tab (WeekLoad). Sibling van de shell-layout. */}
        <Route path="/weekplanner" element={<Weekplanner />} />
        {/* Events-editor = full-screen; bereikbaar via de "Doelen & events"-sectie in
            Instellingen. Sibling van de shell-layout. */}
        <Route path="/events" element={<Events />} />
      </Routes>
    </BrowserRouter>
  );
}
