# Async Patterns

Best practices for async/await, Promise handling, cancellation, and concurrent operations in TypeScript.

## Async/Await Basics

### Proper Async Function Signatures

```typescript
// Always specify return type for public APIs
async function fetchUser(id: string): Promise<User> {
  const response = await fetch(`/users/${id}`);
  return response.json();
}

// Use Result types for error handling
async function fetchUserSafe(id: string): Promise<Result<User, FetchError>> {
  try {
    const response = await fetch(`/users/${id}`);
    if (!response.ok) {
      return err({ type: "http", status: response.status });
    }
    return ok(await response.json());
  } catch (error) {
    return err({ type: "network", message: String(error) });
  }
}
```

### Avoid Unnecessary Async

```typescript
// WRONG: Unnecessary async wrapper
async function getConfig(): Promise<Config> {
  return config; // No await needed
}

// CORRECT: Just return the promise or value
function getConfig(): Config {
  return config;
}

// WRONG: Wrapping a promise in async
async function fetchData(): Promise<Data> {
  return await fetch("/data").then(r => r.json());
}

// CORRECT: Return the promise directly
function fetchData(): Promise<Data> {
  return fetch("/data").then(r => r.json());
}

// CORRECT: Use async when you need multiple awaits
async function processData(): Promise<ProcessedData> {
  const raw = await fetch("/data");
  const json = await raw.json();
  return transform(json);
}
```

## Sequential vs Parallel Execution

### Sequential Execution

```typescript
// Each request waits for the previous one
async function fetchSequential(ids: string[]): Promise<User[]> {
  const users: User[] = [];

  for (const id of ids) {
    const user = await fetchUser(id);
    users.push(user);
  }

  return users;
}

// Use when:
// - Order matters
// - Rate limiting required
// - Each request depends on previous result
```

### Parallel Execution

```typescript
// All requests run simultaneously
async function fetchParallel(ids: string[]): Promise<User[]> {
  const promises = ids.map(id => fetchUser(id));
  return Promise.all(promises);
}

// Use when:
// - Requests are independent
// - Faster total execution time needed
// - No rate limiting concerns
```

### Controlled Concurrency

```typescript
// Limit concurrent requests
async function fetchWithConcurrency<T>(
  items: string[],
  fetcher: (item: string) => Promise<T>,
  concurrency: number
): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const item of items) {
    const promise = fetcher(item).then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // Remove completed promises
      executing.splice(
        executing.findIndex(p => p === promise),
        1
      );
    }
  }

  await Promise.all(executing);
  return results;
}

// Usage: Max 3 concurrent requests
const users = await fetchWithConcurrency(ids, fetchUser, 3);
```

## Promise Utilities

### Promise.all with Error Handling

```typescript
// Fail-fast: First error rejects all
async function fetchAll<T>(promises: Promise<T>[]): Promise<T[]> {
  return Promise.all(promises);
}

// Collect all results (success and failure)
async function fetchAllSettled<T>(
  promises: Promise<T>[]
): Promise<Array<{ status: "fulfilled"; value: T } | { status: "rejected"; reason: unknown }>> {
  return Promise.allSettled(promises);
}

// Separate successes and failures
async function partitionResults<T>(
  promises: Promise<T>[]
): Promise<{ successes: T[]; failures: unknown[] }> {
  const results = await Promise.allSettled(promises);

  const successes: T[] = [];
  const failures: unknown[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      successes.push(result.value);
    } else {
      failures.push(result.reason);
    }
  }

  return { successes, failures };
}
```

### Promise.race Patterns

```typescript
// Timeout wrapper
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = "Operation timed out"
): Promise<T> {
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeout]);
}

// Usage
const result = await withTimeout(fetchUser("123"), 5000);

// First successful result
async function fetchFirst<T>(promises: Promise<T>[]): Promise<T> {
  return Promise.race(promises);
}
```

## Cancellation with AbortController

### Basic Cancellation

```typescript
async function fetchWithAbort(
  url: string,
  signal?: AbortSignal
): Promise<Response> {
  return fetch(url, { signal });
}

// Usage
const controller = new AbortController();

// Start fetch
const fetchPromise = fetchWithAbort("/data", controller.signal);

// Cancel after 5 seconds
setTimeout(() => controller.abort(), 5000);

try {
  const response = await fetchPromise;
} catch (error) {
  if (error instanceof DOMException && error.name === "AbortError") {
    console.log("Request was cancelled");
  } else {
    throw error;
  }
}
```

### Cancellation in Long Operations

```typescript
async function processLargeDataset(
  items: Item[],
  signal?: AbortSignal
): Promise<ProcessedItem[]> {
  const results: ProcessedItem[] = [];

  for (const item of items) {
    // Check cancellation before each iteration
    if (signal?.aborted) {
      throw new DOMException("Operation cancelled", "AbortError");
    }

    const processed = await processItem(item);
    results.push(processed);
  }

  return results;
}

// Helper for cancellation check
function checkAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw new DOMException("Operation cancelled", "AbortError");
  }
}
```

### Linked Abort Signals

```typescript
// Combine multiple abort signals
function linkAbortSignals(...signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();

  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort();
      break;
    }

    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return controller.signal;
}

// Usage: Cancel on either timeout or user action
const timeoutController = new AbortController();
setTimeout(() => timeoutController.abort(), 30000);

const userController = new AbortController();
cancelButton.onclick = () => userController.abort();

const combinedSignal = linkAbortSignals(
  timeoutController.signal,
  userController.signal
);

await fetchWithAbort("/data", combinedSignal);
```

## Retry Patterns

### Simple Retry

```typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt === maxAttempts) break;
    }
  }

  throw lastError;
}

// Usage
const result = await retry(() => fetchData(), 3);
```

### Retry with Exponential Backoff

```typescript
interface RetryOptions {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  signal?: AbortSignal;
}

async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const {
    maxAttempts,
    initialDelayMs,
    maxDelayMs,
    backoffMultiplier,
    signal,
  } = options;

  let delay = initialDelayMs;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) break;
      if (signal?.aborted) break;

      // Wait before retry
      await sleep(delay);

      // Increase delay for next attempt
      delay = Math.min(delay * backoffMultiplier, maxDelayMs);
    }
  }

  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Usage
const result = await retryWithBackoff(fetchData, {
  maxAttempts: 5,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
});
```

## Debouncing and Throttling

### Async Debounce

```typescript
function debounceAsync<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  delayMs: number
): (...args: T) => Promise<R> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingPromise: Promise<R> | null = null;
  let resolve: ((value: R) => void) | null = null;
  let reject: ((error: unknown) => void) | null = null;

  return (...args: T): Promise<R> => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    if (!pendingPromise) {
      pendingPromise = new Promise<R>((res, rej) => {
        resolve = res;
        reject = rej;
      });
    }

    timeoutId = setTimeout(async () => {
      try {
        const result = await fn(...args);
        resolve?.(result);
      } catch (error) {
        reject?.(error);
      } finally {
        pendingPromise = null;
        resolve = null;
        reject = null;
      }
    }, delayMs);

    return pendingPromise;
  };
}

// Usage
const debouncedSearch = debounceAsync(searchApi, 300);
```

## Queue Patterns

### Simple Async Queue

```typescript
class AsyncQueue<T> {
  private queue: Array<() => Promise<T>> = [];
  private processing = false;
  private results: T[] = [];

  add(task: () => Promise<T>): void {
    this.queue.push(task);
    this.process();
  }

  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift()!;
      const result = await task();
      this.results.push(result);
    }

    this.processing = false;
  }

  async drain(): Promise<T[]> {
    while (this.processing || this.queue.length > 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    return this.results;
  }
}
```

## Best Practices

1. **Always Handle Errors**: Use try-catch or Result types
2. **Avoid Floating Promises**: Always await or handle promise
3. **Use Parallel When Possible**: Promise.all for independent operations
4. **Implement Timeouts**: Prevent hanging operations
5. **Support Cancellation**: Use AbortController for long operations
6. **Add Retries for Network**: With exponential backoff
7. **Limit Concurrency**: Prevent overwhelming servers
8. **Type Return Values**: Explicit Promise<T> for public APIs
