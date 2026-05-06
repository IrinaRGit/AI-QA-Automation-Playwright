## Test Plan — Program name validation and duplicate prevention (Negative flows)

### Assumed UI context / test data
- **Program creation form** has **Name** and **Create**.
- **Existing program**: `Web Development 2026`

---

## Negative flows

### TC-004
- **Title**: Program name with only whitespace is rejected and form is not submitted
- **Preconditions**:
  - I am authenticated and authorized to create programs.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `   ` (three spaces).
  2. Click **Create**.
- **Expected result**:
  - The name is trimmed and treated as empty.
  - The form is not submitted.
  - A validation message is shown for **Name** (e.g., `Name is required`).
  - No program is created.
- **Priority**: High

### TC-005
- **Title**: Empty program name is rejected and form is not submitted
- **Preconditions**:
  - I am on the **Program creation** form.
- **Steps**:
  1. Ensure **Name** is empty.
  2. Click **Create**.
- **Expected result**:
  - The form is not submitted.
  - A validation message is shown for **Name**.
  - No program is created.
- **Priority**: High

### TC-006
- **Title**: Exact duplicate program name is rejected with a “name already exists” error
- **Preconditions**:
  - A program exists with **Name** `Web Development 2026`.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `Web Development 2026`.
  2. Fill other required fields with valid values (e.g., **Description** = `Duplicate name attempt`).
  3. Click **Create**.
- **Expected result**:
  - The form is not successfully submitted.
  - An error is shown indicating the name already exists (inline on Name or as a form error).
  - No additional program named `Web Development 2026` is created.
- **Priority**: High

### TC-007
- **Title**: Duplicate prevention still applies when duplicate differs only by case (if case-insensitive)
- **Preconditions**:
  - A program exists with **Name** `Web Development 2026`.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `web development 2026`.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result**:
  - The app does not allow a visually identical duplicate to be created due to casing.
  - A “name already exists” error is shown (if uniqueness is case-insensitive).
- **Priority**: Medium

### TC-008
- **Title**: Duplicate prevention still applies when duplicate differs only by leading/trailing whitespace
- **Preconditions**:
  - A program exists with **Name** `Web Development 2026`.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `  Web Development 2026  `.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result**:
  - After trimming, the app treats the value as `Web Development 2026`.
  - A duplicate-name error is shown and no new program is created.
- **Priority**: High

### TC-009
- **Title**: Server-side validation errors do not create a program or show false success
- **Preconditions**:
  - I am on the **Program creation** form.
  - Backend is configured to reject program creation (e.g., HTTP 400/500).
- **Steps**:
  1. Enter **Name** `Informatique & IA - Niveau 2`.
  2. Fill other required fields with valid values.
  3. Click **Create**.
- **Expected result**:
  - The program is not created.
  - The UI shows an error message and remains on the form (or shows errors inline).
  - No success confirmation appears.
- **Priority**: High

---

## Ambiguities / gaps in the ACs (to confirm)
- **Uniqueness scope**: Not specified whether duplicates are checked globally, per organization, per campus, etc.
- **Case/whitespace rules**: ACs specify trimming for all-whitespace input, but not how duplicates are handled across case and whitespace variations.
- **Error location**: Not specified whether duplicate/validation errors appear inline under **Name**, as a toast, or at the top of the form.
