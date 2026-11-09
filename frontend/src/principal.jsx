import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import Aplicacao from "./Aplicacao";
import "./estilos.css";
import "leaflet/dist/leaflet.css";
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Aplicacao />
    </BrowserRouter>
  </React.StrictMode>,
);
