import type { ReviewRequest, ReviewResponse, Settings, Provider } from '@/types/review';

const TIMEOUT_MS = 60_000;

const DEFAULT_MODELS: Record<Provider, string> = {
  groq: 'llama-3.3-70b-versatile',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  google: 'gemini-2.0-flash',
  huggingface: 'meta-llama/Llama-3.3-70B-Instruct',
  openrouter: 'anthropic/claude-3.5-haiku',
};

chrome.runtime.onMessage.addListener(
  (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: ReviewResponse) => void
  ) => {
    if (sender.id !== chrome.runtime.id) return false;

    if (
      typeof message !== 'object' ||
      message === null ||
      (message as any).type !== 'REVIEW_REQUEST' ||
      typeof (message as any).payload?.diff !== 'string'
    ) return false;

    handleReview((message as any).payload)
      .then(sendResponse)
      .catch((err: Error) =>
        sendResponse({ ok: false, error: err.message ?? 'Unknown error.' })
      );

    return true;
  }
);

async function handleReview(payload: ReviewRequest): Promise<ReviewResponse> {
  const settings = await getSettings();

  if (!settings.apiKey) {
    return {
      ok: false,
      error:
        'No API key configured. Click the Merge Guard icon in the toolbar to set up your provider.',
    };
  }

  const sanitized = sanitizeInput(payload.diff);
  const prompt = buildPrompt(sanitized);
  const review = await callProvider(settings, prompt);

  return { ok: true, review };
}

function getSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(['provider', 'apiKey', 'model'], (result) => {
      resolve({
        provider: (result.provider as Provider) ?? 'groq',
        apiKey: result.apiKey ?? '',
        model: result.model ?? '',
      });
    });
  });
}

async function callProvider(settings: Settings, prompt: string): Promise<string> {
  const model = settings.model.trim() || DEFAULT_MODELS[settings.provider];

  switch (settings.provider) {
    case 'groq':
      return callOpenAICompatible(
        'https://api.groq.com/openai/v1/chat/completions',
        settings.apiKey,
        model,
        prompt
      );
    case 'openai':
      return callOpenAICompatible(
        'https://api.openai.com/v1/chat/completions',
        settings.apiKey,
        model,
        prompt
      );
    case 'anthropic':
      return callAnthropic(settings.apiKey, model, prompt);
    case 'google':
      return callGemini(settings.apiKey, model, prompt);
    case 'huggingface':
      return callOpenAICompatible(
        'https://api-inference.huggingface.co/v1/chat/completions',
        settings.apiKey,
        model,
        prompt
      );
    case 'openrouter':
      return callOpenAICompatible(
        'https://openrouter.ai/api/v1/chat/completions',
        settings.apiKey,
        model,
        prompt
      );
    default:
      throw new Error(`Unknown provider: ${settings.provider}`);
  }
}

async function callOpenAICompatible(
  url: string,
  apiKey: string,
  model: string,
  prompt: string
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.2,
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Try a smaller diff.');
    throw new Error('Could not reach the AI API. Check your network connection.');
  }

  clearTimeout(timer);
  await assertOk(response);

  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from AI. Try again.');
  }
  return text.trim();
}

async function callAnthropic(apiKey: string, model: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Try a smaller diff.');
    throw new Error('Could not reach the Anthropic API. Check your network connection.');
  }

  clearTimeout(timer);
  await assertOk(response);

  const data = await response.json();
  const text = data?.content?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Anthropic. Try again.');
  }
  return text.trim();
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }], role: 'user' }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.2 },
      }),
      signal: controller.signal,
    });
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') throw new Error('Request timed out. Try a smaller diff.');
    throw new Error('Could not reach the Gemini API. Check your network connection.');
  }

  clearTimeout(timer);
  await assertOk(response);

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Empty response from Gemini. Try again.');
  }
  return text.trim();
}

async function assertOk(response: Response): Promise<void> {
  if (response.ok) return;

  let detail = '';
  try {
    const body = await response.json();
    detail = body?.error?.message ?? body?.error ?? '';
  } catch {
    try { detail = await response.text(); } catch { /* ignore */ }
  }

  if (response.status === 401) throw new Error('Invalid API key. Open Merge Guard settings and check your key.');
  if (response.status === 429) throw new Error('Rate limit reached. Wait a moment and try again.');
  if (response.status === 400) throw new Error(`Bad request: ${detail || 'check your model name in settings.'}`);

  throw new Error(`API error ${response.status}${detail ? ': ' + detail.substring(0, 200) : ''}`);
}

function sanitizeInput(raw: string): string {
  if (typeof raw !== 'string') return '';
  return raw
    .replace(/\x00/g, '')
    .replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function buildPrompt(diff: string): string {
  return `You are a senior software engineer conducting a thorough code review of a merge request diff. Your review must be professional, precise, and actionable — the kind of feedback you would give a colleague before merging to production. Focus on modern development practices, clean code principles, and type safety.

REVIEW CRITERIA (in priority order):

1. **Bugs & Critical Issues**
   - Logic errors, null/undefined dereferences, off-by-one errors
   - Race conditions, incorrect data shape assumptions, unintended side effects
   - Security vulnerabilities: injection risks, exposed secrets/credentials, missing auth/authorization
   - Unsafe deserialization, insecure dependencies, XSS/CSRF vulnerabilities
   - Broken control flow, incorrect conditional logic

2. **Type Safety** (TypeScript/typed languages)
   - Use of 'any' type without justification
   - Dangerous type assertions (as unknown as, non-null assertions !)
   - Missing type guards before narrowing
   - Overly generic types (Object, Function, {})
   - Missing return types on functions
   - Implicit any from missing type annotations

3. **Performance**
   - N+1 queries, missing database indexes
   - Unnecessary re-renders in UI frameworks (React, Vue, Angular)
   - Memory leaks, missing cleanup in lifecycle hooks
   - Inefficient algorithms (O(n²) where O(n) possible)
   - Large bundle imports (importing entire library for one function)
   - Blocking operations on main thread

4. **Breaking Changes**
   - Changes to public APIs, method signatures, exported interfaces
   - Database schema changes without migrations
   - Removed/renamed config keys breaking existing deployments
   - Changed behavior of existing functions without version bump

5. **Clean Code & Maintainability**
   - Poor naming: generic names (data, temp, x, handleClick1), unclear abbreviations
   - Code duplication (DRY violations) — same logic repeated 3+ times
   - Functions > 50 lines or with cyclomatic complexity > 10
   - Dead code: unused imports, variables, functions, commented-out code
   - Hardcoded values: magic numbers, URLs, environment-specific values
   - Missing comments for complex/non-obvious logic
   - Tight coupling making code hard to test or reuse

6. **Error Handling & Async**
   - Unhandled promise rejections, missing try/catch around async operations
   - Swallowed errors (empty catch blocks, console.log only)
   - Missing error propagation to caller
   - Callback hell (use async/await instead)
   - Missing finally blocks for cleanup
   - No user-facing error messages

MODERN PRACTICES TO ENFORCE:
- Prefer 'const' over 'let', never use 'var'
- Use optional chaining (?.) and nullish coalescing (??) over manual null checks
- Destructuring for cleaner code
- Array methods (map, filter, reduce) over imperative loops when appropriate
- Dependency injection over global state
- Pure functions over stateful logic when possible

RULES:
- Report ALL real issues you find, do not limit yourself to 1-2 per section.
- Every issue MUST include: (a) exact line(s) from diff, (b) WHY it's a problem, (c) concrete fix.
- Do NOT invent issues. Only report what is clearly visible in the diff.
- Do NOT flag: dependency version bumps, code formatting, minor stylistic preferences, or personal opinions.
- Be direct and specific. Avoid vague statements like "consider refactoring".

OUTPUT FORMAT — follow this EXACTLY:

CRITICAL FORMAT RULES:
- Do NOT use #### headings. Only ### for the six section headers below.
- Do NOT use emojis.
- Do NOT number items. Use a **bold title** per issue instead.
- Every issue has exactly three parts: bold title, code block, then Problem: and Suggestion: lines.

Example:
**Non-null assertion bypasses optional chaining**
\`\`\`typescript
+ const value = user?.profile?.name!;
\`\`\`
Problem: The ! operator asserts name is non-null, but if profile is undefined, this will throw a runtime error despite the optional chaining.
Suggestion: Use nullish coalescing: const value = user?.profile?.name ?? 'Unknown';

### Bugs & Critical Issues
[list issues using the format above, or "No bugs or critical issues found." if none]

### Type Safety
[same format, or "No type safety issues found." if none]

### Performance
[same format, or "No performance issues found." if none]

### Breaking Changes
[same format, or "No breaking changes found." if none]

### Clean Code & Maintainability
[same format, or "No maintainability issues found." if none]

### Error Handling & Async
[same format, or "No error handling issues found." if none]

Do NOT write a Summary section.

Diff:
\`\`\`diff
${diff}
\`\`\``;
}
