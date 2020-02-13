import {ArgumentsSource, Endpoint} from "../../../backend/core/api/endpoint";
import {expect} from "chai";
import {Argument, ArgumentType} from "../../../backend/core/api";
import {ArgumentError} from "common-errors";

describe('Endpoint', function () {
    let endpoint: Endpoint;
    let request: any;
    beforeEach(function () {
        request = {
            'query': {
                'a': 15,
                'b': true
            },
            'params': {
                'c': 32
            },
            'body': {
                'd': {},
                'e': 'name'
            }
        };
        endpoint = new Endpoint('/a/:c', 'command name');
        endpoint.addArgument(ArgumentsSource.QUERY, true, new Argument('a', ArgumentType.number));
        endpoint.addArgument(ArgumentsSource.QUERY, false, new Argument('b', ArgumentType.boolean));
        endpoint.addArgument(ArgumentsSource.PARAMS, true, new Argument('c', ArgumentType.number));
        endpoint.addArgument(ArgumentsSource.BODY, true, new Argument('d', ArgumentType.object));
        endpoint.addArgument(ArgumentsSource.BODY, false, new Argument('e', ArgumentType.string));
        endpoint.addArgument(ArgumentsSource.BODY, false, new Argument('f', ArgumentType.boolean));
    });
    it('should map commands error code to the specified response code', function () {
        // given
        const commandErrorCode: number = 3;
        const responseCode: number = 403;
        // when
        endpoint.mapCommandToResponse(commandErrorCode, responseCode);
        // then
        expect(endpoint.getResponseCodeFor(commandErrorCode)).equal(responseCode);
    });
    it('should fail to convert a request due to missing mandatory argument', function () {
        // given
        delete request.query.a;
        // then
        expect(() => endpoint.convertRequestToCommandArguments(request)).throw(ArgumentError);
    });
    it('should fail to convert a request due to a mandatory argument of an incorrect type', function () {
        // given
        request.params.c = 'fasdg';
        // then
        expect(() => endpoint.convertRequestToCommandArguments(request)).throw(ArgumentError);
    });
    it('should fail to convert a request due to a optional argument of an incorrect type', function () {
        // given
        request.body.e = 125;
        // then
        expect(() => endpoint.convertRequestToCommandArguments(request)).throw(ArgumentError);
    });
    it('should convert a request', function () {
        // when
        const args: any = endpoint.convertRequestToCommandArguments(request);
        // then
        expect(args).eql({'a': 15, 'b': true, 'c': 32, 'd': {}, 'e': 'name'});
    });
});
