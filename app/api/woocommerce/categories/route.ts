import { NextRequest } from "next/server";
import { createAPIResponse, APIError } from "@/lib/api-utils";

// WooCommerce Category Interface
interface WooCommerceCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  display: string;
  image: {
    id: number;
    src: string;
    name: string;
    alt: string;
  } | null;
  menu_order: number;
  count: number;
}

// Transformed category for tree structure
interface CategoryTreeNode {
  id: number;
  name: string;
  slug: string;
  description: string;
  count: number;
  image?: {
    id: number;
    src: string;
    name: string;
    alt: string;
  };
  children: CategoryTreeNode[];
  parent: number;
}

async function fetchWooCommerceCategories(): Promise<WooCommerceCategory[]> {
  const { WC_CONSUMER_KEY, WC_CONSUMER_SECRET, WP_DOMAIN } = process.env;



  if (!WC_CONSUMER_KEY || !WC_CONSUMER_SECRET || !WP_DOMAIN) {
    throw new APIError(
      "WooCommerce credentials not configured. Please check your environment variables.",
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
    const wcAuth = Buffer.from(
      `${WC_CONSUMER_KEY}:${WC_CONSUMER_SECRET}`
    ).toString("base64");

    // Fetch all categories with per_page=100 to get comprehensive list
    const response = await fetch(
      `${WP_DOMAIN}/wp-json/wc/v3/products/categories?per_page=100&orderby=name&order=asc`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${wcAuth}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      console.error("🚨 [CATEGORIES] WooCommerce API Error:", errorData);
      console.error("🚨 [CATEGORIES] Response status:", response.status);
      console.error("🚨 [CATEGORIES] Response headers:", Object.fromEntries(response.headers.entries()));
      console.error("🚨 [CATEGORIES] Request URL:", `${WP_DOMAIN}/wp-json/wc/v3/products/categories?per_page=100&orderby=menu_order&order=asc`);
      throw new APIError(
        `Failed to fetch WooCommerce categories: ${response.statusText}`,
        response.status
      );
    }

    const categories: WooCommerceCategory[] = await response.json();
    console.log(`✅ [CATEGORIES] Successfully fetched ${categories.length} categories`);
    
    return categories;
  } catch (error) {
    console.error("WooCommerce categories fetch error:", error);
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError("Failed to fetch WooCommerce categories", 500);
  }
}

function buildCategoryTree(categories: WooCommerceCategory[]): CategoryTreeNode[] {
  // Create a map for quick lookup
  const categoryMap = new Map<number, CategoryTreeNode>();
  
  // Initialize all categories as tree nodes
  categories.forEach(cat => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      count: cat.count,
      image: cat.image || undefined,
      children: [],
      parent: cat.parent
    });
  });

  // Build the tree structure
  const rootCategories: CategoryTreeNode[] = [];
  
  categories.forEach(cat => {
    const node = categoryMap.get(cat.id)!;
    
    if (cat.parent === 0) {
      // This is a root category
      rootCategories.push(node);
    } else {
      // This is a subcategory, add it to its parent
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        parent.children.push(node);
      } else {
        // Parent not found, treat as root category
        rootCategories.push(node);
      }
    }
  });

  return rootCategories;
}

export async function GET(_request: NextRequest) {
  try {
    console.log("🏷️ [CATEGORIES] Fetching WooCommerce categories...");
    
    const categories = await fetchWooCommerceCategories();
    const categoryTree = buildCategoryTree(categories);
    console.log(`🌳 [CATEGORIES] Built tree with ${categoryTree.length} root categories`);
    
    return createAPIResponse({
      categories: categoryTree,
      totalCount: categories.length,
      rootCount: categoryTree.length
    });
    
  } catch (error) {
    console.error("Categories API error:", error);
    
    if (error instanceof APIError) {
      return createAPIResponse({ error: error.message }, undefined, error.status);
    }
    
    return createAPIResponse(
      { error: "Failed to fetch categories" },
      undefined,
      500
    );
  }
} 