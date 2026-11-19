import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { getFieldMetadataItemGqlFieldName } from '@/object-metadata/utils/getFieldMetadataItemGqlFieldName';
import { type ObjectRecord } from '@/object-record/types/ObjectRecord';
import { FieldMetadataType } from 'twenty-shared/types';
import {
  getSelectOptionRequiredFieldMetadataIds,
  isDefined,
} from 'twenty-shared/utils';

export const computeSelectOptionRequiredFieldPaths = ({
  fieldMetadataItems,
  updateInput,
}: {
  fieldMetadataItems: Pick<
    FieldMetadataItem,
    'id' | 'name' | 'type' | 'relation' | 'settings'
  >[];
  updateInput: Partial<ObjectRecord>;
}): string[] => {
  const requiredFieldMetadataIds = fieldMetadataItems.flatMap(
    (fieldMetadataItem) => {
      const optionValue = updateInput[fieldMetadataItem.name];

      return fieldMetadataItem.type === FieldMetadataType.SELECT &&
        typeof optionValue === 'string'
        ? getSelectOptionRequiredFieldMetadataIds({
            settings: fieldMetadataItem.settings,
            optionValue,
          })
        : [];
    },
  );

  return [
    ...new Set(
      requiredFieldMetadataIds
        .map((fieldMetadataId) =>
          fieldMetadataItems.find(({ id }) => id === fieldMetadataId),
        )
        .filter(isDefined)
        .map(getFieldMetadataItemGqlFieldName),
    ),
  ];
};
