
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

  // Note: user_id is extracted from JWT, not from request body
  // wahoo_user_id is optional and can be fetched from profile if not provided
  
  return { valid: true };
}
