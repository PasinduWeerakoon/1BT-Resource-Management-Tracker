/**
 * LazyCharts Component
 * Lazy-loaded chart components for better code splitting
 */

import React, { lazy, Suspense } from 'react';
import { Spin } from 'antd';

// Lazy load chart components
const Doughnut = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Doughnut })));
const Bar = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Bar })));
const Line = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Line })));
const Pie = lazy(() => import('react-chartjs-2').then(module => ({ default: module.Pie })));

// Chart loading fallback
const ChartFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 200,
  }}>
    <Spin size="small" />
  </div>
);

// Wrapped chart components with Suspense
export const LazyDoughnut = (props) => (
  <Suspense fallback={<ChartFallback />}>
    <Doughnut {...props} />
  </Suspense>
);

export const LazyBar = (props) => (
  <Suspense fallback={<ChartFallback />}>
    <Bar {...props} />
  </Suspense>
);

export const LazyLine = (props) => (
  <Suspense fallback={<ChartFallback />}>
    <Line {...props} />
  </Suspense>
);

export const LazyPie = (props) => (
  <Suspense fallback={<ChartFallback />}>
    <Pie {...props} />
  </Suspense>
);
