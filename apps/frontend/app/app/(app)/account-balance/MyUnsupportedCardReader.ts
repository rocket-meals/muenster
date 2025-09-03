import CardResponse from '@/helper/nfcCardReaderHelper/CardResponse';
import {MyCardReaderInterface, MyCardReaderResponseSupport} from './MyCardReader';

export default class MyUnsupportedCardReader implements MyCardReaderInterface {
	async isNfcEnabled(): Promise<MyCardReaderResponseSupport> {
		return {result: false, message: 'NFC is not supported on this device'};
	}

	async isNfcSupported(): Promise<MyCardReaderResponseSupport> {
		return {result: false, message: 'NFC is not supported on this device'};
	}

	async readCard(callBack: (answer: CardResponse | undefined) => Promise<void>, showInstruction: () => void, hideInstruction: () => void, nfcInstruction: string): Promise<void> {
		throw new Error('NFC is not supported on this device');
	}
}
