import {ArgumentsConsumer, RequestWithArguments} from "../../../app/common/api/request-with-arguments";
import {APIRequest} from "../../../app/common/api/request";
import {Request, Response} from "express";
import {capture, instance, mock, verify, when} from "ts-mockito";
import {Arguments} from "../../../app/common/arguments";
import {expect} from "chai";
import {ArgumentError} from "common-errors";

describe('RequestWithArguments', function () {
    let actualRequest: ArgumentsConsumer;
    let request: APIRequest;
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    beforeEach(function () {
        actualRequest = mock<ArgumentsConsumer>();
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
    });
    it('should obtain requests arguments from the query', async function () {
        // given
        const expectedArguments = {name: 'Tom', age: '15', gender: 'male'};
        when(reqMock.query).thenReturn(expectedArguments);
        request = new RequestWithArguments(instance(actualRequest), 'query', ['name', 'age']);
        // when
        await request.process(req, res);
        // then
        const args: Arguments = capture(actualRequest.setArguments).last()[0];
        expect(args.get('name')).equal(expectedArguments.name);
        expect(args.get('age')).equal(expectedArguments.age);
        expect(args.get('gender')).equal(expectedArguments.gender);
        verify(actualRequest.process(req, res)).once();
    });
    it('should fail to find one of the mandatory arguments', async function () {
        // given
        when(reqMock.body).thenReturn({});
        request = new RequestWithArguments(instance(actualRequest), 'body', ['id']);
        // then
        await expect(request.process(req, res)).rejectedWith(ArgumentError);
        verify(actualRequest.process(req, res)).never();
    });
});