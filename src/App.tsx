import { ConfigProvider, theme } from "antd";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { JornadasView } from "./views/JornadasView";
import { DespachoView } from "./views/DespachoView";
import { CatalogoView } from "./views/CatalogoView";
import { MozosView } from "./views/MozosView";

function App() {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#d97706", // Naranja cálido (estilo gastronomía)
          colorBgBase: "#121212",
          colorTextBase: "#ffffff",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Ruta por defecto: Historial */}
            <Route index element={<JornadasView />} />

            {/* Módulos Operativos */}
            <Route path="despacho" element={<DespachoView />} />
            <Route path="catalogo" element={<CatalogoView />} />
            <Route path="mozos" element={<MozosView />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
}

export default App;
