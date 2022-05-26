/**
 * @jest-environment jsdom
 */
import moment from 'moment';
//import { QueryX } from '../src/Query';
import alasql from 'alasql';

window.moment = moment;

describe('QueryX', () => {
    describe('filtering', () => {
        it('filters paths case insensitive', () => {
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
});
