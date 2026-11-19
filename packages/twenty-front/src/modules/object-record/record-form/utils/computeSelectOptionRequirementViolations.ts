import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { type ValidationRuleViolation } from '@/validation-rules/types/ValidationRuleViolation';
import { t } from '@lingui/core/macro';
import { computeSelectOptionRequiredFieldsViolations } from 'twenty-shared/utils';

export const SELECT_OPTION_REQUIREMENT_RULE_ID_PREFIX =
  'select-option-requirement';

export const computeSelectOptionRequirementViolations = ({
  fieldMetadataItems,
  previousRecord,
  draftRecord,
}: {
  fieldMetadataItems: Pick<
    FieldMetadataItem,
    | 'id'
    | 'name'
    | 'type'
    | 'isActive'
    | 'isSystem'
    | 'isUIEditable'
    | 'settings'
    | 'options'
  >[];
  previousRecord: Partial<ObjectRecord>;
  draftRecord: Partial<ObjectRecord>;
}): ValidationRuleViolation[] =>
  computeSelectOptionRequiredFieldsViolations({
    fieldMetadataItems,
    previousRecord,
    nextRecord: draftRecord,
  }).flatMap(
    ({ selectFieldMetadataId, optionValue, missingFieldMetadataIds }) => {
      const optionLabel =
        fieldMetadataItems
          .find(({ id }) => id === selectFieldMetadataId)
          ?.options?.find(({ value }) => value === optionValue)?.label ??
        optionValue;

      return missingFieldMetadataIds.map((fieldMetadataId) => ({
        ruleId: `${SELECT_OPTION_REQUIREMENT_RULE_ID_PREFIX}:${selectFieldMetadataId}:${optionValue}`,
        message: t`Required to move to ${optionLabel}`,
        fieldMetadataId,
      }));
    },
  );
