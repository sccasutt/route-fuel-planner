
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

    const text = await req.text();
    console.log("Request body raw length:", text ? text.length : 0);

    if (!text || text.trim() === '') {
      throw new Error("Empty request body");
    }

    try {
      return JSON.parse(text);
    } catch (jsonError) {
      console.error("JSON parse error:", jsonError, "Raw body:", text);
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
