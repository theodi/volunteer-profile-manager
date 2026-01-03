/**
 * Rate limiter for external API requests
 * 
 * This module provides a queue-based rate limiter to ensure
 * compliance with API rate limits, particularly for the
 * Nominatim geocoding service which requires 1 request per second.
 */

/**
 * A task queued for execution
 */
interface QueuedTask<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

/**
 * Rate limiter configuration options
 */
interface RateLimiterOptions {
  /** Minimum delay between requests in milliseconds */
  minDelayMs: number;
  /** Maximum number of retries for failed requests */
  maxRetries?: number;
  /** Initial retry delay in milliseconds */
  retryDelayMs?: number;
}

/**
 * A rate limiter that ensures requests are spaced out appropriately
 * and provides retry logic for failed requests.
 */
export class RateLimiter {
  private queue: QueuedTask<unknown>[] = [];
  private isProcessing = false;
  private lastRequestTime = 0;
  private readonly minDelayMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(options: RateLimiterOptions) {
    this.minDelayMs = options.minDelayMs;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelayMs = options.retryDelayMs ?? 1000;
  }

  /**
   * Adds a task to the queue and returns a promise that resolves
   * when the task completes.
   * 
   * @param task - The async function to execute
   * @returns Promise that resolves with the task result
   */
  async add<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        execute: task as () => Promise<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });

      if (!this.isProcessing) {
        this.processQueue();
      }
    });
  }

  /**
   * Processes queued tasks with rate limiting
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      if (!task) continue;

      // Wait for rate limit
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      if (timeSinceLastRequest < this.minDelayMs) {
        await this.delay(this.minDelayMs - timeSinceLastRequest);
      }

      // Execute with retry logic
      try {
        const result = await this.executeWithRetry(task.execute);
        this.lastRequestTime = Date.now();
        task.resolve(result);
      } catch (error) {
        task.reject(error);
      }
    }

    this.isProcessing = false;
  }

  /**
   * Executes a task with exponential backoff retry
   */
  private async executeWithRetry<T>(
    task: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await task();
    } catch (error) {
      if (attempt >= this.maxRetries) {
        throw error;
      }

      // Check if error is retryable (network errors, rate limiting)
      if (this.isRetryableError(error)) {
        const delay = this.retryDelayMs * Math.pow(2, attempt);
        await this.delay(delay);
        return this.executeWithRetry(task, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Determines if an error should trigger a retry
   */
  private isRetryableError(error: unknown): boolean {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return true;
    }

    // HTTP errors that might be transient
    if (error && typeof error === 'object') {
      const err = error as Record<string, unknown>;
      const status = err.status || err.statusCode;
      if (typeof status === 'number') {
        // Retry on rate limiting (429) or server errors (5xx)
        return status === 429 || (status >= 500 && status < 600);
      }
    }

    return false;
  }

  /**
   * Helper to delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clears the queue (useful for cleanup)
   */
  clear(): void {
    const tasks = this.queue.splice(0);
    tasks.forEach(task => {
      task.reject(new Error('Queue cleared'));
    });
  }

  /**
   * Returns the number of pending tasks in the queue
   */
  get pendingCount(): number {
    return this.queue.length;
  }
}

/**
 * Singleton rate limiter for Nominatim requests.
 * Configured for 1 request per second as per Nominatim usage policy.
 */
export const nominatimRateLimiter = new RateLimiter({
  minDelayMs: 1000, // 1 second between requests
  maxRetries: 2,
  retryDelayMs: 2000,
});

/**
 * Reverse geocode coordinates to an address using Nominatim.
 * This function is rate-limited and includes retry logic.
 * 
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Address data from Nominatim
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<NominatimReverseResult> {
  return nominatimRateLimiter.add(async () => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'VolunteerProfileManager/1.0',
        },
      }
    );

    if (!response.ok) {
      const error = new Error(`Nominatim request failed: ${response.status}`);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    return response.json();
  });
}

/**
 * Search for a location by address or postcode using Nominatim.
 * This function is rate-limited and includes retry logic.
 * 
 * @param query - Search query (address or postcode)
 * @returns Array of search results from Nominatim
 */
export async function searchLocation(
  query: string
): Promise<NominatimSearchResult[]> {
  return nominatimRateLimiter.add(async () => {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
      {
        headers: {
          'User-Agent': 'VolunteerProfileManager/1.0',
        },
      }
    );

    if (!response.ok) {
      const error = new Error(`Nominatim request failed: ${response.status}`);
      (error as Error & { status: number }).status = response.status;
      throw error;
    }

    return response.json();
  });
}

/**
 * Type definitions for Nominatim API responses
 */
export interface NominatimAddress {
  postcode?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  county?: string;
  state_district?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

export interface NominatimReverseResult {
  display_name?: string;
  address?: NominatimAddress;
  lat?: string;
  lon?: string;
  error?: string;
}

export interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: NominatimAddress;
}
