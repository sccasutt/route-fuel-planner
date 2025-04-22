
interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateRequestBody(body: any): ValidationResult {
  if (!body) {
    return { valid: false, error: "Request body is empty" };
  }

  if (!body.access_token) {
    return { valid: false, error: "Missing required field: access_token" };
  }

  if (!body.refresh_token) {
    return { valid: false, error: "Missing required field: refresh_token" };
  }

  // user_id is validated separately against the JWT token
  if (!body.user_id) {
    return { valid: false, error: "Missing required field: user_id" };
  }

  // wahoo_user_id can be null, as it might be fetched from the profile
  
  return { valid: true };
}
