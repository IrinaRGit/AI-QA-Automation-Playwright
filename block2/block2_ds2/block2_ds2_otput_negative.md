## Test Plan — Edit existing program details (Negative flows)

### Assumed UI context / test data
- **Existing program**:
  - **Name**: `Web Development 2026`
  - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Edit Program modal** contains at least **Name**, **Description**, **Save**, and **Cancel/X**.

---

## Negative flows

### TC-011
- **Title**: Save is blocked when Name is empty (required field validation)
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Clear the **Name** field so it is empty.
  2. Click **Save**.
- **Expected result**:
  - The modal remains open.
  - A clear validation message is shown for **Name** (e.g., `Name is required`).
  - The program list is not updated.
- **Priority**: High

### TC-012
- **Title**: Save is blocked when Name contains only whitespace
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to `     ` (five spaces).
  2. Click **Save**.
- **Expected result**:
  - The modal remains open.
  - **Name** is treated as invalid (either trimmed to empty and rejected, or rejected directly).
  - No update occurs in the list.
- **Priority**: High

### TC-013
- **Title**: Duplicate Name is rejected with a user-friendly error (if names must be unique)
- **Preconditions**:
  - A second program exists with **Name** `Data Science 2026`.
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to `Data Science 2026`.
  2. Click **Save**.
- **Expected result**:
  - The modal remains open.
  - A clear error is shown indicating the name already exists (e.g., `A program named "Data Science 2026" already exists`).
  - The program list does not change.
- **Priority**: High

### TC-014
- **Title**: Server error on save does not close the modal or corrupt data
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
  - Backend is configured to return an error (e.g., HTTP 500) when saving program updates.
- **Steps**:
  1. Change **Name** to `Web Development 2026 - Updated`.
  2. Click **Save**.
- **Expected result**:
  - The modal remains open (or reopens with the edited values intact).
  - An error message is displayed (e.g., `Could not save changes. Please try again.`).
  - The Programs list does not show `Web Development 2026 - Updated`.
  - A retry is possible without re-entering all values.
- **Priority**: High

### TC-015
- **Title**: Network interruption during save does not close the modal or show a false success
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
  - Network can be disabled mid-request (offline mode).
- **Steps**:
  1. Change **Description** to `Updated description while offline.`
  2. Disable network connectivity.
  3. Click **Save**.
- **Expected result**:
  - The modal does not close due to a false success.
  - A clear offline/network error is shown.
  - The list does not reflect changes.
- **Priority**: High

### TC-016
- **Title**: Unauthorized user cannot save edits
- **Preconditions**:
  - I am logged in as a user without permission to edit programs.
  - I can open the program edit UI (or I attempt to).
- **Steps**:
  1. Navigate to Programs page and attempt to edit `Web Development 2026`.
  2. If the modal opens, change **Name** to `Web Development 2026 - Updated`.
  3. Click **Save**.
- **Expected result**:
  - Either the **Edit** action is not available, or access is denied (e.g., `You do not have permission to edit programs`).
  - If save is attempted, it is rejected; the modal does not close as a success.
  - The program list does not change.
- **Priority**: High

### TC-017
- **Title**: Concurrent modification is handled (stale edit does not silently overwrite)
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
  - Another user/session updates the same program’s **Name** to `Web Development 2026 - Updated by Admin` before I click Save.
- **Steps**:
  1. In my modal, change **Description** to `Local edit after concurrent update.`
  2. Click **Save**.
- **Expected result**:
  - The app does not silently overwrite the other user’s changes without warning.
  - A conflict/stale-data message is shown (e.g., `This program was updated by someone else. Refresh and try again.`) OR the UI refreshes and requires re-apply.
  - The final stored program data is predictable and consistent with the product’s conflict policy.
- **Priority**: Medium

### TC-018
- **Title**: Save cannot create a new program entry (must update existing record only)
- **Preconditions**:
  - A program exists named `Web Development 2026`.
  - I am editing it in the modal.
- **Steps**:
  1. Change **Name** to `Web Development 2026 - Updated`.
  2. Click **Save**.
- **Expected result**:
  - Only one program entry exists for this record (no duplicate rows like both old and new names simultaneously).
  - The original entry is updated in place.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Validation/uniqueness**: ACs don’t state whether Name is required/unique; negative tests assume common constraints.
- **Error UX**: ACs don’t specify how save failures are surfaced (toast vs inline), whether Save disables during request, and whether user-entered values are preserved on error.
- **Authorization behavior**: ACs don’t specify whether unauthorized users can see the edit icon or open the modal.
- **Concurrency policy**: ACs don’t define expected behavior for conflicting updates.
