// Only the resources listed here can be read or changed by the course workspace.
export type Field = {
  key: string; label: string; type?: "text" | "long" | "integer" | "boolean" | "uuid" | "email" | "domain";
  required?: boolean; max?: number; min?: number; reference?: string;
};
export type Resource = {
  table: string; title: string; singular: string; description: string; idType?: "uuid";
  columns: string[]; preview: string[]; search: string[];
  fields?: Field[]; updateOnly?: boolean;
  filters?: Record<string, string>; references?: Record<string, string>;
};
export const resources: Record<string, Resource> = {
  users: { table: "profiles", title: "Users", singular: "User", description: "Course profiles and access", idType: "uuid", columns: ["id", "first_name", "last_name", "email", "is_superadmin", "created_datetime_utc", "modified_datetime_utc"], preview: ["first_name", "last_name", "email", "is_superadmin"], search: ["first_name", "last_name", "email"] },
  requests: { table: "caption_requests", title: "Generation requests", singular: "Generation request", description: "Follow a request from its image to the generated captions", columns: ["id", "profile_id", "image_id", "created_datetime_utc", "modified_datetime_utc"], preview: ["profile_id", "image_id", "created_datetime_utc"], search: [], filters: { user: "profile_id", image: "image_id" }, references: { profile_id: "users", image_id: "images" } },
  chains: { table: "llm_prompt_chains", title: "Prompt chains", singular: "Prompt chain", description: "Recorded chain runs and their model responses", columns: ["id", "caption_request_id", "created_datetime_utc", "modified_datetime_utc"], preview: ["caption_request_id", "created_datetime_utc"], search: [], filters: { request: "caption_request_id" }, references: { caption_request_id: "requests" } },
  templates: { table: "humor_flavors", title: "Chain templates", singular: "Chain template", description: "The humor flavors used to organize prompt steps", columns: ["id", "slug", "description", "is_pinned", "created_datetime_utc", "modified_datetime_utc"], preview: ["slug", "description", "is_pinned"], search: ["slug", "description"] },
  steps: { table: "humor_flavor_steps", title: "Prompt steps", singular: "Prompt step", description: "Step order, model settings, and system and user prompts", columns: ["id", "humor_flavor_id", "order_by", "description", "llm_model_id", "llm_temperature", "llm_input_type_id", "llm_output_type_id", "humor_flavor_step_type_id", "llm_system_prompt", "llm_user_prompt", "is_hidden", "created_datetime_utc", "modified_datetime_utc"], preview: ["humor_flavor_id", "order_by", "description", "llm_model_id"], search: ["description", "llm_system_prompt", "llm_user_prompt"], filters: { template: "humor_flavor_id", model: "llm_model_id" }, references: { humor_flavor_id: "templates", llm_model_id: "models" } },
  mix: { table: "humor_flavor_mix", title: "Chain mix", singular: "Mix entry", description: "Choose how many captions each chain template contributes", columns: ["id", "humor_flavor_id", "caption_count", "created_datetime_utc", "modified_datetime_utc"], preview: ["humor_flavor_id", "caption_count", "modified_datetime_utc"], search: [], updateOnly: true, fields: [{ key: "humor_flavor_id", label: "Chain template", type: "integer", reference: "templates", required: true, min: 1 }, { key: "caption_count", label: "Caption count", type: "integer", required: true, min: 0, max: 32767 }], references: { humor_flavor_id: "templates" } },
  content: { table: "captions", title: "AI content", singular: "Caption", description: "Generated captions and the requests behind them", idType: "uuid", columns: ["id", "content", "image_id", "profile_id", "humor_flavor_id", "caption_request_id", "llm_prompt_chain_id", "like_count", "is_public", "is_featured", "created_datetime_utc", "modified_datetime_utc"], preview: ["content", "humor_flavor_id", "like_count", "created_datetime_utc"], search: ["content"], filters: { request: "caption_request_id", chain: "llm_prompt_chain_id", template: "humor_flavor_id", image: "image_id", user: "profile_id" }, references: { image_id: "images", profile_id: "users", humor_flavor_id: "templates", caption_request_id: "requests", llm_prompt_chain_id: "chains" } },
  responses: { table: "llm_model_responses", title: "Model responses", singular: "Model response", description: "Model output, prompts, temperature, and processing time", idType: "uuid", columns: ["id", "llm_model_response", "processing_time_seconds", "llm_model_id", "profile_id", "caption_request_id", "llm_system_prompt", "llm_user_prompt", "llm_temperature", "humor_flavor_id", "llm_prompt_chain_id", "humor_flavor_step_id", "created_datetime_utc", "modified_datetime_utc"], preview: ["llm_model_id", "caption_request_id", "llm_model_response", "processing_time_seconds"], search: ["llm_model_response"], filters: { request: "caption_request_id", chain: "llm_prompt_chain_id", step: "humor_flavor_step_id", model: "llm_model_id" }, references: { llm_model_id: "models", profile_id: "users", caption_request_id: "requests", humor_flavor_id: "templates", llm_prompt_chain_id: "chains", humor_flavor_step_id: "steps" } },
  terms: { table: "terms", title: "Terms", singular: "Term", description: "Vocabulary and examples available to the generation pipeline", columns: ["id", "term", "definition", "example", "priority", "term_type_id", "created_datetime_utc", "modified_datetime_utc"], preview: ["term", "definition", "priority"], search: ["term", "definition", "example"], fields: [{ key: "term", label: "Term", required: true, max: 300 }, { key: "definition", label: "Definition", type: "long", required: true }, { key: "example", label: "Example", type: "long", required: true }, { key: "priority", label: "Priority", type: "integer", required: true, min: -32768, max: 32767 }, { key: "term_type_id", label: "Term type", type: "integer", reference: "term-types", min: 1, max: 32767 }] },
  examples: { table: "caption_examples", title: "Generation examples", singular: "Generation example", description: "Example captions and explanations used as guidance", columns: ["id", "image_description", "caption", "explanation", "priority", "image_id", "caption_example_category_id", "created_datetime_utc", "modified_datetime_utc"], preview: ["caption", "image_description", "priority"], search: ["caption", "image_description", "explanation"], fields: [{ key: "image_description", label: "Image description", type: "long", required: true }, { key: "caption", label: "Caption", type: "long", required: true }, { key: "explanation", label: "Explanation", type: "long", required: true }, { key: "priority", label: "Priority", type: "integer", required: true, min: -32768, max: 32767 }, { key: "image_id", label: "Image ID (optional)", type: "uuid" }, { key: "caption_example_category_id", label: "Category", type: "integer", reference: "example-categories", min: 1 }], references: { image_id: "images" } },
  models: { table: "llm_models", title: "Models", singular: "Model", description: "Model identifiers and provider settings", columns: ["id", "name", "llm_provider_id", "provider_model_id", "is_temperature_supported", "created_datetime_utc", "modified_datetime_utc"], preview: ["name", "llm_provider_id", "provider_model_id", "is_temperature_supported"], search: ["name", "provider_model_id"], fields: [{ key: "name", label: "Name", required: true, max: 200 }, { key: "llm_provider_id", label: "Provider", type: "integer", reference: "providers", required: true, min: 1, max: 32767 }, { key: "provider_model_id", label: "Provider model ID", required: true, max: 300 }, { key: "is_temperature_supported", label: "Supports temperature", type: "boolean", required: true }], references: { llm_provider_id: "providers" } },
  providers: { table: "llm_providers", title: "Providers", singular: "Provider", description: "Model providers. API credentials are managed separately.", columns: ["id", "name", "created_datetime_utc", "modified_datetime_utc"], preview: ["name", "modified_datetime_utc"], search: ["name"], fields: [{ key: "name", label: "Name", required: true, max: 200 }] },
  domains: { table: "allowed_signup_domains", title: "Signup domains", singular: "Signup domain", description: "Email domains allowed to register for the course app", columns: ["id", "apex_domain", "created_datetime_utc", "modified_datetime_utc"], preview: ["apex_domain", "modified_datetime_utc"], search: ["apex_domain"], fields: [{ key: "apex_domain", label: "Domain", type: "domain", required: true, max: 253 }] },
  emails: { table: "whitelist_email_addresses", title: "Email whitelist", singular: "Email address", description: "Individual email addresses allowed to register", columns: ["id", "email_address", "created_datetime_utc", "modified_datetime_utc"], preview: ["email_address", "modified_datetime_utc"], search: ["email_address"], fields: [{ key: "email_address", label: "Email address", type: "email", required: true, max: 254 }] },
  images: { table: "images", title: "Images", singular: "Image", description: "Images referenced by requests and captions", idType: "uuid", columns: ["id", "url", "image_description", "additional_context", "is_public", "created_datetime_utc", "modified_datetime_utc"], preview: ["url", "image_description", "is_public"], search: ["image_description", "additional_context"] },
};
export function resourceFor(key: string): Resource | undefined { return Object.hasOwn(resources, key) ? resources[key] : undefined; }
export const labels: Record<string, string> = {
  id: "ID", first_name: "First name", last_name: "Last name", email: "Email", is_superadmin: "Administrator", profile_id: "User", image_id: "Image", caption_request_id: "Request", humor_flavor_id: "Chain template", llm_prompt_chain_id: "Prompt chain", llm_model_id: "Model", humor_flavor_step_id: "Prompt step", created_datetime_utc: "Created (UTC)", modified_datetime_utc: "Updated (UTC)", llm_model_response: "Response", llm_system_prompt: "System prompt", llm_user_prompt: "User prompt", processing_time_seconds: "Time (seconds)", order_by: "Step", llm_temperature: "Temperature", llm_input_type_id: "Input type ID", llm_output_type_id: "Output type ID", humor_flavor_step_type_id: "Step type ID", is_hidden: "Hidden", is_pinned: "Pinned", is_public: "Public", is_featured: "Featured", like_count: "Likes", llm_provider_id: "Provider", provider_model_id: "Provider model ID", is_temperature_supported: "Supports temperature", apex_domain: "Domain", email_address: "Email address", caption_count: "Caption count", caption_example_category_id: "Category ID", term_type_id: "Term type ID", image_description: "Image description", additional_context: "Context", url: "Image URL",
};
export function fieldLabel(key: string) { return labels[key] || key.replaceAll("_", " ").replace(/^./, c => c.toUpperCase()); }
export function recordTitle(resource: Resource, row: Record<string, unknown>) {
  if (resource.table === "profiles") return [row.first_name, row.last_name].filter(Boolean).join(" ") || String(row.email || `User ${row.id}`);
  return String(row.name || row.term || row.slug || row.apex_domain || row.email_address || row.caption || row.content || `${resource.singular} #${row.id}`);
}
export function validId(value: string, uuid = false) {
  return uuid ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value) : /^[1-9]\d{0,15}$/.test(value) && Number.isSafeInteger(Number(value));
}
export function safeImageUrl(value: unknown) {
  if (typeof value !== "string") return null;
  try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : null; } catch { return null; }
}
export function validateValues(resource: Resource, input: unknown) {
  if (!resource.fields || !input || typeof input !== "object" || Array.isArray(input)) throw new Error("Please submit valid fields.");
  const raw = input as Record<string, unknown>;
  if (Object.keys(raw).some(key => !resource.fields!.some(field => field.key === key))) throw new Error("This form contains a field that cannot be changed.");
  const values: Record<string, string | number | boolean | null> = {};
  for (const field of resource.fields) {
    const value = raw[field.key];
    if (field.type === "boolean") {
      if (typeof value !== "boolean") throw new Error(`${field.label} must be true or false.`);
      values[field.key] = value; continue;
    }
    if (value === null || value === undefined || value === "") {
      if (field.required) throw new Error(`${field.label} is required.`);
      values[field.key] = null; continue;
    }
    if (field.type === "integer") {
      if ((typeof value !== "string" && typeof value !== "number") || !/^-?\d+$/.test(String(value))) throw new Error(`${field.label} must be a whole number.`);
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < (field.min ?? -Number.MAX_SAFE_INTEGER) || number > (field.max ?? Number.MAX_SAFE_INTEGER)) throw new Error(`${field.label} is outside the allowed range.`);
      values[field.key] = number; continue;
    }
    if (typeof value !== "string") throw new Error(`${field.label} must be text.`);
    let text = value.trim();
    if ((field.required && !text) || text.length > (field.max ?? 20000)) throw new Error(`Please check ${field.label.toLowerCase()}.`);
    if (field.type === "uuid" && !validId(text, true)) throw new Error(`${field.label} must be a valid UUID.`);
    if (field.type === "domain") {
      text = text.toLowerCase();
      if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(text)) throw new Error("Enter a domain such as columbia.edu, without https:// or @.");
    }
    if (field.type === "email") {
      text = text.toLowerCase();
      if (!/^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/.test(text)) throw new Error("Enter a valid email address.");
    }
    values[field.key] = text || null;
  }
  return values;
}
