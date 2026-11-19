import { type FieldMetadataSelectSettings } from 'twenty-shared/types';
import { isNonEmptyArray, isPlainObject } from 'twenty-shared/utils';

// Entries for options that no longer exist are dropped so renamed or removed
// options do not keep stale requirements around
export const buildSelectOptionRequiredFieldsSettings = ({
  settings,
  activeOptionValues,
  optionValue,
  requiredFieldMetadataIds,
}: {
  settings: FieldMetadataSelectSettings | null | undefined;
  activeOptionValues: string[];
  optionValue: string;
  requiredFieldMetadataIds: string[];
}): FieldMetadataSelectSettings => {
  const storedRequiredFieldMetadataIdsByOptionValue =
    settings?.requiredFieldMetadataIdsByOptionValue;
  const previousRequiredFieldMetadataIdsByOptionValue = isPlainObject(
    storedRequiredFieldMetadataIdsByOptionValue,
  )
    ? storedRequiredFieldMetadataIdsByOptionValue
    : {};

  const requiredFieldMetadataIdsByOptionValue = Object.fromEntries(
    Object.entries({
      ...previousRequiredFieldMetadataIdsByOptionValue,
      [optionValue]: requiredFieldMetadataIds,
    }).filter(
      ([value, fieldMetadataIds]) =>
        activeOptionValues.includes(value) && isNonEmptyArray(fieldMetadataIds),
    ),
  );

  return { ...settings, requiredFieldMetadataIdsByOptionValue };
};
