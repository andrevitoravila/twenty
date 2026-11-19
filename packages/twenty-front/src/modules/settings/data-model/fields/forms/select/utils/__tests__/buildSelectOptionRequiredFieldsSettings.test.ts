import { buildSelectOptionRequiredFieldsSettings } from '@/settings/data-model/fields/forms/select/utils/buildSelectOptionRequiredFieldsSettings';

describe('buildSelectOptionRequiredFieldsSettings', () => {
  it('sets the required fields of one option and keeps the others', () => {
    expect(
      buildSelectOptionRequiredFieldsSettings({
        settings: {
          requiredFieldMetadataIdsByOptionValue: { PROPOSAL: ['amount'] },
        },
        activeOptionValues: ['PROPOSAL', 'CUSTOMER'],
        optionValue: 'CUSTOMER',
        requiredFieldMetadataIds: ['company'],
      }),
    ).toEqual({
      requiredFieldMetadataIdsByOptionValue: {
        PROPOSAL: ['amount'],
        CUSTOMER: ['company'],
      },
    });
  });

  it('drops emptied options and options that no longer exist', () => {
    expect(
      buildSelectOptionRequiredFieldsSettings({
        settings: {
          requiredFieldMetadataIdsByOptionValue: {
            PROPOSAL: ['amount'],
            REMOVED: ['amount'],
          },
        },
        activeOptionValues: ['PROPOSAL'],
        optionValue: 'PROPOSAL',
        requiredFieldMetadataIds: [],
      }),
    ).toEqual({ requiredFieldMetadataIdsByOptionValue: {} });
  });
});
