import {FileSystem} from "../../../backend/core/file-system/file-system";
import {Command} from "../../../backend/core/command/command";
import {instance, mock, when} from "ts-mockito";
import {GetFileStats} from "../../../backend/core/file-system/get-file-stats";
import {Stats} from "fs";
import {executeAndReturnOutput} from "../../common";
import {expect} from "chai";

describe('GetFileStats', function () {
    const path: string = '/a/b/c';
    const stats: Stats = new Stats();
    let fileSystem: FileSystem;
    let command: Command;
    beforeEach(function () {
        fileSystem = mock<FileSystem>();
        when(fileSystem.stat(path)).thenResolve(stats);
        command = new GetFileStats(instance(fileSystem));
    });
    it('should read stats of the file located by the specified path', async function () {
        // when
        const actualStats: Stats = await executeAndReturnOutput(command, {path: path}).toPromise();
        // then
        expect(actualStats).equal(stats);
    });
});
