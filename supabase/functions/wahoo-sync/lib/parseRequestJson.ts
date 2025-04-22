
export async function parseRequestJson(req: Request): Promise<any> {
  try {
    if ((req as any).bodyUsed) {
      console.error("Request body has already been read");
      throw new Error("Request body has already been read");
    }

    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.warn("Request content-type is not application/json:", contentType);
    }

    // Get the raw text from the request
    const text = await req.text();
    console.log("Request body raw length:", text ? text.length : 0);
    
    // Log a snippet of the body for debugging (be careful not to log sensitive data)
    if (text && text.length > 0) {
      console.log("Request body snippet:", text.substring(0, Math.min(50, text.length)) + (text.length > 50 ? "..." : ""));
    } else {
      console.warn("Empty or missing request body");
    }

    if (!text || text.trim() === '') {
      console.error("Empty request body received");
      throw new Error("Empty request body");
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError, "Raw body first 100 chars:", text.substring(0, 100));
      throw new Error("Invalid JSON in request body");
    }
  } catch (err: any) {
    console.error("Error parsing request body:", err);
    throw {
      message: err.message || "Invalid request body",
      status: 400,
    };
  }
}
