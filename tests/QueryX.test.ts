/**
 * @jest-environment jsdom
 */
import moment from 'moment';
import alasql from 'alasql';

import { QuerySql } from '../src/QuerySql/QuerySql';
//import { getSettings, updateSettings } from '../src/config/Settings';
import { Status } from '../src/Status';
import { Priority, Task } from '../src/Task';

window.moment = moment;

// type FilteringCase = {
//     filters: Array<string>;
//     tasks: Array<string>;
//     expectedResult: Array<string>;
// };

// function shouldSupportFiltering(filters: Array<string>, allTaskLines: Array<string>, expectedResult: Array<string>) {
//     // Arrange
//     const query = new QuerySql({ source: filters.join('\n') });

//     const tasks = allTaskLines.map(
//         (taskLine) =>
//             Task.fromLine({
//                 line: taskLine,
//                 sectionStart: 0,
//                 sectionIndex: 0,
//                 path: '',
//                 precedingHeader: '',
//             }) as Task,
//     );

//     // Act
//     let filteredTasks = [...tasks];
//     query.filters.forEach((filter) => {
//         filteredTasks = filteredTasks.filter(filter);
//     });

//     // Assert
//     const filteredTaskLines = filteredTasks.map(
//         (task) => task.toFileLineString(), //  `- [ ] ${task.toString()}`,
//     );
//     expect(filteredTaskLines).toMatchObject(expectedResult);
// }

describe('QuerySql', () => {
    describe('filtering', () => {
        it('generic alasql test', () => {
            // Arrange
            const data = [
                { a: 1, b: 1, c: 1 },
                { a: 1, b: 2, c: 1 },
                { a: 1, b: 3, c: 1 },
                { a: 2, b: 1, c: 1 },
            ];

            // Act
            const result = alasql('SELECT a, COUNT(*) AS b FROM ? GROUP BY a', [data]);
            // Assert
            expect(result).toEqual([
                { a: 1, b: 3 },
                { a: 2, b: 1 },
            ]);
        });
    });

    describe('filtering', () => {
        it('filters paths case insensitive', () => {
            // Arrange
            const tasks = [
                new Task({
                    status: Status.TODO,
                    description: 'description',
                    path: 'Ab/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    precedingHeader: null,
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                }),
                new Task({
                    status: Status.TODO,
                    description: 'description',
                    path: 'FF/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    precedingHeader: null,
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                }),
            ];
            const input = 'SELECT * FROM Tasks WHERE Path LIKE "ab/c d"';
            const query = new QuerySql({ source: input });

            // Act
            const groupedTasks = query.applyQueryToTasks(tasks);

            // Assert
            expect(groupedTasks.totalTasksCount()).toEqual(1);
            expect(groupedTasks.groups[0].tasks[0]).toEqual(tasks[0]);
        });
        it('filters paths case insensitive', () => {
            // Arrange
            const tasks = [
                new Task({
                    status: Status.TODO,
                    description: 'description',
                    path: 'Ab/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    precedingHeader: null,
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                }),
                new Task({
                    status: Status.DONE,
                    description: 'description',
                    path: 'FF/C D',
                    indentation: '',
                    sectionStart: 0,
                    sectionIndex: 0,
                    precedingHeader: null,
                    priority: Priority.None,
                    startDate: null,
                    scheduledDate: null,
                    dueDate: null,
                    doneDate: null,
                    recurrence: null,
                    blockLink: '',
                    tags: [],
                }),
            ];
            const input = 'SELECT * FROM Tasks WHERE status->indicator = "x"';
            const query = new QuerySql({ source: input });

            // Act
            const groupedTasks = query.applyQueryToTasks(tasks);

            // Assert
            expect(groupedTasks.totalTasksCount()).toEqual(1);
            expect(groupedTasks.groups[0].tasks[0]).toEqual(tasks[1]);
        });
    });
});

//     it('ignores the global filter when filtering', () => {
//         // Arrange
//         const originalSettings = getSettings();
//         updateSettings({ globalFilter: '#task' });
//         const filters: Array<string> = ['description includes task'];
//         const tasks: Array<string> = [
//             '- [ ] #task this does not include the word; only in the global filter',
//             '- [ ] #task this does: task',
//         ];
//         const expectedResult: Array<string> = ['- [ ] #task this does: task'];

//         // Act, Assert
//         shouldSupportFiltering(filters, tasks, expectedResult);

//         // Cleanup
//         updateSettings(originalSettings);
//     });

//     it('works without a global filter', () => {
//         // Arrange
//         const originalSettings = getSettings();
//         updateSettings({ globalFilter: '' });
//         const filters: Array<string> = ['description includes task'];
//         const tasks: Array<string> = [
//             '- [ ] this does not include the word at all',
//             '- [ ] #task this includes the word as a tag',
//             '- [ ] #task this does: task',
//         ];
//         const expectedResult: Array<string> = [
//             '- [ ] #task this includes the word as a tag',
//             '- [ ] #task this does: task',
//         ];

//         // Act, Assert
//         shouldSupportFiltering(filters, tasks, expectedResult);

//         // Cleanup
//         updateSettings(originalSettings);
//     });

//     test.concurrent.each<[string, FilteringCase]>([
//         [
//             'by due date presence',
//             {
//                 filters: ['has due date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 📅 2022-04-20',
//                 ],
//                 expectedResult: [
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 📅 2022-04-20',
//                 ],
//             },
//         ],
//         [
//             'by start date presence',
//             {
//                 filters: ['has start date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 🛫 2022-04-20',
//                 ],
//                 expectedResult: [
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 🛫 2022-04-20',
//                 ],
//             },
//         ],
//         [
//             'by scheduled date presence',
//             {
//                 filters: ['has scheduled date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 ⏳ 2022-04-20',
//                 ],
//                 expectedResult: [
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 ⏳ 2022-04-20',
//                 ],
//             },
//         ],
//         [
//             'by due date absence',
//             {
//                 filters: ['no due date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 📅 2022-04-20',
//                 ],
//                 expectedResult: ['- [ ] task 1'],
//             },
//         ],
//         [
//             'by start date absence',
//             {
//                 filters: ['no start date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 🛫 2022-04-20',
//                 ],
//                 expectedResult: ['- [ ] task 1'],
//             },
//         ],
//         [
//             'by scheduled date absence',
//             {
//                 filters: ['no scheduled date'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-20 ⏳ 2022-04-20 📅 2022-04-20',
//                     '- [ ] task 3 ⏳ 2022-04-20',
//                 ],
//                 expectedResult: ['- [ ] task 1'],
//             },
//         ],
//         [
//             'by start date (before)',
//             {
//                 filters: ['starts before 2022-04-20'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 🛫 2022-04-15',
//                     '- [ ] task 3 🛫 2022-04-20',
//                     '- [ ] task 4 🛫 2022-04-25',
//                 ],
//                 expectedResult: [
//                     '- [ ] task 1', // reference: https://schemar.github.io/obsidian-tasks/queries/filters/#start-date
//                     '- [ ] task 2 🛫 2022-04-15',
//                 ],
//             },
//         ],
//         [
//             'by due date (before)',
//             {
//                 filters: ['due before 2022-04-20'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 📅 2022-04-15',
//                     '- [ ] task 3 📅 2022-04-20',
//                     '- [ ] task 4 📅 2022-04-25',
//                 ],
//                 expectedResult: ['- [ ] task 2 📅 2022-04-15'],
//             },
//         ],
//         [
//             'by scheduled date (before)',
//             {
//                 filters: ['scheduled before 2022-04-20'],
//                 tasks: [
//                     '- [ ] task 1',
//                     '- [ ] task 2 ⏳ 2022-04-15',
//                     '- [ ] task 3 ⏳ 2022-04-20',
//                     '- [ ] task 4 ⏳ 2022-04-25',
//                 ],
//                 expectedResult: ['- [ ] task 2 ⏳ 2022-04-15'],
//             },
//         ],
//     ])('should support filtering %s', (_, { tasks: allTaskLines, filters, expectedResult }) => {
//         shouldSupportFiltering(filters, allTaskLines, expectedResult);
//     });
// });
//});
