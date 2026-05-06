## Test Plan — Edit existing program details (Positive flows)

### Assumed UI context / test data
- **Programs page**: shows a list/table of programs with an **Edit (pencil) icon** per row.
- **Edit experience**: opens an **Edit Program** modal with at least these fields:
  - **Name** (text)
  - **Description** (multiline text)
  - **Save** button
  - **Cancel** / **X** close control
- **Existing record**:
  - **Name**: `Web Development 2026`
  - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`

---

## Positive flows

### TC-001
- **Title**: Edit form opens pre-populated with the program’s current data
- **Preconditions**:
  - I am authenticated and authorized to edit programs.
  - I am on the **Programs** page.
  - A program exists with:
    - **Name**: `Web Development 2026`
    - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Steps**:
  1. Locate the program row `Web Development 2026`.
  2. Click the **Edit** icon for `Web Development 2026`.
- **Expected result**:
  - The **Edit Program** modal opens.
  - The edit form fields are pre-populated:
    - **Name** = `Web Development 2026`
    - **Description** = `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Priority**: High

### TC-002
- **Title**: Program name can be updated and reflected immediately in the list
- **Preconditions**:
  - I am editing the program `Web Development 2026` in the **Edit Program** modal (opened from Programs page).
- **Steps**:
  1. In **Name**, replace `Web Development 2026` with `Web Development 2026 - Updated`.
  2. Click **Save**.
- **Expected result**:
  - The **Edit Program** modal closes.
  - The Programs list updates immediately and shows `Web Development 2026 - Updated` for the edited program.
  - No duplicate row is created; the same program entry is updated.
- **Priority**: High

### TC-003
- **Title**: Updating only Description preserves Name and other fields
- **Preconditions**:
  - A program exists with:
    - **Name**: `Web Development 2026`
    - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
  - I am editing that program in the **Edit Program** modal.
- **Steps**:
  1. In **Description**, replace the existing text with:
     `Full-stack curriculum updated to include Playwright end-to-end automation and CI best practices.`
  2. Do not change **Name**.
  3. Click **Save**.
- **Expected result**:
  - The modal closes.
  - The program row still shows **Name** `Web Development 2026` (unchanged).
  - Re-open edit for the same program and confirm:
    - **Name** remains `Web Development 2026`.
    - **Description** is updated to `Full-stack curriculum updated to include Playwright end-to-end automation and CI best practices.`
    - Any other fields (if present) are unchanged from their original values.
- **Priority**: High

### TC-004
- **Title**: Save is idempotent when no changes are made (no unintended updates)
- **Preconditions**:
  - A program exists named `Web Development 2026`.
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Do not change any field values.
  2. Click **Save**.
- **Expected result**:
  - The modal closes.
  - The program remains `Web Development 2026` in the list (no visible or data corruption changes).
  - Re-open edit and confirm values match the original pre-populated data.
- **Priority**: Medium

### TC-005
- **Title**: Cancel closes the modal without persisting edits
- **Preconditions**:
  - A program exists named `Web Development 2026`.
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Change **Name** to `Web Development 2026 - Draft`.
  2. Click **Cancel** (or the modal **X** close control if that is the cancel mechanism).
- **Expected result**:
  - The modal closes.
  - The Programs list continues to show `Web Development 2026` (no save occurred).
  - Re-open edit and confirm **Name** is still `Web Development 2026` (change was discarded).
- **Priority**: Medium

### TC-006
- **Title**: Leading/trailing spaces are handled consistently for Name on save
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to `  Web Development 2026 - Updated  ` (two leading and two trailing spaces).
  2. Click **Save**.
- **Expected result**:
  - The modal closes.
  - The program list shows a consistent, user-friendly name (e.g., trimmed to `Web Development 2026 - Updated`).
  - Re-open edit and confirm the stored value matches what the UI displays (no hidden whitespace causing duplicates).
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Field set**: ACs mention **Name** and **Description**, but also say “other fields”; the exact list (e.g., Status, Start Date, End Date, Code, Capacity) is unspecified.
- **Validation rules**: No rules are given for required fields, allowed characters, min/max lengths, or whitespace trimming behavior.
- **Duplicate policy**: It’s unclear whether program **Name** must be unique and how conflicts should be messaged.
- **“Immediately shows”**: Not defined whether update is optimistic (no refresh) or after a server round-trip; also unclear whether sorting/filtering/search should update live.
- **Modal close behavior**: Not defined whether closing requires a success toast, spinner, disabled Save button, or error handling UX.
