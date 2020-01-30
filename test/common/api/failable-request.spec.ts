import {Request, Response} from "express";
import {anything, instance, mock, verify, when} from "ts-mockito";
import {DisposableRequest, FailableRequest} from "../../../app/common/api/failable-request";
import {ArgumentError} from "common-errors";
import {APIRequest} from "../../../app/common/api/request";

describe('FailableRequest', function () {
    const intent: string = 'obtain information about the specified entities';
    const expectedError: Error = new ArgumentError('name');
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let request: FailableRequest;
    let actualRequest: APIRequest & DisposableRequest;
    beforeEach(function () {
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        actualRequest = mock<APIRequest & DisposableRequest>();
        when(actualRequest.dispose()).thenResolve();
        when(resMock.status(anything())).thenReturn(res);
        when(actualRequest.process(req, res)).thenReject(expectedError);
        request = new FailableRequest(instance(actualRequest), intent, instance(actualRequest));
    });
    it('should respond to the request with a default response code', async function () {
        // given
        request.respondWithCodeOnErrorType(400, ArgumentError);
        // when
        await request.process(req, res);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(`Failed to ${intent}. Reason: ${expectedError.message}`)).once();
    });
    it('should respond to the request with a response code according to the error being thrown', async function () {
        // when
        await request.process(req, res);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(`Failed to ${intent}. Reason: ${expectedError.message}`)).once();
    });
    it('should dispose resources, associated with the request, if the request succeeds', async function () {
        // then
        await request.process(req, res);
        // then
        verify(actualRequest.dispose()).once();
    });
    it('should dispose resources, associated with the request, if the request fails', async function () {
        // given
        when(actualRequest.process(req, res)).thenResolve();
        // then
        await request.process(req, res);
        // then
        verify(actualRequest.dispose()).once();
    });
});