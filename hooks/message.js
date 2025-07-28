'use strict'

import api from '../lib/api'

const Message = (authToken, connectionId) => {
  /**
   * Fetch thread information with pagination support.
   *
   * @param {Object} options - Pagination options
   * @param {number} options.limit - Number of messages to fetch (default: 5)
   * @param {number} options.offset - Number of messages to skip (default: 0)
   *
   * @returns {Promise<void>}
   */
  const getMessages = async (options = {}) => {
    const { limit = 5, offset = 0 } = options

    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString()
    })

    return await api(
      'get',
      `/connections/${connectionId}/messages?${params}`,
      {},
      authToken
    )
  }

  /**
   * Send a voice message to a connection.
   *
   * @param {string} audioUri - The local URI of the recorded audio file.
   * @param {number} duration - The duration of the audio in milliseconds.
   *
   * @returns {Promise<void>}
   */
  const sendMessage = async (audioUri, duration) => {
    try {
      // Step 1: Read the audio file and convert to base64
      const response = await fetch(audioUri)
      const blob = await response.blob()

      // Convert blob to base64
      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          // Remove the data:audio/m4a;base64, prefix
          const base64 = reader.result.split(',')[1]
          resolve(base64)
        }
        reader.onerror = reject
        reader.readAsDataURL(blob)
      })

      // Step 2: Upload the file to get a URL
      const uploadResponse = await api(
        'post',
        '/files/upload',
        {
          file: base64Data,
          type: 'audio/mp4' // M4A is actually MP4 audio
        },
        authToken
      )

      if (uploadResponse.error) {
        throw new Error(uploadResponse.error)
      }

      // Step 3: Create the message with the uploaded file URL
      const messageResponse = await api(
        'post',
        `/connections/${connectionId}/messages`,
        {
          length: duration, // Duration in milliseconds
          fileUrl: uploadResponse.data.url
        },
        authToken
      )

      if (messageResponse.error) {
        throw new Error(messageResponse.error)
      }

      return messageResponse
    } catch (err) {
      throw err
    }
  }

  return {
    getMessages,
    sendMessage
  }
}

export default Message
