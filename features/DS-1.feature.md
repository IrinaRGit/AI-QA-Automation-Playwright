Feature: DS-1 — Create new academic program
  As an admin user, I want to create a new academic program
  so that I can begin designing its curriculum structure.

  Background:
    Given I am logged in as admin
    And I navigate to the Programs page

  # ─────────────────────────────────────────────────────────────
  # Happy paths
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-001 Navigate to program creation form
    When I click "+ New Program"
    Then I see the program creation form
    And the form contains a "Program Name" field
    And the form contains a "Description" field

  Scenario: TC-002 Successfully create a program with name and description
    Given I click "+ New Program"
    When I fill in "Program Name" with "IWeb Development 2026"
    And I fill in "Description" with "Full-stack web development program"
    And I click "Create"
    Then the modal closes
    And the program list shows an entry named "Web Development 2026"

  Scenario: TC-003 Successfully create a program without a description
    Given I click "+ New Program"
    When I fill in "Program Name" with "Data Science Fundamentals"
    And I leave the "Description" field empty
    And I click "Create"
    Then the modal closes
    And the program list shows an entry named "Data Science Fundamentals"

  Scenario: TC-004 Create button is enabled when program name is filled
    Given I click "+ New Program"
    When I fill in "Program Name" with "Cybersecurity Essentials"
    Then the "Create" button is enabled

  Scenario: TC-005 Program name with minimum valid length (1 character) is accepted
    Given I click "+ New Program"
    When I fill in "Program Name" with "A"
    And I click "Create"
    Then the modal closes
    And the program list shows an entry named "A"

  Scenario: TC-006 Program name at maximum valid length (255 characters) is accepted
    Given I click "+ New Program"
    When I fill in "Program Name" with a 255-character string "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    And I click "Create"
    Then the modal closes
    And the program list shows the program with the 255-character name

  # ─────────────────────────────────────────────────────────────
  # Negative
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-007 Create button is disabled when program name is empty
    Given I click "+ New Program"
    When I leave the "Program Name" field empty
    Then the "Create" button is disabled
    And the form is not submitted

  Scenario: TC-008 Error is shown and form is not submitted when a program name already exists
    Given a program named "Web Development 2026" already exists
    And I click "+ New Program"
    When I fill in "Program Name" with "Web Development 2026"
    And I click "Create"
    Then I see an inline error message indicating the name is already taken
    And the modal remains open
    And no duplicate program is created in the program list

  Scenario: TC-009 Duplicate detection is case-insensitive
    Given a program named "Web Development 2026" already exists
    And I click "+ New Program"
    When I fill in "Program Name" with "web development 2026"
    And I click "Create"
    Then I see an inline error message indicating the name is already taken
    And no duplicate program is created

  Scenario: TC-010 Program name exceeding 255 characters is rejected
    Given I click "+ New Program"
    When I fill in "Program Name" with a 256-character string "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    Then either the field truncates input at 255 characters
    Or I see a validation error "Program name must not exceed 255 characters"
    And the "Create" button does not submit the oversized name silently

  Scenario: TC-011 Cancelling the form does not create a program
    Given I click "+ New Program"
    When I fill in "Program Name" with "Abandoned Program"
    And I click "Cancel"
    Then the modal closes
    And no program named "Abandoned Program" appears in the program list

  # ─────────────────────────────────────────────────────────────
  # Edge cases
  # ─────────────────────────────────────────────────────────────

  Scenario: TC-012 Program name with leading and trailing whitespace is trimmed before save
    Given I click "+ New Program"
    When I fill in "Program Name" with "  Trimmed Program  "
    And I click "Create"
    Then the program is saved as "Trimmed Program" (without surrounding spaces)
    And the program list shows "Trimmed Program"

  Scenario: TC-013 Program name consisting only of whitespace is rejected
    Given I click "+ New Program"
    When I fill in "Program Name" with "     "
    Then the "Create" button is disabled
    Or I see a validation error "Program name cannot be blank"

  Scenario: TC-014 Program name with special characters is accepted
    Given I click "+ New Program"
    When I fill in "Program Name" with "Math & Science: K–12 (2026)"
    And I click "Create"
    Then the modal closes
    And the program list shows an entry named "Math & Science: K–12 (2026)"

  Scenario: TC-015 Identical NFC and NFD Unicode names are treated as duplicates
    Given a program named "Café Studies" (NFC normalised) already exists
    And I click "+ New Program"
    When I fill in "Program Name" with "Café Studies" (NFD normalised, visually identical)
    And I click "Create"
    Then I see an inline error message indicating the name is already taken
    And no duplicate program is created

  Scenario: TC-016 Double-clicking Create does not submit the form twice
    Given I click "+ New Program"
    When I fill in "Program Name" with "Double-Click Safe Program"
    And I double-click the "Create" button
    Then exactly one program named "Double-Click Safe Program" appears in the program list
    And the modal closes only once

  Scenario: TC-017 Program appears in the list immediately after creation without page reload
    Given I click "+ New Program"
    When I fill in "Program Name" with "Instant Visibility Program"
    And I click "Create"
    Then the modal closes within 2 seconds
    And "Instant Visibility Program" is visible in the program list without refreshing the page

  Scenario: TC-018 Program list row for the new program is uniquely identifiable
    Given I click "+ New Program"
    When I fill in "Program Name" with "Unique Row Program"
    And I click "Create"
    Then the program list contains exactly one row whose accessible name is "Unique Row Program"
    And no other row or cell matches that name erroneously

# ─────────────────────────────────────────────────────────────
# Ambiguities & gaps found in the acceptance criteria
# ─────────────────────────────────────────────────────────────
# 1. MAX LENGTH — The AC does not state a maximum for Program Name.
#    Linked bug DS-78 implies 255 chars is the intended limit, but
#    it is not documented in the ticket. Confirm with BA.
#
# 2. DUPLICATE CHECK SCOPE — AC says "program list shows 'Web Development 2026'"
#    but does not state whether duplicate names are forbidden.
#    Linked bug DS-77 suggests they should be rejected. Confirm with BA
#    whether duplicate detection is case-insensitive and Unicode-aware.
#
# 3. DESCRIPTION FIELD — AC shows Description as optional (TC-003 above),
#    but the ticket does not explicitly state it is optional.
#    Confirm whether Description is required or optional.
#
# 4. CANCEL BUTTON — AC does not mention a Cancel button or
#    closing the modal without saving. Confirm dismiss behaviour.
#
# 5. WHITESPACE HANDLING — No AC covers trimming or whitespace-only names.
#    TC-012 and TC-013 are inferred from standard UX practice.
#
# 6. SUBMISSION GUARD (double-click) — Not in the AC; inferred from
#    linked bugs DS-17, DS-79, DS-92. Confirm if idempotency is in scope.
#
# 7. MODAL CLOSE TIMING — Linked bug DS-16 references a >2 s dismiss time.
#    TC-017 uses 2 s as the implied SLA. Confirm the expected threshold.
# ─────────────────────────────────────────────────────────────
