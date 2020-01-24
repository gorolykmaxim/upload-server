import {URL} from "../../../app/common/url";
import {CommandURL} from "../../../app/command-executor/api/command-url";
import { expect } from "chai";

describe('CommandURL', function () {
    const baseURL: URL = URL.createNew('api').append('command-executor');
    it('should create a command URL that is not related to a specific command', function () {
        // when
        const url: CommandURL = CommandURL.allCommands(baseURL);
        // then
        expect(url.value).equal('/api/command-executor/command');
    });
    it('should create a command URL that is related to a specific command', function () {
        // when
        const url: CommandURL = CommandURL.singleCommand(baseURL);
        // then
        expect(url.value).equal('/api/command-executor/command/:commandId');
    });
    it('should create a URL for a command with a specific ID', function () {
        // given
        const id: string = '123';
        // when
        const url: CommandURL = CommandURL.singleCommand(baseURL).setCommandId(id);
        // then
        expect(url.value).equal(`/api/command-executor/command/${id}`);
    });
});