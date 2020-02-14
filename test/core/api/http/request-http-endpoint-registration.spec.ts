import {HttpEndpoint} from "../../../../backend/core/api/http/http-endpoint";
import {Command} from "../../../../backend/core/command/command";
import {RequestHttpEndpointRegistration} from "../../../../backend/core/api/http/request-http-endpoint-registration";
import {executeAndReturnOutput} from "../../../common";
import {from, of} from "rxjs";
import {expect} from "chai";
import {HttpEndpoints} from "../../../../backend/core/api/http/base";

describe('RequestHttpEndpointRegistration', function () {
    const url: string = '/a/:c';
    let httpEndpoints: HttpEndpoints;
    let command: Command;
    beforeEach(function () {
        httpEndpoints = new HttpEndpoints();
        command = new RequestHttpEndpointRegistration(httpEndpoints);
    });
    it('should save all the endpoints from the input in the list', async function () {
        // given
        const endpoint: HttpEndpoint = new HttpEndpoint('GET', url, 'child command');
        // when
        await executeAndReturnOutput(command, null, of(endpoint)).toPromise();
        // then
        const urls: Array<string> = httpEndpoints.getUrls();
        expect(urls).eql([url]);
        const methods: Array<string> = httpEndpoints.getMethodsOfUrl(urls[0]);
        expect(methods).eql(['GET']);
        const endpoints: Array<HttpEndpoint> = httpEndpoints.getEndpointsWithUrlAndMethod(urls[0], methods[0]);
        expect(endpoints).eql([endpoint]);
    });
    it('should save multiple endpoints with different methods under the same URL', async function () {
        // given
        const endpointA: HttpEndpoint = new HttpEndpoint('GET', url, 'command A');
        const endpointB: HttpEndpoint = new HttpEndpoint('POST', url, 'command B');
        // when
        await executeAndReturnOutput(command, null, from([endpointA, endpointB])).toPromise();
        // then
        const urls: Array<string> = httpEndpoints.getUrls();
        expect(urls).eql([url]);
        const methods: Array<string> = httpEndpoints.getMethodsOfUrl(urls[0]);
        expect(methods).eql(['GET', 'POST']);
        const endpoints: Array<HttpEndpoint> = methods
            .map(m => httpEndpoints.getEndpointsWithUrlAndMethod(urls[0], m))
            .reduce((v, c) => c.concat(v), []);
        expect(endpoints).eql([endpointB, endpointA]);
    });
    it('should save multiple endpoints with different content type under the same method and URL', async function () {
        // given
        const endpointA: HttpEndpoint = new HttpEndpoint('POST', url, 'command A');
        const endpointB: HttpEndpoint = new HttpEndpoint('POST', url, 'command B');
        endpointB.contentType = 'application/json';
        // when
        await executeAndReturnOutput(command, null, from([endpointA, endpointB])).toPromise();
        // then
        const urls: Array<string> = httpEndpoints.getUrls();
        expect(urls).eql([url]);
        const methods: Array<string> = httpEndpoints.getMethodsOfUrl(urls[0]);
        expect(methods).eql(['POST']);
        const endpoints: Array<HttpEndpoint> = httpEndpoints.getEndpointsWithUrlAndMethod(urls[0], methods[0]);
        expect(endpoints).eql([endpointA, endpointB]);
    });
});
