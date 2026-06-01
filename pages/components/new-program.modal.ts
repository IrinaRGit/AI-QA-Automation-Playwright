import type { Locator, Page } from '@playwright/test';

export class NewProgramModal {
  readonly dialog;
  readonly programNameInput;
  readonly descriptionInput;
  readonly createButton;
  readonly cancelButton;
  readonly duplicateError;
  readonly requiredError;
  readonly maxLengthError;
  readonly serverError;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'New Program' });
    this.programNameInput = this.dialog.getByRole('textbox', { name: 'Program Name' });
    this.descriptionInput = this.dialog.getByRole('textbox', { name: 'Description' });
    this.createButton = this.dialog.getByRole('button', { name: 'Create', exact: true });
    this.cancelButton = this.dialog.getByRole('button', { name: /^cancel$/i });
    this.duplicateError = this.dialog.getByText(/already exists|duplicate|name.*taken/i);
    this.requiredError = this.dialog.getByText(/required|must not be empty|cannot be blank/i);
    this.maxLengthError = this.dialog.getByText(/max|maximum|too long|255|limit|characters/i);
    this.serverError = this.dialog.getByText(/error|failed|could not create|try again|bad request/i);
  }

  async fillProgramName(name: string): Promise<void> {
    await this.programNameInput.fill(name);
  }

  async fillDescription(description: string): Promise<void> {
    await this.descriptionInput.fill(description);
  }

  async blurProgramName(): Promise<void> {
    await this.programNameInput.blur();
  }

  async clickCreate(): Promise<void> {
    await this.createButton.click();
  }

  async doubleClickCreate(): Promise<void> {
    await this.createButton.dblclick();
  }

  async dismissWithoutSaving(): Promise<void> {
    if (await this.cancelButton.isVisible()) {
      await this.cancelButton.click();
    } else {
      await this.dialog.getByRole('button', { name: /close|×|✕/i }).click();
    }
  }

  securityError(): Locator {
    return this.dialog.getByText(/invalid|not allowed|html|script|special characters/i);
  }
}
