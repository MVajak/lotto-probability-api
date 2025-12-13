import type {Filter} from '@loopback/filter';
import type {Where} from '@loopback/filter/src/query';
import {
  type Count,
  type DataObject,
  DefaultCrudRepository,
  WhereBuilder,
} from '@loopback/repository';
import type {Options} from '@loopback/repository/src/common-types';

import type {LottoEntity} from '../models/LottoEntity/LottoEntity.model';

export class BaseRepository<
  T extends LottoEntity,
  ID,
  Relations extends object,
> extends DefaultCrudRepository<T, ID, Relations> {
  private now(): string {
    return new Date().toISOString();
  }

  async create(entity: DataObject<T>, options?: Options): Promise<T> {
    const now = this.now();
    const auditedEntity = {
      ...entity,
      createdAt: now,
      updatedAt: now,
    };
    return super.create(auditedEntity, options);
  }

  async createAll(entities: DataObject<T>[], options?: Options): Promise<T[]> {
    const now = this.now();
    entities = entities.map(e => ({
      ...e,
      createdAt: now,
      updatedAt: now,
    }));
    return super.createAll(entities, options);
  }

  async update(entity: T, options?: Options): Promise<void> {
    const auditedEntity = {
      ...entity,
      updatedAt: this.now(),
    };
    return super.update(auditedEntity, options);
  }

  async updateById(id: ID, data: DataObject<T>, options?: Options): Promise<void> {
    data.updatedAt = this.now();
    return super.updateById(id, data, options);
  }

  async updateAll(data: DataObject<T>, where?: Where<T>, options?: Options): Promise<Count> {
    data.updatedAt = this.now();
    return super.updateAll(data, where, options);
  }

  async replaceById(id: ID, data: DataObject<T>, options?: Options): Promise<void> {
    const now = this.now();
    data.createdAt = data.createdAt ?? now;
    data.updatedAt = now;
    return super.replaceById(id, data, options);
  }

  async deleteById(id: ID, options?: Options): Promise<void> {
    const now = this.now();
    await super.updateById(id, {deletedAt: now}, options);
  }

  async deleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    const now = this.now();
    return super.updateAll({deletedAt: now}, where, options);
  }

  async hardDeleteById(id: ID, options?: Options): Promise<void> {
    await super.deleteById(id, options);
  }

  async hardDeleteAll(where?: Where<T>, options?: Options): Promise<Count> {
    return super.deleteAll(where, options);
  }

  async find(filter?: Filter<T>, options?: Options): Promise<(T & Relations)[]> {
    const builder = new WhereBuilder(filter?.where);
    builder.impose(<Where<T>>{deletedAt: {eq: null}});
    return super.find({...filter, where: builder.build()}, options);
  }
}
