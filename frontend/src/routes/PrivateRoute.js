import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import MainLayout from '@layouts/MainLayout';

export const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout>{children}</MainLayout>;
};
