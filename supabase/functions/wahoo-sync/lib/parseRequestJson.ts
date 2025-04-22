
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
    
    if (!text || text.trim() === '') {
      console.error("Empty request body received");
      throw new Error("Empty request body");
    }

    try {
      const parsedBody = JSON.parse(text);
      
      // Log safely (without tokens)
      const safeKeys = Object.keys(parsedBody).filter(key => !key.includes('token'));
      console.log("JSON parsed successfully with keys:", safeKeys);
      
      return parsedBody;
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError);
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
