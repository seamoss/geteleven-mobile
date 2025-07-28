'use strict'

import api from '../lib/api'

const User = authToken => {
  /**
   * Fetch authenticated user information.
   *
   * @returns {Promise<void>}
   */
  const me = async () => {
    return await api('get', '/users/me', {}, authToken)
  }

  const connections = async () => {
    return await api('get', '/users/me/connections', {}, authToken)
  }

  const getConnection = async connectionId => {
    return await api('get', `/connections/${connectionId}`, {}, authToken)
  }

  return {
    me,
    connections,
    getConnection
  }
}

export default User
