import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ComingSoon } from "./pages/ComingSoon";
import { VormScaffold } from "./pages/VormScaffold";

// Fase 5.1a app-shell: same-origin mount + react-router + bottom-nav. Nog GEEN
// tab-data — Schema/Trainingen/Niveau zijn "binnenkort"-placeholders; Vorm is een
// tijdelijke 5.1a-steiger die GET /api/health toont (vervalt in 5.1b).
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* default-tab = Schema (volgt de prototype-default `useState('schema')`) */}
          <Route index element={<Navigate to="/schema" replace />} />
          <Route path="/schema" element={<ComingSoon tab="Schema" />} />
          <Route path="/vorm" element={<VormScaffold />} />
          <Route path="/trainingen" element={<ComingSoon tab="Trainingen" />} />
          <Route path="/niveau" element={<ComingSoon tab="Niveau" />} />
          <Route path="*" element={<Navigate to="/schema" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
