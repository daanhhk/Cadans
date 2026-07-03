import { niveauTier_ } from "@cadans/engine";
import "./App.css";

function App() {
  return (
    <main className="app">
      <h1>Cadans</h1>
      <p>Engine niveau-tier @ 30: {niveauTier_(30)}</p>
    </main>
  );
}

export default App;
