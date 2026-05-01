import type { ReviewRequest, ReviewResponse } from '@/types/review';

export async function requestReview(diff: string): Promise<string> {
  const payload: ReviewRequest = { diff };

  return new Promise((resolve, reject) => {
    const chromeAPI = (globalThis as any).chrome;
    chromeAPI.runtime.sendMessage(
      { type: 'REVIEW_REQUEST', payload },
      (response: ReviewResponse) => {
        if (chromeAPI.runtime.lastError) {
          reject(
            new Error(
              'Could not reach the extension background worker. Try reloading the extension.'
            )
          );
          return;
        }

        if (!response || !response.ok) {
          reject(new Error(response?.error ?? 'Unknown error from background worker.'));
          return;
        }

        resolve(response.review!);
      }
    );
  });
}
