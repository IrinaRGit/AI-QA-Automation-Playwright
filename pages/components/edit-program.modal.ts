import type { Locator, Page } from '@playwright/test';

export class EditProgramModal {
  readonly dialog;
  readonly heading;
  readonly programNameInput;
  readonly descriptionInput;
  readonly saveButton;
  readonly cancelButton;
  readonly duplicateError;
  readonly requiredError;
  readonly maxLengthError;
  readonly saveError;
  readonly conflictError;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /Edit Program/i });
    this.heading = this.dialog.getByRole('heading', { name: /Edit Program/i });
    this.programNameInput = this.dialog.getByRole('textbox', { name: 'Program Name' });
    this.descriptionInput = this.dialog.getByRole('textbox', { name: 'Description' });
    this.saveButton = this.dialog.getByRole('button', { name: 'Save' });
    this.cancelButton = this.dialog.getByRole('button', { name: /^cancel$/i });
    this.duplicateError = this.dialog.getByText(/already exists|duplicate|name.*taken/i);
    this.requiredError = this.dialog.getByText(/required|must not be empty|cannot be blank/i);
    this.maxLengthError = this.dialog.getByText(/max|maximum|too long|limit|characters/i);
    this.saveError = this.dialog.getByText(/could not save|error|failed|try again/i);
    this.conflictError = this.dialog.getByText(/updated by someone else|conflict|stale|refresh/i);
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async clickSave(): Promise<void> {
    await this.saveButton.click();
  }

  async doubleClickSave(): Promise<void> {
    await this.saveButton.click();
    await this.saveButton.click({ force: true });
  }

  async dismissWithoutSaving(): Promise<void> {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    } else {
      await this.dialog.getByRole('button', { name: /close|×|✕/i }).click();
    }
  }

  networkError(): Locator {
    return this.dialog.getByText(/network|offline|connection|could not save|failed/i);
  }

  securityError(): Locator {
    return this.dialog.getByText(/invalid|not allowed|html|script/i);
  }
}
