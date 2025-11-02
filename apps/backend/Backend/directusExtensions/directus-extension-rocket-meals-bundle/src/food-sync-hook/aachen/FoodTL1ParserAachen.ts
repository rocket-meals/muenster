import { FoodTL1Parser, RawTL1FoodofferType } from '../FoodTL1Parser';
import { FoodTL1Parser_GetRawReportInterface } from '../FoodTL1Parser_GetRawReportInterface';
import { CheerioAPI, load } from 'cheerio';

const IGNORED_ROW_CLASSES = new Set(['odd', 'even', 'bg-color']);
const MENSA_NAME = 'Mensa Academica';

export class FoodTL1ParserAachen extends FoodTL1Parser {
  constructor(rawFoodofferReader: FoodTL1Parser_GetRawReportInterface) {
    super(rawFoodofferReader);
  }

  override async getRawFoodofferJSONListFromRawReport(rawReport: string | Buffer | undefined) {
    const html = rawReport?.toString();
    if (!html) {
      return [];
    }

    const $ = load(html);
    const rawFoodoffers: RawTL1FoodofferType[] = [];

    $('.preventBreak').each((dayIndex, dayElement) => {
      const headerLink = $(dayElement).find('h3 a');
      const dateString = FoodTL1ParserAachen.extractDate(headerLink.text());
      if (!dateString) {
        return;
      }

      $(dayElement)
        .find('table.menues > tbody > tr')
        .each((rowIndex, row) => {
          const rawItem = FoodTL1ParserAachen.createRawFoodofferFromRow($, row, {
            date: dateString,
            dayIndex,
            rowIndex,
          });
          if (rawItem) {
            rawFoodoffers.push(rawItem);
          }
        });
    });

    const grouped = FoodTL1Parser._groupParsedReportItemsToFoodofferListsItems(rawFoodoffers);
    return this.getRawFoodofferJSONListFromGroupedList(grouped);
  }

  private static extractDate(headerText: string): string | null {
    if (!headerText) {
      return null;
    }
    const parts = headerText.split(',');
    if (parts.length < 2) {
      return null;
    }
    const datePart = parts[1]?.trim();
    if (!datePart || !/^\d{2}\.\d{2}\.\d{4}$/.test(datePart)) {
      return null;
    }
    return datePart;
  }

  private static createRawFoodofferFromRow(
    $: CheerioAPI,
    row: any,
    context: { date: string; dayIndex: number; rowIndex: number }
  ): RawTL1FoodofferType | null {
    const category = $(row).find('.menue-category').first().text().trim();
    const descriptionSegments = FoodTL1ParserAachen.extractDescriptionSegments($, row);
    if (descriptionSegments.length === 0) {
      return null;
    }

    const priceText = FoodTL1ParserAachen.extractPrice($(row).find('.menue-price').first().text());
    const markingClasses = FoodTL1ParserAachen.extractMarkingsFromRow($, row);

    const recipeId = FoodTL1ParserAachen.generateRecipeId(context.dayIndex, context.rowIndex);

    const rawItem: RawTL1FoodofferType = {
      MENSA: MENSA_NAME,
      DATUM: context.date,
      REZEPTUR_ID: recipeId,
      SPEISE: category,
      SPEISE_BEZEICHNUNG: category,
      [FoodTL1Parser.DEFAULT_MENU_LINE_FIELD]: category,
    };

    if (priceText) {
      rawItem[FoodTL1Parser.FIELD_PRICE_STUDENT_HANNOVER] = priceText;
      rawItem[FoodTL1Parser.FIELD_PRICE_STUDENT_OSNABRUECK] = priceText;
    }

    if (markingClasses.length > 0) {
      rawItem[FoodTL1Parser.DEFAULT_MARKING_LABELS_FIELD] = markingClasses.join(', ');
    }

    descriptionSegments.forEach((segment, index) => {
      rawItem[`${FoodTL1Parser.DEFAULT_TEXT_FIELD}${index + 1}`] = segment;
    });

    return rawItem;
  }

  private static extractDescriptionSegments($: CheerioAPI, row: any): string[] {
    const descriptionWrapper = $(row).find('.menue-desc').first().clone();
    if (!descriptionWrapper.length) {
      return [];
    }

    descriptionWrapper.find('.menue-nutr').remove();
    descriptionWrapper.find('br').replaceWith('|');

    descriptionWrapper.find('sup').each((_, supElement) => {
      let supText = $(supElement).text().trim();
      supText = supText.replace(/\s*,\s*/g, ',');
      supText = supText.replace(/\s+/g, ' ');
      $(supElement).replaceWith(supText ? ` (${supText})` : '');
    });

    const textContent = descriptionWrapper.text();
    const parts = textContent
      .split('|')
      .map(part => part.replace(/\s+/g, ' ').trim())
      .map(part => part.replace(/^\+/, '').trim())
      .filter(part => part.length > 0);

    return parts;
  }

  private static extractPrice(rawPrice: string): string | undefined {
    if (!rawPrice) {
      return undefined;
    }
    const withoutCurrency = rawPrice.replace('€', '').trim();
    return withoutCurrency.length > 0 ? withoutCurrency : undefined;
  }

  private static extractMarkingsFromRow($: CheerioAPI, row: any): string[] {
    const classAttribute = $(row).attr('class');
    if (!classAttribute) {
      return [];
    }
    return classAttribute
      .split(/\s+/)
      .map(item => item.trim())
      .filter(item => item.length > 0 && !IGNORED_ROW_CLASSES.has(item));
  }

  private static generateRecipeId(dayIndex: number, rowIndex: number): string {
    const base = (dayIndex + 1) * 1000 + (rowIndex + 1);
    return base.toString();
  }
}
