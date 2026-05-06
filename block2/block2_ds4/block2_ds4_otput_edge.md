## Test Plan — Delete program with confirmation (Edge cases)

### Assumed UI context / test data
- Programs list includes a **Delete** icon per row.
- Confirmation dialog requires explicit confirmation.

---

## Edge cases

### TC-011
- **Title**: Correct program is deleted when multiple programs have similar names
- **Preconditions**:
  - Two programs exist:
    - `Test Program`
    - `Test Program - Copy`
  - I am on the **Programs** page.
- **Steps**:
  1. Click **Delete** icon for `Test Program`.
  2. In the confirmation dialog, confirm deletion.
- **Expected result**:
  - Only `Test Program` is removed.
  - `Test Program - Copy` remains visible and unchanged.
- **Priority**: High

### TC-012
- **Title**: Delete confirmation dialog handles long program names without truncation issues
- **Preconditions**:
  - A program exists with name:
    - `Test Program - Extremely Long Name For Confirmation Dialog Layout Validation 2026`
  - I am on the **Programs** page.
- **Steps**:
  1. Click **Delete** for the long-name program.
- **Expected result**:
  - The confirmation dialog displays the program name in a readable way (wrap/ellipsis) without breaking layout.
  - The correct program is targeted for deletion.
- **Priority**: Medium

### TC-013
- **Title**: Delete confirmation safely renders special characters in program name
- **Preconditions**:
  - A program exists with name:
    - `Informatique & IA - Niveau 2`
  - I am on the **Programs** page.
- **Steps**:
  1. Click **Delete** for `Informatique & IA - Niveau 2`.
  2. Confirm deletion.
- **Expected result**:
  - The confirmation dialog displays the name correctly (no encoding issues).
  - Program is removed from the list after confirm.
- **Priority**: Medium

### TC-014
- **Title**: Delete confirmation is keyboard accessible (Enter/Escape)
- **Preconditions**:
  - `Test Program` exists.
  - I am on the **Programs** page.
- **Steps**:
  1. Click **Delete** for `Test Program` to open the dialog.
  2. Press **Escape**.
  3. Open the dialog again.
  4. Press **Enter** to confirm (if Enter is mapped to confirm by design).
- **Expected result**:
  - Escape closes the dialog without deletion.
  - Enter confirms deletion only if the confirm button is focused/default (per accessibility spec).
  - Focus management is correct (focus returns to a sensible element on close).
- **Priority**: Medium

### TC-015
- **Title**: Filtering/search does not hide deletion outcome (list state remains consistent)
- **Preconditions**:
  - Programs list supports search/filter.
  - `Test Program` exists.
- **Steps**:
  1. Search for `Test Program` so the list shows only matching results.
  2. Delete `Test Program` via dialog confirmation.
- **Expected result**:
  - The filtered list updates and no longer shows `Test Program`.
  - The UI does not show an empty “ghost row” or stale result.
- **Priority**: Medium

### TC-016
- **Title**: Pagination behavior remains correct after deleting the last item on a page
- **Preconditions**:
  - Programs list is paginated.
  - The current page contains `Test Program` and it is the last item on that page.
- **Steps**:
  1. Delete `Test Program` via confirmation.
- **Expected result**:
  - UI navigates/refreshes to a valid page state (e.g., previous page) without errors.
  - Total count and pagination controls remain accurate.
- **Priority**: Low

---

## Ambiguities / gaps in the ACs (to confirm)
- **Edge validation relevance**: ACs don’t state constraints around program name length/special characters in the delete dialog, but UI should handle them safely.
- **Accessibility requirements**: Keyboard behavior, focus trapping, and screen reader labels are not specified.
- **List behaviors**: ACs don’t define interactions with sorting/filtering/pagination after deletion.
