import { FieldMetadataType } from 'twenty-shared/types';

import {
  computeSelectOptionRequiredFieldsUpdateViolations,
  getSelectFieldNamesGatedByUpdateData,
} from 'src/engine/api/common/common-query-runners/utils/compute-select-option-required-fields-update-violations.util';

const FIELD_METADATA_ITEMS = [
  {
    id: 'stage-id',
    name: 'stage',
    label: 'Stage',
    type: FieldMetadataType.SELECT,
    isActive: true,
    settings: {
      requiredFieldMetadataIdsByOptionValue: {
        PROPOSAL: ['amount-id', 'close-date-id'],
      },
    },
  },
  {
    id: 'amount-id',
    name: 'amount',
    label: 'Amount',
    type: FieldMetadataType.CURRENCY,
    isActive: true,
  },
  {
    id: 'close-date-id',
    name: 'closeDate',
    label: 'Close date',
    type: FieldMetadataType.DATE_TIME,
    isActive: true,
  },
];

describe('getSelectFieldNamesGatedByUpdateData', () => {
  it('returns select fields moved into an option with requirements', () => {
    expect(
      getSelectFieldNamesGatedByUpdateData({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        data: { stage: 'PROPOSAL' },
      }),
    ).toEqual(['stage']);
  });

  it('ignores updates that do not target a gated option', () => {
    expect(
      getSelectFieldNamesGatedByUpdateData({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        data: { stage: 'NEW', name: 'Deal' },
      }),
    ).toEqual([]);
  });
});

describe('computeSelectOptionRequiredFieldsUpdateViolations', () => {
  it('flags records missing required values after the update is applied', () => {
    expect(
      computeSelectOptionRequiredFieldsUpdateViolations({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        recordsBeforeUpdate: [
          {
            id: 'record-1',
            stage: 'NEW',
            amount: { amountMicros: null, currencyCode: 'BRL' },
            closeDate: '2026-12-01T00:00:00.000Z',
          },
        ],
        data: { stage: 'PROPOSAL' },
      }),
    ).toEqual([
      {
        recordId: 'record-1',
        selectFieldName: 'stage',
        optionValue: 'PROPOSAL',
        missingFieldNames: ['amount'],
        missingFieldLabels: ['Amount'],
      },
    ]);
  });

  it('accepts values provided in the same update, including partial composites', () => {
    expect(
      computeSelectOptionRequiredFieldsUpdateViolations({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        recordsBeforeUpdate: [
          {
            id: 'record-1',
            stage: 'NEW',
            amount: { amountMicros: null, currencyCode: 'BRL' },
            closeDate: null,
          },
        ],
        data: {
          stage: 'PROPOSAL',
          amount: { amountMicros: 1000000 },
          closeDate: '2026-12-01T00:00:00.000Z',
        },
      }),
    ).toEqual([]);
  });

  it('does not gate records already in the target option', () => {
    expect(
      computeSelectOptionRequiredFieldsUpdateViolations({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        recordsBeforeUpdate: [
          { id: 'record-1', stage: 'PROPOSAL', amount: null, closeDate: null },
        ],
        data: { stage: 'PROPOSAL' },
      }),
    ).toEqual([]);
  });
});
