import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppStore } from '../store/useAppStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const usuario = useAppStore((state) => state.usuario);
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }
  return children;
};
