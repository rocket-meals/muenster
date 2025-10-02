import React from 'react';
import { Appearance, Linking, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MarkdownIt from 'markdown-it';
import { darkTheme, lightTheme } from '@/styles/themes';
import RenderHtml, { CustomBlockRenderer, CustomMixedRenderer, CustomTextualRenderer, HTMLContentModel, HTMLElementModel } from 'react-native-render-html';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import ProjectButton from '../ProjectButton';
import { myContrastColor } from '@/helper/ColorHelper';
import { CommonSystemActionHelper } from '@/helper/SystemActionHelper';
import { UriScheme } from '@/constants/UriScheme';

export interface MyMarkdownProps {
	content: string;
	textColor?: string;
}

export const replaceLinebreaks = (sourceContent: string) => {
	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = sourceContent.replaceAll('<br/>', '\n');
		sourceContent = sourceContent.replaceAll('</br>', '\n');
		sourceContent = sourceContent.replaceAll('<br>', '\n');
		sourceContent = sourceContent.replaceAll('<p/>', '\n');
		sourceContent = sourceContent.replaceAll('</p>', '\n');
		sourceContent = sourceContent.replaceAll('<p>', '\n');
	}
	return sourceContent;
};

const MyMarkdown: React.FC<MyMarkdownProps> = ({ content, textColor: textColorProp }) => {
	const { primaryColor, selectedTheme } = useSelector((state: RootState) => state.settings);

	const colorScheme = Appearance.getColorScheme();
	const theme = selectedTheme === 'systematic' ? (colorScheme === 'dark' ? darkTheme : lightTheme) : selectedTheme === 'dark' ? darkTheme : lightTheme;

	const { width } = useWindowDimensions();
	const md = new MarkdownIt({ html: true });

        const defaultValidateLink = md.validateLink.bind(md);
        md.validateLink = (url: string | null | undefined) => {
                if (!url) {
                        console.log('[MyMarkdown] validateLink called with empty url');
                        return false;
                }

                const normalizedUrl = url.toLowerCase();
                const isGeoLink = normalizedUrl.startsWith(UriScheme.GEO);
                const isMapsLink = normalizedUrl.startsWith(UriScheme.MAPS);

                console.log('[MyMarkdown] validateLink evaluating url', {
                        url,
                        normalizedUrl,
                        isGeoLink,
                        isMapsLink,
                });

                if (isGeoLink || isMapsLink) {
                        return true;
                }

                const isValid = defaultValidateLink(url);
                console.log('[MyMarkdown] validateLink fallback result', { url, isValid });
                return isValid;
        };

	let sourceContent = content || '';
	const option_find_linebreaks = true;
	if (option_find_linebreaks) {
		sourceContent = replaceLinebreaks(sourceContent);
	}

        console.log('[MyMarkdown] Rendering markdown', {
                originalContentLength: content?.length ?? 0,
                processedContentLength: sourceContent.length,
                preview: sourceContent.slice(0, 1000),
        });

        const result = md.render(sourceContent);
        console.log('[MyMarkdown] Markdown render complete', {
                htmlLength: result.length,
        });
        const source = { html: result || '' };

	const fontSize = 16;
	const textColor = textColorProp ?? theme.sheet.text;
	const contrastColor = myContrastColor(primaryColor, theme, selectedTheme === 'dark');

	const tagsStyles = {
		blockquote: { fontStyle: 'italic' },
		td: { borderColor: 'gray', borderWidth: 1 },
		th: { borderColor: 'gray', borderWidth: 1 },
		a: { color: textColor },
	} as const;

	const customHTMLElementModels = {
		sub: HTMLElementModel.fromCustomModel({
			tagName: 'sub',
			contentModel: HTMLContentModel.textual,
		}),
		sup: HTMLElementModel.fromCustomModel({
			tagName: 'sup',
			contentModel: HTMLContentModel.textual,
		}),
	};

	const defaultTextProps = {
		selectable: true,
		color: textColor,
		fontSize,
		fontStyle: 'normal',
	};

	const customRenderers: Record<string, CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer> = {
		a: (props: any) => {
			const { href } = props.tnode.attributes;
			const { data } = props.tnode;
			const text = data || props.children[0]?.data;

			let finalHref = href;
                        const hrefLowerCase = href?.toLowerCase();

                        const parseCoordinatesFromUri = (uri: string, scheme: UriScheme) => {
                                const coordinateString = uri.slice(scheme.length);
                                const [coordinatePart] = coordinateString.split(/[;?]/);
                                const [latitudeRaw, longitudeRaw] = coordinatePart.split(',');
                                const latitude = parseFloat(latitudeRaw?.trim() ?? '');
                                const longitude = parseFloat(longitudeRaw?.trim() ?? '');

                                console.log('[MyMarkdown] Parsing coordinates from URI', {
                                        uri,
                                        scheme,
                                        latitudeRaw,
                                        longitudeRaw,
                                        latitude,
                                        longitude,
                                });

                                if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
                                        return null;
                                }

                                return { latitude, longitude };
                        };

                        if (hrefLowerCase?.startsWith(UriScheme.GEO)) {
                                const coordinates = parseCoordinatesFromUri(hrefLowerCase, UriScheme.GEO);
                                if (coordinates) {
                                        finalHref = CommonSystemActionHelper.getGoogleMapsUrl(
                                                coordinates.latitude,
                                                coordinates.longitude,
                                        );
                                }
                        } else if (hrefLowerCase?.startsWith(UriScheme.MAPS)) {
                                const coordinates = parseCoordinatesFromUri(hrefLowerCase, UriScheme.MAPS);
                                if (coordinates) {
                                        finalHref = CommonSystemActionHelper.getGoogleMapsUrl(
                                                coordinates.latitude,
                                                coordinates.longitude,
                                        );
                                }
                        }

			const handlePress = () => {
				if (finalHref) {
					Linking.openURL(finalHref).catch(err => console.error('Failed to open URL:', err));
				}
			};

			let iconLeft = <FontAwesome6 name="arrow-up-right-from-square" size={20} color={contrastColor} />;

                        if (finalHref?.startsWith(UriScheme.TEL)) {
                                iconLeft = <FontAwesome6 name="phone" size={20} color={contrastColor} />;
                        } else if (finalHref?.startsWith(UriScheme.MAILTO)) {
                                iconLeft = <MaterialCommunityIcons name="email" size={24} color={contrastColor} />;
                        } else if (hrefLowerCase?.startsWith(UriScheme.GEO) || hrefLowerCase?.startsWith(UriScheme.MAPS)) {
                                iconLeft = <Ionicons name="navigate" size={24} color={contrastColor} />;
                        }

                        console.log('[MyMarkdown] Rendering link', {
                                href,
                                hrefLowerCase,
                                finalHref,
                                text,
                        });

			return <ProjectButton text={text} onPress={handlePress} iconLeft={iconLeft} />;
		},
		sub: (props: any) => {
			const { data } = props.tnode;
			const text = data || props.children[0]?.data;
			return <Text style={{ fontSize, verticalAlign: 'sub', color: textColor }}>{text}</Text>;
		},
		sup: (props: any) => {
			const { data } = props.tnode;
			const text = data || props.children[0]?.data;
			return <Text style={{ fontSize, verticalAlign: 'super', color: textColor }}>{text}</Text>;
		},
	};

	return (
		<View>
			<RenderHtml
				contentWidth={width}
				// @ts-ignore
				baseStyle={defaultTextProps}
				renderers={customRenderers}
				defaultTextProps={defaultTextProps}
				customHTMLElementModels={customHTMLElementModels}
				tagsStyles={tagsStyles}
				source={source}
			/>
		</View>
	);
};

export default MyMarkdown;
