import { engineVersion } from "@cadans/engine";
import "./App.css";

function App() {
  return (
    <main className="app">
      <h1>Cadans</h1>
      <p>Engine: {engineVersion()}</p>
    </main>
  );
}

export default App;
