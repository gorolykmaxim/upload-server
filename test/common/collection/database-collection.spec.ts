import {Database} from "sqlite";
import {
    DatabaseCollection,
    EntityAdditionError, EntityLookupError,
    EntityMapping, EntityRemovalError
} from "../../../app/common/collection/database-collection";
import {instance, mock, verify, when} from "ts-mockito";
import {Collection, EntityNotFoundError} from "../../../app/common/collection/collection";
import { expect } from "chai";

class DummyEntity {
    id: number;
    name: string;
}

describe('DatabaseCollection', function () {
    const expectedError: Error = new Error();
    const tableName: string = 'object';
    const entity: DummyEntity = new DummyEntity();
    entity.id = 15;
    entity.name = 'Tom';
    const object = {ID: entity.id, NAME: entity.name};
    let database: Database;
    let mapping: EntityMapping<DummyEntity>;
    let collection: Collection<DummyEntity>;
    beforeEach(function () {
        database = mock<Database>();
        mapping = mock<EntityMapping<DummyEntity>>();
        when(mapping.serialize(entity)).thenReturn(object);
        when(mapping.deserialize(object)).thenReturn(entity);
        collection = new DatabaseCollection(instance(mapping), tableName, instance(database), 'ID');
    });
    it('should add an item to a collection', async function () {
        // when
        await collection.add(entity);
        // then
        verify(database.run(`INSERT INTO ${tableName}(ID, NAME) VALUES (?, ?)`, entity.id, entity.name)).once();
    });
    it('should fail to add an item to a collection', async function () {
        // given
        when(database.run(`INSERT INTO ${tableName}(ID, NAME) VALUES (?, ?)`, entity.id, entity.name))
            .thenReject(expectedError);
        // then
        await expect(collection.add(entity)).to.be.rejectedWith(EntityAdditionError);
    });
    it('should contain a item with the specified ID', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id))
            .thenResolve(object);
        // then
        expect(await collection.contains(entity.id)).to.be.true;
    });
    it('should not contain an item with the specified ID', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id))
            .thenResolve(undefined);
        // then
        expect(await collection.contains(entity.id)).to.be.false;
    });
    it('should fail to check if the item with the specified ID is in it', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id))
            .thenReject(expectedError);
        // then
        await expect(collection.contains(entity.id)).to.be.rejectedWith(EntityLookupError);
    });
    it('should return all entities, stored in it', async function () {
        // given
        when(database.all(`SELECT * FROM ${tableName}`)).thenResolve([object]);
        // when
        const dummyEntities: Array<DummyEntity> = await collection.findAll();
        // then
        expect(dummyEntities).to.eql([entity]);
    });
    it('should fail to return all entities, stored in it', async function () {
        // given
        when(database.all(`SELECT * FROM ${tableName}`)).thenReject(expectedError);
        // then
        await expect(collection.findAll()).to.be.rejectedWith(EntityLookupError);
    });
    it('should find entity with the specified single-field ID', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id))
            .thenResolve(object);
        // when
        const dummyEntity: DummyEntity = await collection.findById(entity.id);
        // then
        expect(dummyEntity).to.equal(entity);
    });
    it('should find entity with the specified complex ID', async function () {
        // given
        collection = new DatabaseCollection(instance(mapping), tableName, instance(database));
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ? AND NAME = ?`, entity.id, entity.name))
            .thenResolve(object);
        // when
        const dummyEntity: DummyEntity = await collection.findById({ID: entity.id, NAME: entity.name});
        // then
        expect(dummyEntity).to.equal(entity);
    });
    it('should not find entity with the specified ID', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id)).thenResolve(undefined);
        // then
        await expect(collection.findById(entity.id)).to.be.rejectedWith(EntityNotFoundError);
    });
    it('should fail to find entity with the specified ID', async function () {
        // given
        when(database.get(`SELECT * FROM ${tableName} WHERE ID = ?`, entity.id)).thenReject(expectedError);
        // then
        await expect(collection.findById(entity.id)).to.be.rejectedWith(EntityLookupError);
    });
    it('should remove specified entity from the collection', async function () {
        // when
        await collection.remove(entity);
        // then
        verify(database.run(`DELETE FROM ${tableName} WHERE ID = ? AND NAME = ?`, entity.id, entity.name)).once();
    });
    it('should fail to remove specified entity from the collection', async function () {
        // given
        when(database.run(`DELETE FROM ${tableName} WHERE ID = ? AND NAME = ?`, entity.id, entity.name))
            .thenReject(expectedError);
        // then
        await expect(collection.remove(entity)).to.be.rejectedWith(EntityRemovalError);
    });
});