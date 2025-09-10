import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { Tooltip, TooltipContent, TooltipText } from '@gluestack-ui/themed';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import { useTheme } from '@/hooks/useTheme';
import { useLanguage } from '@/hooks/useLanguage';
import { iconLibraries } from '../Drawer/CustomDrawerContent';
import { formatFoodInformationValue, getImageUrl } from '@/constants/HelperFunctions';
import { getFoodAttributesTranslation } from '@/helper/resourceHelper';
import { useMyContrastColor } from '@/helper/colorHelper';
import styles from './styles';

interface AttributeItemProps {
  attr: any;
}

const AttributeItem: React.FC<AttributeItemProps> = ({ attr }) => {
  const { theme } = useTheme();
  const { language, selectedTheme: mode } = useSelector((state: RootState) => state.settings);
  const { translate } = useLanguage();

  let value;
  const prefix = attr?.food_attribute?.prefix || '';
  const suffix = attr?.food_attribute?.suffix || '';
  const status = attr?.food_attribute?.status;
  const full_width = attr?.food_attribute?.full_width;
  const background_color = attr?.food_attribute?.background_color || '';
  const image = attr?.food_attribute?.image_remote_url
    ? { uri: attr?.food_attribute?.image_remote_url }
    : { uri: getImageUrl(attr?.food_attribute?.image) };
  const label = attr?.food_attribute?.translations
    ? getFoodAttributesTranslation(attr?.food_attribute?.translations, language)
    : '';

  const iconParts = attr?.food_attribute?.icon_expo?.split(':') || [];
  const [library, name] = iconParts;
  const Icon = library && iconLibraries[library];

  const attributeIconParts = attr?.icon_value?.split(':') || [];
  const [attributeIconLibrary, attributeIconName] = attributeIconParts;
  const AttributeIcon = attributeIconLibrary && iconLibraries[attributeIconLibrary];
  const colorValue = attr?.color_value || theme.screen.text;

  if (attr?.number_value) {
    value = formatFoodInformationValue(attr?.number_value, suffix);
  } else if (attr?.string_value) {
    value = attr?.string_value + suffix;
  }
  if (prefix && value) {
    value = `${prefix} ${value}`;
  }

  const contrastColor = useMyContrastColor(background_color, theme, mode === 'dark');

  if ((label || value) && status === 'published') {
    return (
      <View
        style={{
          ...styles.averageNutrition,
          minWidth: full_width ? '100%' : 120,
        }}
      >
        <View style={styles.iconContainer}>
          {attr?.food_attribute?.icon_expo ? (
            <Tooltip placement="top"
              trigger={triggerProps => (
                <Pressable {...triggerProps}>
                  <Icon
                    name={name}
                    size={18}
                    color={background_color ? contrastColor : theme.screen.text}
                    style={{
                      backgroundColor: background_color,
                      borderRadius: 4,
                      padding: 2,
                    }}
                  />
                </Pressable>
              )}
            >
              <TooltipContent bg={theme.tooltip.background} py="$1" px="$2">
                <TooltipText fontSize="$sm" color={theme.tooltip.text}>
                  {`${translate(label)}`}
                </TooltipText>
              </TooltipContent>
            </Tooltip>
          ) : image ? (
            <Image
              source={image}
              style={[
                {
                  width: 24,
                  height: 24,
                  resizeMode: 'contain',
                },
                image?.uri && {
                  backgroundColor: background_color,
                  borderRadius: background_color ? 8 : 0,
                },
              ]}
            />
          ) : (
            <View style={{ width: 20 }} />
          )}
        </View>
        <View style={styles.nutritionDetails}>
          {value && (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Text
                style={{
                  ...styles.label,
                  color: theme.screen.text,
                }}
              >
                {value !== null && value !== undefined ? value : 'N/A'}
              </Text>
              {attr?.icon_value ? (
                <AttributeIcon name={attributeIconName} size={20} color={colorValue} />
              ) : (
                <View style={{ width: 20 }} />
              )}
            </View>
          )}
          <Text
            style={{
              ...styles.label,
              color: theme.screen.text,
            }}
          >
            {label}
          </Text>
        </View>
      </View>
    );
  }
  return null;
};

export default AttributeItem;

