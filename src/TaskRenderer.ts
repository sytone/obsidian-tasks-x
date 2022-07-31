import Handlebars from 'handlebars';
import moment from 'moment';
import { Component, MarkdownRenderer } from 'obsidian';
import { Priority, Task } from './Task';
import { getGeneralSetting } from './Config/Settings';
import { logging } from './lib/logging';

export type RenderData = {
    task: Task;
    dataLine: number;
};

export class TaskRenderer {
    public template: string;

    private static _helpersRegistered: boolean;
    logger = logging.getLogger('taskssql.TaskRenderer');

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

        Handlebars.registerHelper('backlink', function (this: RenderData, options) {
            const shortMode = options && options.hash && options.hash.short;
            let linkCss = 'internal-link';
            let linkContent = this.task.getLinkText() ?? '';

            if (shortMode) {
                linkCss += ' internal-link-short-mode';
                linkContent = ' 🔗';
            }

            const linkHtmlStart = `<a href="${this.task.backlinkHref}" data-href="${this.task.backlinkHref}" rel="noopener" target="_blank" class="${linkCss}">`;

            const backlink = `<span class="tasks-backlink">${shortMode ? '' : ' ('}${linkHtmlStart}${linkContent}</a>${
                shortMode ? '' : ')'
            }</span>`;

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
            let checked = '';
            if (this.task.status.indicator !== ' ') {
                checked = ' checked';
            }
            const input =
                '<input data-line="' +
                this.dataLine +
                '"' +
                checked +
                ' type="checkbox" class="task-list-item-checkbox">';
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
            this.logger.debug('Registering Handlebars helpers');
            TaskRenderer.registerHandlebarHelpers();
            TaskRenderer._helpersRegistered = true;
        }

        if (template === undefined) {
            this.template =
                getGeneralSetting('defaultRenderTemplate') === undefined ||
                getGeneralSetting('defaultRenderTemplate') === ''
                    ? '{{#li}}' +
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
                      '{{backlink}}' +
                      '{{editicon}}' +
                      '{{/li}}'
                    : <string>getGeneralSetting('defaultRenderTemplate');
        } else {
            this.template = template;
        }

        this.logger.debug('debug', this.template);
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
