// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layout/MainLayout';
import Mozos from './pages/Mozos';
import Jornadas from './pages/Jornadas';
import Productos from './pages/Productos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/mozos" replace />} />
          <Route path="mozos" element={<Mozos />} />
          <Route path="jornadas" element={<Jornadas />} />
          <Route path="productos" element={<Productos />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
