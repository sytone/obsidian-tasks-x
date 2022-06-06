import { Modal, Setting, TextComponent } from 'obsidian';
import type TasksPlugin from '../main';

export class CustomStatusModal extends Modal {
    statusSymbol: string;
    statusName: string;
    statusNextSymbol: string;
    saved: boolean = false;
    error: boolean = false;
    constructor(public plugin: TasksPlugin, statusType: [string, string, string]) {
        super(plugin.app);
        this.statusSymbol = statusType[0];
        this.statusName = statusType[1];
        this.statusNextSymbol = statusType[2];
    }

    async display() {
        const { contentEl } = this;

        contentEl.empty();

        const settingDiv = contentEl.createDiv();
        //const title = this.title ?? '...';

        let statusSymbolText: TextComponent;
        new Setting(settingDiv)
            .setName('Task Status Symbol')
            .setDesc('This is the character between the square braces.')
            .addText((text) => {
                statusSymbolText = text;
                statusSymbolText.setValue(this.statusSymbol).onChange((v) => {
                    if (!v.length) {
                        CustomStatusModal.setValidationError(text, 'Task status type cannot be empty.');
                        return;
                    }

                    if (v.includes(' ')) {
                        CustomStatusModal.setValidationError(text, 'Task status type cannot include spaces.');
                        return;
                    }

                    if (v.length > 1) {
                        CustomStatusModal.setValidationError(text, 'Task status must be a single character.');
                        return;
                    }
                    CustomStatusModal.removeValidationError(text);
                    this.statusSymbol = v;
                });
            });

        new Setting(settingDiv)
            .setName('Task Status Name')
            .setDesc('This is the friendly name of the task status.')
            .addText((text) => {
                text.setValue(this.statusName).onChange((v) => {
                    this.statusName = v;
                });
            });

        new Setting(settingDiv)
            .setName('Task Next Status Symbol')
            .setDesc('When clicked on this is the symbol that should be used next.')
            .addText((text) => {
                text.setValue(this.statusNextSymbol).onChange((v) => {
                    this.statusNextSymbol = v;
                });
            });

        const footerEl = contentEl.createDiv();
        const footerButtons = new Setting(footerEl);
        footerButtons.addButton((b) => {
            b.setTooltip('Save')
                .setIcon('checkmark')
                .onClick(async () => {
                    // let error = false;
                    // if (!this.statusSymbol.length) {
                    //     SettingsModal.setValidationError(this.statusSymbol, 'Task status type cannot be empty.');
                    //     error = true;
                    //     return;
                    // }

                    // if (error) {
                    //     new Notice('Fix errors before saving.');
                    //     return;
                    // }
                    this.saved = true;
                    this.close();
                });
            return b;
        });
        footerButtons.addExtraButton((b) => {
            b.setIcon('cross')
                .setTooltip('Cancel')
                .onClick(() => {
                    this.saved = false;
                    this.close();
                });
            return b;
        });
    }

    // updateTitle(admonitionPreview: HTMLElement, title: string) {
    //     let titleSpan = admonitionPreview.querySelector('.admonition-title-content');
    //     let iconEl = admonitionPreview.querySelector('.admonition-title-icon');
    //     titleSpan.textContent = title;
    //     titleSpan.prepend(iconEl);
    // }
    onOpen() {
        this.display();
    }

    static setValidationError(textInput: TextComponent, message?: string) {
        textInput.inputEl.addClass('is-invalid');
        if (message) {
            textInput.inputEl.parentElement?.addClasses(['has-invalid-message', 'unset-align-items']);
            textInput.inputEl.parentElement?.parentElement?.addClass('.unset-align-items');
            let mDiv = textInput.inputEl.parentElement?.querySelector('.invalid-feedback') as HTMLDivElement;

            if (!mDiv) {
                mDiv = createDiv({ cls: 'invalid-feedback' });
            }
            mDiv.innerText = message;
            mDiv.insertAfter(textInput.inputEl);
        }
    }
    static removeValidationError(textInput: TextComponent) {
        textInput.inputEl.removeClass('is-invalid');
        textInput.inputEl.parentElement?.removeClasses(['has-invalid-message', 'unset-align-items']);
        textInput.inputEl.parentElement?.parentElement?.removeClass('.unset-align-items');

        const invalidFeedback = textInput.inputEl.parentElement?.querySelector('.invalid-feedback');
        if (invalidFeedback) {
            textInput.inputEl.parentElement?.removeChild(invalidFeedback);
        }
    }
}
