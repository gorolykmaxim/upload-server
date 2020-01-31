import {ArgumentsConsumer, EndpointWithArguments} from "../../../app/common/api/endpoint-with-arguments";
import {Endpoint} from "../../../app/common/api/endpoint";
import {Request, Response} from "express";
import {capture, instance, mock, verify, when} from "ts-mockito";
import {Arguments} from "../../../app/common/arguments";
import {expect} from "chai";
import {ArgumentError} from "common-errors";

describe('EndpointWithArguments', function () {
    let actualEndpoint: ArgumentsConsumer;
    let endpoint: Endpoint;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    beforeEach(function () {
        actualEndpoint = mock<ArgumentsConsumer>();
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
    });
    it('should obtain requests arguments from the query', async function () {
        // given
        const expectedArguments = {name: 'Tom', age: '15', gender: 'male'};
        when(reqMock.query).thenReturn(expectedArguments);
        endpoint = new EndpointWithArguments(instance(actualEndpoint), 'query', ['name', 'age']);
        // when
        await endpoint.process(req, res);
        // then
        const args: Arguments = capture(actualEndpoint.setArguments).last()[0];
        expect(args.get('name')).equal(expectedArguments.name);
        expect(args.get('age')).equal(expectedArguments.age);
        expect(args.get('gender')).equal(expectedArguments.gender);
        verify(actualEndpoint.process(req, res)).once();
    });
    it('should fail to find one of the mandatory arguments', async function () {
        // given
        when(reqMock.body).thenReturn({});
        endpoint = new EndpointWithArguments(instance(actualEndpoint), 'body', ['id']);
        // then
        await expect(endpoint.process(req, res)).rejectedWith(ArgumentError);
        verify(actualEndpoint.process(req, res)).never();
    });
});