import { getSelectOptionRequirableFieldMetadataItems } from '@/settings/data-model/fields/forms/select/utils/getSelectOptionRequirableFieldMetadataItems';
import { FieldMetadataType } from 'twenty-shared/types';

const buildField = (
  overrides: Partial<{
    id: string;
    name: string;
    label: string;
    type: FieldMetadataType;
    isActive: boolean;
    isSystem: boolean;
  }>,
) => ({
  id: 'id',
  name: 'name',
  label: 'Name',
  type: FieldMetadataType.TEXT,
  isActive: true,
  isSystem: false,
  isUIEditable: true,
  settings: null,
  ...overrides,
});

describe('getSelectOptionRequirableFieldMetadataItems', () => {
  it('keeps editable fields sorted by label and drops the select itself', () => {
    const result = getSelectOptionRequirableFieldMetadataItems({
      selectFieldMetadataId: 'stage',
      fieldMetadataItems: [
        buildField({
          id: 'stage',
          name: 'stage',
          type: FieldMetadataType.SELECT,
        }),
        buildField({ id: 'name', name: 'name', label: 'Name' }),
        buildField({
          id: 'amount',
          name: 'amount',
          label: 'Amount',
          type: FieldMetadataType.CURRENCY,
        }),
        buildField({
          id: 'archived',
          name: 'archived',
          label: 'Archived',
          type: FieldMetadataType.BOOLEAN,
        }),
        buildField({
          id: 'createdAt',
          name: 'createdAt',
          label: 'Creation date',
          isSystem: true,
        }),
        buildField({ id: 'old', name: 'old', label: 'Old', isActive: false }),
      ],
    });

    expect(result.map(({ id }) => id)).toEqual(['amount', 'name']);
  });
});
