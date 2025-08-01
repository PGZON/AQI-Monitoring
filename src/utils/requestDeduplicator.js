/**
 * Request Deduplicator
 * Prevents duplicate API calls within a short time window
 */

class RequestDeduplicator {
  constructor() {
    this.pendingRequests = new Map();
    this.cache = new Map();
    this.cacheTimeout = 5000; // 5 seconds
  }

  /**
   * Make a deduplicated request
   */
  async makeRequest(key, requestFn) {
    // Check if we have a cached response
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      console.log(`📋 [Deduplicator] Using cached response for ${key}`);
      return cached.data;
    }

    // Check if there's already a pending request
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ [Deduplicator] Request already pending for ${key}, waiting...`);
      return this.pendingRequests.get(key);
    }

    // Create new request
    const requestPromise = requestFn().then(result => {
      // Cache successful response
      this.cache.set(key, {
        data: result,
        timestamp: Date.now()
      });
      
      // Remove from pending
      this.pendingRequests.delete(key);
      
      return result;
    }).catch(error => {
      // Remove from pending on error
      this.pendingRequests.delete(key);
      throw error;
    });

    // Store pending request
    this.pendingRequests.set(key, requestPromise);
    
    return requestPromise;
  }

  /**
   * Generate request key
   */
  generateKey(method, url, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${params[key]}`)
      .join('&');
    
    return `${method}:${url}:${paramString}`;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [Deduplicator] Cache cleared');
  }

  /**
   * Clear pending requests
   */
  clearPending() {
    this.pendingRequests.clear();
    console.log('🗑️ [Deduplicator] Pending requests cleared');
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      pending: this.pendingRequests.size,
      cached: this.cache.size
    };
  }
}

// Create singleton instance
const requestDeduplicator = new RequestDeduplicator();

export default requestDeduplicator; 