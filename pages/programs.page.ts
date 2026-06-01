import type { Page } from '@playwright/test';
import { EditProgramModal } from './components/edit-program.modal';
import { NewProgramModal } from './components/new-program.modal';
import { escapeRegExp } from './programs.constants';

export class ProgramsPage {
  readonly newProgramButton;
  readonly createProgramButton;
  readonly programColumnHeader;
  readonly duplicateNameError;
  readonly newProgramModal: NewProgramModal;
  readonly editProgramModal: EditProgramModal;

  constructor(private readonly page: Page) {
    this.newProgramButton = page.getByRole('button', { name: '+ New Program' });
    this.createProgramButton = page.getByRole('button', { name: 'Create Program' });
    this.programColumnHeader = page.getByRole('columnheader', { name: 'Program' });
    this.duplicateNameError = page.getByText(/already exists|duplicate|name.*taken/i);
    this.newProgramModal = new NewProgramModal(page);
    this.editProgramModal = new EditProgramModal(page);
  }

  async goto(): Promise<void> {
    await this.page.goto('/programs');
  }

  async openNewProgram(): Promise<void> {
    await this.newProgramButton.click();
  }

  programRow(name: string) {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(name)) });
  }

  programRowExact(name: string) {
    return this.page.getByRole('row', { name: new RegExp(`^${escapeRegExp(name)}$`) });
  }

  programNameText(name: string) {
    return this.page.getByText(name, { exact: true });
  }

  editButtonFor(programName: string) {
    return this.page.getByRole('button', { name: `Edit ${programName}` });
  }

  deleteButtonFor(programName: string) {
    return this.page.getByRole('button', { name: `Delete ${programName}` });
  }

  async openEditFor(programName: string): Promise<void> {
    const namedEdit = this.editButtonFor(programName);
    if ((await namedEdit.count()) > 0) {
      await namedEdit.click();
      return;
    }

    await this.programRow(programName)
      .first()
      .getByRole('button', { name: '✏️' })
      .click();
  }

  async ensureProgramExists(name: string, description: string): Promise<void> {
    const row = this.programRow(name).first();
    if ((await row.count()) > 0 && (await row.isVisible())) {
      return;
    }

    await this.openNewProgram();
    await this.newProgramModal.fillProgramName(name);
    await this.newProgramModal.fillDescription(description);
    await this.newProgramModal.clickCreate();
  }

  async createProgram(name: string, description?: string): Promise<void> {
    await this.openNewProgram();
    await this.newProgramModal.fillProgramName(name);
    if (description !== undefined) {
      await this.newProgramModal.fillDescription(description);
    }
    await this.newProgramModal.clickCreate();
  }
}
