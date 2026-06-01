export const BASE_PROGRAM_NAME = 'Web Development 2026';
export const BASE_PROGRAM_DESC =
  'Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.';
export const PROGRAM_DESC = 'Full-stack web development program';
export const UPDATED_DESC =
  'Full-stack curriculum updated to include Playwright end-to-end automation and CI best practices.';
export const ASSUMED_MAX_LENGTH = 255;

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
