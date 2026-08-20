import { generateImage } from "./generate-image.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

Deno.test("MuAPI submits once, polls, and downloads without forwarding the API key", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = Deno.env.get("MUAPI_API_KEY");
  const calls: Array<{ url: string; method: string; headers: Headers; body?: string }> = [];
  const output = await Deno.makeTempFile({ suffix: ".png" });

  Deno.env.set("MUAPI_API_KEY", "test-key");
  globalThis.fetch = (input, init) => {
    const url = String(input);
    calls.push({
      url,
      method: init?.method || "GET",
      headers: new Headers(init?.headers),
      body: typeof init?.body === "string" ? init.body : undefined,
    });

    if (url.endsWith("/flux-dev-image")) {
      return Promise.resolve(jsonResponse({ request_id: "request-1", status: "processing" }));
    }
    if (url.endsWith("/predictions/request-1/result")) {
      return Promise.resolve(jsonResponse({
        id: "request-1",
        status: "completed",
        outputs: ["https://cdn.example.test/image.png"],
      }));
    }
    return Promise.resolve(new Response(new Uint8Array([137, 80, 78, 71])));
  };

  try {
    const result = await generateImage({
      provider: "muapi",
      prompt: "pixel art potion",
      output,
      size: "768x512",
    });

    assert(result.success, result.error || "generation should succeed");
    assert(calls.filter((call) => call.method === "POST").length === 1, "must submit once");
    assert(
      calls[0].url === "https://api.muapi.ai/api/v1/flux-dev-image",
      "must use Flux Dev endpoint",
    );
    assert(calls[0].headers.get("x-api-key") === "test-key", "must authenticate with x-api-key");
    assert(calls.at(-1)?.headers.get("x-api-key") === null, "must not send API key to the CDN");

    const request = JSON.parse(calls[0].body || "{}");
    assert(request.prompt === "pixel art potion", "must pass the prompt");
    assert(request.size === "768*512", "must translate CLI size to MuAPI format");
    assert(request.num_images === 1, "must request one image");
    assert((await Deno.readFile(output)).length === 4, "must write the downloaded image");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) Deno.env.delete("MUAPI_API_KEY");
    else Deno.env.set("MUAPI_API_KEY", originalKey);
    await Deno.remove(output);
  }
});

Deno.test("MuAPI reports a missing API key without submitting", async () => {
  const originalKey = Deno.env.get("MUAPI_API_KEY");
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  const output = await Deno.makeTempFile({ suffix: ".png" });

  Deno.env.delete("MUAPI_API_KEY");
  globalThis.fetch = () => {
    fetchCalls++;
    return Promise.resolve(jsonResponse({}));
  };

  try {
    const result = await generateImage({
      provider: "muapi",
      prompt: "pixel art potion",
      output,
    });
    assert(!result.success, "generation should fail");
    assert(result.error?.includes("MUAPI_API_KEY"), "error should identify the missing variable");
    assert(fetchCalls === 0, "missing credentials must fail before network access");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey !== undefined) Deno.env.set("MUAPI_API_KEY", originalKey);
    await Deno.remove(output);
  }
});

Deno.test("MuAPI reports failed predictions and does not retry submission errors", async () => {
  const originalKey = Deno.env.get("MUAPI_API_KEY");
  const originalFetch = globalThis.fetch;
  const output = await Deno.makeTempFile({ suffix: ".png" });
  let mode: "prediction" | "submit-error" = "prediction";
  let submitCalls = 0;

  Deno.env.set("MUAPI_API_KEY", "test-key");
  globalThis.fetch = (input) => {
    const url = String(input);
    if (url.endsWith("/flux-dev-image")) {
      submitCalls++;
      if (mode === "submit-error") {
        return Promise.resolve(new Response("temporary failure", { status: 503 }));
      }
      return Promise.resolve(jsonResponse({ request_id: "request-2", status: "processing" }));
    }
    return Promise.resolve(jsonResponse({ id: "request-2", status: "failed", error: "blocked" }));
  };

  try {
    const failed = await generateImage({ provider: "muapi", prompt: "bad", output });
    assert(!failed.success, "failed prediction should fail");
    assert(failed.error?.includes("blocked"), "failed prediction should preserve the error");

    mode = "submit-error";
    submitCalls = 0;
    const unavailable = await generateImage({ provider: "muapi", prompt: "retry", output });
    assert(!unavailable.success, "submit error should fail");
    assert(submitCalls === 1, "generation POST must not be retried");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) Deno.env.delete("MUAPI_API_KEY");
    else Deno.env.set("MUAPI_API_KEY", originalKey);
    await Deno.remove(output);
  }
});

Deno.test("MuAPI rejects sizes outside Flux Dev limits before submitting", async () => {
  const originalKey = Deno.env.get("MUAPI_API_KEY");
  const originalFetch = globalThis.fetch;
  const output = await Deno.makeTempFile({ suffix: ".png" });
  let fetchCalls = 0;

  Deno.env.set("MUAPI_API_KEY", "test-key");
  globalThis.fetch = () => {
    fetchCalls++;
    return Promise.resolve(jsonResponse({}));
  };

  try {
    const result = await generateImage({
      provider: "muapi",
      prompt: "pixel art potion",
      output,
      size: "1792x1024",
    });
    assert(!result.success, "invalid size should fail");
    assert(result.error?.includes("between 512 and 1536"), "error should describe size limits");
    assert(fetchCalls === 0, "invalid size must fail before network access");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) Deno.env.delete("MUAPI_API_KEY");
    else Deno.env.set("MUAPI_API_KEY", originalKey);
    await Deno.remove(output);
  }
});
