// Create a new file: src/services/tokenManager.js
export class TokenManager {
  constructor() {
    this.token = null;
    this.storageKey = 'mineazy_auth_token';
  }

  setToken(token) {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, token);
        // Also try to set a cookie as backup
        document.cookie = `authToken=${token}; path=/; max-age=86400; SameSite=Lax`;
      } catch (error) {
        console.warn('Could not store token:', error);
      }
    }
  }

  getToken() {
    if (this.token) return this.token;

    if (typeof window !== 'undefined') {
      // Try localStorage first
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored && stored !== 'null' && stored !== 'undefined') {
          this.token = stored;
          return stored;
        }
      } catch (error) {
        console.warn('Could not access localStorage:', error);
      }

      // Fallback to cookies
      try {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'authToken' && value && value !== 'undefined' && value !== 'null') {
            this.token = value;
            return value;
          }
        }
      } catch (error) {
        console.warn('Could not access cookies:', error);
      }
    }

    return null;
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey);
        // Clear cookie
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = `authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
      } catch (error) {
        console.warn('Could not clear token:', error);
      }
    }
  }

  hasToken() {
    return !!this.getToken();
  }
}

// Singleton instance
export const tokenManager = new TokenManager();