import { UriScheme } from '@/constants/UriScheme';

type ContentPatterns = {
        email: RegExp;
        link: RegExp;
        image: RegExp;
        heading: RegExp;
};

export const markdownContentPatterns: ContentPatterns = {
        email: new RegExp(`\\[([^\\]]+)]\\((${UriScheme.MAILTO}[^\\)]+)\\)`),
        link: /\[([^\]]+)]\((https?:\/\/[^\)]+)\)/,
        image: /!\[([^\]]*)]\(([^)]+)\)/,
        heading: /^#{1,6}\s*(.*)$/,
};
