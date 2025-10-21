import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SingleLineInput from '@/components/SingleLineInput/SingleLineInput';
import BaseBottomSheet from '@/components/BaseBottomSheet';
import { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type BottomSheet from '@gorhom/bottom-sheet';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

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

const DropdownInput = ({ id, value, onChange, error, isDisabled, custom_type, options = [], prefix, suffix }: DropdownInputProps) => {
        const { theme } = useTheme();
        const { translate } = useLanguage();
        const { primaryColor } = useSelector((state: RootState) => state.settings);

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
        const isCustomSelected = showCustomInput;
        const sheetRef = useRef<BottomSheet>(null);

        const openSheet = useCallback(() => {
                if (!isDisabled) {
                        sheetRef.current?.expand();
                }
        }, [isDisabled]);

        const closeSheet = useCallback(() => {
                sheetRef.current?.close();
        }, []);

        const selectPlaceholder = useCallback(() => {
                setShowCustomInput(false);
                onChange(id, '', custom_type);
                closeSheet();
        }, [closeSheet, custom_type, id, onChange]);

        const selectCustom = useCallback(() => {
                setShowCustomInput(true);
                const nextValue = currentValue && !normalizedOptions.includes(currentValue) ? currentValue : '';
                onChange(id, nextValue, custom_type);
                closeSheet();
        }, [closeSheet, currentValue, custom_type, normalizedOptions, id, onChange]);

        const selectOption = useCallback(
                (option: string) => {
                        setShowCustomInput(false);
                        onChange(id, option, custom_type);
                        closeSheet();
                },
                [closeSheet, custom_type, id, onChange]
        );

        const placeholderLabel = translate(TranslationKeys.select);
        const customLabel = translate(TranslationKeys.enter_custom_value);

        const trimmedValue = currentValue.trim();
        const displayValue = showCustomInput ? trimmedValue : valueMatchesOption ? currentValue : trimmedValue;
        const labelToShow = displayValue.length > 0 ? displayValue : showCustomInput ? customLabel : placeholderLabel;
        const isPlaceholderDisplay = displayValue.length === 0;

        return (
                <View style={styles.container}>
                        <View style={styles.inputContainer}>
                                {prefix && (
                                        <View style={[styles.prefixSuffix, styles.prefixSuffixLeft, { backgroundColor: theme.screen.iconBg, borderColor: theme.screen.iconBg }]}>
                                                <Text style={[styles.prefixSuffixLabel, { color: theme.screen.text }]}>{prefix}</Text>
                                        </View>
                                )}
                                <TouchableOpacity
                                        style={[
                                                styles.selectorButton,
                                                {
                                                        backgroundColor: theme.screen.inputBg,
                                                        borderColor: theme.screen.iconBg,
                                                        opacity: isDisabled ? 0.6 : 1,
                                                },
                                                prefix && styles.selectorButtonWithPrefix,
                                                suffix && styles.selectorButtonWithSuffix,
                                        ]}
                                        activeOpacity={0.7}
                                        onPress={openSheet}
                                        disabled={isDisabled}
                                >
                                        <Text
                                                style={[
                                                        styles.selectorText,
                                                        {
                                                                color: isPlaceholderDisplay ? theme.screen.placeholder : theme.screen.text,
                                                        },
                                                        isPlaceholderDisplay && styles.placeholderText,
                                                ]}
                                                numberOfLines={1}
                                                ellipsizeMode="tail"
                                        >
                                                {labelToShow}
                                        </Text>
                                        <MaterialCommunityIcons name="chevron-down" size={22} color={theme.screen.icon} style={styles.chevronIcon} />
                                </TouchableOpacity>
                                {suffix && (
                                        <View style={[styles.prefixSuffix, styles.prefixSuffixRight, { backgroundColor: theme.screen.iconBg, borderColor: theme.screen.iconBg }]}>
                                                <Text style={[styles.prefixSuffixLabel, { color: theme.screen.text }]}>{suffix}</Text>
                                        </View>
                                )}
                        </View>
                        {isCustomSelected && (
                                <View style={styles.customInputContainer}>
                                        <SingleLineInput id={id} value={currentValue} onChange={onChange} error={error || ''} isDisabled={isDisabled} custom_type={custom_type} prefix={prefix} suffix={suffix} />
                                </View>
                        )}
                        {Boolean(error) && <Text style={styles.errorText}>{error}</Text>}
                        <BaseBottomSheet ref={sheetRef} enablePanDownToClose onClose={closeSheet}>
                                <BottomSheetScrollView style={{ backgroundColor: theme.sheet.sheetBg }} contentContainerStyle={styles.sheetContent}>
                                        <Text style={[styles.sheetHeading, { color: theme.sheet.text }]}>{placeholderLabel}</Text>
                                        <View style={styles.optionsList}>
                                                <TouchableOpacity
                                                        style={[
                                                                styles.optionRow,
                                                                {
                                                                        backgroundColor: !isCustomSelected && trimmedValue.length === 0 ? primaryColor : theme.screen.iconBg,
                                                                },
                                                        ]}
                                                        onPress={selectPlaceholder}
                                                >
                                                        <Text
                                                                style={[
                                                                        styles.optionLabel,
                                                                        {
                                                                                color: !isCustomSelected && trimmedValue.length === 0 ? theme.activeText : theme.screen.text,
                                                                        },
                                                                ]}
                                                        >
                                                                {placeholderLabel}
                                                        </Text>
                                                        <MaterialCommunityIcons
                                                                name={!isCustomSelected && trimmedValue.length === 0 ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                                size={24}
                                                                color={!isCustomSelected && trimmedValue.length === 0 ? theme.activeText : theme.screen.icon}
                                                        />
                                                </TouchableOpacity>
                                                <TouchableOpacity
                                                        style={[
                                                                styles.optionRow,
                                                                {
                                                                        backgroundColor: isCustomSelected ? primaryColor : theme.screen.iconBg,
                                                                },
                                                        ]}
                                                        onPress={selectCustom}
                                                >
                                                        <Text
                                                                style={[
                                                                        styles.optionLabel,
                                                                        {
                                                                                color: isCustomSelected ? theme.activeText : theme.screen.text,
                                                                        },
                                                                ]}
                                                        >
                                                                {customLabel}
                                                        </Text>
                                                        <MaterialCommunityIcons
                                                                name={isCustomSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                                size={24}
                                                                color={isCustomSelected ? theme.activeText : theme.screen.icon}
                                                        />
                                                </TouchableOpacity>
                                                {normalizedOptions.map(option => {
                                                        const isSelected = !isCustomSelected && currentValue === option;
                                                        return (
                                                                <TouchableOpacity
                                                                        key={option}
                                                                        style={[
                                                                                styles.optionRow,
                                                                                {
                                                                                        backgroundColor: isSelected ? primaryColor : theme.screen.iconBg,
                                                                                },
                                                                        ]}
                                                                        onPress={() => selectOption(option)}
                                                                >
                                                                        <Text
                                                                                style={[
                                                                                        styles.optionLabel,
                                                                                        {
                                                                                                color: isSelected ? theme.activeText : theme.screen.text,
                                                                                        },
                                                                                ]}
                                                                        >
                                                                                {option}
                                                                        </Text>
                                                                        <MaterialCommunityIcons
                                                                                name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                                                                size={24}
                                                                                color={isSelected ? theme.activeText : theme.screen.icon}
                                                                        />
                                                                </TouchableOpacity>
                                                        );
                                                })}
                                        </View>
                                </BottomSheetScrollView>
                        </BaseBottomSheet>
                </View>
        );
};

export default DropdownInput;
