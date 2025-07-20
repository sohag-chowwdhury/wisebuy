import { NextRequest } from "next/server";
import { WordPressPublishData, PublishResponse } from "@/lib/types";
import { createAPIResponse, APIError } from "@/lib/api-utils";

// Helper function to upload image to WordPress Media Library (based on working Go implementation)
async function uploadImageToWordPress(
  base64Image: string,
  title: string,
  wpAuth: string,
  wpDomain: string
): Promise<number | null> {
  try {
    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Image, "base64");

    // Create form data for the image upload (matching Go multipart approach)
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: "image/jpeg" });
    const filename = `${title.replace(/\s+/g, "-").toLowerCase()}.jpg`;

    formData.append("file", blob, filename);

    // Use the same URL format as the working Go code: ?rest_route=/wp/v2/media
    const mediaAPIURL = `${wpDomain}?rest_route=/wp/v2/media`;

    const response = await fetch(mediaAPIURL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${wpAuth}`,
        // Don't set Content-Type - let the browser set it with boundary for FormData
      },
      body: formData,
    });

    // Expect 201 Created status (like Go code expects StatusCreated)
    if (response.status !== 201) {
      const errorText = await response.text();
      console.error(
        `WordPress media upload error (${response.status}):`,
        errorText
      );
      return null;
    }

    const mediaData = await response.json();
    console.log(
      `✅ [MEDIA] Uploaded image with ID: ${mediaData.id}, URL: ${mediaData.source_url}`
    );
    return mediaData.id;
  } catch (error) {
    console.error("Image upload failed:", error);
    return null;
  }
}

// WooCommerce API Product Interface (based on official docs)
interface WooCommerceProduct {
  name: string;
  type: "simple";
  status: "draft" | "pending" | "private" | "publish";
  regular_price: string;
  description: string;
  short_description: string;
  sku?: string;
  manage_stock: boolean;
  stock_quantity?: number;
  stock_status: "instock" | "outofstock" | "onbackorder";
  catalog_visibility: "visible" | "catalog" | "search" | "hidden";
  featured: boolean;
  categories: { id?: number; name: string }[];
  tags: { id?: number; name: string }[];
  images: { id?: number; src?: string; name?: string; alt?: string }[];
  meta_data: { key: string; value: string | number }[];
  slug?: string;
  weight?: string;
  dimensions?: {
    length: string;
    width: string;
    height: string;
  };
}

async function publishToWordPress(
  data: WordPressPublishData
): Promise<PublishResponse> {
  const {
    WC_CONSUMER_KEY,
    WC_CONSUMER_SECRET,
    WP_DOMAIN,
    WP_USERNAME,
    WP_APP_PASSWORD,
  } = process.env;

  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !WP_DOMAIN) {
    throw new APIError(
      "WordPress/WooCommerce credentials not configured. Please check your environment variables.",
      500
    );
  }

  if (!WP_USERNAME || !WP_APP_PASSWORD) {
    throw new APIError(
      "WordPress Application Password credentials not configured. Please add WP_USERNAME and WP_APP_PASSWORD to your environment variables.",
      500
    );
  }

  // Validate WP_DOMAIN format
  if (!WP_DOMAIN.startsWith("http")) {
    throw new APIError(
      "WP_DOMAIN must include the protocol (http:// or https://)",
      500
    );
  }

  try {
    // Create separate authentication for WordPress REST API (media) and WooCommerce API (products)
    const wpAuth = Buffer.from(`${WP_USERNAME}:${WP_APP_PASSWORD}`).toString(
      "base64"
    );
    const wcAuth = Buffer.from(
      `${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`
    ).toString("base64");

    // Upload images to WordPress Media Library using WordPress Application Password
    console.log(
      `🖼️ [PUBLISH] Uploading ${data.images.length} images to WordPress Media Library...`
    );
    const uploadedImages: { id: number }[] = [];

    for (let i = 0; i < data.images.length; i++) {
      const base64Image = data.images[i];
      const imageTitle = `${data.title} - Image ${i + 1}`;

      const mediaId = await uploadImageToWordPress(
        base64Image,
        imageTitle,
        wpAuth,
        WP_DOMAIN
      );
      if (mediaId) {
        uploadedImages.push({ id: mediaId });
      }
    }

    console.log(
      `✅ [PUBLISH] Successfully uploaded ${uploadedImages.length} out of ${data.images.length} images`
    );

    // Generate unique slug and SKU to prevent duplicates
    const timestamp = Date.now();
    const slug = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    const uniqueSku = `${data.sku}-${timestamp}`;

    // Prepare WooCommerce product data according to official API
    const productData: WooCommerceProduct = {
      name: data.title,
      slug: slug,
      type: "simple",
      status: data.status,
      featured: false,
      catalog_visibility: "visible",
      description: data.description,
      short_description:
        data.description.length > 200
          ? data.description.substring(0, 200) + "..."
          : data.description,
      sku: uniqueSku,
      regular_price: data.price.toString(),
      manage_stock: true,
      stock_quantity: data.stockQuantity || 1,
      stock_status: "instock",
      categories: data.categories.map((cat) => ({ name: cat })),
      tags: data.tags.map((tag) => ({ name: tag })),
      images: uploadedImages, // Use uploaded image IDs
      meta_data: [
        { key: "_condition", value: data.condition },
        { key: "_brand", value: data.brand },
        { key: "_flip_forge_processed", value: "true" },
        { key: "_processing_date", value: new Date().toISOString() },
        ...Object.entries(data.specifications).map(([key, value]) => ({
          key: `_spec_${key.toLowerCase().replace(/\s+/g, "_")}`,
          value: value,
        })),
      ],
    };

    const response = await fetch(`${WP_DOMAIN}/wp-json/wc/v3/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${wcAuth}`,
      },
      body: JSON.stringify(productData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("WooCommerce API Error:", errorData);
      throw new APIError(
        `Failed to publish to WordPress: ${response.statusText}`,
        response.status
      );
    }

    const result = await response.json();

    console.log(`✅ [PUBLISH] Product created successfully:`, {
      id: result.id,
      name: result.name,
      permalink: result.permalink,
      images: result.images?.length || 0,
    });

    return {
      success: true,
      productId: result.id.toString(),
      productUrl: result.permalink,
      platform: "wordpress",
    };
  } catch (error) {
    console.error("WordPress publishing error:", error);
    throw error instanceof APIError
      ? error
      : new APIError("Failed to publish to WordPress", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform, data } = body;

    console.log(`🚀 [PUBLISH] Publishing to platform: ${platform}`);

    if (platform === "wordpress") {
      const result = await publishToWordPress(data as WordPressPublishData);
      return createAPIResponse<PublishResponse>(result);
    } else {
      // For other platforms, return "not implemented" message
      return createAPIResponse<PublishResponse>({
        success: false,
        error: "Work in progress - not implemented yet",
        platform: platform,
      });
    }
  } catch (error) {
    console.error("💥 [PUBLISH] Error in publish API:", error);

    if (error instanceof APIError) {
      return createAPIResponse(undefined, error.message, error.status);
    }

    return createAPIResponse(undefined, "Internal server error", 500);
  }
}
