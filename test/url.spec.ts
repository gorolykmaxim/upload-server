import {URL, URLIsAlreadyFinishedError} from "../app/url";
import { expect } from "chai";

describe('URL', function () {
    it('should create new URL, while prepending the "/"', function () {
        // when
        const url: URL = URL.createNew('api');
        // then
        expect(url.value).to.equal('/api');
    });
    it('should append a part to the existing URL and create a new one', function () {
        // given
        const baseURL: URL = URL.createNew('api');
        // when
        const url: URL = baseURL.append('entity');
        // then
        expect(url.value).to.equal('/api/entity');
    });
    it('should not change existing URL while appending a part to it', function () {
        // given
        const baseURL: URL = URL.createNew('api');
        // when
        const url: URL = baseURL.append('entity');
        // then
        expect(baseURL.value).to.equal('/api');
    });
    it('should create exact URL from the specified string without changing anything', function () {
        // given
        const rawURL: string = '/a/b/c?d=1&e=true';
        // when
        const url: URL = new URL(rawURL);
        // then
        expect(url.value).to.equal(rawURL);
    });
    it('should return null while trying to find query value in newly created URL', function () {
        // given
        const url: URL = URL.createNew('api');
        // when
        const value: string = url.getQueryValueOf('name');
        // then
        expect(value).to.be.null;
    });
    it('should return null while trying to find query value in URL that is created from a string', function () {
        // given
        const url: URL = new URL('/a/b/c?');
        // when
        const value: string = url.getQueryValueOf('name');
        // then
        expect(value).to.be.null;
    });
    it('should return value of a query parameter', function () {
        // given
        const url: URL = new URL('/a/b/c?name=Tom');
        // when
        const value: string = url.getQueryValueOf('name');
        // then
        expect(value).to.equal('Tom');
    });
    it('should fail to append a part to a URL that already has a query part', function () {
        // given
        const url: URL = new URL('/a/b/c?age=18');
        // then
        expect(() => url.append('d')).to.throw(URLIsAlreadyFinishedError);
    });
});