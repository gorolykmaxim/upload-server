import {
    Collection,
    EntityComparison,
    EntityNotFoundError,
    InMemoryCollection,
    ValuesCollection
} from "../app/collection";
import {expect} from "chai";
import {anything, instance, mock, when} from "ts-mockito";

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

describe('InMemoryCollection', function () {
    const object = {};
    let comparison: EntityComparison<any>;
    let collection: Collection<any>;
    beforeEach(function () {
        comparison = mock<EntityComparison<any>>();
        when(comparison.hasId(anything(), anything())).thenReturn(true);
        when(comparison.equal(anything(), anything())).thenReturn(true);
        collection = new InMemoryCollection(instance(comparison));
    });
    it('should add entity to collection', async function () {
        // when
        await collection.add(object);
        // then
        expect(await collection.contains(object)).to.be.true;
    });
    it('should find entity in collection', async function () {
        // given
        await collection.add(object);
        // when
        const actualObject = await collection.findById(object);
        // then
        expect(actualObject).to.be.equal(object);
    });
    it('should not find entity in collection', async function () {
        // then
        await expect(collection.findById(object)).to.be.rejectedWith(EntityNotFoundError);
    });
    it('should remove entity from collection', async function () {
        // given
        await collection.add(object);
        // when
        await collection.remove(object);
        // then
        expect(await collection.contains(object)).to.be.false;
    });
    it('should fail to remove entity from collection, since the collection does not have the entity', async function () {
        // then
        await expect(collection.remove(object)).to.be.rejectedWith(EntityNotFoundError);
    });
    it('should contain entity', async function () {
        // given
        await collection.add(object);
        // when
        const contains = await collection.contains(object);
        // then
        expect(contains).to.be.true;
    });
    it('should not contain entity', async function () {
        // when
        const contains = await collection.contains(object);
        // then
        expect(contains).to.be.false;
    });
});