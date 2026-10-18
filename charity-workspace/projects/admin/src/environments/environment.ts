/**
 * Admin-side environment configuration.
 * Points at the same RESTful API as the client website.
 * Update `apiBaseUrl` after deploying the API to the SCU cPanel.
 */
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
