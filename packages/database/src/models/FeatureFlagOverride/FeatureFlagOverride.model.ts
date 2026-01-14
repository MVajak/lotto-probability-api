import {model, property} from '@loopback/repository';

import {LottoEntity} from '../LottoEntity/LottoEntity.model';

@model({
  settings: {
    postgresql: {
      table: 'feature_flag_override',
    },
  },
})
export class FeatureFlagOverride extends LottoEntity {
  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'feature_flag_id', dataType: 'uuid'},
  })
  featureFlagId: string;

  @property({
    type: 'string',
    required: true,
    postgresql: {columnName: 'user_email'},
  })
  userEmail: string;

  @property({
    type: 'boolean',
    required: true,
    postgresql: {columnName: 'enabled'},
  })
  enabled: boolean;
}

export type FeatureFlagOverrideRelations = {};

export type FeatureFlagOverrideWithRelations = FeatureFlagOverride & FeatureFlagOverrideRelations;
