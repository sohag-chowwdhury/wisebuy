import { claudeService } from "@/lib/ai-services";
import { SEORequest, SEOData } from "@/lib/types";
import {
  createAPIResponse,
  validateRequiredFields,
  APIError,
} from "@/lib/api-utils";
import { VALIDATION_RULES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const seoRequest: SEORequest = await request.json();

    console.log(
      `🔍 [SEO] Received SEO request for: ${seoRequest.productModel}`
    );

    // Validate required fields
    const validationError = validateRequiredFields(
      seoRequest as unknown as Record<string, unknown>,
      VALIDATION_RULES.REQUIRED_FIELDS.SEO
    );
    if (validationError) {
      throw new APIError(validationError, 400);
    }

    // Validate price is a positive number
    if (seoRequest.finalPrice < 0) {
      throw new APIError("Final price must be a positive number", 400);
    }

    const seoContent = await claudeService.generateSEOContent(seoRequest);

    return createAPIResponse<SEOData>(seoContent);
  } catch (error) {
    console.error("💥 [SEO] Error in SEO API:", error);

    if (error instanceof APIError) {
      return createAPIResponse(undefined, error.message, error.status);
    }

    return createAPIResponse(undefined, "Internal server error", 500);
  }
}
