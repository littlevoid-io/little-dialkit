import { element, placeBelow, textButton } from './dom';

const CHOICE = 'little-prompt-choice';

/** What a panel asks before a step. `choices`: what to do, by button label. The first one is the one Enter takes. */
export interface Question {
  text: string;
  choices: Record<string, () => void>;
}

/**
 * A panel's questions: a modal dialog under the toolbar with the text, a button per choice and Cancel.
 * While it is open nothing else on the page takes input. Enter takes the first choice, Escape cancels.
 */
export class Prompt {
  private readonly dialog = element('dialog', 'little-prompt');
  private first: HTMLButtonElement | undefined;

  constructor(private readonly root: HTMLElement, private readonly toolbar: HTMLElement) {
    this.dialog.addEventListener('close', () => window.removeEventListener('keydown', this.key, true));
    root.append(this.dialog);
  }

  /** A choice closes the dialog, then runs. */
  public ask({ text, choices }: Question): void {
    const buttons = Object.entries(choices).map(([label, run]) => textButton(CHOICE, label, () => {
      this.dialog.close();
      run();
    }));
    const row = element('div', 'little-prompt-choices');
    row.append(...buttons, textButton(CHOICE, 'Cancel', () => this.dialog.close()));
    this.dialog.replaceChildren(element('p', 'little-prompt-text', text), row);
    if (!this.dialog.open) this.dialog.showModal();
    // Under the toolbar, or under the panel's icon while the panel is collapsed.
    placeBelow(this.dialog, this.toolbar.offsetWidth > 0 ? this.toolbar : this.root);
    [this.first] = buttons;
    this.first?.focus();
    window.addEventListener('keydown', this.key, true);
  }

  /**
   * On the window, capturing, while the dialog is open: a click beside the dialog takes the focus off its buttons,
   * and the keys then go to the page. They stay the dialog's: not the panel's or the page's shortcuts.
   * Escape is left to the browser, which cancels the dialog.
   */
  private readonly key = (event: KeyboardEvent): void => {
    event.stopPropagation();
    // On a button, Enter presses it.
    if (event.key !== 'Enter' || event.target instanceof HTMLButtonElement) return;
    event.preventDefault();
    this.first?.click();
  };
}
