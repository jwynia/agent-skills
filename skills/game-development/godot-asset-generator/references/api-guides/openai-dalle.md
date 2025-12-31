# DALL-E 3 API Guide

Complete reference for using OpenAI's DALL-E 3 API for game asset generation.

## Authentication

Set the `OPENAI_API_KEY` environment variable:

```bash
export OPENAI_API_KEY="sk-..."
```

Get your API key from: https://platform.openai.com/api-keys

## API Endpoint

```
POST https://api.openai.com/v1/images/generations
```

## Request Format

```json
{
  "model": "dall-e-3",
  "prompt": "your prompt here",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard",
  "style": "vivid",
  "response_format": "b64_json"
}
```

## Parameters

### model
- `dall-e-3` - Latest model, best quality
- `dall-e-2` - Older model, cheaper, less capable

### size
| Size | Aspect | Best For |
|------|--------|----------|
| 1024x1024 | Square | Sprites, icons, tiles |
| 1792x1024 | Landscape | Backgrounds, scenes |
| 1024x1792 | Portrait | Character art, UI |

### quality
- `standard` - Default, good for most uses ($0.040/image)
- `hd` - Higher detail, sharper ($0.080/image)

### style
- `vivid` - Default, dramatic and vibrant
- `natural` - More realistic, less stylized

### response_format
- `url` - Returns temporary URL (expires in 1 hour)
- `b64_json` - Returns base64-encoded image data

## Response Format

```json
{
  "created": 1699000000,
  "data": [
    {
      "revised_prompt": "A detailed pixel art knight...",
      "b64_json": "iVBORw0KGgoAAAANSUhEUgAA..."
    }
  ]
}
```

Note: DALL-E 3 may revise your prompt. The `revised_prompt` field shows what was actually used.

## Rate Limits

| Tier | Images/min | Images/day |
|------|------------|------------|
| Free | 5 | 50 |
| Tier 1 | 7 | 100 |
| Tier 2+ | 7 | 500+ |

## Pricing (as of 2024)

| Model | Quality | Size | Price |
|-------|---------|------|-------|
| DALL-E 3 | Standard | 1024x1024 | $0.040 |
| DALL-E 3 | Standard | 1792x1024 | $0.080 |
| DALL-E 3 | HD | 1024x1024 | $0.080 |
| DALL-E 3 | HD | 1792x1024 | $0.120 |
| DALL-E 2 | - | 1024x1024 | $0.020 |
| DALL-E 2 | - | 512x512 | $0.018 |

## Error Handling

### Common Errors

| Status | Meaning | Solution |
|--------|---------|----------|
| 401 | Invalid API key | Check OPENAI_API_KEY |
| 429 | Rate limit | Wait and retry |
| 400 | Invalid request | Check prompt/parameters |
| 500 | Server error | Retry with backoff |

### Content Policy

DALL-E 3 has content restrictions. Avoid:
- Violence or gore
- Adult content
- Real people's faces
- Copyrighted characters by name

If rejected, rephrase the prompt to be more abstract.

## TypeScript Example

```typescript
interface DalleRequest {
  model: "dall-e-3" | "dall-e-2";
  prompt: string;
  n: number;
  size: "1024x1024" | "1792x1024" | "1024x1792";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  response_format?: "url" | "b64_json";
}

async function generateWithDalle(prompt: string): Promise<string> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    throw new Error(`DALL-E API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].b64_json;
}
```

## Game Asset Tips

### Pixel Art
```
prompt: "pixel art [subject], 16-bit style, game sprite, clean pixels,
         no anti-aliasing, transparent background, limited color palette"
quality: "standard"  // HD adds unwanted detail
style: "vivid"       // More saturated colors
```

### Backgrounds
```
prompt: "[scene description], game background art, painted style,
         horizontal composition, no characters"
size: "1792x1024"    // Landscape for backgrounds
quality: "hd"        // More detail for backgrounds
```

### UI Elements
```
prompt: "game UI [element], flat design, clean edges, [color scheme],
         game interface style"
quality: "standard"
style: "vivid"
```

### Consistency Tips

1. **Use detailed prompts** - DALL-E 3 follows prompts closely
2. **Specify art style explicitly** - "16-bit pixel art", "hand-painted"
3. **Request transparent backgrounds** - Add "transparent background" or "isolated on white"
4. **Batch with same prompt structure** - Keep base prompt consistent

## Cost Optimization

1. **Start with standard quality** - Use HD only when needed
2. **Use 1024x1024 for sprites** - Smaller is cheaper
3. **Test prompts on DALL-E 2 first** - Much cheaper for iteration
4. **Cache and reuse** - Don't regenerate identical requests
5. **Batch wisely** - Generate variations only when needed

## Integration with generate-image.ts

```bash
# Basic usage
deno run scripts/generate-image.ts --provider dalle \
  --prompt "pixel art knight" --output ./knight.png

# HD quality
deno run scripts/generate-image.ts --provider dalle \
  --prompt "game background forest" --output ./forest.png \
  --quality hd --size 1792x1024

# With style preset
deno run scripts/generate-image.ts --provider dalle \
  --prompt "knight character, front view" --output ./knight.png \
  --style pixel-art
```
