import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { isFieldMetadataEligibleForSelectOptionRequirement } from 'twenty-shared/utils';

export const getSelectOptionRequirableFieldMetadataItems = <
  TFieldMetadataItem extends Pick<
    FieldMetadataItem,
    | 'id'
    | 'name'
    | 'label'
    | 'type'
    | 'isActive'
    | 'isSystem'
    | 'isUIEditable'
    | 'settings'
  >,
>({
  fieldMetadataItems,
  selectFieldMetadataId,
}: {
  fieldMetadataItems: TFieldMetadataItem[];
  selectFieldMetadataId: string;
}): TFieldMetadataItem[] =>
  fieldMetadataItems
    .filter(
      (fieldMetadataItem) =>
        fieldMetadataItem.id !== selectFieldMetadataId &&
        isFieldMetadataEligibleForSelectOptionRequirement({
          fieldName: fieldMetadataItem.name,
          fieldType: fieldMetadataItem.type,
          isActive: fieldMetadataItem.isActive === true,
          isSystem: fieldMetadataItem.isSystem === true,
          isUIEditable: fieldMetadataItem.isUIEditable !== false,
          relationType:
            fieldMetadataItem.settings &&
            'relationType' in fieldMetadataItem.settings
              ? fieldMetadataItem.settings.relationType
              : undefined,
        }),
    )
    .sort((first, second) => first.label.localeCompare(second.label));
