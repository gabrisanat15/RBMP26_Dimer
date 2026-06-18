import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MDDimerPosterPage from "./home.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MDDimerPosterPage />
  </StrictMode>
);
