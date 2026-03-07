import { createAuthConfig } from '@workspace/login';

export const authConfig = createAuthConfig({
  cookieName: 'jt_token',
  csrfCookieName: 'jt_csrf',
  appName: 'ApplyFlow',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5181',
  emailFrom: process.env.EMAIL_FROM || 'noreply@applyflow.local',
});
