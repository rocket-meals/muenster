import React from 'react';
import { Appearance, Linking, Text, useWindowDimensions, View } from 'react-native';
import { FontAwesome6, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import MarkdownIt from 'markdown-it';
import { darkTheme, lightTheme } from '@/styles/themes';
import RenderHtml, {
	CustomBlockRenderer,
	CustomMixedRenderer,
	CustomTextualRenderer,
	HTMLContentModel,
	HTMLElementModel,
	defaultSystemFonts,
} from 'react-native-render-html';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/reducer';
import ProjectButton from '../ProjectButton';
import { myContrastColor } from '@/helper/ColorHelper';
import { UriScheme } from '@/constants/UriScheme';
import { resolveLocationHref } from '@/helper/MarkdownLinkHelper';

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

const MARKDOWN_SYSTEM_FONTS = Array.from(
	new Set([
		...defaultSystemFonts,
		'Poppins_300Light',
		'Poppins_400Regular',
		'Poppins_500Medium',
		'Poppins_600SemiBold',
		'Poppins_700Bold',
	]),
);

const MyMarkdown: React.FC<MyMarkdownProps> = ({ content, textColor: textColorProp }) => {
	const { primaryColor, selectedTheme } = useSelector((state: RootState) => state.settings);

	const colorScheme = Appearance.getColorScheme();
	const theme = selectedTheme === 'systematic' ? (colorScheme === 'dark' ? darkTheme : lightTheme) : selectedTheme === 'dark' ? darkTheme : lightTheme;

	const { width } = useWindowDimensions();
	const md = new MarkdownIt({ html: true });

	const defaultValidateLink = md.validateLink.bind(md);
	const defaultNormalizeLink = md.normalizeLink.bind(md);
	md.validateLink = (url: string | null | undefined) => {
		if (!url) {
			console.log('[MyMarkdown] validateLink called with empty url');
			return false;
		}

		const trimmedUrl = url.trim();
		if (!trimmedUrl) {
			console.log('[MyMarkdown] validateLink called with whitespace url');
			return false;
		}

		const normalizedUrl = trimmedUrl.toLowerCase();
		const isGeoLink = normalizedUrl.startsWith(UriScheme.GEO);
		const isMapsLink = normalizedUrl.startsWith(UriScheme.MAPS);

		console.log('[MyMarkdown] validateLink evaluating url', {
			url: trimmedUrl,
			normalizedUrl,
			isGeoLink,
			isMapsLink,
		});

		if (isGeoLink || isMapsLink) {
			return true;
		}

		const isValid = defaultValidateLink(trimmedUrl);
		console.log('[MyMarkdown] validateLink fallback result', { url: trimmedUrl, isValid });
		return isValid;
	};

	md.normalizeLink = (url: string) => {
		if (!url) {
			return url;
		}

		const trimmedUrl = url.trim();
		if (!trimmedUrl) {
			return trimmedUrl;
		}

		const { resolvedHref, scheme, coordinates } = resolveLocationHref(trimmedUrl);

		if (scheme) {
			console.log('[MyMarkdown] normalizeLink resolved location URI', {
				originalUrl: trimmedUrl,
				scheme,
				coordinates,
				resolvedHref,
			});
			return resolvedHref ?? trimmedUrl;
		}

		return defaultNormalizeLink(trimmedUrl);
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
		blockquote: { fontStyle: 'italic', fontFamily: 'Poppins_400Regular' },
		td: { borderColor: 'gray', borderWidth: 1, fontFamily: 'Poppins_400Regular' },
		th: { borderColor: 'gray', borderWidth: 1, fontFamily: 'Poppins_400Regular' },
		a: { color: textColor, fontFamily: 'Poppins_400Regular' },
		li: { fontFamily: 'Poppins_400Regular' },
		ul: { fontFamily: 'Poppins_400Regular' },
		ol: { fontFamily: 'Poppins_400Regular' },
		p: { fontFamily: 'Poppins_400Regular' },
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

	const baseTextStyle = React.useMemo(
		() => ({
			color: textColor,
			fontSize,
			fontStyle: 'normal' as const,
			fontFamily: 'Poppins_400Regular',
		}),
		[textColor],
	);

	const customRenderers: Record<string, CustomBlockRenderer | CustomTextualRenderer | CustomMixedRenderer> = {
		a: (props: any) => {
			const { href } = props.tnode.attributes;
			const textContent = props.tnode.textContent?.trim();

			const { resolvedHref, scheme, coordinates } = resolveLocationHref(href);
			const targetHref = resolvedHref ?? href;
			const normalizedHref = href?.trim().toLowerCase();

			const text = textContent || targetHref || href || '';

			const handlePress = () => {
				if (targetHref) {
					Linking.openURL(targetHref).catch(err => console.error('Failed to open URL:', err));
				}
			};

			let iconLeft = <FontAwesome6 name="arrow-up-right-from-square" size={20} color={contrastColor} />;

			if (targetHref?.startsWith(UriScheme.TEL)) {
				iconLeft = <FontAwesome6 name="phone" size={20} color={contrastColor} />;
			} else if (targetHref?.startsWith(UriScheme.MAILTO)) {
				iconLeft = <MaterialCommunityIcons name="email" size={24} color={contrastColor} />;
			} else if (scheme === UriScheme.GEO || scheme === UriScheme.MAPS) {
				iconLeft = <Ionicons name="navigate" size={24} color={contrastColor} />;
			}

			console.log('[MyMarkdown] Rendering link', {
				href,
				normalizedHref,
				targetHref,
				scheme,
				coordinates,
				text,
			});

			return <ProjectButton text={text} onPress={handlePress} iconLeft={iconLeft} />;
		},
		sub: (props: any) => {
			const { data } = props.tnode;
			const text = data || props.children[0]?.data;
			return <Text style={{ fontSize, verticalAlign: 'sub', color: textColor, fontFamily: 'Poppins_400Regular' }}>{text}</Text>;
		},
		sup: (props: any) => {
			const { data } = props.tnode;
			const text = data || props.children[0]?.data;
			return (
				<Text style={{ fontSize, verticalAlign: 'super', color: textColor, fontFamily: 'Poppins_400Regular' }}>
					{text}
				</Text>
			);
		},
	};

	return (
		<View>
			<RenderHtml
				contentWidth={width}
				baseStyle={baseTextStyle}
				renderers={customRenderers}
				defaultTextProps={{ selectable: true }}
				customHTMLElementModels={customHTMLElementModels}
				tagsStyles={tagsStyles}
				systemFonts={MARKDOWN_SYSTEM_FONTS}
				source={source}
			/>
		</View>
	);
};

export default MyMarkdown;
