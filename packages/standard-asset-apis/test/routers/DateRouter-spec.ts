import { DataEntity } from '@terascope/utils';
import 'jest-extended';
import {
    DateRouter,
    DateResolution
} from '../../src';

describe('DateRouter', () => {
    it('should work with the default daily', () => {
        const router = new DateRouter({
            field: 'date'
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1995.01.01');
    });

    it('should work with a resolution of daily', () => {
        const router = new DateRouter({
            field: 'date',
            resolution: DateResolution.daily
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1995.01.01');
    });

    it('should work with a resolution of weekly', () => {
        const router = new DateRouter({
            field: 'date',
            resolution: DateResolution.weekly
        });

        const entity = new DataEntity({ date: '1995-05-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1995.17');
    });

    it('should work with a resolution of weekly epoch', () => {
        const router = new DateRouter({
            field: 'date',
            resolution: DateResolution.weekly_epoch
        });

        const entity = new DataEntity({ date: '1995-10-28T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1347');
    });

    it('should work with a resolution of monthly', () => {
        const router = new DateRouter({
            field: 'date',
            resolution: DateResolution.monthly
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1995.01');
    });

    it('should work with a resolution of yearly', () => {
        const router = new DateRouter({
            field: 'date',
            resolution: DateResolution.yearly
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('1995');
    });

    it('should be able to return the date units', () => {
        const router = new DateRouter({
            field: 'date',
            include_date_units: true,
            resolution: DateResolution.daily
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('year_1995.month_01.day_01');
    });

    it('should be able to return the date units with custom delimiters', () => {
        const router = new DateRouter({
            field: 'date',
            include_date_units: true,
            date_delimiter: '/',
            date_unit_delimiter: '-',
            resolution: DateResolution.daily
        });

        const entity = new DataEntity({ date: '1995-01-01T10:05:00.001Z' });
        expect(router.lookup(entity)).toEqual('year-1995/month-01/day-01');
    });

    it('should throw if given an invalid date_delimiter', () => {
        expect(() => {
            new DateRouter({
                field: 'date',
                date_delimiter: '@',
            });
        }).toThrowError(/Expected date_delimiter to be one of/);
    });

    it('should throw if given an invalid date_unit_delimiter', () => {
        expect(() => {
            new DateRouter({
                field: 'date',
                date_unit_delimiter: '@',
            });
        }).toThrowError(/Expected date_unit_delimiter to be one of/);
    });
});
