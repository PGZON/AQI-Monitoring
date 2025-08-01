/**
 * Request Coordinator
 * Prevents multiple simultaneous requests during app initialization
 */

class RequestCoordinator {
  constructor() {
    this.pendingRequests = new Map();
    this.requestQueue = [];
    this.isProcessing = false;
    this.initializationComplete = false;
  }

  /**
   * Coordinate a request to prevent duplicates
   */
  async coordinateRequest(key, requestFn, options = {}) {
    const { 
      priority = 0, 
      timeout = 10000, 
      allowRetry = true,
      maxRetries = 3 
    } = options;

    // If request is already pending, return the existing promise
    if (this.pendingRequests.has(key)) {
      console.log(`⏳ [Coordinator] Request already pending for ${key}`);
      return this.pendingRequests.get(key);
    }

    // Create the request promise
    const requestPromise = this.executeRequest(key, requestFn, {
      timeout,
      allowRetry,
      maxRetries
    });

    // Store the promise
    this.pendingRequests.set(key, requestPromise);

    // Clean up when request completes
    requestPromise.finally(() => {
      this.pendingRequests.delete(key);
    });

    return requestPromise;
  }

  /**
   * Execute the actual request with retry logic
   */
  async executeRequest(key, requestFn, options) {
    const { timeout, allowRetry, maxRetries } = options;
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🚀 [Coordinator] Executing request ${key} (attempt ${attempt})`);
        
        // Add timeout to the request
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Request timeout')), timeout);
        });

        const result = await Promise.race([
          requestFn(),
          timeoutPromise
        ]);

        console.log(`✅ [Coordinator] Request ${key} completed successfully`);
        return result;

      } catch (error) {
        lastError = error;
        console.warn(`⚠️ [Coordinator] Request ${key} failed (attempt ${attempt}):`, error.message);

        if (!allowRetry || attempt >= maxRetries) {
          console.error(`❌ [Coordinator] Request ${key} failed after ${attempt} attempts`);
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /**
   * Batch multiple requests together
   */
  async batchRequests(requests) {
    console.log(`📦 [Coordinator] Batching ${requests.length} requests`);
    
    const results = await Promise.allSettled(
      requests.map(({ key, requestFn, options }) => 
        this.coordinateRequest(key, requestFn, options)
      )
    );

    const successful = results.filter(r => r.status === 'fulfilled');
    const failed = results.filter(r => r.status === 'rejected');

    console.log(`📊 [Coordinator] Batch completed: ${successful.length} successful, ${failed.length} failed`);

    return {
      successful: successful.map(r => r.value),
      failed: failed.map(r => r.reason)
    };
  }

  /**
   * Mark initialization as complete
   */
  markInitializationComplete() {
    this.initializationComplete = true;
    console.log('✅ [Coordinator] App initialization marked as complete');
  }

  /**
   * Check if initialization is complete
   */
  isInitializationComplete() {
    return this.initializationComplete;
  }

  /**
   * Get current stats
   */
  getStats() {
    return {
      pendingRequests: this.pendingRequests.size,
      queueLength: this.requestQueue.length,
      isProcessing: this.isProcessing,
      initializationComplete: this.initializationComplete
    };
  }

  /**
   * Clear all pending requests
   */
  clear() {
    this.pendingRequests.clear();
    this.requestQueue = [];
    this.isProcessing = false;
    console.log('🗑️ [Coordinator] All pending requests cleared');
  }
}

// Create singleton instance
const requestCoordinator = new RequestCoordinator();

export default requestCoordinator; 