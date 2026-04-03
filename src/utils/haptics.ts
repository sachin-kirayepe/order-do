/**
 * Haptic feedback utility for mobile devices.
 * Uses navigator.vibrate API with graceful fallbacks for desktop/unsupported browsers.
 */

export const haptics = {
  /**
   * Light pulse for regular button clicks or selection changes.
   */
  light: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(10);
    }
  },

  /**
   * Medium pulse for primary actions (e.g. "Next" button).
   */
  medium: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(15);
    }
  },

  /**
   * Success pattern for positive outcomes (e.g. order submitted).
   */
  success: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([20, 10, 20]);
    }
  },

  /**
   * Error pattern for validation failures or errors.
   */
  error: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 30, 50]);
    }
  },

  /**
   * Warning pattern to grab attention.
   */
  warning: () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([30, 10, 30, 10]);
    }
  },
};

export default haptics;
