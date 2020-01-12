import {Collection, ValuesCollection} from "../app/collection";
import {expect} from "chai";

describe('ValuesCollection', function () {
    const value = 42;
    let collection: Collection<number>;
    beforeEach(function () {
        collection = new ValuesCollection();
    });
    it('should add value to the collection', async function () {
        // when
        await collection.add(value);
        // then
        expect(await collection.contains(value)).to.be.true;
    });
    it('should remove value from the collection', async function () {
        // given
        await collection.add(value);
        // when
        await collection.remove(value);
        // then
        expect(await collection.contains(value)).to.be.false;
    });
    it('should fail to remove value from the collection, since the value is not in the collection', async function () {
        // then
        await expect(collection.remove(value)).to.be.rejected;
    });
    it('should contain the value', async function () {
        // given
        await collection.add(value);
        // when
        const contains = await collection.contains(value);
        // then
        expect(contains).to.be.true;
    });
    it('should not contain the value', async function () {
        // when
        const contains = await collection.contains(value);
        // then
        expect(contains).to.be.false;
    });
    it('should find value', async function () {
        // given
        await collection.add(value);
        // when
        const actualValue = await collection.findById(value);
        // then
        expect(actualValue).to.equal(value);
    });
    it('should not find value', async function () {
        // then
        await expect(collection.findById(value)).to.be.rejected;
    });
});