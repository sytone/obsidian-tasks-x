import Handlebars from 'handlebars';
import type { Moment } from 'moment';
//import moment from 'moment';

export class PathProperty {
    public readonly name: string = 'path';
    public readonly isRendered: boolean = false;
    public readonly prefix: string[] = [];
    public readonly suffix: string[] = [];

    constructor(public readonly value: string) {}

    public toString(): string {
        return this.value;
    }
}

export class DescriptionProperty {
    public readonly name: string = 'description';
    public readonly isRendered: boolean = true;
    public readonly prefix: string[] = [];
    public readonly suffix: string[] = [];

    constructor(public readonly value: string) {}

    public toString(): string {
        return this.value;
    }
}

export class DueDateProperty {
    public readonly name: string = 'dueDate';

    public prefixes: string[] = ['📅 ', '📆 ', '🗓 '];
    public defaultPrefix: string = '📅 ';
    public suffixes: string[] = [];
    public defaultSuffix: string = '';

    public valueRenderFormat = 'YYYY-MM-DD';
    public valueMarkdownFormat = 'YYYY-MM-DD';

    public isRendered: boolean = true;
    public defaultRenderTemplate = '{{prefix}}{{date value}}';
    public shortRenderTemplate = '{{prefix}}';

    public hasMatchingRegex: boolean = true;
    public matchingRegex: RegExp = /(\d{4}-\d{2}-\d{2})/u;
    public defaultMarkdownTemplate = '{{prefix}}{{date value}}';
    public locationIndex: number;
    public length: number;

    private _value: Moment | null;
    public get value(): Moment | null {
        return this._value;
    }
    public set value(value: Moment | string | null) {
        if (typeof value === 'string') {
            const dueDateMatch = this.getMatchingRegExp().exec(value);
            if (dueDateMatch !== null) {
                this.locationIndex = value.indexOf(dueDateMatch[0]);
                this.length = dueDateMatch[0].length;
                this._value = window.moment(dueDateMatch[1], this.valueMarkdownFormat);
                console.log(JSON.stringify(this));
            }
        } else if (this.isMoment(value)) {
            this._value = value;
        }
    }
    constructor(value?: string | Moment | null) {
        this._value = null;
        this.locationIndex = 0;
        this.length = 0;

        if (value) {
            this.value = value;
        }
    }

    public toRenderedString(short?: boolean): string {
        const template = this.compileTemplate(short ? this.shortRenderTemplate : this.defaultRenderTemplate);

        return template({
            prefix: this.defaultPrefix,
            suffix: this.defaultSuffix,
            value: { value: this.value, valueFormat: this.valueRenderFormat },
        });
    }

    public toMarkdownString(): string {
        const template = this.compileTemplate(this.defaultMarkdownTemplate);

        return template({
            prefix: this.defaultPrefix,
            suffix: this.defaultSuffix,
            value: { value: this.value, valueFormat: this.valueMarkdownFormat },
        });
    }

    private compileTemplate(template: string) {
        Handlebars.registerHelper('date', function (value) {
            return value.value.format(value.valueFormat);
        });
        return Handlebars.compile(template);
    }

    private getMatchingRegExp(): RegExp {
        let finalRegExp = '';
        if (this.prefixes.length > 0) {
            finalRegExp += `[${this.prefixes.join('')}]`;
        }

        finalRegExp += this.matchingRegex.source;

        if (this.suffixes.length > 0) {
            finalRegExp += `[${this.suffixes.join('')}]`;
        }
        console.log(finalRegExp);
        return new RegExp(finalRegExp, 'ud');
    }

    private isMoment(toBeDetermined: Moment | null): toBeDetermined is Moment {
        if ((toBeDetermined as Moment).hasAlignedHourOffset) {
            return true;
        }
        return false;
    }
}
