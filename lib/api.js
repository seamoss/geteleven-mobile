'use strict'

import { API_BASE_URL, DEBUG_ENABLED } from './config'

// React Native compatible API using fetch
// Production: https://platform.getelevenapp.com/v1
// Development: http://localhost:3030/v1
const baseURL = API_BASE_URL

/**
 * API helper function to make requests to the Eleven API using fetch.
 * Compatible with React Native and web environments.
 *
 * @param {string} method The HTTP method to use.
 * @param {string} url The endpoint to request.
 * @param {object} data The data to send with the request.
 * @param {string} authToken The user's authentication token.
 * @param {object} headers Additional headers to send with the request.
 *
 * @returns {Promise<object>} The response from the API.
 */
const api = async (method, url, data = {}, authToken, headers = {}) => {
  const fullUrl = `${baseURL}${url}`

  try {
    const config = {
      method: method.toUpperCase(),
      headers: {
        Accept: 'application/json',
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...headers
      }
    }

    // Only add Content-Type and body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      config.headers['Content-Type'] = 'application/json'
      if (data && Object.keys(data).length > 0) {
        config.body = JSON.stringify(data)
      }
    }

    const response = await fetch(fullUrl, config)

    let result
    try {
      result = await response.json()
    } catch (jsonError) {
      // Handle cases where response is not JSON
      result = { message: 'Invalid JSON response' }
    }

    if (!response.ok) {
      throw new Error(
        result.message || `HTTP ${response.status}: ${response.statusText}`
      )
    }

    return {
      data: result,
      status: response.status
    }
  } catch (err) {
    return {
      error: err.message || 'Super awful API error happening. Call the medics.',
      status: err.status || 500
    }
  }
}

export { api }
export default api
