Feature: DS-2 — Edit existing program details
  As an admin user, I want to edit an existing program's details
  so that I can correct or update program information after creation.

  Background:
    Given I am logged in as admin
    And I navigate to the Programs page
    And a program "Web Development 2026" exists

  # ─────────────────────────────────────────────────────────────
  # Happy paths
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-001 Open the edit form for an existing program
    When I click the edit icon (✏️) on the "Web Development 2026" row
    Then I see the edit form
    And the "Program Name" field is pre-populated with "Web Development 2026"
    And the "Description" field is pre-populated with the program's current description

  Scenario: TC-002 Successfully update the program name
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    And I type "Web Development 2026 - Updated"
    And I click "Save"
    Then the modal closes
    And the program list immediately shows "Web Development 2026 - Updated"
    And "Web Development 2026" no longer appears in the program list

  Scenario: TC-003 Successfully update the description only — program name is preserved
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Description" field
    And I type "Revised: Full-stack web development program"
    And I click "Save"
    Then the modal closes
    And the program list shows "Web Development 2026" (name unchanged)
    And the program's stored description is "Revised: Full-stack web development program"

  Scenario: TC-004 Successfully clear the description (make it empty)
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Description" field
    And I leave it empty
    And I click "Save"
    Then the modal closes
    And the program list shows "Web Development 2026" (name unchanged)

  Scenario: TC-005 Edited row reflects new values immediately without page reload
    Given I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "Full-Stack Bootcamp 2026"
    And I click "Save"
    Then the modal closes
    And the program list row shows "Full-Stack Bootcamp 2026"
    And no stale text from the previous name remains visible on the page

  Scenario: TC-006 Save button is enabled when at least the program name field has a valid value
    Given I have opened the edit form for "Web Development 2026"
    When the "Program Name" field contains "Web Development 2026"
    Then the "Save" button is enabled

  # ─────────────────────────────────────────────────────────────
  # Negative
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-007 Save button is disabled when program name is empty
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    Then the "Save" button is disabled
    And the form is not submitted

  Scenario: TC-008 Error is shown when renaming to a name that already exists
    Given a second program named "Data Science Fundamentals" also exists
    And I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "Data Science Fundamentals"
    And I click "Save"
    Then I see an inline error message indicating the name is already taken
    And the modal remains open
    And "Web Development 2026" is not renamed in the program list

  Scenario: TC-009 Duplicate detection on edit is case-insensitive
    Given a second program named "Data Science Fundamentals" also exists
    And I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "data science fundamentals"
    And I click "Save"
    Then I see an inline error message indicating the name is already taken
    And the modal remains open

  Scenario: TC-010 Program name exceeding 255 characters is rejected on save
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    And I type a 256-character name "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    Then either the input field truncates the value at 255 characters
    Or the "Save" button is disabled
    Or I see a validation error "Program name must not exceed 255 characters"
    And the original program "Web Development 2026" is not corrupted or removed from the list

  Scenario: TC-011 Cancelling the edit form discards changes
    Given I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "Should Not Be Saved"
    And I click "Cancel"
    Then the modal closes
    And the program list still shows "Web Development 2026" (unchanged)

  Scenario: TC-012 Saving the form with no changes does not corrupt program data
    Given I have opened the edit form for "Web Development 2026"
    When I do not change any field
    And I click "Save"
    Then the modal closes
    And the program list still shows "Web Development 2026" with its original data intact

  # ─────────────────────────────────────────────────────────────
  # Edge cases
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-013 Program name with leading and trailing whitespace is trimmed before save
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    And I type "  Trimmed Edit Program  "
    And I click "Save"
    Then the program is saved as "Trimmed Edit Program" (without surrounding spaces)
    And the program list shows "Trimmed Edit Program"

  Scenario: TC-014 Program name consisting only of whitespace is rejected
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    And I type "     "
    Then the "Save" button is disabled
    Or I see a validation error "Program name cannot be blank"

  Scenario: TC-015 Program name with special characters is accepted
    Given I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "Science & Tech: K–12 (Rev. 2026)"
    And I click "Save"
    Then the modal closes
    And the program list shows "Science & Tech: K–12 (Rev. 2026)"

  Scenario: TC-016 XSS payload in program name is stored as plain text and not executed
    Given I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "<script>alert('xss')</script>"
    And I click "Save"
    Then no JavaScript alert appears
    And the program name is displayed as the literal text "<script>alert('xss')</script>"
    Or an error is shown and the value is rejected

  Scenario: TC-017 Double-clicking Save does not submit two PATCH requests
    Given I have opened the edit form for "Web Development 2026"
    When I change "Program Name" to "Double-Click Safe Edit"
    And I double-click the "Save" button
    Then exactly one PATCH request is sent to the server
    And the program list shows exactly one entry named "Double-Click Safe Edit"
    And the modal does not get stuck open

  Scenario: TC-018 Program name at exactly 255 characters is accepted
    Given I have opened the edit form for "Web Development 2026"
    When I clear the "Program Name" field
    And I type a 255-character name "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    And I click "Save"
    Then the modal closes
    And the program list shows the program with the 255-character name

  Scenario: TC-019 Renaming to a name identical to itself (no actual change) is accepted
    Given I have opened the edit form for "Web Development 2026"
    When I do not change the "Program Name" field (value remains "Web Development 2026")
    And I click "Save"
    Then the modal closes without a duplicate-name error
    And the program list still shows "Web Development 2026"

  Scenario: TC-020 Edit icon is visible and clickable for every program row
    Given the program list contains at least two programs
    Then each row displays a clickable edit control (✏️ icon or equivalent button)
    And clicking the edit control on any row opens the edit form for that specific program

# ─────────────────────────────────────────────────────────────
# Ambiguities & gaps found in the acceptance criteria
# ─────────────────────────────────────────────────────────────
# 1. EDIT CONTROL TYPE — Multiple bugs (DS-57, DS-81, DS-93, DS-94) report the
#    edit button alternates between a pencil emoji (✏️) and an icon image.
#    Confirm the expected accessible name / selector for the edit button.
#
# 2. DUPLICATE CHECK ON EDIT — AC does not state whether renaming to an
#    existing name is forbidden. Bugs DS-11, DS-22, DS-37, DS-38, DS-47,
#    DS-55 all confirm it should be rejected. Confirm with BA.
#
# 3. MAX LENGTH ON EDIT — Not stated in AC. Bugs DS-15, DS-39, DS-42, DS-48,
#    DS-56, DS-95 indicate 255 chars is the intended limit. Confirm with BA.
#    Also confirm whether >255-char input should be: (a) truncated by the
#    field, (b) blocked by a disabled Save, or (c) rejected on Save.
#
# 4. SAVE BUTTON WITH NO CHANGES (TC-012) — Bug DS-44 notes Save stays enabled
#    when nothing is changed. Confirm whether Save should be disabled when
#    the form values are identical to the current persisted values.
#
# 5. DOUBLE-CLICK GUARD — AC does not mention idempotency. Bugs DS-23, DS-41,
#    DS-43, DS-45, DS-50, DS-96, DS-97 confirm duplicate PATCHes occur.
#    TC-017 tests for this; confirm it is an in-scope requirement.
#
# 6. STALE DATA (DS-9) — AC says list "immediately shows" the new name but
#    does not define a time SLA. Confirm acceptable maximum refresh latency.
#
# 7. XSS (DS-89) — Not addressed in AC. TC-016 is included as an edge case;
#    confirm whether security validation is in scope for this story.
# ─────────────────────────────────────────────────────────────
