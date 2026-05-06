## Test Plan — Program name validation and duplicate prevention (Edge cases)

### Assumed UI context / test data
- **Program creation form** contains **Name** and other required fields (e.g., Description).
- **Existing program**: `Web Development 2026`

---

## Edge cases

### TC-010
- **Title**: Name supports accented characters and mixed punctuation without corruption
- **Preconditions**:
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `Informatique & IA - Niveau 2`.
  2. In **Description**, enter `Vérifier l'encodage Unicode et l’affichage des caractères accentués.`
  3. Click **Create**.
- **Expected result**:
  - Program is created successfully.
  - The list/detail view displays accents correctly (no replacement characters).
- **Priority**: Medium

### TC-011
- **Title**: Name supports non-Latin characters (Unicode)
- **Preconditions**:
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `データサイエンス 2026`.
  2. In **Description**, enter `Unicode name test.`
  3. Click **Create**.
- **Expected result**:
  - Program is created successfully.
  - Name displays correctly across list and detail views.
- **Priority**: Medium

### TC-012
- **Title**: Name max-length boundary is enforced (exactly max allowed)
- **Preconditions**:
  - The max length for **Name** is known/configured (commonly 100–255 characters).
  - I am on the **Program creation** form.
- **Steps**:
  1. Enter a **Name** string that is exactly the maximum allowed length.
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result**:
  - If the input is exactly at max, the program is created successfully.
  - Stored name matches what was entered (no silent truncation).
- **Priority**: High

### TC-013
- **Title**: Name max-length overflow is blocked (max+1)
- **Preconditions**:
  - The max length for **Name** is known/configured.
  - I am on the **Program creation** form.
- **Steps**:
  1. Enter a **Name** string that is max length + 1.
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result**:
  - The form is not submitted.
  - A clear validation message indicates the maximum length.
  - The UI does not silently truncate and create a program.
- **Priority**: High

### TC-014
- **Title**: Duplicate detection is robust to Unicode normalization (accented variants)
- **Preconditions**:
  - A program already exists with **Name** `Informatique & IA - Niveau 2`.
  - I am on the **Program creation** form.
- **Steps**:
  1. Attempt to create another program with **Name** `Informatique & IA - Niveau 2` (same visible text) where the apostrophes/accents could be pasted from a different source (different Unicode normalization).
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result**:
  - App prevents visually identical duplicates that differ only in Unicode normalization (if that is the intended policy).
  - A duplicate-name error is shown.
- **Priority**: Medium

### TC-015
- **Title**: Internal multiple spaces are handled consistently for duplicates
- **Preconditions**:
  - A program exists with **Name** `Web Development 2026`.
  - I am on the **Program creation** form.
- **Steps**:
  1. Enter **Name** `Web  Development  2026` (double spaces between words).
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result**:
  - Duplicate-prevention behavior is consistent with the product’s normalization rules:
    - If internal whitespace is normalized, duplicate is rejected.
    - If not normalized, UI still avoids confusing near-duplicates (needs clarified).
- **Priority**: Medium

### TC-016
- **Title**: Script/HTML injection strings are not executed and are handled safely
- **Preconditions**:
  - I am on the **Program creation** form.
- **Steps**:
  1. In **Name**, enter `<script>alert("xss")</script>`.
  2. Fill other required fields.
  3. Click **Create**.
- **Expected result**:
  - No script executes.
  - The value is rejected with validation OR escaped/sanitized per security policy (must be defined).
  - No unsafe rendering occurs in the Programs list.
- **Priority**: High

---

## Ambiguities / gaps in the ACs (to confirm)
- **Normalization policy**: Not specified whether duplicates compare after trimming only, or also case-folding, collapsing internal whitespace, and Unicode normalization.
- **Max length**: ACs don’t specify the max allowed length for **Name** (needed for boundary testing).
- **Character allowlist/denylist**: ACs give one special-character example but don’t define whether `<`, `>`, quotes, emojis, or slashes are allowed.
- **Uniqueness scope**: Not specified whether the name must be unique globally, per tenant, or per program type.
