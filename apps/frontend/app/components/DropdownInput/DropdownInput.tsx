import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import styles from './styles';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import SingleLineInput from '@/components/SingleLineInput/SingleLineInput';
import BaseBottomModal from '@/components/BaseBottomModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';

const ensureStringArray = (options: string[]): string[] => {
	const uniqueValues = new Set<string>();
	options.forEach(option => {
		if (option && option.trim().length > 0) {
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
	allowCustomValues?: boolean;
};

const DropdownInput = ({ id, value, onChange, error, isDisabled, custom_type, options = [], prefix, suffix, allowCustomValues = true }: DropdownInputProps) => {
	const { theme } = useTheme();
	const { translate } = useLanguage();
	const { primaryColor } = useSelector((state: RootState) => state.settings);

	const normalizedOptions = useMemo(() => ensureStringArray(options), [options]);

	const currentValue = typeof value === 'string' ? value : '';
	const [showCustomInput, setShowCustomInput] = useState(() => {
		if (currentValue.trim().length === 0) return false;
		return allowCustomValues ? !normalizedOptions.includes(currentValue) : false;
	});

	useEffect(() => {
		if (currentValue.trim().length > 0) {
			setShowCustomInput(allowCustomValues ? !normalizedOptions.includes(currentValue) : false);
		} else if (normalizedOptions.includes(currentValue)) {
			setShowCustomInput(false);
		}
	}, [currentValue, normalizedOptions, allowCustomValues]);

	const valueMatchesOption = normalizedOptions.includes(currentValue);
	const isCustomSelected = showCustomInput;

	const [isModalVisible, setIsModalVisible] = useState(false);

	const openSheet = useCallback(() => {
		if (!isDisabled) {
			setIsModalVisible(true);
		}
	}, [isDisabled]);

	const closeSheet = useCallback(() => {
		setIsModalVisible(false);
	}, []);

	const selectPlaceholder = useCallback(() => {
		setShowCustomInput(false);
		onChange(id, '', custom_type);
		closeSheet();
	}, [closeSheet, custom_type, id, onChange]);

	const selectCustom = useCallback(() => {
		if (!allowCustomValues) return;
		setShowCustomInput(true);
		// keep modal open so user can type directly
		const nextValue = currentValue && !normalizedOptions.includes(currentValue) ? currentValue : '';
		onChange(id, nextValue, custom_type);
		// don't closeSheet();
	}, [allowCustomValues, currentValue, normalizedOptions, custom_type, id, onChange]);

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
							backgroundColor: theme.sheet.inputBg,
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
			{Boolean(error) && <Text style={styles.errorText}>{error}</Text>}

			<BaseBottomModal visible={isModalVisible} onClose={closeSheet} title={placeholderLabel}>
				<View style={[styles.sheetContent, { backgroundColor: theme.sheet.sheetBg }]}>
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
								{translate(TranslationKeys.deselect)}
							</Text>
							<MaterialCommunityIcons name={!isCustomSelected && trimmedValue.length === 0 ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={!isCustomSelected && trimmedValue.length === 0 ? theme.activeText : theme.screen.icon} />
						</TouchableOpacity>
						{isCustomSelected && (
							<View style={{ width: '100%', marginBottom: 12 }}>
								<SingleLineInput id={id} value={currentValue} onChange={onChange} error={error || ''} isDisabled={isDisabled} custom_type={custom_type} prefix={prefix} suffix={suffix} autoFocus={true} />
							</View>
						)}
						{!isCustomSelected && allowCustomValues && (
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
								<MaterialCommunityIcons name={isCustomSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={isCustomSelected ? theme.activeText : theme.screen.icon} />
							</TouchableOpacity>
						)}
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
									<MaterialCommunityIcons name={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'} size={24} color={isSelected ? theme.activeText : theme.screen.icon} />
								</TouchableOpacity>
							);
						})}
					</View>
				</View>
			</BaseBottomModal>
		</View>
	);
};

export default DropdownInput;
