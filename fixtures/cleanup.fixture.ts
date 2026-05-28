import { test as base, expect, type Page } from '@playwright/test';

type CleanupFixtures = {
  trackProgram: (uuid: string) => void;
};

async function deleteProgram(uuid: string): Promise<void> {
  const baseUrl = process.env.DIDAXIS_URL;
  const token = process.env.DIDAXIS_API_TOKEN;
  if (!baseUrl || !token) {
    console.warn(
      `Skipping cleanup for program ${uuid}: set DIDAXIS_URL and DIDAXIS_API_TOKEN in .env`,
    );
    return;
  }

  const response = await fetch(`${baseUrl}/api/programs/${uuid}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    console.warn(`Failed to delete program ${uuid}: ${response.status} ${body}`);
  }
}

/** Call before clicking Create; resolves with the new program UUID from POST /api/programs. */
export function waitForCreatedProgramId(page: Page): Promise<string> {
  return page
    .waitForResponse(
      (resp) =>
        resp.request().method() === 'POST' &&
        /\/api\/programs\/?$/.test(new URL(resp.url()).pathname) &&
        resp.ok(),
      { timeout: 30_000 },
    )
    .then(async (response) => {
      const body = (await response.json()) as { data?: { id?: string } };
      const id = body?.data?.id;
      if (!id) {
        throw new Error('Program creation response did not include data.id');
      }
      return id;
    });
}

export const test = base.extend<CleanupFixtures>({
  trackProgram: async ({}, use) => {
    const uuids = new Set<string>();
    await use((uuid: string) => {
      uuids.add(uuid);
    });

    for (const uuid of uuids) {
      await deleteProgram(uuid);
    }
  },
});

export { expect };
