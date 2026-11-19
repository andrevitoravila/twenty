import { FieldMetadataType } from '@/types/FieldMetadataType';
import { type RelationType } from '@/types/RelationType';
import { type SelectOptionRequiredFieldsViolation } from '@/types/SelectOptionRequiredFieldsViolation';
import { isFieldMetadataEligibleForSelectOptionRequirement } from '@/utils/fieldMetadata/isFieldMetadataEligibleForSelectOptionRequirement';
import { isRecordFieldValueMissingForSelectOptionRequirement } from '@/utils/fieldMetadata/isRecordFieldValueMissingForSelectOptionRequirement';
import { isPlainObject } from '@/utils/typeguard/isPlainObject';
import { isDefined } from '@/utils/validation/isDefined';

export type SelectOptionRequirementFieldMetadata = {
  id: string;
  name: string;
  type: FieldMetadataType;
  isActive?: boolean | null;
  isSystem?: boolean | null;
  isUIEditable?: boolean | null;
  settings?: unknown;
};

const getRelationType = (settings: unknown): RelationType | undefined =>
  isPlainObject(settings) ? (settings.relationType as RelationType) : undefined;

export const getSelectOptionRequiredFieldMetadataIds = ({
  settings,
  optionValue,
}: {
  settings: unknown;
  optionValue: string;
}): string[] => {
  if (!isPlainObject(settings)) {
    return [];
  }

  const requiredFieldMetadataIdsByOptionValue =
    settings.requiredFieldMetadataIdsByOptionValue;

  if (!isPlainObject(requiredFieldMetadataIdsByOptionValue)) {
    return [];
  }

  const requiredFieldMetadataIds =
    requiredFieldMetadataIdsByOptionValue[optionValue];

  return Array.isArray(requiredFieldMetadataIds)
    ? requiredFieldMetadataIds.filter(
        (fieldMetadataId): fieldMetadataId is string =>
          typeof fieldMetadataId === 'string',
      )
    : [];
};

// Only a change of the select value is gated, so records already sitting in
// an option stay editable after a requirement is added to it
export const computeSelectOptionRequiredFieldsViolations = ({
  fieldMetadataItems,
  previousRecord,
  nextRecord,
}: {
  fieldMetadataItems: SelectOptionRequirementFieldMetadata[];
  previousRecord: Record<string, unknown>;
  nextRecord: Record<string, unknown>;
}): SelectOptionRequiredFieldsViolation[] => {
  const fieldMetadataItemById = new Map(
    fieldMetadataItems.map((fieldMetadataItem) => [
      fieldMetadataItem.id,
      fieldMetadataItem,
    ]),
  );

  return fieldMetadataItems.flatMap((selectFieldMetadataItem) => {
    if (selectFieldMetadataItem.type !== FieldMetadataType.SELECT) {
      return [];
    }

    const nextOptionValue = nextRecord[selectFieldMetadataItem.name];

    if (
      typeof nextOptionValue !== 'string' ||
      nextOptionValue === previousRecord[selectFieldMetadataItem.name]
    ) {
      return [];
    }

    const missingFieldMetadataIds = getSelectOptionRequiredFieldMetadataIds({
      settings: selectFieldMetadataItem.settings,
      optionValue: nextOptionValue,
    }).filter((requiredFieldMetadataId) => {
      const requiredFieldMetadataItem = fieldMetadataItemById.get(
        requiredFieldMetadataId,
      );

      return (
        isDefined(requiredFieldMetadataItem) &&
        requiredFieldMetadataItem.id !== selectFieldMetadataItem.id &&
        isFieldMetadataEligibleForSelectOptionRequirement({
          fieldName: requiredFieldMetadataItem.name,
          fieldType: requiredFieldMetadataItem.type,
          isActive: requiredFieldMetadataItem.isActive === true,
          isSystem: requiredFieldMetadataItem.isSystem === true,
          isUIEditable: requiredFieldMetadataItem.isUIEditable !== false,
          relationType: getRelationType(requiredFieldMetadataItem.settings),
        }) &&
        isRecordFieldValueMissingForSelectOptionRequirement({
          fieldName: requiredFieldMetadataItem.name,
          fieldType: requiredFieldMetadataItem.type,
          record: nextRecord,
        })
      );
    });

    return missingFieldMetadataIds.length > 0
      ? [
          {
            selectFieldMetadataId: selectFieldMetadataItem.id,
            optionValue: nextOptionValue,
            missingFieldMetadataIds,
          },
        ]
      : [];
  });
};
