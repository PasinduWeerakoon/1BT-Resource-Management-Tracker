/**
 * Documents Service
 * API calls for document generation and download
 */

import axios from 'axios';
import { API_CONFIG } from '../config';
import { ENDPOINTS } from '../endpoints';
import { getStoredAuth } from '@utils/auth.utils';

// Create a separate axios instance for file downloads to avoid interceptor issues
const fileDownloadClient = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
});

// Add auth token to file download requests
fileDownloadClient.interceptors.request.use(
  (config) => {
    const auth = getStoredAuth();
    if (auth && auth.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Helper function to download a file from blob
 * @param {Blob} blob - File blob
 * @param {Object} response - Axios response object
 * @param {string} defaultFilename - Default filename if not in headers
 */
const downloadFileFromBlob = (blob, response, defaultFilename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  
  // Extract filename from Content-Disposition header or use default
  const contentDisposition = response.headers['content-disposition'];
  let filename = defaultFilename;
  
  if (contentDisposition) {
    const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (filenameMatch && filenameMatch[1]) {
      filename = filenameMatch[1].replace(/['"]/g, '');
      // Decode URI if needed
      try {
        filename = decodeURIComponent(filename);
      } catch (e) {
        // If decode fails, use as is
      }
    }
  }
  
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const documentsService = {
  /**
   * Download summary report as Excel
   * @returns {Promise<Blob>} Excel file blob
   */
  downloadSummaryExcel: async () => {
    const response = await fileDownloadClient.get(ENDPOINTS.DOCUMENTS.EXCEL_SUMMARY, {
      responseType: 'blob',
    });
    
    const blob = response.data;
    const today = new Date().toISOString().split('T')[0];
    downloadFileFromBlob(blob, response, `summary_report_${today}.xlsx`);
    
    return blob;
  },

  /**
   * Download non-billing (critical shadows) report as Excel
   * @param {Object} params - Query parameters (e.g., { track_id: 1 })
   * @returns {Promise<Blob>} Excel file blob
   */
  downloadNonBillingExcel: async (params = {}) => {
    const response = await fileDownloadClient.get(ENDPOINTS.DOCUMENTS.EXCEL_NON_BILLING, {
      responseType: 'blob',
      params,
    });
    
    const blob = response.data;
    const today = new Date().toISOString().split('T')[0];
    downloadFileFromBlob(blob, response, `critical_shadows_report_${today}.xlsx`);
    
    return blob;
  },
};

export default documentsService;
