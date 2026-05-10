# Test Plan — React TodoMVC (Playwright demo)

**Application under test**: [React TodoMVC demo](https://demo.playwright.dev/todomvc/#/)  
**Disclaimer shown in UI**: “This is just a demo of TodoMVC for testing, not the real TodoMVC app.”

---

## Assumed UI context / test data

- **URL (default / All view)**: `https://demo.playwright.dev/todomvc/#/`
- **Page title**: `React • TodoMVC`
- **Main heading**: `todos`
- **New todo field**:
  - CSS class: `new-todo`
  - **Placeholder**: `What needs to be done?`
  - **Submit**: Enter key after typing (standard TodoMVC pattern)
- **Todo list**:
  - Container: `ul.todo-list`
  - Each item: `li` inside `ul.todo-list`, with:
    - **Completion control**: checkbox with class `toggle`
    - **Visible title**: `label` (e.g. text `Buy milk`)
    - **Delete control**: element with class `destroy` (typically revealed on row hover/focus)
  - **Completed state**: list item has class `completed` on the `li`
- **Footer** (visible once at least one todo exists):
  - **Remaining count**: element `span.todo-count` (e.g. `3 items left`, singular `1 item left`)
  - **Filters** (links): `All` → `#/`, `Active` → `#/active`, `Completed` → `#/completed`
  - **Clear completed**: button/link `Clear completed` (class `clear-completed`), shown when there is at least one completed todo
- **Help text** (`.info`): includes “Double-click to edit a todo”
- **Sample todo titles used in this plan** (concrete values):
  - `Buy milk`
  - `Walk the dog`
  - `Pay rent`
  - `Call dentist — 555-0100`

---

## Positive flows

### TC-001
- **Title**: Empty list can be initialized from the default route and shows the new-todo field
- **Preconditions**:
  - Browser cache/storage for the site is cleared **or** a fresh profile is used (so no stale todos).
  - I open `https://demo.playwright.dev/todomvc/#/`.
- **Steps**:
  1. Wait for the heading `todos` to be visible.
  2. Locate the text field with placeholder `What needs to be done?`.
- **Expected result**:
  - The page title is `React • TodoMVC`.
  - The `todos` heading is visible.
  - The `new-todo` field is visible and enabled.
  - No `ul.todo-list` items are shown **or** the list is empty (no `li` rows), consistent with a new session.
  - The footer (filters / count) is **not** shown when there are zero todos (standard TodoMVC behavior).
- **Priority**: High  
- **Maps to AC**: Create a todo list (baseline / empty list)

### TC-002
- **Title**: Four distinct todos appear in order after sequential entry
- **Preconditions**:
  - I am on `https://demo.playwright.dev/todomvc/#/` with an empty todo list.
- **Steps**:
  1. Click the field with placeholder `What needs to be done?`.
  2. Type `Buy milk` and press **Enter**.
  3. Type `Walk the dog` and press **Enter**.
  4. Type `Pay rent` and press **Enter**.
  5. Type `Call dentist — 555-0100` and press **Enter**.
- **Expected result**:
  - Exactly **four** `li` elements exist under `ul.todo-list`, in this top-to-bottom order:
    1. `Buy milk`
    2. `Walk the dog`
    3. `Pay rent`
    4. `Call dentist — 555-0100`
  - `span.todo-count` reads **`4 items left`**.
  - Footer is visible with filter links `All`, `Active`, `Completed`.
- **Priority**: High  
- **Maps to AC**: Add items (4)

### TC-003
- **Title**: Marking one todo completed updates styling, count, and Active/Completed views
- **Preconditions**:
  - The list contains (top to bottom): `Buy milk`, `Walk the dog`, `Pay rent`, `Call dentist — 555-0100` (from TC-002).
  - I am on `https://demo.playwright.dev/todomvc/#/` (**All**).
- **Steps**:
  1. Click the **toggle** checkbox for the row labeled `Pay rent`.
  2. Observe the `Pay rent` row.
  3. Read `span.todo-count`.
  4. Click the **Active** filter link (`#/active`).
  5. Click the **Completed** filter link (`#/completed`).
  6. Click **All** (`#/`).
- **Expected result**:
  - **Finish item. Expect to be finished**:
    - The `Pay rent` `li` has class **`completed`**.
    - The `Pay rent` checkbox (`toggle`) is checked.
    - Visual treatment matches completed todos (e.g. title struck through per TodoMVC styling).
  - `span.todo-count` reads **`3 items left`**.
  - On **Active**: rows shown are only `Buy milk`, `Walk the dog`, `Call dentist — 555-0100` (no `Pay rent`).
  - On **Completed**: only `Pay rent` is listed.
  - On **All**: all four rows are visible again; `Pay rent` remains in **completed** state.
  - **`Clear completed`** control is available (because there is at least one completed item).
- **Priority**: High  
- **Maps to AC**: Finish item. Expect to be finished

### TC-004
- **Title**: Deleting one todo removes only that row and fixes the remaining count
- **Preconditions**:
  - The list contains four todos as in TC-002.
  - `Pay rent` is **not** completed (if prior tests completed it, reset by reloading a fresh session and repeating TC-002 only, or un-toggle if the app allows).
  - I am on `https://demo.playwright.dev/todomvc/#/` (**All**).
- **Steps**:
  1. Hover or focus the row labeled `Walk the dog` so the **destroy** control is actionable.
  2. Click **destroy** for `Walk the dog`.
  3. Inspect `ul.todo-list` rows and `span.todo-count`.
- **Expected result**:
  - **Remove item from the list. Expect to be removed**:
    - No row with label `Walk the dog` exists.
  - Remaining rows (order preserved for survivors): `Buy milk`, `Pay rent`, `Call dentist — 555-0100`.
  - `span.todo-count` reads **`3 items left`**.
  - No browser error dialog; page remains `React • TodoMVC`.
- **Priority**: High  
- **Maps to AC**: Remove item from the list. Expect to be removed

### TC-005
- **Title**: Clear completed removes finished todos and resets the completed filter view
- **Preconditions**:
  - At least one todo is completed (e.g. complete `Buy milk` via its `toggle`).
  - `Clear completed` is visible.
- **Steps**:
  1. Note which todos are completed.
  2. Click **`Clear completed`**.
  3. View **All** and **Completed** lists; read `todo-count`.
- **Expected result**:
  - All previously completed todos are removed from **All**.
  - **Completed** view is empty (or shows no rows).
  - No completed rows retain class `completed` on **All**.
  - Count matches number of remaining active todos only.
- **Priority**: Medium  
- **Maps to AC**: Finish item (cleanup path; ensures “finished” state is actionable in bulk)

### TC-006
- **Title**: Inline edit via double-click saves updated text on Enter
- **Preconditions**:
  - A todo exists with label `Buy milk`.
- **Steps**:
  1. Double-click the `Buy milk` label (per hint: “Double-click to edit a todo”).
  2. Change text to `Buy organic milk`.
  3. Press **Enter**.
- **Expected result**:
  - The row displays **`Buy organic milk`**.
  - No duplicate row is created.
  - `todo-count` is unchanged (still the same number of items).
- **Priority**: Medium  
- **Maps to AC**: Add items / list integrity (editing is app-documented behavior)

---

## Negative flows

### TC-101
- **Title**: Submitting an empty todo does not create a blank list item
- **Preconditions**:
  - Empty list **or** a known non-empty list with count `N`.
- **Steps**:
  1. Focus `new-todo`.
  2. Press **Enter** without typing.
- **Expected result**:
  - The number of `li` rows does not increase.
  - If the list was empty, it remains empty and footer remains hidden (or state unchanged).
- **Priority**: High

### TC-102
- **Title**: Whitespace-only input does not create a meaningful todo (or normalizes to empty)
- **Preconditions**:
  - Empty list.
- **Steps**:
  1. Type three spaces `   ` into `new-todo`.
  2. Press **Enter**.
- **Expected result**:
  - No new `li` appears **or** the app trims and behaves per TC-101 (no blank visible label).  
  - **Pass criterion**: user never sees an “empty title” todo that breaks list semantics.
- **Priority**: Medium

### TC-103
- **Title**: Deleting the last todo returns the UI to the “no footer” empty state
- **Preconditions**:
  - Exactly one todo exists, labeled `Buy milk`.
- **Steps**:
  1. Delete the todo via **destroy**.
- **Expected result**:
  - No `li` elements under `ul.todo-list`.
  - Footer with filters and `Clear completed` is not shown (TodoMVC standard).
  - `new-todo` remains available.
- **Priority**: Medium

### TC-104
- **Title**: Completing a todo must not remove it from the **All** list
- **Preconditions**:
  - List contains `Pay rent`.
- **Steps**:
  1. Toggle complete on `Pay rent`.
  2. On **All**, search for label `Pay rent`.
- **Expected result**:
  - `Pay rent` still exists on **All** but is visually/nominally completed (`li.completed`).
- **Priority**: High

### TC-105
- **Title**: Removing an active todo must not mark other todos completed
- **Preconditions**:
  - List contains `Buy milk` and `Walk the dog`, both active.
- **Steps**:
  1. Delete `Buy milk`.
  2. Inspect `Walk the dog` row classes and toggle state.
- **Expected result**:
  - `Walk the dog` is still present and **not** `completed`.
- **Priority**: Medium

---

## Edge cases

### TC-201
- **Title**: Duplicate titles are allowed as separate rows
- **Preconditions**:
  - Empty list.
- **Steps**:
  1. Add `Buy milk` (Enter).
  2. Add `Buy milk` (Enter).
- **Expected result**:
  - Two distinct `li` rows, each labeled `Buy milk`.
  - `todo-count` reads **`2 items left`**.
- **Priority**: Low

### TC-202
- **Title**: Special characters and HTML-like text are stored as plain text (no script execution)
- **Preconditions**:
  - Empty list.
- **Steps**:
  1. Add todo text: `<script>alert(1)</script> — safe?` (Enter).
  2. Observe DOM / page behavior.
- **Expected result**:
  - Text displays literally in the label (no script execution / no alert).
  - Item remains toggleable and deletable.
- **Priority**: Medium

### TC-203
- **Title**: Unicode and emoji characters render correctly in titles
- **Preconditions**:
  - Empty list.
- **Steps**:
  1. Add `Покупки 🛒 — 日本語` (Enter).
- **Expected result**:
  - Label matches exactly `Покупки 🛒 — 日本語`.
  - Count is `1 item left`.
- **Priority**: Low

### TC-204
- **Title**: Very long single-line title does not break page layout critically
- **Preconditions**:
  - Empty list.
- **Steps**:
  1. Paste a string of **2000** characters (e.g. repeated `A`) into `new-todo`.
  2. Press **Enter**.
- **Expected result**:
  - Exactly one new todo exists.
  - List remains scrollable/usable; **destroy** and **toggle** remain reachable (may require scroll).
  - No silent truncation without visual indication **or** truncation is consistent and documented — **note as observation** if ambiguous.
- **Priority**: Low

### TC-205
- **Title**: Filter URLs deep-link: Active hides completed items
- **Preconditions**:
  - Todos: `A` active, `B` completed.
- **Steps**:
  1. Navigate directly to `https://demo.playwright.dev/todomvc/#/active`.
- **Expected result**:
  - Only active todos appear; `B` is not listed.
- **Priority**: Medium

### TC-206
- **Title**: Filter URLs deep-link: Completed hides active items
- **Preconditions**:
  - Same as TC-205.
- **Steps**:
  1. Navigate to `https://demo.playwright.dev/todomvc/#/completed`.
- **Expected result**:
  - Only `B` (completed) appears.
- **Priority**: Medium

### TC-207
- **Title**: Toggling a completed todo back to active updates counts and filters
- **Preconditions**:
  - `Pay rent` is completed.
- **Steps**:
  1. Click **toggle** on `Pay rent` again.
- **Expected result**:
  - `li` no longer has class `completed`; checkbox unchecked.
  - `items left` increments accordingly.
  - **Active** list now includes `Pay rent`; **Completed** excludes it.
- **Priority**: Medium

---

## Acceptance criteria coverage checklist

| # | Acceptance criterion | Covered by (test IDs) |
|---|----------------------|------------------------|
| 1 | Create a todo list | TC-001 |
| 2 | Add items (4) | TC-002 |
| 3 | Finish item. Expect to be finished | TC-003, TC-104, TC-207 |
| 4 | Remove item from the list. Expect to be removed | TC-004, TC-103, TC-105 |

---

## Ambiguities / gaps in the acceptance criteria

1. **Persistence**: ACs do not state whether todos survive refresh, new tab, or browser restart. Plan assumes **session/local persistence per app**; add explicit persistence ACs if product requires it.
2. **“Create a todo list”**: Could mean only “add first item” or “establish multi-item list.” TC-001 + TC-002 together cover both interpretations.
3. **Finish semantics**: Not specified whether “finished” means strikethrough only, hidden from Active, included in Completed, or removed via **Clear completed**. TC-003 and TC-005 clarify expected demo behavior.
4. **Remove UX**: Destroy control visibility (hover-only) is not in ACs but affects automation and accessibility; worth an explicit requirement if this were production.
5. **Editing**: ACs omit inline edit; included because the demo UI documents it (`.info` hint).
6. **Concurrency / multi-user**: Not applicable to this static demo; gap if ACs were meant for a real backend-backed product.
7. **Max length / validation**: No business rule for maximum title length; TC-204 probes technical behavior only.

**Revalidation**: Every numbered AC in the prompt template is exercised by at least one **High**-priority case in **Positive flows** (TC-001–TC-004), with supporting cases for state consistency and filters.
