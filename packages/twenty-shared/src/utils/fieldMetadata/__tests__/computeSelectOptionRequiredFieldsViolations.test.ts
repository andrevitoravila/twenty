import { FieldMetadataType, RelationType } from '@/types';
import {
  computeSelectOptionRequiredFieldsViolations,
  getSelectOptionRequiredFieldMetadataIds,
  type SelectOptionRequirementFieldMetadata,
} from '@/utils/fieldMetadata/computeSelectOptionRequiredFieldsViolations';

const STAGE_FIELD: SelectOptionRequirementFieldMetadata = {
  id: 'stage-id',
  name: 'stage',
  type: FieldMetadataType.SELECT,
  isActive: true,
  settings: {
    requiredFieldMetadataIdsByOptionValue: {
      PROPOSAL: ['amount-id', 'close-date-id'],
      CUSTOMER: ['company-id', 'unknown-id', 'stage-id'],
    },
  },
};

const FIELDS: SelectOptionRequirementFieldMetadata[] = [
  STAGE_FIELD,
  {
    id: 'amount-id',
    name: 'amount',
    type: FieldMetadataType.CURRENCY,
    isActive: true,
  },
  {
    id: 'close-date-id',
    name: 'closeDate',
    type: FieldMetadataType.DATE_TIME,
    isActive: true,
  },
  {
    id: 'company-id',
    name: 'company',
    type: FieldMetadataType.RELATION,
    isActive: true,
    settings: { relationType: RelationType.MANY_TO_ONE },
  },
];

describe('computeSelectOptionRequiredFieldsViolations', () => {
  it('reports required fields left empty when moving into an option', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: { stage: 'NEW' },
        nextRecord: {
          stage: 'PROPOSAL',
          amount: { amountMicros: null, currencyCode: 'USD' },
          closeDate: null,
        },
      }),
    ).toEqual([
      {
        selectFieldMetadataId: 'stage-id',
        optionValue: 'PROPOSAL',
        missingFieldMetadataIds: ['amount-id', 'close-date-id'],
      },
    ]);
  });

  it('passes once every required field is filled', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: { stage: 'NEW' },
        nextRecord: {
          stage: 'PROPOSAL',
          amount: { amountMicros: 1000000, currencyCode: 'USD' },
          closeDate: '2026-12-01T00:00:00.000Z',
        },
      }),
    ).toEqual([]);
  });

  it('does not gate records whose option does not change', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: { stage: 'PROPOSAL' },
        nextRecord: { stage: 'PROPOSAL', closeDate: null },
      }),
    ).toEqual([]);
  });

  it('does not gate when the select value is not part of the record', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: {},
        nextRecord: { closeDate: null },
      }),
    ).toEqual([]);
  });

  it('checks relations through their join column and skips unknown or self references', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: { stage: 'PROPOSAL' },
        nextRecord: { stage: 'CUSTOMER', companyId: null },
      }),
    ).toEqual([
      {
        selectFieldMetadataId: 'stage-id',
        optionValue: 'CUSTOMER',
        missingFieldMetadataIds: ['company-id'],
      },
    ]);

    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS,
        previousRecord: { stage: 'PROPOSAL' },
        nextRecord: { stage: 'CUSTOMER', company: { id: 'company-1' } },
      }),
    ).toEqual([]);
  });

  it('ignores required fields that were deactivated', () => {
    expect(
      computeSelectOptionRequiredFieldsViolations({
        fieldMetadataItems: FIELDS.map((field) =>
          field.id === 'close-date-id' ? { ...field, isActive: false } : field,
        ),
        previousRecord: { stage: 'NEW' },
        nextRecord: {
          stage: 'PROPOSAL',
          amount: { amountMicros: 5, currencyCode: 'USD' },
          closeDate: null,
        },
      }),
    ).toEqual([]);
  });
});

describe('getSelectOptionRequiredFieldMetadataIds', () => {
  it.each([
    null,
    undefined,
    'invalid',
    { requiredFieldMetadataIdsByOptionValue: [] },
  ])('returns no ids for malformed settings %p', (settings) => {
    expect(
      getSelectOptionRequiredFieldMetadataIds({
        settings,
        optionValue: 'PROPOSAL',
      }),
    ).toEqual([]);
  });
});
