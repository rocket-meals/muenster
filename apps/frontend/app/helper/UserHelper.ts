import {DatabaseTypes} from 'repo-depkit-common';

export class UserHelper {
	public static isAnonymousUser(user: Record<string, any> | DatabaseTypes.DirectusUsers | null): boolean {
		return !user?.id;
	}

	public static isRegisteredUser(user: Record<string, any> | DatabaseTypes.DirectusUsers | null): boolean {
		return !!user?.id;
	}
}