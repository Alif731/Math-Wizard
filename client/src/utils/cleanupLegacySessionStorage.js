const LEGACY_SESSION_KEYS = ["mathStreak", "visualHintSeen", "matchHintSeen"];
const CLEANUP_FLAG_KEY = "legacySessionCleanup:v1";

export const cleanupLegacySessionStorage = () => {
  try {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(CLEANUP_FLAG_KEY) === "1") return;

    for (const key of LEGACY_SESSION_KEYS) {
      sessionStorage.removeItem(key);
    }

    localStorage.setItem(CLEANUP_FLAG_KEY, "1");
  } catch (error) {
    // Ignore storage access errors in restricted browsing contexts.
  }
};

