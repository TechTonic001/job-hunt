/**
 * Dynamically loads the Google Identity Services (GIS) JavaScript client SDK
 * @returns {Promise<google>} Resolves with window.google when the script is loaded
 */
export const loadGoogleIdentityServices = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }

    const existingScript = document.getElementById('google-identity-services');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-identity-services';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = (err) => reject(new Error(`Failed to load Google Identity Services: ${err.message || 'Network error'}`));

    document.head.appendChild(script);
  });
};

export default loadGoogleIdentityServices;
