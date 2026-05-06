## Test Plan — Program list filtering and display (Edge cases)

### Assumed UI context / test data
- Programs page displays each program’s **Name** and **Description**.

---

## Edge cases

### TC-008
- **Title**: Very long descriptions display without breaking the list layout
- **Preconditions**:
  - A program exists with:
    - **Name** `Long Description Program`
    - **Description** `Full-stack curriculum updated. ` repeated until ~5,000 characters.
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - The program is listed.
  - The UI handles long text gracefully (wrap, truncation with “Read more”, or scroll) according to design.
  - No overlapping elements or broken rows/cards.
- **Priority**: Medium

### TC-009
- **Title**: Long program names display without truncation bugs or layout break
- **Preconditions**:
  - A program exists with:
    - **Name** `Web Development 2026 - Extremely Long Name For Programs List Display Validation`
    - **Description** `Layout validation for long names.`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - Name is displayed in a readable way (wrap/ellipsis) per design.
  - The row/card remains aligned and usable.
- **Priority**: Low

### TC-010
- **Title**: Special characters and Unicode render correctly in the list
- **Preconditions**:
  - Programs exist:
    - **Name** `Informatique & IA - Niveau 2`
      **Description** `Programme avancé: IA appliquée, MLOps, et automatisation QA.`
    - **Name** `データサイエンス 2026`
      **Description** `Unicode name/description render test.`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - Names/descriptions render correctly (no � characters, no encoding issues).
- **Priority**: Medium

### TC-011
- **Title**: Duplicate program names (if allowed) are distinguishable and displayed consistently
- **Preconditions**:
  - Two programs exist with the same **Name** `Web Development 2026` but different **Description** values:
    - `Cohort A`
    - `Cohort B`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - Both programs appear (if duplicates are allowed).
  - Each entry shows its correct description so users can distinguish them.
- **Priority**: Low

### TC-012
- **Title**: List updates correctly when transitioning from empty state to first program created
- **Preconditions**:
  - No programs exist.
  - I am on the **Programs** page and see the empty state.
- **Steps**:
  1. Click `Create your first program`.
  2. Create a program with:
     - **Name** `Test Program`
     - **Description** `First program created from empty state.`
  3. Return to the **Programs** page (if not automatically returned).
- **Expected result**:
  - Empty state is no longer shown.
  - The list shows `Test Program` with its description.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **Filtering behavior**: The feature name includes “filtering” but no filter UI/logic is defined (search box, tags, status filters, etc.).
- **Truncation rules**: Not specified how long names/descriptions should be displayed (wrap vs ellipsis vs “Read more”).
- **Duplicate handling**: Not specified whether duplicate program names are possible and how they should appear in the list.
