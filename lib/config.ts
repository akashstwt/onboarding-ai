/**
 * Application Configuration
 * Toggle between dummy data and real API calls
 */

export const APP_CONFIG = {
  // Set to true to use dummy data, true to use real API
  USE_DUMMY_DATA: false,

  // Individual feature flags (optional - overrides USE_DUMMY_DATA if set)
  FEATURES: {
    BROADCAST: true,        // Use dummy data for broadcast
    CHAT_LINK: true,        // Use dummy data for chat-link
    PROMPTS: true,          // Use dummy data for prompts
    SETTINGS: true,         // Use dummy data for settings
    TELEGRAM: true,         // Use dummy data for telegram mentions
    USER_MAPPINGS: true,    // Use dummy data for user mappings
    CRLA: true,             // Use dummy data for CRLA
    PULSE: true,            // Use dummy data for pulse
    CHAT: true,            // Chat always uses real API
    USERS: false,           // Users always uses real API
  }
};

/**
 * Check if a feature should use dummy data
 */
export const isDummyDataEnabled = (feature: keyof typeof APP_CONFIG.FEATURES): boolean => {
  return APP_CONFIG.FEATURES[feature] ?? APP_CONFIG.USE_DUMMY_DATA;
};
