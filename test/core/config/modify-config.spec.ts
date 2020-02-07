import {JsonDB} from "node-json-db";
import {deepEqual, instance, mock, verify} from "ts-mockito";
import {ModifyConfig} from "../../../backend/core/config/modify-config";
import {executeAndReturnOutput} from "../../common";
import {Command} from "../../../backend/core/command/command";

describe('ModifyConfig', function () {
    const path: string = '/a/b/c';
    const expectedData: any = {'a': 15, 'b': 'c'};
    let config: JsonDB;
    let command: Command;
    beforeEach(function () {
        config = mock<JsonDB>();
        command = new ModifyConfig(instance(config));
    });
    it('should save specified data structure by the specified path in config', async function () {
        // when
        executeAndReturnOutput(command, {path: path, dataToSave: expectedData}).subscribe();
        // then
        verify(config.push(path, deepEqual(expectedData))).once();
    });
});
