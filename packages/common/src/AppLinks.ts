export enum AppScreens {
    LOGIN = 'login',
    FOOD_OFFERS = 'foodoffers',
    EATING_HABITS = 'eating-habits',
    ACCOUNT_BALANCE = 'account-balance',
    CAMPUS = 'campus',
    HOUSING = 'housing',
    NEWS = 'news',
    COURSE_TIMETABLE = 'course-timetable',
    SETTINGS = 'settings',
    PRICE_GROUP = 'price-group',
    DATA_ACCESS = 'data-access',
    SUPPORT_FAQ = 'support-FAQ',
    LICENSE_INFORMATION = 'licenseInformation',
    MANAGEMENT = 'management',
    STATISTICS = 'statistics',
    LABELS = 'labels',
}

export interface AppLinkParam {
    key: string;
    value: string | number | boolean;
}

export class AppLinks {
    static build(path: AppScreens | string, params: AppLinkParam[] = []): string {
        const query = params
            .map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(String(p.value))}`)
            .join('&');
        return query ? `${path}?${query}` : path;
    }

    static foodOffers(params: AppLinkParam[] = []): string {
        return this.build(AppScreens.FOOD_OFFERS, params);
    }

    static campus(params: AppLinkParam[] = []): string {
        return this.build(AppScreens.CAMPUS, params);
    }
}

export const APP_ROUTES = Object.values(AppScreens);
