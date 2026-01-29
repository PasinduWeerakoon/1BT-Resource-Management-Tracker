/**
 * API Configuration
 * Base URL and API settings
 */

// Environment-based API URLs
const API_URLS = {
  dev: 'https://s743ays8pa.execute-api.ap-southeast-1.amazonaws.com/dev/api/v1',
  qa: 'https://z7di2kfr2l.execute-api.ap-southeast-1.amazonaws.com/qa/api/v1',
  prod: 'https://s743ays8pa.execute-api.ap-southeast-1.amazonaws.com/prod/api/v1', // Update when prod URL is available
};

// Safely get environment variables (process.env is injected by webpack DefinePlugin)
// DefinePlugin replaces process.env.KEY with the actual string value at build time
const getEnvVar = (key, defaultValue) => {
  // DefinePlugin replaces process.env.KEY with the actual value, so we can access it directly
  try {
    // Access the environment variable directly (DefinePlugin replaces these at build time)
    const value = process.env[key];
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  } catch (e) {
    // Ignore errors
  }
  return defaultValue;
};

// Get environment from process.env or default to 'qa'
// Note: DefinePlugin replaces these with actual values from .env file at build time
const NODE_ENV = process.env.NODE_ENV || 'development';
const REACT_APP_ENV = process.env.REACT_APP_ENV || null;
const REACT_APP_API_BASE_URL = process.env.REACT_APP_API_BASE_URL || null;

const ENV = REACT_APP_ENV || (NODE_ENV === 'production' ? 'prod' : 'qa');

// Select base URL based on environment
const getBaseURL = () => {
  // Check for explicit environment variable
  if (REACT_APP_API_BASE_URL) {
    return REACT_APP_API_BASE_URL;
  }

  // Use environment-based URL
  return API_URLS[ENV] || API_URLS.qa;
};

const baseURL = getBaseURL();

// Debug logging (only in development)
if (typeof globalThis.window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('🔧 API Configuration:');
  console.log('  - REACT_APP_ENV:', REACT_APP_ENV || 'not set (defaulting to qa)');
  console.log('  - NODE_ENV:', NODE_ENV);
  console.log('  - Selected ENV:', ENV);
  console.log('  - BASE_URL:', baseURL);
}

export const API_CONFIG = {
  BASE_URL: baseURL,
  TIMEOUT: 30000, // 30 seconds
  ENV: ENV,
};

export default API_CONFIG;
