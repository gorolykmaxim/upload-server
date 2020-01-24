import { expect } from "chai";
import {Arguments} from "../../app/common/arguments";
import {ArgumentError} from "common-errors";

describe('Arguments', function () {
    it('should fail to create arguments since of the mandatory ones are missing', function () {
        // then
        expect(() => new Arguments({}, ['name'])).throw(ArgumentError);
    });
    it('should construct arguments and return the value of the argument', function () {
        // when
        const args: Arguments = new Arguments({'name': 'Tom', 'age': 15}, ['name']);
        // then
        expect(args.get('name')).equal('Tom');
        expect(args.get('age')).equal(15);
    });
});