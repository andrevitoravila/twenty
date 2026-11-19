import { FieldMetadataType, type RelationType } from '@/types';
import { isFieldMetadataEligibleForRecordForm } from '@/utils/fieldMetadata/isFieldMetadataEligibleForRecordForm';

// A boolean always holds a value and a morph relation has no single join column to check
const NON_REQUIRABLE_FIELD_TYPES: readonly FieldMetadataType[] = [
  FieldMetadataType.BOOLEAN,
  FieldMetadataType.MORPH_RELATION,
];

export const isFieldMetadataEligibleForSelectOptionRequirement = ({
  fieldName,
  fieldType,
  isActive,
  isSystem,
  isUIEditable,
  relationType,
}: {
  fieldName: string;
  fieldType: FieldMetadataType;
  isActive: boolean;
  isSystem: boolean;
  isUIEditable: boolean;
  relationType?: RelationType | null;
}): boolean =>
  !NON_REQUIRABLE_FIELD_TYPES.includes(fieldType) &&
  isFieldMetadataEligibleForRecordForm({
    fieldName,
    fieldType,
    isActive,
    isSystem,
    isUIEditable,
    relationType,
  });
