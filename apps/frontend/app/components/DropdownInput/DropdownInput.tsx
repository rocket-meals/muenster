import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SingleLineInput from '@/components/SingleLineInput/SingleLineInput';

const CUSTOM_OPTION_VALUE = '__custom__';
const PLACEHOLDER_VALUE = '__placeholder__';

const ensureStringArray = (options: string[]): string[] => {
        const uniqueValues = new Set<string>();
        options.forEach(option => {
                if (typeof option === 'string' && option.trim().length > 0) {
                        uniqueValues.add(option.trim());
                }
        });
        return Array.from(uniqueValues);
};

type DropdownInputProps = {
        id: string;
        value: string | null | undefined;
        onChange: (id: string, value: string, custom_type: string) => void;
        error?: string;
        isDisabled: boolean;
        custom_type: string;
        options?: string[];
        prefix?: string | null;
        suffix?: string | null;
};

const DropdownInput = ({
        id,
        value,
        onChange,
        error,
        isDisabled,
        custom_type,
        options = [],
        prefix,
        suffix,
}: DropdownInputProps) => {
        const { theme } = useTheme();
        const { translate } = useLanguage();

        const normalizedOptions = useMemo(() => ensureStringArray(options), [options]);

        const currentValue = typeof value === 'string' ? value : '';
        const [showCustomInput, setShowCustomInput] = useState(() => {
                if (currentValue.trim().length === 0) {
                        return false;
                }

                return !normalizedOptions.includes(currentValue);
        });

        useEffect(() => {
                if (currentValue.trim().length > 0) {
                        setShowCustomInput(!normalizedOptions.includes(currentValue));
                } else if (normalizedOptions.includes(currentValue)) {
                        setShowCustomInput(false);
                }
        }, [currentValue, normalizedOptions]);

        const valueMatchesOption = normalizedOptions.includes(currentValue);
        const selectedValue = showCustomInput ? CUSTOM_OPTION_VALUE : valueMatchesOption ? currentValue : PLACEHOLDER_VALUE;
        const isCustomSelected = showCustomInput;

        const handlePickerChange = (itemValue: string) => {
                if (itemValue === CUSTOM_OPTION_VALUE) {
                        setShowCustomInput(true);
                        const nextValue = currentValue && !normalizedOptions.includes(currentValue) ? currentValue : '';
                        onChange(id, nextValue, custom_type);
                        return;
                }

                if (itemValue === PLACEHOLDER_VALUE) {
                        setShowCustomInput(false);
                        onChange(id, '', custom_type);
                        return;
                }

                setShowCustomInput(false);
                onChange(id, itemValue, custom_type);
        };

        return (
                <View style={styles.container}>
                        <View style={styles.inputContainer}>
                                {prefix && (
                                        <View
                                                style={[
                                                        styles.prefixSuffix,
                                                        styles.prefixSuffixLeft,
                                                        { backgroundColor: theme.screen.iconBg, borderColor: theme.screen.iconBg },
                                                ]}
                                        >
                                                <Text style={[styles.prefixSuffixLabel, { color: theme.screen.text }]}>{prefix}</Text>
                                        </View>
                                )}
                                <View
                                        style={[
                                                styles.pickerWrapper,
                                                {
                                                        backgroundColor: theme.screen.inputBg,
                                                        borderColor: theme.screen.iconBg,
                                                },
                                                prefix || suffix ? styles.pickerWrapperWithAffix : styles.pickerWrapperFull,
                                        ]}
                                >
                                        <Picker
                                                enabled={!isDisabled}
                                                selectedValue={selectedValue}
                                                onValueChange={handlePickerChange}
                                                style={[styles.picker, { color: theme.screen.text }]}
                                                dropdownIconColor={theme.screen.text}
                                        >
                                                <Picker.Item label={translate(TranslationKeys.enter_custom_value)} value={CUSTOM_OPTION_VALUE} />
                                                <Picker.Item label={translate(TranslationKeys.select)} value={PLACEHOLDER_VALUE} />
                                                {normalizedOptions.map(option => (
                                                        <Picker.Item key={option} label={option} value={option} />
                                                ))}
                                        </Picker>
                                </View>
                                {suffix && (
                                        <View
                                                style={[
                                                        styles.prefixSuffix,
                                                        styles.prefixSuffixRight,
                                                        { backgroundColor: theme.screen.iconBg, borderColor: theme.screen.iconBg },
                                                ]}
                                        >
                                                <Text style={[styles.prefixSuffixLabel, { color: theme.screen.text }]}>{suffix}</Text>
                                        </View>
                                )}
                        </View>
                        {isCustomSelected && (
                                <View style={styles.customInputContainer}>
                                        <SingleLineInput
                                                id={id}
                                                value={currentValue}
                                                onChange={onChange}
                                                error={error || ''}
                                                isDisabled={isDisabled}
                                                custom_type={custom_type}
                                                prefix={prefix}
                                                suffix={suffix}
                                        />
                                </View>
                        )}
                        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
                </View>
        );
};

export default DropdownInput;
