/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import { DueDateProperty } from '../src/TaskProperties';

jest.mock('obsidian');
window.moment = moment;

describe('Due Date Property', () => {
    it('should render default template', () => {
        const prop = new DueDateProperty(moment('2022-02-02'));
        const expected = `${prop.defaultPrefix}2022-02-02`;

        expect(prop.toRenderedString()).toBe(expected);
        expect(prop.isRendered).toBe(true);
    });

    it('should render short template', () => {
        const prop = new DueDateProperty(moment('2022-02-02'));

        expect(prop.toRenderedString(true)).toBe(prop.defaultPrefix);
        expect(prop.isRendered).toBe(true);
    });

    it('should render specified value format', () => {
        const prop = new DueDateProperty(moment('2022-02-02'));
        prop.valueRenderFormat = 'YYYYMMDD';
        const expected = `${prop.defaultPrefix}20220202`;

        expect(prop.toRenderedString()).toBe(expected);
        expect(prop.isRendered).toBe(true);
    });

    it('should match value in markdown task', () => {
        const prop = new DueDateProperty('- [ ] on 📅 2022-02-02 do my taxes');
        const expected = `${prop.defaultPrefix}2022-02-02`;

        expect(prop.value?.year()).toBe(2022);
        expect(prop.value?.month()).toBe(1); //JS is 0 based...
        expect(prop.value?.date()).toBe(2);
        expect(prop.toRenderedString()).toBe(expected);
        expect(prop.isRendered).toBe(true);
    });

    it('should match value in markdown task with custom prefix', () => {
        const prop = new DueDateProperty();
        prop.prefixes.push('D:');
        prop.defaultPrefix = 'D:';
        prop.value = '- [ ] on D:2022-02-02 do my taxes';
        const expected = 'D:2022-02-02';

        expect(prop.value?.year()).toBe(2022);
        expect(prop.value?.month()).toBe(1); //JS is 0 based...
        expect(prop.value?.date()).toBe(2);
        expect(prop.toRenderedString()).toBe(expected);
        expect(prop.isRendered).toBe(true);
    });

    it('should render markdown template', () => {
        const prop = new DueDateProperty(moment('2022-02-02'));

        expect(prop.toMarkdownString()).toBe('📅 2022-02-02');
        expect(prop.isRendered).toBe(true);
    });

    it('should capture markdown locations', () => {
        const original = '- [ ] on 📅 2022-02-02 do my taxes';

        const prop = new DueDateProperty(original);
        const propNew = new DueDateProperty(moment('2023-02-23'));

        const newtask = original.replace(prop.toMarkdownString(), propNew.toMarkdownString());

        expect(newtask).toBe('- [ ] on 📅 2023-02-23 do my taxes');
        expect(prop.isRendered).toBe(true);
    });
});
