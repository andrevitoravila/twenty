export type SelectOptionRequiredFieldsViolation = {
  selectFieldMetadataId: string;
  optionValue: string;
  missingFieldMetadataIds: string[];
};
