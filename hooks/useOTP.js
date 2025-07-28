import { api } from '../lib/api'

const useOTP = () => {
  const countries = {
    AR: {
      primary: 'Argentina',
      secondary: '+54'
    },
    BE: {
      primary: 'Belgium',
      secondary: '+32'
    },
    CA: {
      primary: 'Canada',
      secondary: '+1'
    },
    CO: {
      primary: 'Colombia',
      secondary: '+57'
    },
    EG: {
      primary: 'Egypt',
      secondary: '+20'
    },
    GB: {
      primary: 'United Kingdom',
      secondary: '+44'
    },
    HN: {
      primary: 'Honduras',
      secondary: '+504'
    },
    IN: {
      primary: 'India',
      secondary: '+91'
    },
    MX: {
      primary: 'Mexico',
      secondary: '+52'
    },
    PH: {
      primary: 'Philippines',
      secondary: '+63'
    },
    SA: {
      primary: 'Saudi Arabia',
      secondary: '+966'
    },
    ZA: {
      primary: 'South Africa',
      secondary: '+27'
    },
    US: {
      primary: 'United States',
      secondary: '+1'
    }
  }

  /**
   * Check if user exists.
   *
   * @param {string} countryCode - The user's country code.
   * @param {string} phone - The user's phone number.
   *
   * @returns {Promise<object>}
   */
  const checkUser = async (countryCode, phone) => {
    return await api('post', '/users/check', {
      countryCode: countryCode,
      phone: parseInt(phone, 10)
    })
  }

  /**
   * Send OTP to phone number.
   *
   * @param {string} countryCode - The user's country code.
   * @param {string} phone - The user's phone number.
   *
   * @returns {Promise<object>}
   */
  const sendOTP = async (countryCode, phone) => {
    return await api('post', '/auth/otp/new', {
      countryCode: countryCode,
      phone: parseInt(phone, 10)
    })
  }

  /**
   * Verify OTP.
   *
   * @param {string} countryCode - The user's country code.
   * @param {string} phone - The user's phone number.
   * @param {string} otp - The OTP code sent to the user's phone number.
   * @param {boolean} createManager - Whether to create a manager account.
   *
   * @returns {Promise<object>}
   */
  const verifyOTP = async ({ countryCode, phone, otp, createManager }) => {
    return await api('post', '/auth/otp/verify', {
      countryCode: countryCode,
      phone: parseInt(phone, 10),
      otp,
      createManager
    })
  }

  return {
    countries,
    checkUser,
    sendOTP,
    verifyOTP
  }
}

export default useOTP
