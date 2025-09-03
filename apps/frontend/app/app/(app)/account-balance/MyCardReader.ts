import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import MyNativeCardReader from './MyNativeCardReader';
import MyUnsupportedCardReader from './MyUnsupportedCardReader';

export type MyCardReaderResponseSupport = {
	result: boolean,
	message?: string
	error?: any
}

export interface MyCardReaderInterface {
	isNfcSupported: () => Promise<MyCardReaderResponseSupport>;
	isNfcEnabled: () => Promise<MyCardReaderResponseSupport>;
	readCard: (callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string) => Promise<void>;
}

export default function useMyCardReader(): MyCardReaderInterface {
	const isExpoGo = isRunningInExpoGo();

	if ((Platform.OS === 'android' || Platform.OS === 'ios') && !isExpoGo) {
		return new MyNativeCardReader();
	}

	return new MyUnsupportedCardReader();
}
