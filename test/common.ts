import {Observable} from "rxjs";
import {Command} from "../backend/core/command/command";

export function executeAndReturnOutput(command: Command, args?: any, input?: Observable<any>): Observable<any> {
    return new Observable<any>(subscriber => {
        command.execute(subscriber, args, input).catch(e => subscriber.error(e));
    });
}
