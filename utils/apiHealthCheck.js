import { API_BASE_URL, BUILD_INFO } from '../lib/config'
import { api } from '../lib/api'
import AsyncStorage from '@react-native-async-storage/async-storage'

/**
 * API Health Check Utility
 * Diagnoses API connectivity and endpoint availability
 */

class APIHealthCheck {
  constructor () {
    this.results = []
    this.isRunning = false
  }

  log (message, status = 'info', details = null) {
    const entry = {
      timestamp: new Date().toISOString(),
      message,
      status,
      details
    }
    this.results.push(entry)

    // Console output with color coding
    // Removed emoji from prefix
    const prefix =
      status === 'success'
        ? '[SUCCESS]'
        : status === 'error'
        ? '[ERROR]'
        : status === 'warning'
        ? '[WARNING]'
        : '[INFO]'
    console.log(`${prefix} [API Health] ${message}`, details || '')
  }

  async runHealthCheck (authToken = null) {
    if (this.isRunning) {
      this.log('Health check already running', 'warning')
      return this.results
    }

    this.isRunning = true
    this.results = []

    this.log('========================================')
    this.log('API Health Check Starting')
    this.log('========================================')

    try {
      // 1. Check build configuration
      await this.checkBuildConfig()

      // 2. Check base URL accessibility
      await this.checkBaseURL()

      // 3. Check public endpoints (no auth required)
      await this.checkPublicEndpoints()

      // 4. Check authenticated endpoints (if token provided)
      if (authToken) {
        await this.checkAuthenticatedEndpoints(authToken)
      } else {
        this.log(
          'No auth token provided, skipping authenticated endpoint checks',
          'warning'
        )
      }

      // 5. Test raw fetch to rule out API wrapper issues
      await this.testRawFetch()

      // 6. Check for common issues
      await this.diagnoseCommonIssues()
    } catch (error) {
      this.log(
        'Health check failed with critical error',
        'error',
        error.message
      )
    } finally {
      this.isRunning = false
      this.log('========================================')
      this.log('Health check complete')
      this.log('========================================')
    }

    return this.results
  }

  async checkBuildConfig () {
    this.log('\nBuild Configuration:')
    this.log(
      `Environment: ${
        BUILD_INFO.isDevelopment
          ? 'Development'
          : BUILD_INFO.isProduction
          ? 'Production'
          : 'Preview'
      }`
    )
    this.log(`API Base URL: ${API_BASE_URL}`)

    // Check if localhost is being used in production
    if (!BUILD_INFO.isDevelopment && API_BASE_URL.includes('localhost')) {
      this.log('WARNING: Using localhost in non-development build!', 'error')
      this.log(
        'This will cause 404s on real devices. Check your environment configuration.',
        'error'
      )
    }

    // Check for missing protocol
    if (
      !API_BASE_URL.startsWith('http://') &&
      !API_BASE_URL.startsWith('https://')
    ) {
      this.log('Invalid API URL: Missing http:// or https:// protocol', 'error')
    }
  }

  async checkBaseURL () {
    this.log('\nTesting API Base URL:')
    this.log(`Attempting to reach: ${API_BASE_URL}`)

    try {
      const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
          Accept: 'application/json'
        }
      })

      this.log(
        `Base URL Response: ${response.status} ${response.statusText}`,
        response.ok ? 'success' : 'error'
      )

      if (response.status === 404) {
        this.log(
          'API base URL returns 404 - API might be down or URL is incorrect',
          'error'
        )
      }

      // Try to get response body
      try {
        const text = await response.text()
        if (text) {
          const preview = text.substring(0, 200)
          this.log(`Response preview: ${preview}...`, 'info')

          // Check if we got HTML instead of JSON (common nginx/server error)
          if (text.includes('<!DOCTYPE') || text.includes('<html')) {
            this.log(
              'Server returning HTML instead of JSON - possible proxy/server configuration issue',
              'error'
            )
          }
        }
      } catch (e) {
        // Ignore body read errors
      }
    } catch (error) {
      this.log(`Failed to reach API base URL: ${error.message}`, 'error')

      if (error.message.includes('Network request failed')) {
        this.log(
          'Network request failed - check internet connection or if API server is running',
          'error'
        )

        if (API_BASE_URL.includes('localhost')) {
          this.log(
            'Using localhost - make sure your local API server is running on port 3030',
            'warning'
          )
          this.log('Run: npm run dev (or similar) in your API project', 'info')
        }
      }
    }
  }

  async checkPublicEndpoints () {
    this.log('\nTesting Public Endpoints:')

    const publicEndpoints = [
      { path: '/health', description: 'Health check endpoint' },
      { path: '/status', description: 'Status endpoint' },
      { path: '/ping', description: 'Ping endpoint' },
      { path: '/version', description: 'Version endpoint' }
    ]

    for (const endpoint of publicEndpoints) {
      try {
        const fullUrl = `${API_BASE_URL}${endpoint.path}`
        this.log(`Testing ${endpoint.description}: ${fullUrl}`)

        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          this.log(`${endpoint.path} - Status: ${response.status}`, 'success')
        } else if (response.status === 404) {
          this.log(`${endpoint.path} - Not found (404)`, 'warning')
        } else {
          this.log(`${endpoint.path} - Status: ${response.status}`, 'error')
        }
      } catch (error) {
        this.log(`${endpoint.path} - Error: ${error.message}`, 'error')
      }
    }
  }

  async checkAuthenticatedEndpoints (authToken) {
    this.log('\nTesting Authenticated Endpoints:')
    this.log(`Using auth token: ${authToken.substring(0, 20)}...`)

    const authEndpoints = [
      { path: '/users/me', description: 'User profile', method: 'GET' },
      { path: '/connections', description: 'Connections list', method: 'GET' },
      { path: '/messages', description: 'Messages list', method: 'GET' }
    ]

    for (const endpoint of authEndpoints) {
      try {
        this.log(`Testing ${endpoint.description}: ${endpoint.path}`)

        const response = await api(
          endpoint.method,
          endpoint.path,
          {},
          authToken
        )

        if (response.error) {
          if (response.error.includes('404')) {
            this.log(`${endpoint.path} - Endpoint not found (404)`, 'error')
            this.log(
              'This endpoint should exist. Check API version or routes.',
              'error'
            )
          } else if (
            response.error.includes('401') ||
            response.error.includes('403')
          ) {
            this.log(`${endpoint.path} - Authentication failed`, 'warning')
            this.log('Token might be expired or invalid', 'warning')
          } else {
            this.log(`${endpoint.path} - Error: ${response.error}`, 'error')
          }
        } else {
          this.log(`${endpoint.path} - Success`, 'success')

          // Log some data info
          if (response.data) {
            const dataInfo = Array.isArray(response.data)
              ? `Array with ${response.data.length} items`
              : `Object with keys: ${Object.keys(response.data)
                  .slice(0, 5)
                  .join(', ')}`
            this.log(`Data received: ${dataInfo}`, 'info')
          }
        }
      } catch (error) {
        this.log(`${endpoint.path} - Exception: ${error.message}`, 'error')
      }
    }
  }

  async testRawFetch () {
    this.log('\nTesting Raw Fetch (bypassing API wrapper):')

    try {
      const testUrl = `${API_BASE_URL}/users/me`
      this.log(`Raw fetch to: ${testUrl}`)

      const authToken = await AsyncStorage.getItem('authToken')

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(authToken && { Authorization: `Bearer ${authToken}` })
        }
      })

      this.log(
        `Raw fetch status: ${response.status} ${response.statusText}`,
        response.ok ? 'success' : 'error'
      )

      // Check response headers
      const contentType = response.headers.get('content-type')
      this.log(`Content-Type: ${contentType}`, 'info')

      if (!contentType || !contentType.includes('application/json')) {
        this.log(
          'Response is not JSON - server might be misconfigured',
          'warning'
        )
      }

      // Try to parse response
      try {
        const data = await response.json()
        this.log('Successfully parsed JSON response', 'success')
      } catch (e) {
        const text = await response.text()
        this.log(
          `Failed to parse JSON. Response: ${text.substring(0, 100)}...`,
          'error'
        )
      }
    } catch (error) {
      this.log(`Raw fetch failed: ${error.message}`, 'error')
    }
  }

  async diagnoseCommonIssues () {
    this.log('\nDiagnosing Common Issues:')

    // Check if we're using the right URL for the environment
    if (BUILD_INFO.isDevelopment && !API_BASE_URL.includes('localhost')) {
      this.log(
        'Development build but not using localhost - might be pointing to production',
        'warning'
      )
    }

    if (!BUILD_INFO.isDevelopment && API_BASE_URL.includes('localhost')) {
      this.log(
        'Production/Preview build using localhost - THIS WILL NOT WORK',
        'error'
      )
      this.log(
        'Solution: Set EXPO_PUBLIC_API_URL environment variable to production API',
        'info'
      )
    }

    // Check for /v1 in the URL
    if (!API_BASE_URL.includes('/v1')) {
      this.log(
        'API URL does not include /v1 - might be missing API version',
        'warning'
      )
      this.log('Expected format: https://domain.com/v1', 'info')
    }

    // Check for trailing slash
    if (API_BASE_URL.endsWith('/')) {
      this.log(
        'API URL has trailing slash - this might cause double slashes in requests',
        'warning'
      )
    }

    this.log('\nSummary:')
    const errors = this.results.filter(r => r.status === 'error').length
    const warnings = this.results.filter(r => r.status === 'warning').length
    const successes = this.results.filter(r => r.status === 'success').length

    this.log(
      `Errors: ${errors}, Warnings: ${warnings}, Successes: ${successes}`
    )

    if (errors > 0) {
      this.log('API health check found critical issues', 'error')
      this.log(
        'Review the errors above and check your API configuration',
        'error'
      )
    } else if (warnings > 0) {
      this.log('API is partially working but has some issues', 'warning')
    } else {
      this.log('API appears to be healthy', 'success')
    }
  }

  getFormattedResults () {
    return this.results
      .map(r => {
        // Removed emoji from icon
        const icon =
          r.status === 'success'
            ? '[SUCCESS]'
            : r.status === 'error'
            ? '[ERROR]'
            : r.status === 'warning'
            ? '[WARNING]'
            : '[INFO]'
        return `${icon} ${r.message}${r.details ? ` - ${r.details}` : ''}`
      })
      .join('\n')
  }
}

// Export singleton instance
export default new APIHealthCheck()
