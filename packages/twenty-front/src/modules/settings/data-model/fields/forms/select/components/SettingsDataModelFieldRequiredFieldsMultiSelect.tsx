import { type FieldMetadataItem } from '@/object-metadata/types/FieldMetadataItem';
import { MultiSelectControl } from '@/ui/input/components/MultiSelectControl';
import { SelectOptionIcon } from '@/ui/input/components/SelectOptionIcon';
import { DropdownContent } from '@/ui/layout/dropdown/components/DropdownContent';
import { DropdownRoot } from '@/ui/layout/dropdown/components/DropdownRoot';
import { GenericDropdownContentWidth } from '@/ui/layout/dropdown/constants/GenericDropdownContentWidth';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { isNonEmptyArray, isNonEmptyString } from '@sniptt/guards';
import { useState } from 'react';
import { Dropdown } from 'twenty-ui/components/navigation';
import { IconListSearch } from 'twenty-ui/icon';
import { useIcons } from 'twenty-ui/icon/provider';

type SettingsDataModelFieldRequiredFieldsMultiSelectProps = {
  dropdownId: string;
  ariaLabel: string;
  fieldMetadataItems: Pick<FieldMetadataItem, 'id' | 'label' | 'icon'>[];
  selectedFieldMetadataIds: string[];
  onChange: (selectedFieldMetadataIds: string[]) => void;
  disabled?: boolean;
};

export const SettingsDataModelFieldRequiredFieldsMultiSelect = ({
  dropdownId,
  ariaLabel,
  fieldMetadataItems,
  selectedFieldMetadataIds,
  onChange,
  disabled = false,
}: SettingsDataModelFieldRequiredFieldsMultiSelectProps) => {
  const { t } = useLingui();
  const { getIcon } = useIcons();
  const [searchInputValue, setSearchInputValue] = useState('');

  const options = fieldMetadataItems.map((fieldMetadataItem) => ({
    label: fieldMetadataItem.label,
    fieldMetadataId: fieldMetadataItem.id,
    Icon: getIcon(fieldMetadataItem.icon),
  }));

  const selectedOptions = options.filter(({ fieldMetadataId }) =>
    selectedFieldMetadataIds.includes(fieldMetadataId),
  );

  const matchingOptions = isNonEmptyString(searchInputValue)
    ? options.filter(({ label }) =>
        label.toLowerCase().includes(searchInputValue.toLowerCase()),
      )
    : options;

  const isDisabled = disabled || options.length === 0;

  const selectControl = (
    <MultiSelectControl
      selectedOptions={selectedOptions}
      fixedIcon={selectedOptions.length === 1 ? undefined : IconListSearch}
      fixedText={
        selectedOptions.length === 1
          ? undefined
          : selectedOptions.length === 0
            ? t`None`
            : plural(selectedOptions.length, {
                one: `# field`,
                other: `# fields`,
              })
      }
      isDisabled={isDisabled}
      selectSizeVariant="small"
    />
  );

  if (isDisabled) {
    return selectControl;
  }

  return (
    <DropdownRoot
      dropdownId={dropdownId}
      type="picker"
      onOpenChange={(open) => {
        if (!open) {
          setSearchInputValue('');
        }
      }}
    >
      <Dropdown.Trigger render={<div />} nativeButton={false}>
        {selectControl}
      </Dropdown.Trigger>
      <DropdownContent
        width={GenericDropdownContentWidth.Medium}
        align="end"
        aria-label={ariaLabel}
      >
        <Dropdown.Search
          value={searchInputValue}
          onValueChange={setSearchInputValue}
          placeholder={t`Search`}
          aria-label={t`Search`}
        />
        {isNonEmptyArray(matchingOptions) && <Dropdown.Separator />}
        {isNonEmptyArray(matchingOptions) && (
          <Dropdown.SelectionGroup
            aria-label={ariaLabel}
            multiple
            value={selectedFieldMetadataIds}
            onValueChange={onChange}
          >
            <Dropdown.Section scrollable>
              {matchingOptions.map((option) => (
                <Dropdown.OptionItem
                  key={option.fieldMetadataId}
                  value={option.fieldMetadataId}
                  startIcon={<SelectOptionIcon Icon={option.Icon} />}
                >
                  {option.label}
                </Dropdown.OptionItem>
              ))}
            </Dropdown.Section>
          </Dropdown.SelectionGroup>
        )}
      </DropdownContent>
    </DropdownRoot>
  );
};
