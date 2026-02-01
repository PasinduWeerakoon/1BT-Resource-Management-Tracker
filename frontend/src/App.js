import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { routes } from '@routes';
import { PrivateRoute } from '@routes/PrivateRoute';
import { PublicRoute } from '@routes/PublicRoute';
import LoadingState from '@components/LoadingState';

// Suspense fallback component
const SuspenseFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
  }}>
    <LoadingState message="Loading page..." size="large" />
  </div>
);

function App() {
  return (
    <Suspense fallback={<SuspenseFallback />}>
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
                    <Suspense fallback={<SuspenseFallback />}>
                      <Component />
                    </Suspense>
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
                    <Suspense fallback={<SuspenseFallback />}>
                      <Component />
                    </Suspense>
                  </PublicRoute>
                }
              />
            );
          }
          
          return (
            <Route
              key={path}
              path={path}
              element={
                <Suspense fallback={<SuspenseFallback />}>
                  <Component />
                </Suspense>
              }
            />
          );
        })}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
