import {anything, instance, mock, when} from "ts-mockito";
import {expect} from "chai";
import {EntityComparison, InMemoryCollection} from "../../app/collection/in-memory-collection";
import {Collection, EntityNotFoundError} from "../../app/collection/collection";

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
    it('should find all entities in the collection', async function () {
        // given
        const expectedEntities = [{a: 1}, {a: 2}, {a: 3}];
        await Promise.all(expectedEntities.map(collection.add.bind(collection)));
        // when
        const entities = await collection.findAll();
        // then
        expect(entities).to.eql(expectedEntities);
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