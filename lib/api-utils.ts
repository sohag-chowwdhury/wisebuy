import { APIResponse, StreamingData } from "./types";

// Shared error handling
export class APIError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = "APIError";
  }
}

// Streaming response helper
export function createStreamingResponse() {
  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendData = async (data: StreamingData) => {
    await writer.write(encoder.encode(JSON.stringify(data) + "\n"));
  };

  const sendProgress = async (value: number) => {
    await sendData({ type: "progress", value });
  };

  const sendStatus = async (message: string) => {
    await sendData({ type: "status", message });
  };

  const sendError = async (message: string) => {
    await sendData({ type: "error", message });
  };

  const sendResult = async (type: string, result: any) => {
    await sendData({ type: type as StreamingData["type"], result } as StreamingData);
  };

  const close = async () => {
    await writer.close();
  };

  return {
    stream: stream.readable,
    sendData,
    sendProgress,
    sendStatus,
    sendError,
    sendResult,
    close,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  };
}

// Standard API response helper
export function createAPIResponse<T>(
  data?: T,
  error?: string,
  status: number = 200
): Response {
  const response: APIResponse<T> = {
    success: !error,
    ...(data && { data }),
    ...(error && { error }),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Validation helper
export function validateRequiredFields(
  data: Record<string, unknown>,
  requiredFields: string[]
): string | null {
  for (const field of requiredFields) {
    if (!data[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}

// JSON parsing helper with fallback
export function parseJSONFromText(text: string): unknown {
  // Try to extract JSON from text that might contain markdown or other content
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error("Error parsing extracted JSON:", e);
      throw new APIError("Invalid JSON response from AI service");
    }
  } else {
    throw new APIError("No JSON found in AI response");
  }
}

// Rate limiting helper (simple in-memory implementation)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(identifier);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

// Retry helper for AI services
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
