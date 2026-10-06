import { StyleSheet, View } from 'react-native';

import { ChoiceChips } from '@/components/ChoiceChips';
import { DateStepper } from '@/components/DateStepper';
import { DATE_RANGE_PRESET_LABELS, DATE_RANGE_PRESETS, type DateRangePreset } from '@/constants/dateRange';
import { SPACE_MD } from '@/constants/layout';
import { changeRangeEnd, type DateRange } from '@/domain/dateRange';

type DateRangeFilterProps = {
  preset: DateRangePreset;
  customRange: DateRange;
  onChangePreset: (preset: DateRangePreset) => void;
  onChangeCustomRange: (range: DateRange) => void;
};

export function DateRangeFilter({ preset, customRange, onChangePreset, onChangeCustomRange }: DateRangeFilterProps) {
  return (
    <View style={styles.container}>
      <ChoiceChips
        label="Period"
        options={DATE_RANGE_PRESETS}
        getLabel={(option) => DATE_RANGE_PRESET_LABELS[option]}
        value={preset}
        onChange={onChangePreset}
      />
      {preset === 'custom' ? (
        <>
          <DateStepper
            label="From"
            value={customRange.from}
            onChange={(value) => onChangeCustomRange(changeRangeEnd(customRange, 'from', value))}
          />
          <DateStepper
            label="To"
            value={customRange.to}
            onChange={(value) => onChangeCustomRange(changeRangeEnd(customRange, 'to', value))}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACE_MD,
  },
});
