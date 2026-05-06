## Test Plan — Delete program with confirmation (Negative flows)

### Assumed UI context / test data
- Programs list row actions include **Delete**.
- Confirmation dialog includes **Delete** (confirm) and **Cancel**.
- Program used in tests: `Test Program`

---

## Negative flows

### TC-005
- **Title**: Deletion is not executed before user confirms in the dialog
- **Preconditions**:
  - `Test Program` exists in the Programs list.
  - I am on the **Programs** page.
- **Steps**:
  1. Click **Delete** icon for `Test Program`.
  2. Observe the list without clicking **Delete** in the dialog.
- **Expected result**:
  - `Test Program` remains in the list while the dialog is open.
  - No background deletion happens without explicit confirmation.
- **Priority**: High

### TC-006
- **Title**: Server error during deletion does not remove the program and shows an error
- **Preconditions**:
  - `Test Program` exists.
  - Backend is configured to return an error on delete (e.g., HTTP 500).
  - Delete confirmation dialog for `Test Program` is open.
- **Steps**:
  1. Click **Delete** (confirm).
- **Expected result**:
  - `Test Program` is not removed from the list (no false success).
  - An error message is shown (e.g., `Could not delete program. Please try again.`).
  - User can retry or cancel; UI remains consistent.
- **Priority**: High

### TC-007
- **Title**: Network interruption during delete does not show false success
- **Preconditions**:
  - `Test Program` exists.
  - Delete confirmation dialog is open.
  - Network can be disabled mid-request.
- **Steps**:
  1. Disable network connectivity.
  2. Click **Delete** (confirm).
- **Expected result**:
  - Program is not removed from the list due to a false success.
  - A network/offline error is displayed.
- **Priority**: High

### TC-008
- **Title**: Unauthorized user cannot delete programs
- **Preconditions**:
  - I am logged in as a user without permission to delete programs.
  - `Test Program` exists.
- **Steps**:
  1. Navigate to the **Programs** page.
  2. Attempt to delete `Test Program` (via Delete icon if visible).
  3. If the dialog appears, click **Delete** (confirm).
- **Expected result**:
  - Either the Delete icon is not available, or the action is blocked with an access denied message.
  - `Test Program` remains in the list.
- **Priority**: High

### TC-009
- **Title**: Rapid repeated confirm clicks do not cause inconsistent state
- **Preconditions**:
  - `Test Program` exists.
  - Delete confirmation dialog is open.
- **Steps**:
  1. Double-click **Delete** (confirm) rapidly.
- **Expected result**:
  - Only one delete is processed.
  - UI does not error due to duplicate requests; no other programs are impacted.
  - The app prevents multi-submit (e.g., disables confirm while deleting) or safely deduplicates.
- **Priority**: Medium

### TC-010
- **Title**: Attempting to delete a program that no longer exists does not break the UI
- **Preconditions**:
  - `Test Program` existed, but is deleted by another user/session before confirmation.
  - I still have the delete dialog open for `Test Program`.
- **Steps**:
  1. Click **Delete** (confirm).
- **Expected result**:
  - App handles the “already deleted / not found” response gracefully (e.g., `Program no longer exists`).
  - Programs list remains stable and accurate after refresh.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Error UX**: ACs do not define what is shown on failure (toast vs inline), or whether the dialog closes on failure.
- **Authorization UX**: Not specified whether delete controls are hidden or visible-but-disabled for unauthorized roles.
- **Concurrency behavior**: Not specified how “already deleted” (404) should be communicated.
