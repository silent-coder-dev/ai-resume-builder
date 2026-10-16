// Single entry point for browser → /api/ai calls. It turns network failures,
// platform timeouts, and non-JSON error pages into readable messages.
export async function callAi<T>(action: string, payload: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, payload }),
    });
  } catch {
    throw new Error('Could not reach the AI service. Check your internet connection and try again.');
  }

  let data: { result?: T; error?: string } | null = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok || data?.result === undefined || data.result === null) {
    if (data?.error) throw new Error(data.error);
    if (response.status === 504) {
      throw new Error('The AI service took too long to respond. Please try again.');
    }
    if (response.status === 413) {
      throw new Error('The request is too large. Try a smaller file or shorter text.');
    }
    throw new Error('The AI request could not be completed. Please try again.');
  }

  return data.result;
}
