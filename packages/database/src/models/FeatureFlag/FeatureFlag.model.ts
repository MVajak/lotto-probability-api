import {model, property} from '@loopback/repository';

import {LottoEntity} from '../LottoEntity/LottoEntity.model';

@model({
  settings: {
    postgresql: {
      table: 'feature_flag',
    },
  },
})
export class FeatureFlag extends LottoEntity {
  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'key'},
  })
  key: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'name'},
  })
  name: string;

  @property({
    type: 'string',
    required: false,
    postgresql: {columnName: 'description'},
  })
  description?: string | null;

  @property({
    type: 'boolean',
    required: true,
    default: false,
    postgresql: {columnName: 'default_enabled'},
  })
  defaultEnabled: boolean;
}

export type FeatureFlagRelations = {};

export type FeatureFlagWithRelations = FeatureFlag & FeatureFlagRelations;
