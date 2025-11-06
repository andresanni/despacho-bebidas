import { theme as antdTheme } from 'antd';

export const themeConfig = {
  algorithm: antdTheme.darkAlgorithm, // Base oscura de Ant Design

  token: {
    colorPrimary: '#A69CAC', // Botones, acentos
    colorBgBase: '#0D0C1D', // Fondo principal
    colorBgContainer: '#161B33', // Paneles, tarjetas
    colorTextBase: '#F1DAC4', // Texto principal
    colorTextSecondary: '#474973', // Texto atenuado
    colorBorder: '#474973', // Bordes suaves

    borderRadius: 8,
    fontFamily: `'Inter', 'Segoe UI', sans-serif`,
  },
};
