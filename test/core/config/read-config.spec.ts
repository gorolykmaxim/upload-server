import {JsonDB} from "node-json-db";
import {instance, mock, when} from "ts-mockito";
import {ReadConfig, ReadConfigArgs} from "../../../backend/core/config/read-config";
import {Observable} from "rxjs";
import {expect} from "chai";
import {executeAndReturnOutput} from "../../common";
import {Command} from "../../../backend/core/command/command";

describe('ReadConfig', function () {
    const args: ReadConfigArgs = new ReadConfigArgs('/a/b/c');
    const expectedData: any = {'a': 15, 'b': 'c'};
    let config: JsonDB;
    let command: Command;
    beforeEach(function () {
        config = mock<JsonDB>();
        when(config.getData(args.path)).thenReturn(expectedData);
        command = new ReadConfig(instance(config));
    });
    it('should read data structure from the config, located by the specified path', async function () {
        // when
        const output: Observable<any> = executeAndReturnOutput(command, args);
        // then
        expect(await output.toPromise()).eql(expectedData);
    });
});
