import {JsonDB} from "node-json-db";
import {Command} from "../../../backend/core/command";
import {deepEqual, instance, mock, verify} from "ts-mockito";
import {ModifyConfig} from "../../../backend/core/config/modify-config";
import {Observable} from "rxjs";
import {executeAndReturnOutput} from "../../common";
import { expect } from "chai";
import {ArgumentError} from "common-errors";

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
    it('should throw an error because either path or dataToSave is missing', async function () {
        for (let args of [undefined, {}, {path: path}, {dataToSave: expectedData}]) {
            // when
            const output: Observable<any> = executeAndReturnOutput(command, args);
            // then
            await expect(output.toPromise()).rejectedWith(ArgumentError);
        }
    });
});
