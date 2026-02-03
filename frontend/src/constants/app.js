/**
 * Application-wide Constants
 * Centralized constants for pagination, UI defaults, and common values
 */

/**
 * Pagination Constants
 */
export const PAGINATION = {
  // Default page sizes
  DEFAULT_PAGE_SIZE: 20,
  DEFAULT_PAGE_SIZE_SMALL: 10,
  DEFAULT_PAGE_SIZE_LARGE: 50,
  
  // Page size options for dropdowns
  PAGE_SIZE_OPTIONS: ['10', '20', '50', '100'],
  
  // Default page number
  DEFAULT_PAGE: 1,
  
  // Minimum and maximum page sizes
  MIN_PAGE_SIZE: 1,
  MAX_PAGE_SIZE: 100,
};

/**
 * Table Constants
 */
export const TABLE = {
  // Default table sizes
  SIZE_SMALL: 'small',
  SIZE_MIDDLE: 'middle',
  SIZE_LARGE: 'large',
  
  // Default scroll width
  DEFAULT_SCROLL_X: 800,
  
  // Column width defaults
  COLUMN_WIDTH_SMALL: 100,
  COLUMN_WIDTH_MEDIUM: 150,
  COLUMN_WIDTH_LARGE: 200,
  COLUMN_WIDTH_XLARGE: 250,
};

/**
 * UI Constants
 */
export const UI = {
  // Grid gutters
  GUTTER_SMALL: 16,
  GUTTER_MEDIUM: 20,
  GUTTER_LARGE: 24,
  
  // Responsive breakpoints (Ant Design)
  BREAKPOINT_XS: 24, // Full width on mobile
  BREAKPOINT_SM: 12, // Half width on tablet
  BREAKPOINT_MD: 8,  // One third on desktop
  BREAKPOINT_LG: 8,  // One third on large desktop
  
  // Chart defaults
  CHART_BORDER_WIDTH: 2,
  CHART_BORDER_RADIUS: 4,
  CHART_BORDER_COLOR: '#fff',
};

/**
 * Date/Time Constants
 */
export const DATE_TIME = {
  // Date formats
  DATE_FORMAT: 'YYYY-MM-DD',
  DATE_TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  DISPLAY_DATE_FORMAT: 'DD/MM/YYYY',
  DISPLAY_DATE_TIME_FORMAT: 'DD/MM/YYYY HH:mm',
  
  // Time units (in milliseconds)
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
};

/**
 * Common Values
 */
export const COMMON = {
  // Default empty values
  EMPTY_STRING: '',
  EMPTY_ARRAY: [],
  EMPTY_OBJECT: {},
  
  // Default labels
  NO_DATA_LABEL: 'No Data',
  N_A_LABEL: 'N/A',
  
  // Percentage formatting
  PERCENTAGE_DECIMAL_PLACES: 2,
};

export default {
  PAGINATION,
  TABLE,
  UI,
  DATE_TIME,
  COMMON,
};
