import {Entity, property} from '@loopback/repository';

export class LottoEntity extends Entity {
  @property({
    type: 'string',
    id: true,
    postgresql: {dataType: 'uuid'},
  })
  id: string;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'created_at'},
  })
  createdAt?: string;

  @property({
    type: 'date',
    required: true,
    postgresql: {columnName: 'updated_at'},
  })
  updatedAt?: string;

  @property({
    type: 'date',
    nullable: true,
    required: false,
    postgresql: {columnName: 'deleted_at'},
  })
  deletedAt?: string | null;

  constructor(data?: Partial<LottoEntity>) {
    super(data);
    Object.assign(this, data);
  }
}
