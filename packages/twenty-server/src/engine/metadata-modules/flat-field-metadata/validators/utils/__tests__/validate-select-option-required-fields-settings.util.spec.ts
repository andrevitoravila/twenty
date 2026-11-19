import { validateSelectOptionRequiredFieldsSettings } from 'src/engine/metadata-modules/flat-field-metadata/validators/utils/validate-select-option-required-fields-settings.util';

describe('validateSelectOptionRequiredFieldsSettings', () => {
  it.each([
    null,
    {},
    { requiredFieldMetadataIdsByOptionValue: {} },
    { requiredFieldMetadataIdsByOptionValue: { PROPOSAL: ['field-id'] } },
  ])('accepts %p', (settings) => {
    expect(validateSelectOptionRequiredFieldsSettings({ settings })).toEqual(
      [],
    );
  });

  it.each([
    { requiredFieldMetadataIdsByOptionValue: ['field-id'] },
    { requiredFieldMetadataIdsByOptionValue: { PROPOSAL: 'field-id' } },
    { requiredFieldMetadataIdsByOptionValue: { PROPOSAL: [42] } },
  ])('rejects %p', (settings) => {
    expect(validateSelectOptionRequiredFieldsSettings({ settings })).toEqual([
      expect.objectContaining({ code: 'INVALID_FIELD_INPUT' }),
    ]);
  });
});
