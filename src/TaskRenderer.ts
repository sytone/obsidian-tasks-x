import Handlebars from 'handlebars';
import moment from 'moment';
import { Component, MarkdownRenderer } from 'obsidian';
import { log } from './lib/logging';
import { Priority, Task } from './Task';

export type RenderData = {
    task: Task;
    dataLine: number;
    isFilenameUnique: boolean;
};

export class TaskRenderer {
    public template: string;

    private static _helpersRegistered: boolean;

    private static registerHandlebarHelpers() {
        Handlebars.registerHelper('moment', function (context, options) {
            if (context === null) {
                return;
            }

            const date = moment(context);

            if (options.hash.utcOffset) {
                date.utcOffset(options.hash.utcOffset);
            }
            let prefix = '';
            let result = '';
            for (const i in options.hash) {
                if (i === 'prefix') {
                    prefix = options.hash.prefix;
                }
                if (i === 'format') {
                    result = date.format(options.hash.format);
                }
            }

            if (result === '') {
                result = date.format('YYYY-MM-DD');
            }
            return prefix + result;
        });

        Handlebars.registerHelper('editicon', function () {
            return new Handlebars.SafeString('<a class="tasks-edit"></a>');
        });

        Handlebars.registerHelper('backlinks', function (this: RenderData) {
            let linkHref = this.task.path;
            if (this.task.precedingHeader !== null) {
                linkHref = linkHref + '#' + this.task.precedingHeader;
            }
            const backlink = `<span class="tasks-backlink"> (<a href="${linkHref}" data-href="${linkHref}" rel="noopener" target="_blank" class="internal-link">${
                this.task.getLinkText() ?? ''
            }</a>)`;
            return new Handlebars.SafeString(backlink);
        });

        Handlebars.registerHelper('priority', function (this: RenderData) {
            if (this.task.priority === Priority.High) {
                return '⏫';
            } else if (this.task.priority === Priority.Medium) {
                return '🔼';
            } else if (this.task.priority === Priority.Low) {
                return '🔽';
            }
            return '';
        });

        Handlebars.registerHelper('recurrence', function (this: RenderData) {
            if (this.task.recurrence) {
                return `🔁 ${this.task.recurrence.toText()}`;
            } else {
                return '';
            }
        });

        Handlebars.registerHelper('li', function (this: RenderData, options) {
            let cssClasses = 'task-list-item plugin-tasks-list-item';
            if (this.task.status.indicator !== ' ') {
                cssClasses += ' is-checked';
            }
            return `<li data-line="${
                this.dataLine
            }" data-task="${this.task.status.indicator.trim()}" class="${cssClasses}">${options.fn(this)}</li>`;
        });

        Handlebars.registerHelper('input', function (this: RenderData) {
            const input = '<input data-line="' + this.dataLine + '" type="checkbox" class="task-list-item-checkbox">';
            return new Handlebars.SafeString(input);
        });

        Handlebars.registerHelper('text', function (this: RenderData, options) {
            return new Handlebars.SafeString('<span class="tasks-list-text">' + options.fn(this) + '</span>');
        });

        Handlebars.registerHelper('description', function (this: RenderData) {
            let renderedDescription = this.task.description;
            if (this.task.description.indexOf('[[') != -1 && this.task.description.indexOf(']]') != -1) {
                const textSpan = document.createElement('span');
                MarkdownRenderer.renderMarkdown(
                    this.task.description,
                    textSpan,
                    this.task.path,
                    null as unknown as Component,
                );

                // If the task is a block quote, the block quote wraps the p-tag that contains the content.
                // In that case, we need to unwrap the p-tag *inside* the surrounding block quote.
                // Otherwise, we unwrap the p-tag as a direct descendant of the textSpan.
                const blockQuote = textSpan.querySelector('blockquote');
                const directParentOfPTag = blockQuote ?? textSpan;

                // Unwrap the p-tag that was created by the MarkdownRenderer:
                const pElement = directParentOfPTag.querySelector('p');
                if (pElement !== null) {
                    while (pElement.firstChild) {
                        directParentOfPTag.insertBefore(pElement.firstChild, pElement);
                    }
                    pElement.remove();
                }

                // Remove an empty trailing p-tag that the MarkdownRenderer appends when there is a block link:
                textSpan.findAll('p').forEach((pElement) => {
                    if (!pElement.hasChildNodes()) {
                        pElement.remove();
                    }
                });

                // Remove the footnote that the MarkdownRenderer appends when there is a footnote in the task:
                textSpan.findAll('.footnotes').forEach((footnoteElement) => {
                    footnoteElement.remove();
                });

                renderedDescription = textSpan.innerHTML;
            }

            return new Handlebars.SafeString(renderedDescription);
        });
    }
    /**
     * Creates a instance of the task renderer to be used in rendering the output of a SQL based query.
     */
    constructor(template?: string) {
        if (!TaskRenderer._helpersRegistered) {
            TaskRenderer.registerHandlebarHelpers();
            TaskRenderer._helpersRegistered = true;
        }

        if (template === undefined) {
            this.template =
                '{{#li}}' +
                '{{input}}' +
                '{{#text}}' +
                '{{#if task.description}}{{description}} {{/if}}' +
                '{{#if task.createdDate}}{{moment task.createdDate prefix="➕ "}} {{/if}}' +
                '{{#if task.priority}}{{priority}} {{/if}}' +
                '{{#if task.recurrence}}{{recurrence}} {{/if}}' +
                '{{#if task.startDate}}{{moment task.startDate prefix="🛫 "}} {{/if}}' +
                '{{#if task.scheduledDate}}{{moment task.scheduledDate prefix="⏳ "}} {{/if}}' +
                '{{#if task.dueDate}}{{moment task.dueDate prefix="📅 "}} {{/if}}' +
                '{{#if task.doneDate}}{{moment task.doneDate prefix="✅ "}} {{/if}}' +
                '{{#if task.blockLink}}{{task.blockLink}} {{/if}}' +
                '{{/text}}' +
                '{{editicon}}' +
                '{{/li}}';
        } else {
            this.template = template;
        }

        log('debug', this.template);
    }

    public async toHTMLElement(parentUlElement: HTMLElement, index: number, task: Task): Promise<HTMLElement> {
        const template = this.compileTemplate(this.template);

        const el = parentUlElement.createEl('template');
        el.innerHTML = template(<RenderData>{ task: task, dataLine: index }).trim();
        const finalElement = <HTMLElement>el.content.firstChild;
        return finalElement as HTMLElement;
    }

    public toRenderedString(task: Task): string {
        const template = this.compileTemplate(this.template);

        return template(<RenderData>{ task: task, dataLine: 1 }).trim();
    }

    private compileTemplate(template: string) {
        return Handlebars.compile(template);
    }
}
