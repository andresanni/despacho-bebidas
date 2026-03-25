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
          colorPrimary: "#0891b2", // Teal/Cian intenso (más moderno y refrescante)
          colorBgBase: "#0d1421", // Azul-gris profundo oscuro
          colorBgContainer: "#111827", // Fondo de inputs más integrado
          colorBorder: "#1f2937", // Bordes más sutiles
          colorTextBase: "#ffffff",
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
