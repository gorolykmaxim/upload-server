import {Mocker} from "ts-mockito/lib/Mock";

// A workaround to make mocks resolvable by promises (ts-mockito mocks are not resolvable by default).
// https://github.com/NagRock/ts-mockito/issues/163
export function betterMock<T>(clazz?: (new(...args: any[]) => T) | (Function & { prototype: T }) ): T {
    const mocker = new Mocker(clazz);
    mocker['excludedPropertyNames'] = ['hasOwnProperty', 'then'];
    return mocker.getMock();
}
