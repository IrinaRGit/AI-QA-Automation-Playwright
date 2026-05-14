Write Playwright tests for creating a new program on Didaxis Studio.

## App context (locators verified via Playwright MCP / accessibility tree)

Use **`getByRole` / `getByLabel` / `getByText`** (not `getByPlaceholder`). Accessible names below match Chromium’s a11y snapshot on Didaxis Studio.

- Login page: [https://test.didaxis.studio/login](https://test.didaxis.studio/login)
  - Email: `getByRole('textbox', { name: 'Email' })` (visible label “Email *”; placeholder `you@college.edu` is not the accessible name)
  - Password: `getByRole('textbox', { name: 'Password' })` (placeholder `Your password`)
  - Sign In: `getByRole('button', { name: 'Sign In' })`
- Programs page: `/programs`
  - New program: `getByRole('button', { name: '+ New Program' })`
  - **Create modal** (named dialog): `getByRole('dialog', { name: 'New Program' })` — scope all create fields under this dialog so other dialogs cannot match.
    - Program name: `dialog.getByRole('textbox', { name: 'Program Name' })` (UI label “Program Name *”; placeholder `e.g. Computer Science BSc`)
    - Description: `dialog.getByRole('textbox', { name: 'Description' })` (placeholder `Brief description`)
    - Create: `dialog.getByRole('button', { name: 'Create' })` (may be disabled until required fields are filled)
  - **Programs table**: each program is a `row` whose accessible name includes the title (and often the subtitle). Prefer `getByRole('row', { name: /<program title>/ }).first()` when duplicate titles exist.
- **Edit program (TC-001)**:
  - Row: `getByRole('row', { name: /<program title>/ }).first()`
  - Edit control: `row.getByRole('button', { name: '✏️' })` (pencil icon; there is no separate `"Edit"` button name in the tree)
  - Modal: `getByRole('dialog', { name: /Edit Program/i })`
  - Same field locators inside the dialog: `getByRole('textbox', { name: 'Program Name' })`, `getByRole('textbox', { name: 'Description' })`

## Credentials

Use dotenv. Read URL and credentials from `process.env` (see `playwright.config.ts`):

- `process.env.DIDAXIS_URL` (e.g. `https://test.didaxis.studio`) — used as Playwright `baseURL`
- `process.env.DIDAXIS_EMAIL`
- `process.env.DIDAXIS_PASSWORD`

Do NOT hardcode credentials in the test file.

## Test plan

### TC-001
- **Title**: Edit form opens pre-populated with the program’s current data
- **Preconditions**:
  - I am authenticated and authorized to edit programs.
  - I am on the **Programs** page.
  - A program exists with:
    - **Name**: `Web Development 2026`
    - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Steps**:
  1. Locate the program row `Web Development 2026` (e.g. `getByRole('row', { name: /Web Development 2026/ }).first()`).
  2. Click the **✏️** (pencil) action for that row — `row.getByRole('button', { name: '✏️' })` (not a button named `"Edit"` in the accessibility tree).
- **Expected result**:
  - The **Edit Program** modal opens (`getByRole('dialog', { name: /Edit Program/i })`).
  - The edit form fields are pre-populated (assert with `getByRole('textbox', { name: 'Program Name' })` and `getByRole('textbox', { name: 'Description' })` scoped to that dialog):
    - **Program name** = `Web Development 2026`
    - **Description** = `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Priority**: High

## Requirements

- TypeScript
- Use Playwright locators (getByRole, getByLabel, getByText)
- Login as the first step in each test (or use beforeEach)
- Each test is independent
- Use unique test data with Date.now() suffix
- Save as tests/ds1-create-program.spec.ts