/**
 * Central API Client for SecureShare.
 * Manages Auth Tokens, JSON payloads, multipart file uploads, and binary file downloads.
 */

const BASE_URL = 'https://securesharingsystem.onrender.com/api';

export const getAuthToken = () => {
  return localStorage.getItem('secureshare_token') || '';
};

export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('secureshare_token', token);
  } else {
    localStorage.removeItem('secureshare_token');
  }
};

export async function request(endpoint, options = {}) {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
  };

  // Do not set Content-Type for FormData (browser sets boundary automatically)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Token ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    // If 401 Unauthorized, notify auth context or clean expired tokens
    if (response.status === 401 && !endpoint.includes('/auth/login/')) {
      setAuthToken(null);
      window.dispatchEvent(new CustomEvent('secureshare:unauthorized'));
    }

    // Binary file download
    if (options.isBlob) {
      if (!response.ok) {
        let errMsg = 'Download failed.';
        try {
          const errData = await response.json();
          errMsg = errData.error || errMsg;
        } catch (_) {}
        throw new Error(errMsg);
      }
      return await response.blob();
    }

    const data = await response.json();

    if (!response.ok) {
      const errMsg = data.error || (typeof data === 'string' ? data : Object.values(data)[0]);
      throw new Error(Array.isArray(errMsg) ? errMsg[0] : errMsg || 'Request failed.');
    }

    return data;
  } catch (err) {
    throw err;
  }
}
