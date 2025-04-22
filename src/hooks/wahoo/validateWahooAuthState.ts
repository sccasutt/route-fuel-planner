
export const MAX_STATE_AGE = 15 * 60 * 1000; // 15 minutes

export interface WahooStateData {
  value: string;
  created: number;
}

export interface StateValidationResult {
  valid: boolean;
  reason?: string;
  title?: string;
  description?: string;
}

export function validateWahooAuthState(
  stateFromURL: string | null,
  storedStateJSON: string | null
): StateValidationResult {
  // No state in URL - this could be a direct page access
  if (!stateFromURL) {
    return {
      valid: false,
      reason: "missing-url-state",
      title: "Missing state parameter",
      description: "No authorization state was provided in the response",
    };
  }

  // No stored state - could be expired or first time access
  if (!storedStateJSON) {
    return {
      valid: false,
      reason: "missing-stored-state",
      title: "Security error",
      description:
        "Your browser session may have expired. Please try again.",
    };
  }

  // Validate stored state format
  let storedState: WahooStateData;
  try {
    storedState = JSON.parse(storedStateJSON);
  } catch {
    return {
      valid: false,
      reason: "parse-fail",
      title: "Security error",
      description: "Invalid state data in browser session",
    };
  }

  // Check if state is expired
  const stateAge = Date.now() - storedState.created;
  if (stateAge > MAX_STATE_AGE) {
    return {
      valid: false,
      reason: "expired",
      title: "Session expired",
      description: "Your authorization session has expired. Please try again.",
    };
  }

  // Check if state matches
  if (stateFromURL !== storedState.value) {
    return {
      valid: false,
      reason: "state-mismatch",
      title: "Security error",
      description: "Authorization state validation failed",
    };
  }

  return { valid: true };
}
