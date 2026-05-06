## Test Plan — Program list filtering and display (Positive flows)

### Assumed UI context / test data
- **Programs page** displays a list/table/cards of programs.
- Each program shows at least:
  - **Name**
  - **Description**
- **Empty state** includes:
  - Message: `No programs have been created`
  - Prompt CTA: `Create your first program` (button/link)
- Example programs in the system:
  1. **Name**: `Web Development 2026`  
     **Description**: `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`
  2. **Name**: `Informatique & IA - Niveau 2`  
     **Description**: `Programme avancé: IA appliquée, MLOps, et automatisation QA.`

---

## Positive flows

### TC-001
- **Title**: Programs page displays a list with each program’s name and description
- **Preconditions**:
  - I am authenticated and authorized to view programs.
  - At least two programs exist:
    - `Web Development 2026`
    - `Informatique & IA - Niveau 2`
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - A program list is visible.
  - Each program entry displays:
    - **Name** (e.g., `Web Development 2026`)
    - **Description** (e.g., `Full-stack curriculum covering HTML, CSS, JavaScript, React, Node.js, testing, and deployment.`)
  - The page does not show the “no programs” empty-state messaging.
- **Priority**: High

### TC-002
- **Title**: Empty state message and “create first program” prompt are shown when no programs exist
- **Preconditions**:
  - I am authenticated and authorized to view programs.
  - No programs exist in the system (fresh tenant or data cleared).
- **Steps**:
  1. Navigate to the **Programs** page.
- **Expected result**:
  - A message is displayed indicating no programs have been created (e.g., `No programs have been created`).
  - A prompt/CTA is displayed to create the first program (e.g., `Create your first program`).
  - No program list rows/cards are shown.
- **Priority**: High

### TC-003
- **Title**: Create-first-program CTA navigates to the program creation form
- **Preconditions**:
  - No programs exist.
  - I am on the **Programs** page and the empty state is displayed.
- **Steps**:
  1. Click `Create your first program`.
- **Expected result**:
  - I am navigated to the **Program creation** form (or a creation modal opens).
  - The creation UI is ready to accept a **Name** and other required fields.
- **Priority**: Medium

---

## Ambiguities / gaps in the ACs (to confirm)
- **“Filtering” scope**: The feature title mentions filtering, but ACs contain only list display and empty state; filter UI/behavior is unspecified.
- **Field set**: ACs mention Name and Description only; any other displayed fields (status, dates, owner) are not defined.
- **Sorting/pagination**: Not specified whether results are paginated, sortable, or searchable.
- **Empty-state exact copy**: Message/CTA text is not specified; tests assume common wording.
