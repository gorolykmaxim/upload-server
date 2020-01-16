import {URL} from "../app/url";
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
});