## Test Plan — Program list filtering and display (Negative flows)

### Assumed UI context / test data
- Programs page displays a list of programs (Name + Description) or an empty state.

---

## Negative flows

### TC-004
- **Title**: Programs page does not show empty state when programs exist
- **Preconditions**:
  - At least one program exists:
    - **Name** `Web Development 2026`
    - **Description** `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - Program list is visible with `Web Development 2026`.
  - The message `No programs have been created` is not shown.
  - The “Create your first program” prompt is not shown as the primary state.
- **Priority**: Medium

### TC-005
- **Title**: Programs page handles server error without showing misleading empty state
- **Preconditions**:
  - Backend is configured to fail the programs list request (e.g., HTTP 500).
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - An error state is shown (e.g., `Unable to load programs. Please try again.`).
  - The UI does not show the empty state messaging that implies there are truly no programs.
  - No partial/corrupted list is displayed.
- **Priority**: High

### TC-006
- **Title**: Unauthorized user cannot view program list data
- **Preconditions**:
  - I am logged in as a user without permission to view programs.
- **Steps**:
  1. Attempt to navigate to the **Programs** page.
- **Expected result**:
  - Access is denied (e.g., redirect to login, or show `You do not have permission to view programs`).
  - Program names/descriptions are not exposed.
- **Priority**: High

### TC-007
- **Title**: Programs page does not display raw HTML from descriptions (safe rendering)
- **Preconditions**:
  - A program exists with:
    - **Name** `Security Test Program`
    - **Description** `<b>bold</b><script>alert("xss")</script>`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - No script executes.
  - Description is rendered safely (escaped/sanitized) per security policy.
- **Priority**: High

---

## Ambiguities / gaps in the ACs (to confirm)
- **Error vs empty state**: ACs define empty state only for “no programs exist”, but not what to show on API failures/timeouts.
- **Authorization UX**: Not defined whether unauthorized users see a blank page, error banner, or redirect.
- **HTML rendering policy**: Not specified whether Description supports rich text or plain text only.
