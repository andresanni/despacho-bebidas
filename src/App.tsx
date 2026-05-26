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
          colorSuccess: "#22c55e",
          colorPrimary: "#0f91b6",
          colorWarning: "#f59e0b",
          colorError: "#ef4444",
          colorInfo: "#38bdf8",
          colorBgBase: "#08111f",
          colorBgContainer: "#101b2c",
          colorBgElevated: "#132033",
          colorBorder: "#26384f",
          colorBorderSecondary: "#1c2b40",
          colorTextBase: "#e6eef8",
          colorTextSecondary: "#9fb0c5",
          colorTextTertiary: "#73839a",
          borderRadius: 8,
          borderRadiusLG: 8,
          borderRadiusSM: 6,
          controlHeight: 38,
          controlHeightLG: 46,
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontSizeHeading1: 38,
          fontSizeHeading2: 30,
          fontSizeHeading3: 24,
          fontSizeHeading4: 20,
          lineHeight: 1.45,
          lineHeightHeading1: 1.12,
          lineHeightHeading2: 1.16,
          lineHeightHeading3: 1.2,
          lineHeightHeading4: 1.24,
          boxShadow:
            "0 14px 40px rgba(0, 0, 0, 0.28), 0 1px 0 rgba(255, 255, 255, 0.03)",
          controlItemBgHover: "#17263a",
          controlItemBgActive: "#15334a",
        },
        components: {
          Button: {
            primaryShadow: "0 10px 24px rgba(15, 145, 182, 0.26)",
            defaultBg: "#111f31",
            defaultBorderColor: "#2a3d55",
            defaultColor: "#d8e5f2",
          },
          Card: {
            colorBgContainer: "#101b2c",
            headerBg: "#101b2c",
            paddingLG: 20,
          },
          Layout: {
            bodyBg: "#08111f",
            headerBg: "#0b1625",
            siderBg: "#08111f",
          },
          Menu: {
            itemBg: "transparent",
            itemColor: "#8fa3ba",
            itemHoverBg: "#122236",
            itemHoverColor: "#f5f9ff",
            itemSelectedBg: "#12344b",
            itemSelectedColor: "#ffffff",
            itemBorderRadius: 8,
          },
          Table: {
            headerBg: "#132235",
            headerColor: "#c8d7e8",
            rowHoverBg: "#13253a",
            borderColor: "#22344b",
          },
          Tag: {
            borderRadiusSM: 999,
          },
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
