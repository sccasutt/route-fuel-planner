
export const MAX_STATE_AGE = 15 * 60 * 1000;

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
  if (!stateFromURL) {
    return {
      valid: false,
      reason: "missing-url-state",
      title: "Security error",
      description: "Missing authorization state in response",
    };
  }

  if (!storedStateJSON) {
    return {
      valid: false,
      reason: "missing-stored-state",
      title: "Security error",
      description:
        "Your browser session may have expired. Please try again.",
    };
  }

  let storedState: WahooStateData;
  try {
    storedState = JSON.parse(storedStateJSON);
  } catch {
    return {
      valid: false,
      reason: "parse-fail",
      title: "Security error",
      description: "Invalid state data",
    };
  }

  const stateAge = Date.now() - storedState.created;
  if (stateAge > MAX_STATE_AGE) {
    return {
      valid: false,
      reason: "expired",
      title: "Security error",
      description: "Authorization request expired. Please try again.",
    };
  }

  if (stateFromURL !== storedState.value) {
    return {
      valid: false,
      reason: "state-mismatch",
      title: "Security error",
      description: "Authorization validation failed",
    };
  }

  return { valid: true };
}

