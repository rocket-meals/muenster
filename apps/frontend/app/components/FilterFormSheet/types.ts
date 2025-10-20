export interface FilterFormSheetProps {
        closeSheet: () => void;
        isVisible: boolean;
        isFormSubmission: boolean;
        setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
        selectedOption: string;
	options: Array<{
		id: string;
		label: string;
		icon: { library: string; name: string };
	}>;
	isEditMode?: boolean;
}
