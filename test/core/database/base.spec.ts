import {Where} from "../../../backend/core/database/base";
import { expect } from "chai";

describe('Where', function () {
    it('should create a WHERE clause of a key-value data structure', function () {
        // given
        const query: any = {'name': 'Tom', 'age': 15};
        // when
        const where: Where = new Where(query);
        // then
        expect(where.statement).equal('WHERE name = ? AND age = ?');
        expect(where.values).eql(['Tom', 15]);
    });
});
