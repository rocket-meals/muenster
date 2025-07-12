export enum AppScreens {
    FOOD_OFFERS = 'foodoffers',
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
}
