/**
 * ReportHeader Component
 * Standard header for report pages
 * Optimized with React.memo for better performance
 */

import React, { memo } from 'react';
import PropTypes from 'prop-types';

/**
 * ReportHeader Component
 * @param {Object} props
 * @param {string} props.title - Report title
 * @param {React.ReactNode} props.extra - Extra content (buttons, etc.)
 * @param {string} props.className - Additional CSS class
 */
const ReportHeader = ({ title, extra, className = '' }) => {
  return (
    <div className={`report-header ${className}`}>
      <h1 className="report-title">{title}</h1>
      {extra && <div className="report-header-extra">{extra}</div>}
    </div>
  );
};

ReportHeader.propTypes = {
  title: PropTypes.string.isRequired,
  extra: PropTypes.node,
  className: PropTypes.string,
};

// Memoize component to prevent unnecessary re-renders
export default memo(ReportHeader, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.className === nextProps.className &&
    prevProps.extra === nextProps.extra
  );
});
