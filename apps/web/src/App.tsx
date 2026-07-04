import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ComingSoon } from "./pages/ComingSoon";
import { Vorm } from "./pages/Vorm";

// App-shell: same-origin mount + react-router + bottom-nav. Schema/Trainingen/
// Niveau zijn "binnenkort"-placeholders; Vorm is gevuld (Fase 5.1b, Vorm-lite:
// conditie-balans + check-in + live level/metrics uit /api/settings|wellness|checkin).
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* default-tab = Schema (volgt de prototype-default `useState('schema')`) */}
          <Route index element={<Navigate to="/schema" replace />} />
          <Route path="/schema" element={<ComingSoon tab="Schema" />} />
          <Route path="/vorm" element={<Vorm />} />
          <Route path="/trainingen" element={<ComingSoon tab="Trainingen" />} />
          <Route path="/niveau" element={<ComingSoon tab="Niveau" />} />
          <Route path="*" element={<Navigate to="/schema" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
