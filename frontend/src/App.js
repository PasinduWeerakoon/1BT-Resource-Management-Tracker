import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routes } from '@routes';
import { PrivateRoute } from '@routes/PrivateRoute';
import { PublicRoute } from '@routes/PublicRoute';

function App() {
  return (
    <Routes>
      {routes.map((route) => {
        const { path, component: Component, isPrivate, isPublic } = route;
        
        if (isPrivate) {
          return (
            <Route
              key={path}
              path={path}
              element={
                <PrivateRoute>
                  <Component />
                </PrivateRoute>
              }
            />
          );
        }
        
        if (isPublic) {
          return (
            <Route
              key={path}
              path={path}
              element={
                <PublicRoute>
                  <Component />
                </PublicRoute>
              }
            />
          );
        }
        
        return (
          <Route key={path} path={path} element={<Component />} />
        );
      })}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
