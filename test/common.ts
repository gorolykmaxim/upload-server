import {Observable} from "rxjs";
import {Command} from "../backend/core/command/command";
import {Mocker} from "ts-mockito/lib/Mock";

export function executeAndReturnOutput(command: Command, args?: any, input?: Observable<any>): Observable<any> {
    return new Observable<any>(subscriber => {
        command.execute(subscriber, args, input).catch(e => subscriber.error(e));
    });
}

// A workaround to make mocks resolvable by promises (ts-mockito mocks are not resolvable by default).
// https://github.com/NagRock/ts-mockito/issues/163
export function betterMock<T>(clazz?: (new(...args: any[]) => T) | (Function & { prototype: T }) ): T {
    const mocker = new Mocker(clazz);
    mocker['excludedPropertyNames'] = ['hasOwnProperty', 'then'];
    return mocker.getMock();
}
