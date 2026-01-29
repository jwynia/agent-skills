#!/usr/bin/env -S deno run --allow-env --allow-net --allow-write

/**
 * Image Generation CLI - Unified API Wrapper
 *
 * Generate images using DALL-E 3, Replicate, or fal.ai APIs.
 * Provides a consistent interface across providers with style presets.
 *
 * Usage:
 *   deno run --allow-env --allow-net --allow-write scripts/generate-image.ts \
 *     --provider dalle --prompt "pixel art knight" --output ./knight.png
 *
 * Environment Variables:
 *   OPENAI_API_KEY - Required for DALL-E 3
 *   REPLICATE_API_TOKEN - Required for Replicate
 *   FAL_KEY - Required for fal.ai
 *
 * Permissions:
 *   --allow-env: Read API key environment variables
 *   --allow-net: Make API requests
 *   --allow-write: Save generated images
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-image";

// === Style Presets ===
const STYLE_PRESETS: Record<string, { prefix: string; suffix: string; negative?: string }> = {
  "pixel-art": {
    prefix: "pixel art style, 16-bit, retro game sprite,",
    suffix: ", clean pixels, no anti-aliasing, limited color palette",
    negative: "blurry, smooth, gradient, realistic, 3d, photorealistic",
  },
  "hand-drawn": {
    prefix: "hand-drawn illustration,",
    suffix: ", ink lines, sketch style, artistic",
    negative: "photorealistic, 3d render, smooth, digital",
  },
  painterly: {
    prefix: "digital painting, concept art style,",
    suffix: ", painterly brush strokes, artistic lighting",
    negative: "flat, vector, pixel art, low quality",
  },
  vector: {
    prefix: "flat design, vector art style,",
    suffix: ", clean edges, solid colors, minimal shading",
    negative: "realistic, gradient, texture, 3d, photorealistic",
  },
};

// === Types ===
type Provider = "dalle" | "replicate" | "fal";

interface GenerationOptions {
  provider: Provider;
  prompt: string;
  output: string;
  model?: string;
  size?: string;
  style?: string;
  negative?: string;
  quality?: "standard" | "hd";
  outputJson?: boolean;
}

interface GenerationResult {
  success: boolean;
  provider: Provider;
  model: string;
  prompt: string;
  enhancedPrompt: string;
  output: string;
  size: string;
  durationMs: number;
  error?: string;
}

// === Provider: DALL-E 3 ===
async function generateDalle(options: GenerationOptions): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const model = options.model || "dall-e-3";
  const size = options.size || "1024x1024";
  const quality = options.quality || "standard";

  // Validate size
  const validSizes = ["1024x1024", "1792x1024", "1024x1792"];
  if (!validSizes.includes(size)) {
    throw new Error(`Invalid size for DALL-E 3. Valid sizes: ${validSizes.join(", ")}`);
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      prompt: options.prompt,
      n: 1,
      size,
      quality,
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid OpenAI API key");
    } else if (response.status === 429) {
      throw new Error("OpenAI rate limit exceeded. Please wait and try again.");
    } else if (response.status === 400) {
      throw new Error(`OpenAI bad request: ${error}`);
    }
    throw new Error(`OpenAI API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}

// === Provider: Replicate ===
async function generateReplicate(options: GenerationOptions): Promise<string> {
  const apiToken = Deno.env.get("REPLICATE_API_TOKEN");
  if (!apiToken) {
    throw new Error("REPLICATE_API_TOKEN environment variable is not set");
  }

  const model = options.model || "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b";

  // Parse size
  const [width, height] = (options.size || "1024x1024").split("x").map(Number);

  // Build input based on model
  const input: Record<string, unknown> = {
    prompt: options.prompt,
    width,
    height,
  };

  if (options.negative) {
    input.negative_prompt = options.negative;
  }

  // Create prediction
  const createResponse = await fetch("https://api.replicate.com/v1/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${apiToken}`,
    },
    body: JSON.stringify({
      version: model.includes(":") ? model.split(":")[1] : model,
      input,
    }),
  });

  if (!createResponse.ok) {
    const error = await createResponse.text();
    if (createResponse.status === 401) {
      throw new Error("Invalid Replicate API token");
    }
    throw new Error(`Replicate API error (${createResponse.status}): ${error}`);
  }

  const prediction = await createResponse.json();

  // Poll for completion
  let result = prediction;
  while (result.status !== "succeeded" && result.status !== "failed") {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const pollResponse = await fetch(result.urls.get, {
      headers: {
        Authorization: `Token ${apiToken}`,
      },
    });

    if (!pollResponse.ok) {
      throw new Error(`Failed to poll prediction status`);
    }

    result = await pollResponse.json();
  }

  if (result.status === "failed") {
    throw new Error(`Replicate generation failed: ${result.error}`);
  }

  // Get the image URL and download
  const imageUrl = Array.isArray(result.output) ? result.output[0] : result.output;
  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  return btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
}

// === Provider: fal.ai ===
async function generateFal(options: GenerationOptions): Promise<string> {
  const apiKey = Deno.env.get("FAL_KEY");
  if (!apiKey) {
    throw new Error("FAL_KEY environment variable is not set");
  }

  const model = options.model || "fal-ai/flux/schnell";

  // Parse size
  const [width, height] = (options.size || "1024x1024").split("x").map(Number);

  const input: Record<string, unknown> = {
    prompt: options.prompt,
    image_size: { width, height },
    num_images: 1,
  };

  if (options.negative) {
    input.negative_prompt = options.negative;
  }

  const response = await fetch(`https://fal.run/${model}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid fal.ai API key");
    }
    throw new Error(`fal.ai API error (${response.status}): ${error}`);
  }

  const data = await response.json();

  // Get image URL and download
  const imageUrl = data.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error("No image URL in fal.ai response");
  }

  const imageResponse = await fetch(imageUrl);
  const imageBuffer = await imageResponse.arrayBuffer();

  return btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
}

// === Core Generation Function ===
export async function generateImage(options: GenerationOptions): Promise<GenerationResult> {
  const startTime = Date.now();

  // Apply style preset
  let enhancedPrompt = options.prompt;
  let negativePrompt = options.negative;

  if (options.style && STYLE_PRESETS[options.style]) {
    const preset = STYLE_PRESETS[options.style];
    enhancedPrompt = `${preset.prefix} ${options.prompt}${preset.suffix}`;
    if (!negativePrompt && preset.negative) {
      negativePrompt = preset.negative;
    }
  }

  const enhancedOptions = { ...options, prompt: enhancedPrompt, negative: negativePrompt };

  try {
    let base64Image: string;

    switch (options.provider) {
      case "dalle":
        base64Image = await generateDalle(enhancedOptions);
        break;
      case "replicate":
        base64Image = await generateReplicate(enhancedOptions);
        break;
      case "fal":
        base64Image = await generateFal(enhancedOptions);
        break;
      default:
        throw new Error(`Unknown provider: ${options.provider}`);
    }

    // Save image
    const imageBytes = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
    await Deno.writeFile(options.output, imageBytes);

    return {
      success: true,
      provider: options.provider,
      model: options.model || getDefaultModel(options.provider),
      prompt: options.prompt,
      enhancedPrompt,
      output: options.output,
      size: options.size || "1024x1024",
      durationMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      provider: options.provider,
      model: options.model || getDefaultModel(options.provider),
      prompt: options.prompt,
      enhancedPrompt,
      output: options.output,
      size: options.size || "1024x1024",
      durationMs: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

function getDefaultModel(provider: Provider): string {
  switch (provider) {
    case "dalle":
      return "dall-e-3";
    case "replicate":
      return "stability-ai/sdxl";
    case "fal":
      return "fal-ai/flux/schnell";
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate images using AI APIs

Usage:
  deno run --allow-env --allow-net --allow-write scripts/generate-image.ts [options]

Required Options:
  --provider <name>   Provider: dalle, replicate, or fal
  --prompt <text>     Generation prompt
  --output <path>     Output file path (.png)

Optional:
  --model <name>      Specific model (provider-dependent)
  --size <WxH>        Image size (default: 1024x1024)
  --style <name>      Style preset: pixel-art, hand-drawn, painterly, vector
  --negative <text>   Negative prompt (Replicate/fal only)
  --quality <level>   Quality: standard, hd (DALL-E only)
  --json              Output result as JSON
  -h, --help          Show this help

Environment Variables:
  OPENAI_API_KEY       Required for DALL-E 3
  REPLICATE_API_TOKEN  Required for Replicate
  FAL_KEY              Required for fal.ai

Style Presets:
  pixel-art    16-bit pixel art with clean pixels
  hand-drawn   Illustration style with ink lines
  painterly    Digital painting, concept art
  vector       Flat design with solid colors

Examples:
  # Basic DALL-E generation
  ./scripts/generate-image.ts --provider dalle \\
    --prompt "pixel art knight" --output ./knight.png

  # Pixel art with style preset
  ./scripts/generate-image.ts --provider replicate \\
    --prompt "knight character, front view" \\
    --style pixel-art --output ./knight.png

  # HD quality with specific size
  ./scripts/generate-image.ts --provider dalle \\
    --prompt "game background forest" \\
    --size 1792x1024 --quality hd --output ./forest.png

  # Replicate with negative prompt
  ./scripts/generate-image.ts --provider replicate \\
    --prompt "pixel art sword" \\
    --negative "blurry, realistic" --output ./sword.png
`);
}

// === Argument Parsing ===
function parseArgs(args: string[]): GenerationOptions | null {
  const options: Partial<GenerationOptions> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      return null;
    } else if (arg === "--provider" && args[i + 1]) {
      options.provider = args[++i] as Provider;
    } else if (arg === "--prompt" && args[i + 1]) {
      options.prompt = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === "--model" && args[i + 1]) {
      options.model = args[++i];
    } else if (arg === "--size" && args[i + 1]) {
      options.size = args[++i];
    } else if (arg === "--style" && args[i + 1]) {
      options.style = args[++i];
    } else if (arg === "--negative" && args[i + 1]) {
      options.negative = args[++i];
    } else if (arg === "--quality" && args[i + 1]) {
      options.quality = args[++i] as "standard" | "hd";
    } else if (arg === "--json") {
      options.outputJson = true;
    }
  }

  return options as GenerationOptions;
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  const options = parseArgs(args);

  if (!options) {
    printHelp();
    Deno.exit(0);
  }

  // Validate required options
  if (!options.provider) {
    console.error("Error: --provider is required (dalle, replicate, or fal)");
    Deno.exit(1);
  }
  if (!options.prompt) {
    console.error("Error: --prompt is required");
    Deno.exit(1);
  }
  if (!options.output) {
    console.error("Error: --output is required");
    Deno.exit(1);
  }

  // Validate provider
  if (!["dalle", "replicate", "fal"].includes(options.provider)) {
    console.error(`Error: Invalid provider '${options.provider}'. Use: dalle, replicate, or fal`);
    Deno.exit(1);
  }

  // Validate style
  if (options.style && !STYLE_PRESETS[options.style]) {
    console.error(`Error: Invalid style '${options.style}'. Use: ${Object.keys(STYLE_PRESETS).join(", ")}`);
    Deno.exit(1);
  }

  if (!options.outputJson) {
    console.log(`\nGenerating image with ${options.provider}...`);
    console.log(`Prompt: ${options.prompt}`);
    if (options.style) {
      console.log(`Style: ${options.style}`);
    }
  }

  const result = await generateImage(options);

  if (options.outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success) {
      console.log(`\nSuccess! Image saved to: ${result.output}`);
      console.log(`Duration: ${result.durationMs}ms`);
      if (options.style) {
        console.log(`Enhanced prompt: ${result.enhancedPrompt}`);
      }
    } else {
      console.error(`\nError: ${result.error}`);
      Deno.exit(1);
    }
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
