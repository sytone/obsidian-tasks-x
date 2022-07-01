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

export class CreatedDateProperty {
    public readonly name: string = 'createdDate';

    public prefixes: string[] = ['➕'];
    public defaultPrefix: string = '➕';
    public prefixSpacer: string = ' ';
    public suffixes: string[] = [];
    public defaultSuffix: string = '';
    public suffixSpacer: string = '';

    public valueRenderFormat = 'YYYY-MM-DD';
    public valueMarkdownFormat = 'YYYY-MM-DD';

    public isRendered: boolean = true;
    public defaultRenderTemplate = '{{prefix}}{{prefixSpacer}}{{date value}}';
    public shortRenderTemplate = '{{prefix}}';

    public hasMatchingRegex: boolean = true;
    public matchingRegex: RegExp = /(\d{4}-\d{2}-\d{2})/u;
    public defaultMarkdownTemplate = '{{prefix}}{{prefixSpacer}}{{date value}}';
    public locationIndex: number;
    public length: number;

    public get hasValue(): boolean {
        return this._value !== null;
    }

    private _value: Moment | null;
    public get value(): Moment | null {
        return this._value;
    }
    public set value(value: Moment | string | Date | null) {
        if (typeof value === 'string') {
            const match = this.getMatchingRegExp().exec(value);
            if (match !== null) {
                this.locationIndex = value.indexOf(match[0]);
                this.length = match[0].length;
                this._value = window.moment(match[1], this.valueMarkdownFormat);
                // console.log(JSON.stringify(this));
            }
        } else if (value instanceof Date) {
            this._value = window.moment(value);
        } else if (this.isMoment(value)) {
            this._value = value;
        }
    }

    constructor(value?: string | Moment | Date | null) {
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
            prefixSpacer: this.prefixSpacer,
            value: { value: this.value, valueFormat: this.valueRenderFormat },
        });
    }

    public toMarkdownString(): string {
        const template = this.compileTemplate(this.defaultMarkdownTemplate);

        return template({
            prefix: this.defaultPrefix,
            suffix: this.defaultSuffix,
            prefixSpacer: this.prefixSpacer,
            value: { value: this.value, valueFormat: this.valueMarkdownFormat },
        });
    }

    private compileTemplate(template: string) {
        Handlebars.registerHelper('date', function (value) {
            if (value.value) {
                return value.value.format(value.valueFormat);
            }
            return '';
        });
        return Handlebars.compile(template);
    }

    private getMatchingRegExp(): RegExp {
        let finalRegExp = '';

        if (this.prefixes.length > 1) {
            finalRegExp += `[${this.prefixes.join('')}]${this.prefixSpacer}?`;
        } else if (this.prefixes.length == 1) {
            finalRegExp += `${this.prefixes[0]}${this.prefixSpacer}?`;
        }

        finalRegExp += this.matchingRegex.source;

        if (this.suffixes.length > 0) {
            finalRegExp += `[${this.suffixes.join('')}]`;
        }
        return new RegExp(finalRegExp, 'ud');
    }

    private isMoment(toBeDetermined: Moment | null): toBeDetermined is Moment {
        if ((toBeDetermined as Moment).hasAlignedHourOffset) {
            return true;
        }
        return false;
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
            const match = this.getMatchingRegExp().exec(value);
            if (match !== null) {
                this.locationIndex = value.indexOf(match[0]);
                this.length = match[0].length;
                this._value = window.moment(match[1], this.valueMarkdownFormat);
                // console.log(JSON.stringify(this));
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
        // console.log(finalRegExp);
        return new RegExp(finalRegExp, 'ud');
    }

    private isMoment(toBeDetermined: Moment | null): toBeDetermined is Moment {
        if ((toBeDetermined as Moment).hasAlignedHourOffset) {
            return true;
        }
        return false;
    }
}
