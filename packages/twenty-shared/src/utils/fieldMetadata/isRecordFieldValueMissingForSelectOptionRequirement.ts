import { VALIDATION_RULE_EMPTINESS_SUBFIELDS_BY_COMPOSITE_TYPE } from '@/constants/ValidationRuleEmptinessSubfieldsByCompositeType';
import { FieldMetadataType } from '@/types/FieldMetadataType';
import { computeRelationGqlFieldJoinColumnName } from '@/utils/fieldMetadata/compute-relation-gql-field-join-column-name';
import { isPlainObject } from '@/utils/typeguard/isPlainObject';
import { isDefined } from '@/utils/validation/isDefined';

const ADDRESS_EMPTINESS_SUBFIELDS = [
  'addressStreet1',
  'addressStreet2',
  'addressCity',
  'addressState',
  'addressPostcode',
  'addressCountry',
];

const RICH_TEXT_EMPTINESS_SUBFIELDS = ['markdown', 'blocknote'];

const isScalarValueEmpty = (value: unknown): boolean =>
  !isDefined(value) ||
  (typeof value === 'string' && value.trim() === '') ||
  (Array.isArray(value) && value.length === 0);

const areSubfieldsEmpty = (value: unknown, subfieldNames: string[]) =>
  !isPlainObject(value) ||
  subfieldNames.every((subfieldName) =>
    isScalarValueEmpty(value[subfieldName]),
  );

export const isRecordFieldValueMissingForSelectOptionRequirement = ({
  fieldName,
  fieldType,
  record,
}: {
  fieldName: string;
  fieldType: FieldMetadataType;
  record: Record<string, unknown>;
}): boolean => {
  if (fieldType === FieldMetadataType.RELATION) {
    const joinColumnName = computeRelationGqlFieldJoinColumnName({
      name: fieldName,
    });

    // The join column wins because it is what an update input sets
    return joinColumnName in record
      ? isScalarValueEmpty(record[joinColumnName])
      : !isPlainObject(record[fieldName]);
  }

  const value = record[fieldName];

  if (fieldType === FieldMetadataType.ADDRESS) {
    return areSubfieldsEmpty(value, ADDRESS_EMPTINESS_SUBFIELDS);
  }

  if (fieldType === FieldMetadataType.RICH_TEXT) {
    return areSubfieldsEmpty(value, RICH_TEXT_EMPTINESS_SUBFIELDS);
  }

  const compositeEmptinessSubfields =
    VALIDATION_RULE_EMPTINESS_SUBFIELDS_BY_COMPOSITE_TYPE[fieldType];

  if (isDefined(compositeEmptinessSubfields)) {
    return areSubfieldsEmpty(value, compositeEmptinessSubfields);
  }

  return isScalarValueEmpty(value);
};
