import {Request, Response} from "express";
import {anything, instance, mock, verify, when} from "ts-mockito";
import {DisposableEndpoint, FailableEndpoint} from "../../../app/common/api/failable-endpoint";
import {ArgumentError} from "common-errors";
import {Endpoint} from "../../../app/common/api/endpoint";

describe('FailableEndpoint', function () {
    const intent: string = 'obtain information about the specified entities';
    const expectedError: Error = new ArgumentError('name');
    let reqMock: Request;
    let resMock: Response;
    let req: Request;
    let res: Response;
    let endpoint: FailableEndpoint;
    let actualEndpoint: Endpoint & DisposableEndpoint;
    beforeEach(function () {
        reqMock = mock<Request>();
        resMock = mock<Response>();
        req = instance(reqMock);
        res = instance(resMock);
        actualEndpoint = mock<Endpoint & DisposableEndpoint>();
        when(actualEndpoint.dispose()).thenResolve();
        when(resMock.status(anything())).thenReturn(res);
        when(actualEndpoint.process(req, res)).thenReject(expectedError);
        endpoint = new FailableEndpoint(instance(actualEndpoint), intent, instance(actualEndpoint));
    });
    it('should respond to the request with a default response code', async function () {
        // given
        endpoint.respondWithCodeOnErrorType(400, ArgumentError);
        // when
        await endpoint.process(req, res);
        // then
        verify(resMock.status(400)).once();
        verify(resMock.end(`Failed to ${intent}. Reason: ${expectedError.message}`)).once();
    });
    it('should respond to the request with a response code according to the error being thrown', async function () {
        // when
        await endpoint.process(req, res);
        // then
        verify(resMock.status(500)).once();
        verify(resMock.end(`Failed to ${intent}. Reason: ${expectedError.message}`)).once();
    });
    it('should dispose resources, associated with the request, if the request succeeds', async function () {
        // then
        await endpoint.process(req, res);
        // then
        verify(actualEndpoint.dispose()).once();
    });
    it('should dispose resources, associated with the request, if the request fails', async function () {
        // given
        when(actualEndpoint.process(req, res)).thenResolve();
        // then
        await endpoint.process(req, res);
        // then
        verify(actualEndpoint.dispose()).once();
    });
});