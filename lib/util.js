'use strict'

/**
 * Replace the domain in a URL with a new domain.
 * This is typically used to convert image URLs to use CDN transformations.
 *
 * @param {string} url - The original URL
 * @param {string} newDomain - The new domain to replace with
 * @returns {string} - The URL with the replaced domain
 */
export const replaceDomain = (url, newDomain) => {
  if (!url || !newDomain) return url

  try {
    const urlObj = new URL(url)
    return `https://${newDomain}${urlObj.pathname}${urlObj.search}`
  } catch (error) {
    console.warn('Failed to replace domain:', error)
    return url
  }
}

/**
 * Format a name for consistent display in ElevenAvatar components.
 * Converts full names to "First L." format.
 *
 * @param {string} firstName - The user's first name
 * @param {string} lastName - The user's last name
 * @returns {string|null} - Formatted name or null if no name provided
 */
export const formatAvatarName = (firstName, lastName) => {
  if (!firstName && !lastName) return null

  const first = firstName?.trim() || ''
  const last = lastName?.trim() || ''

  if (!first && !last) return null

  // If we have a last name, format as "First L."
  if (last) {
    return `${first} ${last.slice(0, 1)}.`
  }

  // If we only have a first name, return it
  return first
}

/**
 * Format a connection name for display in messages and headers.
 * Uses full name if available, falls back to phone number.
 *
 * @param {Object} connection - The connection object
 * @returns {string} - Formatted connection name
 */
export const formatConnectionName = connection => {
  if (connection?.full_name) {
    // Use full name for messages feed, just clean up extra spaces
    return connection.full_name.replace(/ +/g, ' ').trim()
  }
  return connection?.phone_last_4 || 'Unknown Connection'
}
