import React, { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { MarkingLabelProps } from './types';

import { SET_MARKING_DETAILS } from '@/redux/Types/types';
import PermissionModal from '../PermissionModal/PermissionModal';
import { useTheme } from '@/hooks/useTheme';
import { isWeb } from '@/constants/Constants';
import styles from './styles';
import { getTextFromTranslation } from '@/helper/resourceHelper';
import { DatabaseTypes } from 'repo-depkit-common';
import MarkingIcon from '../MarkingIcon';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { useLanguage } from '@/hooks/useLanguage';
import { TranslationKeys } from '@/locales/keys';
import { RootState } from '@/redux/reducer';

const MarkingLabels: React.FC<MarkingLabelProps> = ({ markingId, handleMenuSheet, size = 30 }) => {
	const { theme } = useTheme();
	const dispatch = useDispatch();
	const { translate } = useLanguage();
	const [warning, setWarning] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const likeLoading = false;
	const dislikeLoading = false;
	const { primaryColor, language, appSettings, selectedTheme: mode } = useSelector((state: RootState) => state.settings);

	const { profile } = useSelector((state: RootState) => state.authReducer);
	const foods_area_color = appSettings?.foods_area_color ? appSettings?.foods_area_color : primaryColor;
	const { markings } = useSelector((state: RootState) => state.food);
	const marking = markings?.find((mark: any) => mark.id === markingId);
	const ownMarking = profile?.markings?.find((mark: any) => mark.markings_id === markingId);

	const openMarkingLabel = (marking: DatabaseTypes.Markings) => {
		if (handleMenuSheet) {
			dispatch({
				type: SET_MARKING_DETAILS,
				payload: marking,
			});
			handleMenuSheet();
		}
	};

	// Early return AFTER all hooks have been called
	if (!marking) return null;

	const markingText = getTextFromTranslation(marking?.translations, language);
	const iconSize = isWeb ? 24 : 22;

	return (
		<View style={styles.row}>
			<View style={styles.col}>
				{handleMenuSheet ? (
					<Tooltip
						placement="top"
						trigger={triggerProps => (
							<Pressable {...triggerProps} onPress={() => openMarkingLabel(marking)} onHoverIn={() => setShowTooltip(true)} onHoverOut={() => setShowTooltip(false)}>
								<MarkingIcon marking={marking} size={size} />
							</Pressable>
						)}
					>
						<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
							<TooltipText fontSize="$sm" color={theme.tooltip.text}>
								{`${markingText}`}
							</TooltipText>
						</TooltipContent>
					</Tooltip>
				) : (
					<MarkingIcon marking={marking} size={size} />
				)}
				<Tooltip
					placement="top"
					isOpen={showTooltip}
					trigger={triggerProps => (
						<Pressable {...triggerProps} onHoverIn={() => setShowTooltip(true)} onHoverOut={() => setShowTooltip(false)} style={styles.labelContainer}>
							<Text
								style={{
									...styles.label,
									color: theme.screen.text,
									fontSize: isWeb ? 18 : 14,
									textAlignVertical: 'center',
								}}
							>
								{markingText}
							</Text>
						</Pressable>
					)}
				>
					<TooltipContent
						bg={theme.tooltip.background}
						py="$1"
						px="$2"
						left="100%"
						transform={[{ translateX: -50 }]} // Adjust to truly center it
					>
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{`${translate(TranslationKeys.markings)}: ${markingText}`}
						</TooltipText>
					</TooltipContent>
				</Tooltip>
			</View>
			{/* REACTION SIDE */}

			<View style={styles.col2}>
				<Tooltip
					placement="top"
					trigger={triggerProps => (
						<Pressable onHoverIn={() => setShowTooltip(true)} onHoverOut={() => setShowTooltip(false)} style={styles.likeButton} {...triggerProps} onPress={() => handleUpdateMarking(true)}>
							{likeLoading ? <ActivityIndicator size={25} color={foods_area_color} /> : <MaterialCommunityIcons name={ownMarking?.like ? 'thumb-up' : 'thumb-up-outline'} size={iconSize} color={ownMarking?.like ? foods_area_color : theme.screen.icon} />}
						</Pressable>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{`${translate(TranslationKeys.i_like_that)}: ${translate(ownMarking?.like ? TranslationKeys.active : TranslationKeys.inactive)}: ${translate(TranslationKeys.markings)}: ${markingText}`}
						</TooltipText>
					</TooltipContent>
				</Tooltip>
				<Tooltip
					placement="top"
					trigger={triggerProps => (
						<Pressable onHoverIn={() => setShowTooltip(true)} onHoverOut={() => setShowTooltip(false)} {...triggerProps} style={styles.dislikeButton} {...triggerProps} onPress={() => handleUpdateMarking(false)}>
							{dislikeLoading ? <ActivityIndicator size={25} color={foods_area_color} /> : <MaterialCommunityIcons name={ownMarking?.like === false ? 'thumb-down' : 'thumb-down-outline'} size={iconSize} color={ownMarking?.like === false ? foods_area_color : theme.screen.icon} />}
						</Pressable>
					)}
				>
					<TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
						<TooltipText fontSize="$sm" color={theme.tooltip.text}>
							{`${translate(TranslationKeys.i_dislike_that)}: ${translate(ownMarking?.like === false ? TranslationKeys.active : TranslationKeys.inactive)}: ${translate(TranslationKeys.markings)}: ${markingText}`}
						</TooltipText>
					</TooltipContent>
				</Tooltip>
			</View>
			<PermissionModal isVisible={warning} setIsVisible={setWarning} />
		</View>
	);
};

export default MarkingLabels;
