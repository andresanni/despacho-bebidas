import { theme as antdTheme } from 'antd';

export const themeConfig = {
  algorithm: antdTheme.darkAlgorithm,

  token: {
    // === COLORES (Esquema oscuro sobrio y profesional) ===
    colorPrimary: '#6366f1', // Índigo moderno (botones principales)
    colorSuccess: '#10b981', // Verde suave
    colorWarning: '#f59e0b', // Ámbar
    colorError: '#ef4444', // Rojo
    colorInfo: '#3b82f6', // Azul

    colorBgBase: '#0f172a', // Fondo principal (slate-900)
    colorBgContainer: '#1e293b', // Paneles/tarjetas (slate-800)
    colorBgElevated: '#334155', // Modales/dropdowns (slate-700)

    colorTextBase: '#f1f5f9', // Texto principal (slate-100)
    colorTextSecondary: '#94a3b8', // Texto secundario (slate-400)
    colorTextTertiary: '#64748b', // Texto terciario (slate-500)

    colorBorder: '#334155', // Bordes sutiles (slate-700)
    colorBorderSecondary: '#1e293b', // Bordes más sutiles

    // === TIPOGRAFÍA ===
    fontFamily: `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    fontSize: 14, // Base
    fontSizeHeading1: 32, // h1
    fontSizeHeading2: 24, // h2
    fontSizeHeading3: 20, // h3
    fontSizeHeading4: 16, // h4
    fontSizeHeading5: 14, // h5

    lineHeight: 1.5,
    lineHeightHeading1: 1.2,
    lineHeightHeading2: 1.3,

    // === ESPACIADO Y FORMA ===
    borderRadius: 6, // Bordes suaves pero no excesivos
    borderRadiusLG: 8, // Para cards
    borderRadiusSM: 4, // Para inputs pequeños

    // === SOMBRAS (sutiles para profundidad) ===
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  },

  components: {
    // === LAYOUT ===
    Layout: {
      headerBg: '#1e293b',
      headerColor: '#f1f5f9',
      siderBg: '#0f172a',
      bodyBg: '#1e293b',
    },

    // === MENÚ ===
    Menu: {
      darkItemBg: '#0f172a',
      darkItemSelectedBg: '#334155',
      darkItemHoverBg: '#1e293b',
      itemHeight: 50,
      iconSize: 18,
      fontSize: 16,
    },

    // === BOTONES ===
    Button: {
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
      fontWeight: 500,
    },

    // === INPUTS ===
    Input: {
      controlHeight: 36,
      controlHeightLG: 44,
    },

    // === TABLAS ===
    Table: {
      headerBg: '#1e293b',
      headerColor: '#f1f5f9',
      rowHoverBg: '#334155',
    },

    // === CARDS ===
    Card: {
      headerBg: 'transparent',
    },
  },
};
