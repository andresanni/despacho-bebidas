import { ConfigProvider, theme } from "antd";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./layouts/MainLayout";
import { useEffect } from "react";
import { JornadasView } from "./views/JornadasView";
import { DespachoView } from "./views/DespachoView";
import { CatalogoView } from "./views/CatalogoView";
import { MozosView } from "./views/MozosView";
import { LoginView } from "./views/LoginView";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useAppStore } from "./store/useAppStore";

function App() {
  const inicializarAuth = useAppStore((state) => state.inicializarAuth);

  useEffect(() => {
    inicializarAuth();
  }, [inicializarAuth]);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: "#155e75", // Cyan 800 - Más sobrio y profesional
          colorBgBase: "#0d1421", // Azul-gris profundo oscuro
          colorBgContainer: "#0d1421", // Fondo de contenedores (inputs, etc) integrado al base
          colorBgElevated: "#111827", // Fondo de Modales, Drawers y Selects mucho más oscuro
          colorBorder: "#1f2937", // Bordes más sutiles
          colorTextBase: "#e2e8f0", // Blanco apagado (Slate 200) para menor contraste
          controlItemBgHover: "#1e293b", // Highlight más sutil en Selects
          controlItemBgActive: "#1e293b",
        },
      }}
    >
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<LoginView />} />

          {/* Rutas protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
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
