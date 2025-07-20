import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Cleans dirty JSON strings by removing markdown formatting and extracting valid JSON
 * @param dirtyJsonData - The potentially dirty JSON string
 * @returns Clean JSON string ready for parsing
 * @throws Error if input is not a valid string
 */
export function cleanDirtyJsonStr(dirtyJsonData: string): string {
  if (!dirtyJsonData || typeof dirtyJsonData !== "string") {
    throw new Error("Input must be a non-empty string");
  }

  const cleanedStr = dirtyJsonData.trim();

  // Case 1: Extract JSON from markdown code blocks with ```json tag
  const jsonCodeBlockRegex = /```json\s*([\s\S]*?)\s*```/;
  const jsonMatch = cleanedStr.match(jsonCodeBlockRegex);
  if (jsonMatch && jsonMatch[1]) {
    return jsonMatch[1].trim();
  }

  // Case 2: Extract JSON from plain code blocks with ``` tag
  const plainCodeBlockRegex = /```\s*([\s\S]*?)\s*```/;
  const plainMatch = cleanedStr.match(plainCodeBlockRegex);
  if (plainMatch && plainMatch[1]) {
    return plainMatch[1].trim();
  }

  // Case 3: Extract JSON content from surrounding text
  // Look for content between square brackets or curly braces
  if (!cleanedStr.startsWith("{") && !cleanedStr.startsWith("[")) {
    const objectRegex = /(\{[\s\S]*\})/; // Match content between { }
    const arrayRegex = /(\[[\s\S]*\])/; // Match content between [ ]
    const objectMatch = cleanedStr.match(objectRegex);
    const arrayMatch = cleanedStr.match(arrayRegex);
    if (objectMatch && objectMatch[1]) {
      return objectMatch[1].trim();
    } else if (arrayMatch && arrayMatch[1]) {
      return arrayMatch[1].trim();
    }
  }

  // If we didn't find any specific patterns, return the trimmed input
  return cleanedStr;
}
