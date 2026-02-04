/**
 * API utility module for consistent error handling and response formatting
 */

export interface APIError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: APIError;
}

export interface APICallOptions extends RequestInit {
  timeout?: number;
}

/**
 * Makes an API call with consistent error handling and response formatting
 * 
 * @param endpoint - The API endpoint URL
 * @param options - Fetch options including method, headers, body, and timeout
 * @returns Promise resolving to APIResponse with success flag, data, or error
 */
export async function apiCall<T>(
  endpoint: string,
  options?: APICallOptions
): Promise<APIResponse<T>> {
  const { timeout = 30000, ...fetchOptions } = options || {};

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(endpoint, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle non-OK responses
      if (!response.ok) {
        let errorData: any;
        
        try {
          errorData = await response.json();
        } catch {
          // If response is not JSON, use status text
          errorData = {
            message: response.statusText || 'An error occurred',
            code: `HTTP_${response.status}`,
          };
        }

        return {
          success: false,
          error: {
            message: errorData.message || errorData.detail || 'An error occurred',
            code: errorData.code || `HTTP_${response.status}`,
            details: errorData.details,
            timestamp: errorData.timestamp || new Date().toISOString(),
          },
        };
      }

      // Parse successful response
      const data = await response.json();

      return {
        success: true,
        data,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    // Handle network errors, timeouts, and other exceptions
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: {
            message: 'Request timeout - please try again',
            code: 'TIMEOUT_ERROR',
            timestamp: new Date().toISOString(),
          },
        };
      }

      return {
        success: false,
        error: {
          message: error.message || 'Network error - please check your connection',
          code: 'NETWORK_ERROR',
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Fallback for unknown error types
    return {
      success: false,
      error: {
        message: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * Helper function for GET requests
 */
export async function apiGet<T>(
  endpoint: string,
  options?: Omit<APICallOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'GET',
  });
}

/**
 * Helper function for POST requests
 */
export async function apiPost<T>(
  endpoint: string,
  body?: any,
  options?: Omit<APICallOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function for PATCH requests
 */
export async function apiPatch<T>(
  endpoint: string,
  body?: any,
  options?: Omit<APICallOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete<T>(
  endpoint: string,
  options?: Omit<APICallOptions, 'method' | 'body'>
): Promise<APIResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: 'DELETE',
  });
}

export default apiCall;
