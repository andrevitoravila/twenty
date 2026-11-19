import {
  type FieldMetadataItem,
  type FieldMetadataItemOption,
} from '@/object-metadata/types/FieldMetadataItem';
import { SettingsOptionCardContentSelect } from '@/settings/components/SettingsOptions/SettingsOptionCardContentSelect';
import { StyledSettingsSelectGroup } from '@/settings/components/SettingsOptions/StyledSettingsSelectGroup';
import { SettingsDataModelFieldRequiredFieldsMultiSelect } from '@/settings/data-model/fields/forms/select/components/SettingsDataModelFieldRequiredFieldsMultiSelect';
import { SELECT_OPTION_REQUIRED_FIELDS_CONTROL_WIDTH } from '@/settings/data-model/fields/forms/select/constants/SelectOptionRequiredFieldsControlWidth';
import { buildSelectOptionRequiredFieldsSettings } from '@/settings/data-model/fields/forms/select/utils/buildSelectOptionRequiredFieldsSettings';
import { getSelectOptionRequirableFieldMetadataItems } from '@/settings/data-model/fields/forms/select/utils/getSelectOptionRequirableFieldMetadataItems';
import { splitSelectOptionsByIsActive } from '@/settings/data-model/fields/forms/select/utils/splitSelectOptionsByIsActive';
import { useLingui } from '@lingui/react/macro';
import { useFormContext } from 'react-hook-form';
import { type FieldMetadataSelectSettings } from 'twenty-shared/types';
import { getSelectOptionRequiredFieldMetadataIds } from 'twenty-shared/utils';
import { Tag } from 'twenty-ui/primitives/data-display';
import { Card } from 'twenty-ui/primitives/surfaces';

type SettingsDataModelFieldSelectRequiredFieldsFormProps = {
  selectFieldMetadataItem: Pick<FieldMetadataItem, 'id' | 'options'>;
  objectFieldMetadataItems: FieldMetadataItem[];
  disabled?: boolean;
};

type SelectRequiredFieldsFormValues = {
  options?: FieldMetadataItemOption[];
  settings?: FieldMetadataSelectSettings | null;
};

export const SettingsDataModelFieldSelectRequiredFieldsForm = ({
  selectFieldMetadataItem,
  objectFieldMetadataItems,
  disabled = false,
}: SettingsDataModelFieldSelectRequiredFieldsFormProps) => {
  const { t } = useLingui();
  const { watch, setValue } = useFormContext<SelectRequiredFieldsFormValues>();

  const settings = watch('settings');
  const { activeOptions } = splitSelectOptionsByIsActive(
    watch('options') ?? selectFieldMetadataItem.options ?? [],
  );

  const requirableFieldMetadataItems =
    getSelectOptionRequirableFieldMetadataItems({
      fieldMetadataItems: objectFieldMetadataItems,
      selectFieldMetadataId: selectFieldMetadataItem.id,
    });

  const handleRequiredFieldsChange = ({
    optionValue,
    requiredFieldMetadataIds,
  }: {
    optionValue: string;
    requiredFieldMetadataIds: string[];
  }) => {
    setValue(
      'settings',
      buildSelectOptionRequiredFieldsSettings({
        settings,
        activeOptionValues: activeOptions.map(({ value }) => value),
        optionValue,
        requiredFieldMetadataIds,
      }),
      { shouldDirty: true },
    );
  };

  return (
    <Card.Root>
      <StyledSettingsSelectGroup
        controlWidth={SELECT_OPTION_REQUIRED_FIELDS_CONTROL_WIDTH}
      >
        {activeOptions.map((option, index) => (
          <SettingsOptionCardContentSelect
            key={option.id}
            title={<Tag color={option.color}>{option.label}</Tag>}
            divider={index < activeOptions.length - 1}
          >
            <SettingsDataModelFieldRequiredFieldsMultiSelect
              dropdownId={`select-option-required-fields-${option.id}`}
              ariaLabel={t`Required fields for ${option.label}`}
              fieldMetadataItems={requirableFieldMetadataItems}
              selectedFieldMetadataIds={getSelectOptionRequiredFieldMetadataIds(
                { settings, optionValue: option.value },
              )}
              onChange={(requiredFieldMetadataIds) =>
                handleRequiredFieldsChange({
                  optionValue: option.value,
                  requiredFieldMetadataIds,
                })
              }
              disabled={disabled}
            />
          </SettingsOptionCardContentSelect>
        ))}
      </StyledSettingsSelectGroup>
    </Card.Root>
  );
};
