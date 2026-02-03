/**
 * cacheSlice
 * API response caching for better performance
 * Optional: Can be used to cache API responses and reduce redundant calls
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Cache entries with timestamp and data
  entries: {},
  // Cache configuration
  config: {
    defaultTTL: 5 * 60 * 1000, // 5 minutes in milliseconds
    maxEntries: 100, // Maximum number of cache entries
  },
  // Cache statistics
  stats: {
    hits: 0,
    misses: 0,
    evictions: 0,
  },
};

const cacheSlice = createSlice({
  name: 'cache',
  initialState,
  reducers: {
    // Set cache entry
    setCacheEntry: (state, action) => {
      const { key, data, ttl } = action.payload;
      const now = Date.now();
      const entryTTL = ttl || state.config.defaultTTL;

      // Evict old entries if we're at max capacity
      const entryKeys = Object.keys(state.entries);
      if (entryKeys.length >= state.config.maxEntries && !state.entries[key]) {
        // Remove oldest entry
        const oldestKey = entryKeys[0];
        delete state.entries[oldestKey];
        state.stats.evictions += 1;
      }

      state.entries[key] = {
        data,
        timestamp: now,
        ttl: entryTTL,
        expiresAt: now + entryTTL,
      };
    },
    // Mark cache entry as accessed (for statistics)
    markCacheAccess: (state, action) => {
      const { key, hit } = action.payload;
      if (hit) {
        state.stats.hits += 1;
      } else {
        state.stats.misses += 1;
        // Remove expired entry if it exists
        if (state.entries[key]) {
          delete state.entries[key];
        }
      }
    },
    // Remove cache entry
    removeCacheEntry: (state, action) => {
      const { key } = action.payload;
      if (state.entries[key]) {
        delete state.entries[key];
      }
    },
    // Clear all cache entries
    clearCache: (state) => {
      state.entries = {};
      state.stats.hits = 0;
      state.stats.misses = 0;
      state.stats.evictions = 0;
    },
    // Clear expired cache entries
    clearExpiredEntries: (state) => {
      const now = Date.now();
      const keys = Object.keys(state.entries);
      let clearedCount = 0;

      keys.forEach((key) => {
        if (state.entries[key].expiresAt <= now) {
          delete state.entries[key];
          clearedCount += 1;
        }
      });

      if (clearedCount > 0) {
        state.stats.evictions += clearedCount;
      }
    },
    // Update cache configuration
    updateCacheConfig: (state, action) => {
      state.config = { ...state.config, ...action.payload };
    },
    // Reset cache statistics
    resetCacheStats: (state) => {
      state.stats = {
        hits: 0,
        misses: 0,
        evictions: 0,
      };
    },
  },
});

export const {
  setCacheEntry,
  markCacheAccess,
  removeCacheEntry,
  clearCache,
  clearExpiredEntries,
  updateCacheConfig,
  resetCacheStats,
} = cacheSlice.actions;

// Selector helpers - Use these in components instead of getCacheEntry action
export const selectCacheEntry = (state, key) => {
  const entry = state.cache.entries[key];
  if (!entry) {
    // Mark as miss
    return null;
  }

  const now = Date.now();
  if (entry.expiresAt > now) {
    // Mark as hit (you can dispatch markCacheAccess if needed)
    return entry.data;
  }

  // Entry expired, will be cleaned up by clearExpiredEntries
  return null;
};

// Helper function to check if cache entry exists and is valid
export const isCacheValid = (state, key) => {
  const entry = state.cache.entries[key];
  if (!entry) return false;

  const now = Date.now();
  return entry.expiresAt > now;
};

export const selectCacheStats = (state) => state.cache.stats;

export default cacheSlice.reducer;
