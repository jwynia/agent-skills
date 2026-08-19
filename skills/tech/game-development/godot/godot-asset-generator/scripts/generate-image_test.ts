import { generateImage } from "./generate-image.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test("Atlas Cloud submits once, polls, and downloads the image", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = Deno.env.get("ATLASCLOUD_API_KEY");
  const calls: Array<{ url: string; method: string; body?: string }> = [];
  const output = await Deno.makeTempFile({ suffix: ".png" });

  Deno.env.set("ATLASCLOUD_API_KEY", "test-key");
  globalThis.fetch = (input, init) => {
    const url = String(input);
    calls.push({ url, method: init?.method || "GET", body: init?.body?.toString() });

    if (url.endsWith("/model/generateImage")) {
      return Promise.resolve(Response.json({ data: { id: "prediction-1", status: "starting" } }));
    }
    if (url.endsWith("/model/prediction/prediction-1")) {
      return Promise.resolve(Response.json({
        data: {
          id: "prediction-1",
          status: "succeeded",
          output: ["https://example.test/image.png"],
        },
      }));
    }
    return Promise.resolve(new Response(new Uint8Array([137, 80, 78, 71])));
  };

  try {
    const result = await generateImage({
      provider: "atlas",
      prompt: "pixel art potion",
      output,
      size: "768x512",
    });

    assert(result.success, result.error || "generation should succeed");
    assert(calls.filter((call) => call.method === "POST").length === 1, "must submit exactly once");
    const request = JSON.parse(calls[0].body || "{}");
    assert(request.model === "black-forest-labs/flux-schnell", "must use the Atlas default model");
    assert(request.size === "768*512", "must translate CLI size to Atlas format");
    assert((await Deno.readFile(output)).length === 4, "must write the downloaded image");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) Deno.env.delete("ATLASCLOUD_API_KEY");
    else Deno.env.set("ATLASCLOUD_API_KEY", originalKey);
    await Deno.remove(output);
  }
});

Deno.test("Atlas Cloud reports a missing API key without submitting", async () => {
  const originalKey = Deno.env.get("ATLASCLOUD_API_KEY");
  Deno.env.delete("ATLASCLOUD_API_KEY");
  const output = await Deno.makeTempFile({ suffix: ".png" });

  try {
    const result = await generateImage({
      provider: "atlas",
      prompt: "pixel art potion",
      output,
    });
    assert(!result.success, "generation should fail");
    assert(
      result.error?.includes("ATLASCLOUD_API_KEY"),
      "error should identify the missing variable",
    );
  } finally {
    if (originalKey !== undefined) Deno.env.set("ATLASCLOUD_API_KEY", originalKey);
    await Deno.remove(output);
  }
});
