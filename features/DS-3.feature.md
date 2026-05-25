Feature: DS-3 — Program name validation and duplicate prevention

  As an authenticated admin on Didaxis Studio
  I want program names validated and duplicates blocked when creating a program
  So that the Programs list stays clean and unambiguous

  Background:
    Given I am logged in to Didaxis Studio
    And I am on the Programs page at "/programs"

  # Happy paths

  Scenario: Accept program name with special characters
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" in the Program Name field
    And I enter "Programme avancé: IA appliquée, MLOps, et automatisation QA." in the Description field
    And I click Create
    Then the New Program dialog closes
    And I see a program row named "Informatique & IA - Niveau 2" in the Programs list

  Scenario: Program name is trimmed when it includes leading and trailing spaces
    Given I am on the program creation form
    When I enter "  Informatique & IA - Niveau 2  " in the Program Name field
    And I enter "Test trimming behavior for program names." in the Description field
    And I click Create
    Then the New Program dialog closes
    And I see exactly one program row named "Informatique & IA - Niveau 2" in the Programs list
    And no duplicate row exists due to hidden whitespace

  Scenario: Create a valid non-duplicate program when a similar program already exists
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026 - Evening Track" in the Program Name field
    And I enter "Evening cohort for working professionals." in the Description field
    And I click Create
    Then the New Program dialog closes
    And I see a program row named "Web Development 2026 - Evening Track" in the Programs list
    And I do not see a duplicate-name error

  Scenario: Single-character program name is accepted as minimum valid length
    Given I am on the program creation form
    When I enter "A" in the Program Name field
    Then the Create button is enabled
    When I click Create
    Then either the New Program dialog closes and I see a program row named "A"
    Or a duplicate-name error is shown if "A" already exists

  # Negative

  Scenario: Reject program name with only whitespace
    Given I am on the program creation form
    When I enter "   " in the Program Name field
    And I click Create
    Then the New Program dialog remains open
    And the form is not submitted
    And I see a validation message indicating Program Name is required
    And no new program is created

  Scenario: Reject empty program name
    Given I am on the program creation form
    When I leave the Program Name field empty
    Then either the Create button is disabled
    Or clicking Create shows a validation message indicating Program Name is required
    And the form is not submitted
    And no new program is created

  Scenario: Reject duplicate program name
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web Development 2026" in the Program Name field
    And I enter "Duplicate name attempt" in the Description field
    And I click Create
    Then the New Program dialog remains open
    And I see an error indicating the name already exists
    And exactly one program row named "Web Development 2026" exists in the Programs list

  Scenario: Reject duplicate when name differs only by case
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "web development 2026" in the Program Name field
    And I enter "Case-variant duplicate attempt" in the Description field
    And I click Create
    Then either I see an error indicating the name already exists
    Or the program is created only if uniqueness is case-sensitive and both names are visibly distinct in the list

  Scenario: Reject duplicate when name differs only by leading and trailing whitespace
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "  Web Development 2026  " in the Program Name field
    And I enter "Whitespace-padded duplicate attempt" in the Description field
    And I click Create
    Then the New Program dialog remains open
    And I see an error indicating the name already exists or is invalid
    And no additional program named "Web Development 2026" is created

  Scenario: Server-side validation failure does not show false success
    Given I am on the program creation form
    And the server rejects program creation with HTTP 400
    When I enter "Informatique & IA - Niveau 2" in the Program Name field
    And I enter "Server error test" in the Description field
    And I click Create
    Then the New Program dialog remains open
    And I see an error message indicating creation failed
    And no program row named "Informatique & IA - Niveau 2" appears in the Programs list

  # Edge cases

  Scenario: Name supports accented characters and mixed punctuation without corruption
    Given I am on the program creation form
    When I enter "Informatique & IA - Niveau 2" in the Program Name field
    And I enter "Vérifier l'encodage Unicode et l'affichage des caractères accentués." in the Description field
    And I click Create
    Then the New Program dialog closes
    And I see a program row named "Informatique & IA - Niveau 2" with accents displayed correctly

  Scenario: Name supports non-Latin Unicode characters
    Given I am on the program creation form
    When I enter "データサイエンス 2026" in the Program Name field
    And I enter "Unicode name test." in the Description field
    And I click Create
    Then the New Program dialog closes
    And I see a program row named "データサイエンス 2026" displayed correctly without truncation or corruption

  Scenario: Name at maximum allowed length is accepted without silent truncation
    Given I am on the program creation form
    And the maximum Program Name length is 255 characters
    When I enter a Program Name of exactly 255 characters
    And I click Create
    Then either the program is created with the full 255-character name visible in the list
    Or a clear validation message indicates the name exceeds the maximum length

  Scenario: Name exceeding maximum allowed length is blocked
    Given I am on the program creation form
    And the maximum Program Name length is 255 characters
    When I enter a Program Name of 256 characters
    Then either the field prevents input beyond 255 characters
    Or clicking Create shows a validation message indicating the maximum length
    And no program is created with a silently truncated name

  Scenario: Duplicate detection handles Unicode normalization variants
    Given a program named "Informatique & IA - Niveau 2" already exists in NFC form
    And I am on the program creation form
    When I enter the same visible name in NFD Unicode normalization form
    And I enter "NFD form — should be treated as duplicate" in the Description field
    And I click Create
    Then either I see an error indicating the name already exists
    Or both forms are accepted without user-visible confusion in the Programs list

  Scenario: Internal multiple spaces are handled consistently for duplicate detection
    Given a program named "Web Development 2026" already exists
    And I am on the program creation form
    When I enter "Web  Development  2026" in the Program Name field
    And I enter "Internal-space duplicate detection test" in the Description field
    And I click Create
    Then either I see an error indicating the name already exists
    Or the program is created as a visibly distinct name with no confusing near-duplicate in the list

  Scenario: Script or HTML injection in Program Name is handled safely
    Given I am on the program creation form
    When I enter "<script>alert(\"xss\")</script>" in the Program Name field
    And I enter "XSS injection safety test" in the Description field
    And I click Create
    Then no JavaScript alert dialog is executed
    And either a validation error rejects the input
    Or the value is stored and displayed as literal text in the Programs list

# Ambiguities / gaps in acceptance criteria (for QA review)

# - Jira ticket DS-3 could not be fetched live (Atlassian MCP auth skipped). Acceptance
#   criteria below are sourced from block2/block2_ds3/block2_ds3_input and existing test plans.
#
# - Field requirements: Only Program Name is confirmed required; Description is optional
#   per Confluence Field Definitions but is used in most scenarios for realistic data.
#
# - Trim rules: Leading/trailing whitespace is trimmed on submit. Whether internal
#   multiple spaces are collapsed for duplicate checks is unspecified.
#
# - Uniqueness scope: Name must be unique per organization (per Confluence), but
#   case-sensitivity and whitespace-normalization rules for duplicate checks are not
#   defined in the ticket ACs.
#
# - Max length: The ticket ACs do not specify the maximum allowed Program Name length.
#   Edge scenarios assume 255 characters as a common default — confirm with product docs.
#
# - Allowed character set: ACs provide one special-character example ("Informatique & IA - Niveau 2")
#   but do not define whether apostrophes, slashes, emojis, angle brackets, or quotes are allowed.
#
# - Error placement: Not specified whether validation/duplicate errors appear inline under
#   Program Name, as a toast, or at the top of the New Program dialog.
#
# - Create button behavior: Unclear whether Create is disabled when Name is empty or whether
#   clicking it triggers inline validation — both behaviors are acceptable pending product spec.
#
# - TC numbering overlap: Existing Playwright suites reuse TC-004 across positive and negative
#   groups; renumber for traceability if linking Gherkin scenarios to automated tests.
