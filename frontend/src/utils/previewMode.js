/**
 * Utility to determine whether Development Preview Mode is active.
 * In production builds (import.meta.env.PROD === true), preview mode
 * is strictly disabled to prevent bypass of real backend authentication.
 */
export const isPreviewModeActive = () => {
  if (import.meta.env.PROD) {
    return false;
  }

  const saved = typeof window !== 'undefined' ? localStorage.getItem('veloop_dev_preview') : null;
  if (saved !== null) {
    return saved === 'true';
  }

  return import.meta.env.VITE_ENABLE_DEV_PREVIEW === 'true';
};
