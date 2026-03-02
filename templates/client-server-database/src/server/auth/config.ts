import { createAuthConfig } from '@workspace/login';

export const authConfig = createAuthConfig({
  cookieName: 'app_token',
  csrfCookieName: 'app_csrf',
  appName: 'App',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5174',
  emailFrom: process.env.EMAIL_FROM || 'noreply@app.local',
});
