/**
 * Utility to determine whether Development Preview / Demo Mode is active.
 * Defaults to true whenever no authenticated user token is present in localStorage,
 * allowing live demo exploration without unauthenticated 401 errors.
 * Automatically switches to false once a user logs in with real credentials.
 */
export const isPreviewModeActive = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // In production builds, development preview mode is strictly disabled
  if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    return false;
  }

  const saved = localStorage.getItem('veloop_dev_preview');
  if (saved !== null) {
    return saved === 'true';
  }

  // If user has a real JWT token stored, default to live mode
  const token = localStorage.getItem('veloop_auth_token');
  if (token) {
    return false;
  }

  // When unauthenticated, default to true so visitors see preview data smoothly
  return true;
};
