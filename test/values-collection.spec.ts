import {expect} from "chai";
import {Collection} from "../app/collection/collection";
import {ValuesCollection} from "../app/collection/values-collection";

describe('ValuesCollection', function () {
    const value = 42;
    let collection: Collection<number>;
    beforeEach(function () {
        collection = new ValuesCollection();
    });
    it('should find all values in the collection', async function () {
        // given
        const expectedValues = [1,2,3,4];
        await Promise.all(expectedValues.map(collection.add.bind(collection)));
        // when
        const values = await collection.findAll();
        // then
        expect(values).to.eql(expectedValues);
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