export type FormSubmissionSortOption = 'alphabetical';

export interface FormSubmissionSortSheetProps {
	closeSheet: () => void;
	selectedOption: FormSubmissionSortOption;
	setSelectedOption: (option: FormSubmissionSortOption) => void;
}
