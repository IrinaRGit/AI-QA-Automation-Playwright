## Test Plan — Program name validation and duplicate prevention (Positive flows)

### Assumed UI context / test data
- **Program creation form** contains at least:
  - **Program Name** (text field labeled `Name`)
  - **Description** (multiline)
  - **Create** button
- **Existing program for duplicate checks**:
  - **Name**: `Web Development 2026`
  - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`

---

## Positive flows

### TC-001
- **Title**: Program name with special characters is accepted and program is created successfully
- **Preconditions**:
  - I am authenticated and authorized to create programs.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `Informatique & IA - Niveau 2`.
  2. In **Description**, enter `Programme avancé: IA appliquée, MLOps, et automatisation QA.`
  3. Click **Create**.
- **Expected result**:
  - The form is submitted successfully.
  - The program is created.
  - The Programs list (or success confirmation) shows a program named `Informatique & IA - Niveau 2`.
- **Priority**: High

### TC-002
- **Title**: Program name is trimmed and saved correctly when it includes leading/trailing spaces
- **Preconditions**:
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `  Informatique & IA - Niveau 2  `.
  2. In **Description**, enter `Test trimming behavior for program names.`
  3. Click **Create**.
- **Expected result**:
  - The program is created successfully.
  - The stored/displayed program name is consistent and user-friendly (e.g., trimmed to `Informatique & IA - Niveau 2`).
  - The UI does not show a visually identical duplicate due to hidden whitespace.
- **Priority**: Medium

### TC-003
- **Title**: Program creation succeeds with a typical valid name that is not a duplicate
- **Preconditions**:
  - `Web Development 2026` exists.
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `Web Development 2026 - Evening Track`.
  2. In **Description**, enter `Evening cohort for working professionals.`
  3. Click **Create**.
- **Expected result**:
  - Program is created successfully.
  - No duplicate-name error is shown.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Field requirements**: ACs say “fill other required fields” but don’t list which fields are required besides **Name**.
- **Trim rules**: Not specified whether trimming is only leading/trailing whitespace or also collapses multiple internal spaces.
- **Allowed characters**: Special characters example is provided, but the full allowed set (e.g., apostrophes, slashes, emojis) is unspecified.
- **Uniqueness rules**: Not specified whether uniqueness is case-insensitive, whitespace-normalized, and/or accent-insensitive.
