import { computeSelectOptionRequiredFieldPaths } from '@/object-record/record-form/utils/computeSelectOptionRequiredFieldPaths';
import { FieldMetadataType, RelationType } from 'twenty-shared/types';

const FIELD_METADATA_ITEMS = [
  {
    id: 'stage-field',
    name: 'stage',
    type: FieldMetadataType.SELECT,
    relation: null,
    settings: {
      requiredFieldMetadataIdsByOptionValue: {
        PROPOSAL: ['amount-field', 'company-field'],
      },
    },
  },
  {
    id: 'amount-field',
    name: 'amount',
    type: FieldMetadataType.CURRENCY,
    relation: null,
    settings: null,
  },
  {
    id: 'company-field',
    name: 'company',
    type: FieldMetadataType.RELATION,
    relation: {
      type: RelationType.MANY_TO_ONE,
    } as never,
    settings: { relationType: RelationType.MANY_TO_ONE },
  },
];

describe('computeSelectOptionRequiredFieldPaths', () => {
  it('returns the record paths of fields required by the new option', () => {
    expect(
      computeSelectOptionRequiredFieldPaths({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        updateInput: { stage: 'PROPOSAL' },
      }),
    ).toEqual(['amount', 'companyId']);
  });

  it('returns nothing when the update does not touch a gated option', () => {
    expect(
      computeSelectOptionRequiredFieldPaths({
        fieldMetadataItems: FIELD_METADATA_ITEMS,
        updateInput: { stage: 'NEW' },
      }),
    ).toEqual([]);
  });
});
