## Test Plan — Delete program with confirmation (Positive flows)

### Assumed UI context / test data
- **Programs page** shows a list/table of programs with a **Delete (trash) icon** per row.
- Clicking delete opens a **Delete program** confirmation dialog with:
  - Dialog text referencing the program name (e.g., `Delete "Test Program"?`)
  - **Confirm** button (e.g., `Delete`)
  - **Cancel** button (e.g., `Cancel`) and/or close `X`
- **Existing program**:
  - **Name**: `Test Program`
  - **Description**: `Temporary program created for deletion confirmation testing.`

---

## Positive flows

### TC-001
- **Title**: Delete confirmation dialog appears for the selected program
- **Preconditions**:
  - I am authenticated and authorized to delete programs.
  - I am on the **Programs** page.
  - A program exists with **Name** `Test Program`.
- **Steps**:
  1. Locate the program row `Test Program`.
  2. Click the **Delete** (trash) icon for `Test Program`.
- **Expected result**:
  - A confirmation dialog is displayed.
  - The dialog clearly references `Test Program` (name shown in title/body).
  - No deletion occurs until confirmation.
- **Priority**: High

### TC-002
- **Title**: Confirming deletion removes the program from the list
- **Preconditions**:
  - A program exists with **Name** `Test Program`.
  - The delete confirmation dialog for `Test Program` is currently displayed.
- **Steps**:
  1. Click **Delete** (confirm) in the confirmation dialog.
- **Expected result**:
  - The program `Test Program` is removed from the Programs list.
  - The deleted program does not reappear after a refresh/navigation back to Programs.
  - The UI does not remove any other program row.
- **Priority**: High

### TC-003
- **Title**: Canceling deletion keeps the program in the list
- **Preconditions**:
  - A program exists with **Name** `Test Program`.
  - I am on the **Programs** page.
- **Steps**:
  1. Click the **Delete** icon for `Test Program`.
  2. In the confirmation dialog, click **Cancel**.
- **Expected result**:
  - The confirmation dialog closes.
  - `Test Program` still exists and remains visible in the Programs list.
  - No delete request is executed.
- **Priority**: High

### TC-004
- **Title**: Closing the dialog via X/overlay behaves like Cancel (no deletion)
- **Preconditions**:
  - A program exists with **Name** `Test Program`.
  - The delete confirmation dialog for `Test Program` is displayed.
- **Steps**:
  1. Close the dialog using the **X** control (or click outside the dialog if overlay-click-to-close is supported).
- **Expected result**:
  - The dialog closes.
  - `Test Program` still exists in the list.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Dialog copy and buttons**: Exact button labels (`Delete` vs `Confirm`) and whether the dialog must display the program name are not explicitly stated.
- **Post-delete feedback**: ACs don’t specify whether a success toast/banner should appear.
- **List refresh behavior**: “Removed from the list” doesn’t define whether removal is immediate/optimistic or after server confirmation.
- **Navigation behavior**: ACs don’t specify whether deletion can occur from places other than the Programs list (details page, etc.).
