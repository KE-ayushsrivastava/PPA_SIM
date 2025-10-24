import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./contexts/AuthContext.jsx";
import { ScenarioProvider } from "./contexts/ScenarioContext.jsx"; // 👈 add this import
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <ScenarioProvider>
      <App />
    </ScenarioProvider>
  </AuthProvider>
);
