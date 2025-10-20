import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	container: {
		width: '100%',
	},
	inputContainer: {
		width: '100%',
		flexDirection: 'row',
		alignItems: 'center',
	},
	pickerWrapper: {
		borderWidth: 1,
		borderRadius: 10,
	},
	pickerWrapperFull: {
		flex: 1,
		width: '100%',
	},
	pickerWrapperWithAffix: {
		flex: 1,
	},
	picker: {
		width: '100%',
		height: 50,
	},
	prefixSuffix: {
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#3A3A3A',
		paddingHorizontal: 12,
	},
	prefixSuffixLeft: {
		borderTopLeftRadius: 10,
		borderBottomLeftRadius: 10,
	},
	prefixSuffixRight: {
		borderTopRightRadius: 10,
		borderBottomRightRadius: 10,
	},
	prefixSuffixLabel: {
		fontSize: 16,
		fontFamily: 'Poppins_400Regular',
	},
	customInputContainer: {
		marginTop: 10,
	},
	errorText: {
		marginTop: 6,
		fontSize: 12,
		fontFamily: 'Poppins_400Regular',
		color: '#ff4d4f',
	},
});
