import { StyleSheet } from 'react-native';

export default StyleSheet.create({
	sheetView: {
		width: '100%',
		height: '100%',
		borderTopRightRadius: 28,
		borderTopLeftRadius: 28,
		padding: 16,
		paddingBottom: 24,
		alignItems: 'center',
	},
        keyboardAvoidingView: {
                flex: 1,
                width: '100%',
        },
        keyboardAvoidingContent: {
                flexGrow: 1,
                alignItems: 'center',
        },
	sheetHeader: {
		width: '100%',
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'center',
	},
	sheetHeading: {
		fontFamily: 'Poppins_700Bold',
		fontSize: 24,
		textAlign: 'center',
	},
	description: {
		marginTop: 12,
		fontFamily: 'Poppins_400Regular',
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	inputContainer: {
		width: '100%',
		marginTop: 20,
	},
	buttonContainer: {
		width: '70%',
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginTop: 28,
	},
	cancelButton: {
		flex: 1,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
		borderWidth: 1,
		marginRight: 10,
	},
	saveButton: {
		flex: 1,
		height: 50,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: 50,
		marginLeft: 10,
	},
	buttonText: {
		fontSize: 16,
		fontFamily: 'Poppins_700Bold',
	},
});
