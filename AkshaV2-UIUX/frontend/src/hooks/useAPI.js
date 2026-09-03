import { useCallback } from "react";
import axios from "axios";

/**
 * Hook to make API calls using Axios with consistent options.
 */
export const useApi = () => {
  /**
   * Generic API call handler
   *
   * @param url - Full API URL to call
   * @param options - Method, headers, body, timeout, etc.
   */
  const callApi = useCallback(async (url, options = {}) => {
    const {
      method = "POST",
      body = {},
      headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
      timeout = 10000,
    } = options;

    const config = { headers, timeout };

    try {
      if (method === "GET") {
        return await axios.get(url, config);
      } else if (method === "POST") {
        return await axios.post(url, body, config);
      } else if (method === "PUT") {
        return await axios.put(url, body, config);
      } else if (method === "DELETE") {
        return await axios.delete(url, config);
      }
    } catch (error) {
      console.error(`[useApi] ${method} ${url} failed:`, error);
      throw error;
    }
  }, []);

  return { callApi };
};
