import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ComingSoon } from "./pages/ComingSoon";
import { Niveau } from "./pages/Niveau";
import { Vorm } from "./pages/Vorm";

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
          <Route path="/schema" element={<ComingSoon tab="Schema" />} />
          <Route path="/vorm" element={<Vorm />} />
          <Route path="/trainingen" element={<ComingSoon tab="Trainingen" />} />
          <Route path="/niveau" element={<Niveau />} />
          <Route path="*" element={<Navigate to="/schema" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
