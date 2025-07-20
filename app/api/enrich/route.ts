import { geminiService } from "@/lib/ai-services";
import {
  createStreamingResponse,
  validateRequiredFields,
  APIError,
} from "@/lib/api-utils";
import { VALIDATION_RULES } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const { productModel } = await request.json();

    // Validate required fields
    const validationError = validateRequiredFields(
      { productModel },
      VALIDATION_RULES.REQUIRED_FIELDS.ENRICH
    );
    if (validationError) {
      throw new APIError(validationError, 400);
    }

    console.log(`🔍 [ENRICH] Starting enrichment for: ${productModel}`);

    const {
      stream,
      sendProgress,
      sendStatus,
      sendResult,
      sendError,
      close,
      headers,
    } = createStreamingResponse();

    // Start async processing
    (async () => {
      try {
        await sendProgress(10);
        await sendStatus("Starting MSRP research...");

        // Step 1: Get MSRP and market research
        const msrpData = await geminiService.getMSRPData(productModel);
        await sendResult("msrp", msrpData);
        await sendProgress(40);

        // Step 2: Get specifications
        await sendStatus("Gathering specifications...");
        const specificationsData = await geminiService.getSpecifications(
          productModel
        );
        await sendResult("specifications", specificationsData);
        await sendProgress(70);

        // Step 3: Get competitive analysis
        await sendStatus("Analyzing competitive landscape...");
        const competitiveData = await geminiService.getCompetitiveAnalysis(
          productModel
        );
        await sendResult("competitive", competitiveData);
        await sendProgress(100);

        // Send completion
        await sendResult("complete", { success: true });
        console.log(`✅ [ENRICH] Enrichment completed for: ${productModel}`);
      } catch (error) {
        console.error("💥 [ENRICH] Error in enrichment process:", error);
        await sendError(
          error instanceof APIError
            ? error.message
            : "Error processing enrichment"
        );
      } finally {
        await close();
      }
    })();

    return new Response(stream, { headers });
  } catch (error) {
    console.error("💥 [ENRICH] Error in enrich API:", error);

    if (error instanceof APIError) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: error.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
