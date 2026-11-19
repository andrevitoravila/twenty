import { FieldMetadataType, type ObjectRecord } from 'twenty-shared/types';
import {
  computeSelectOptionRequiredFieldsViolations,
  getSelectOptionRequiredFieldMetadataIds,
  isDefined,
  isPlainObject,
  type SelectOptionRequirementFieldMetadata,
} from 'twenty-shared/utils';

type LabeledFieldMetadata = SelectOptionRequirementFieldMetadata & {
  label: string;
};

export type SelectOptionRequiredFieldsUpdateViolation = {
  recordId: string;
  selectFieldName: string;
  optionValue: string;
  missingFieldNames: string[];
  missingFieldLabels: string[];
};

export const getSelectFieldNamesGatedByUpdateData = ({
  fieldMetadataItems,
  data,
}: {
  fieldMetadataItems: SelectOptionRequirementFieldMetadata[];
  data: Partial<ObjectRecord>;
}): string[] =>
  fieldMetadataItems
    .filter(
      (fieldMetadataItem) =>
        fieldMetadataItem.type === FieldMetadataType.SELECT &&
        typeof data[fieldMetadataItem.name] === 'string' &&
        getSelectOptionRequiredFieldMetadataIds({
          settings: fieldMetadataItem.settings,
          optionValue: data[fieldMetadataItem.name] as string,
        }).length > 0,
    )
    .map((fieldMetadataItem) => fieldMetadataItem.name);

// Composite inputs can be partial (e.g. only amountMicros), so they are merged
// onto the stored value instead of replacing it
const applyUpdateDataToRecord = (
  record: ObjectRecord,
  data: Partial<ObjectRecord>,
): Record<string, unknown> =>
  Object.fromEntries([
    ...Object.entries(record),
    ...Object.entries(data).map(([fieldName, value]) => [
      fieldName,
      isPlainObject(value) && isPlainObject(record[fieldName])
        ? { ...record[fieldName], ...value }
        : value,
    ]),
  ]);

export const computeSelectOptionRequiredFieldsUpdateViolations = ({
  fieldMetadataItems,
  recordsBeforeUpdate,
  data,
}: {
  fieldMetadataItems: LabeledFieldMetadata[];
  recordsBeforeUpdate: ObjectRecord[];
  data: Partial<ObjectRecord>;
}): SelectOptionRequiredFieldsUpdateViolation[] => {
  const fieldMetadataItemById = new Map(
    fieldMetadataItems.map((fieldMetadataItem) => [
      fieldMetadataItem.id,
      fieldMetadataItem,
    ]),
  );

  return recordsBeforeUpdate.flatMap((recordBeforeUpdate) =>
    computeSelectOptionRequiredFieldsViolations({
      fieldMetadataItems,
      previousRecord: recordBeforeUpdate,
      nextRecord: applyUpdateDataToRecord(recordBeforeUpdate, data),
    }).map((violation) => {
      const missingFieldMetadataItems = violation.missingFieldMetadataIds
        .map((fieldMetadataId) => fieldMetadataItemById.get(fieldMetadataId))
        .filter(isDefined);

      return {
        recordId: recordBeforeUpdate.id,
        selectFieldName:
          fieldMetadataItemById.get(violation.selectFieldMetadataId)?.name ??
          '',
        optionValue: violation.optionValue,
        missingFieldNames: missingFieldMetadataItems.map(({ name }) => name),
        missingFieldLabels: missingFieldMetadataItems.map(({ label }) => label),
      };
    }),
  );
};
