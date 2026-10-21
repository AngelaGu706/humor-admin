export type ContentFields = { area: string; food: string; recommendation: string; cuisine: string };
export function decodeContent(content: string): ContentFields | null {
  try {
    const value = JSON.parse(content);
    if (value?.format === "nyc-food-pick-v1" && typeof value.area === "string" && typeof value.food === "string" && typeof value.recommendation === "string") {
      return { area: value.area, food: value.food, recommendation: value.recommendation, cuisine: typeof value.cuisine === "string" ? value.cuisine : "" };
    }
  } catch { /* Preserve the original Markdown of older picks. */ }
  return null;
}
export function encodeContent(fields: ContentFields) {
  return JSON.stringify({ format: "nyc-food-pick-v1", area: fields.area, food: fields.food, recommendation: fields.recommendation, ...(fields.cuisine ? { cuisine: fields.cuisine } : {}) });
}
export const cuisines = ["American", "Chinese", "French", "Indian", "Italian", "Japanese", "Korean", "Mediterranean", "Mexican", "Middle Eastern", "Thai", "Vietnamese", "Other"];
export function validateMedia(body: unknown) {
  if (!body || typeof body !== "object") throw new Error("Please fill in the content details.");
  const input = body as Record<string, unknown>;
  const text = (key: string, max: number) => {
    if (typeof input[key] !== "string" || !input[key].trim() || input[key].length > max) throw new Error(`${key[0].toUpperCase() + key.slice(1)} is required and must be at most ${max.toLocaleString()} characters.`);
    return input[key].trim();
  };
  return { title: text("title", 90), prompt: text("prompt", 1000), content: text("content", 10000) };
}
export function isUuid(value: string) { return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value); }
