## Test Plan — Edit existing program details (Edge cases)

### Assumed UI context / test data
- **Existing program**:
  - **Name**: `Web Development 2026`
  - **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
- **Edit Program modal** contains at least **Name**, **Description**, **Save**, and **Cancel/X**.

---

## Edge cases

### TC-021
- **Title**: Name supports common punctuation and symbols without breaking save or display
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to `Web Development 2026 - Updated (C#/.NET & JS)`.
  2. Click **Save**.
- **Expected result**:
  - The modal closes.
  - The list shows `Web Development 2026 - Updated (C#/.NET & JS)` exactly (or with documented normalization).
  - Re-open edit and confirm the stored Name matches what is shown.
- **Priority**: Medium

### TC-022
- **Title**: Name supports non-English characters (Unicode)
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to `Web Development 2026 – Développement Web (東京)`.
  2. Click **Save**.
- **Expected result**:
  - The modal closes.
  - The list displays the Unicode characters correctly (no � replacement, no truncation that breaks characters).
  - Re-open edit and confirm Name persists correctly.
- **Priority**: Medium

### TC-023
- **Title**: Description supports multi-line text and preserves line breaks
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Description** to:
     `Full-stack curriculum:\n- HTML/CSS\n- JavaScript\n- React\n- Node.js\n- Playwright E2E`
  2. Click **Save**.
- **Expected result**:
  - The modal closes.
  - Re-open edit and confirm **Description** retains intended line breaks and characters.
- **Priority**: Medium

### TC-024
- **Title**: Extremely long Description saves without truncation or UI lag (up to system max)
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Paste a long **Description** (~5,000 characters) such as:
     `Full-stack curriculum updated. ` repeated until ~5,000 characters.
  2. Click **Save**.
- **Expected result**:
  - If within allowed limits, save succeeds and persists full text.
  - If over allowed limits, an explicit max-length validation is shown and save is blocked (no silent truncation).
- **Priority**: Medium

### TC-025
- **Title**: Name enforces max-length correctly (boundary: exactly max and max+1)
- **Preconditions**:
  - Max length for **Name** is known/configured (commonly 100–255 characters).
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Name** to a string of exactly the max length (e.g., 100 chars) and click **Save**.
  2. Re-open edit.
  3. Set **Name** to a string of max length + 1 and click **Save**.
- **Expected result**:
  - Exactly max length: save succeeds.
  - Max+1: save is blocked with a clear validation message (no silent truncation).
- **Priority**: High

### TC-026
- **Title**: Name normalization prevents “invisible duplicates” (case/whitespace variations)
- **Preconditions**:
  - A program exists with **Name** `Web Development 2026`.
  - I am editing another program (or the same one, depending on uniqueness rules).
- **Steps**:
  1. Attempt to set **Name** to `web development 2026` (lowercase).
  2. Attempt to set **Name** to `Web  Development  2026` (double spaces).
  3. Click **Save** for each attempt (as applicable).
- **Expected result**:
  - If names are unique, uniqueness is applied consistently (e.g., case-insensitive and space-normalized) to prevent duplicates that look the same to users.
  - If names are not unique, the UI still displays consistently (no confusion due to only whitespace differences).
- **Priority**: Medium

### TC-027
- **Title**: HTML/JS injection strings are not executed and are safely rendered
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Set **Description** to `<script>alert("xss")</script>`.
  2. Click **Save**.
  3. View the program in the list and re-open edit.
- **Expected result**:
  - No script executes.
  - The value is either escaped and displayed as text, or rejected with a validation error per security policy.
- **Priority**: High

### TC-028
- **Title**: Rapid double-click on Save does not create inconsistent state
- **Preconditions**:
  - I am editing `Web Development 2026` in the modal.
- **Steps**:
  1. Change **Name** to `Web Development 2026 - Updated`.
  2. Double-click **Save** quickly (or click Save repeatedly).
- **Expected result**:
  - Only one update is applied.
  - No duplicate rows appear.
  - UI prevents multiple submissions (e.g., disables Save while saving) or safely deduplicates requests.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Max lengths**: ACs do not specify max lengths for **Name**/**Description**; boundary testing needs confirmed limits.
- **Uniqueness/normalization**: ACs do not define whether Name uniqueness is required or what normalization rules apply (trim, collapse spaces, case-insensitive).
- **Security handling**: ACs do not specify whether HTML is allowed in Description; expected escaping/sanitization should be defined.
- **Performance expectations**: “Immediately shows” doesn’t define acceptable latency for list refresh or save responsiveness.
