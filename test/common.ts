import {Command} from "../backend/core/command";
import {Observable} from "rxjs";

export function executeAndReturnOutput(command: Command, args?: any, input?: Observable<any>): Observable<any> {
    return new Observable<any>(subscriber => {
        command.execute(subscriber, args, input)
            .then(() => subscriber.complete())
            .catch(e => subscriber.error(e));
    });
}
