import {Argument, ArgumentType} from "../../../backend/core/api";
import {expect} from "chai";
import {ArgumentError} from "common-errors";

describe('Argument', function () {
    const name: string = 'name';
    it('should verify value of a string argument', function () {
        // then
        new Argument(name, ArgumentType.string).verifyValue('string');
    });
    it('should fail to verify value of a string argument', function () {
        // then
        expect(() => new Argument(name, ArgumentType.string).verifyValue(12345)).throw(ArgumentError);
    });
    it('should verify value of a number argument', function () {
        // then
        new Argument(name, ArgumentType.number).verifyValue(12343);
    });
    it('should fail to verify value of a number argument', function () {
        // then
        expect(() => new Argument(name, ArgumentType.number).verifyValue('124563')).throw(ArgumentError);
    });
    it('should verify value of a boolean argument', function () {
        // then
        new Argument(name, ArgumentType.boolean).verifyValue(true);
    });
    it('should fail to verify value of a boolean argument', function () {
        // then
        expect(() => new Argument(name, ArgumentType.boolean).verifyValue({})).throw(ArgumentError);
    });
    it('should verify value of an object argument', function () {
        // then
        new Argument(name, ArgumentType.object).verifyValue([]);
    });
    it('should fail to verify value of an object argument', function () {
        // then
        expect(() => new Argument(name, ArgumentType.object).verifyValue('{}')).throw(ArgumentError);
    });
});
