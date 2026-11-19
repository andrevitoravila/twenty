import { FieldMetadataType } from '@/types';
import { isRecordFieldValueMissingForSelectOptionRequirement } from '@/utils/fieldMetadata/isRecordFieldValueMissingForSelectOptionRequirement';

describe('isRecordFieldValueMissingForSelectOptionRequirement', () => {
  it.each([
    [FieldMetadataType.TEXT, null, true],
    [FieldMetadataType.TEXT, '   ', true],
    [FieldMetadataType.TEXT, 'Acme', false],
    [FieldMetadataType.NUMBER, 0, false],
    [FieldMetadataType.MULTI_SELECT, [], true],
    [FieldMetadataType.MULTI_SELECT, ['A'], false],
    [
      FieldMetadataType.CURRENCY,
      { amountMicros: null, currencyCode: 'BRL' },
      true,
    ],
    [
      FieldMetadataType.CURRENCY,
      { amountMicros: 0, currencyCode: 'BRL' },
      false,
    ],
    [
      FieldMetadataType.EMAILS,
      { primaryEmail: '', additionalEmails: [] },
      true,
    ],
    [FieldMetadataType.FULL_NAME, { firstName: '', lastName: 'Doe' }, false],
    [FieldMetadataType.ADDRESS, { addressCity: '' }, true],
    [FieldMetadataType.ADDRESS, { addressCity: 'Recife' }, false],
    [FieldMetadataType.RICH_TEXT, { markdown: 'note', blocknote: null }, false],
    [FieldMetadataType.LINKS, undefined, true],
  ])('%s %p is missing: %p', (fieldType, value, expected) => {
    expect(
      isRecordFieldValueMissingForSelectOptionRequirement({
        fieldName: 'field',
        fieldType,
        record: { field: value },
      }),
    ).toBe(expected);
  });

  it('reads relations from the join column when present', () => {
    expect(
      isRecordFieldValueMissingForSelectOptionRequirement({
        fieldName: 'company',
        fieldType: FieldMetadataType.RELATION,
        record: { company: { id: 'old' }, companyId: null },
      }),
    ).toBe(true);

    expect(
      isRecordFieldValueMissingForSelectOptionRequirement({
        fieldName: 'company',
        fieldType: FieldMetadataType.RELATION,
        record: { company: { id: 'company-1' } },
      }),
    ).toBe(false);
  });
});
