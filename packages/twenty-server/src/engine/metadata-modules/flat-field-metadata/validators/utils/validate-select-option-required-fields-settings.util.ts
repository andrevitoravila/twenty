import { msg } from '@lingui/core/macro';
import { isDefined, isPlainObject } from 'twenty-shared/utils';

import { FieldMetadataExceptionCode } from 'src/engine/metadata-modules/field-metadata/field-metadata.exception';
import { type FlatFieldMetadataValidationError } from 'src/engine/metadata-modules/flat-field-metadata/types/flat-field-metadata-validation-error.type';

export const validateSelectOptionRequiredFieldsSettings = ({
  settings,
}: {
  settings: unknown;
}): FlatFieldMetadataValidationError[] => {
  if (!isPlainObject(settings)) {
    return [];
  }

  const requiredFieldMetadataIdsByOptionValue =
    settings.requiredFieldMetadataIdsByOptionValue;

  if (!isDefined(requiredFieldMetadataIdsByOptionValue)) {
    return [];
  }

  const isValidShape =
    isPlainObject(requiredFieldMetadataIdsByOptionValue) &&
    Object.values(requiredFieldMetadataIdsByOptionValue).every(
      (requiredFieldMetadataIds) =>
        Array.isArray(requiredFieldMetadataIds) &&
        requiredFieldMetadataIds.every(
          (requiredFieldMetadataId) =>
            typeof requiredFieldMetadataId === 'string',
        ),
    );

  if (isValidShape) {
    return [];
  }

  return [
    {
      code: FieldMetadataExceptionCode.INVALID_FIELD_INPUT,
      message:
        'settings.requiredFieldMetadataIdsByOptionValue must map option values to arrays of field metadata ids',
      userFriendlyMessage: msg`Required fields per option are invalid`,
      value: requiredFieldMetadataIdsByOptionValue,
    },
  ];
};
