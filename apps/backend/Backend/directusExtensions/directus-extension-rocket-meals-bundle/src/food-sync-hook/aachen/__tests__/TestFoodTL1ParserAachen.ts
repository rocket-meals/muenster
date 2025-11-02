import { describe, expect, it } from '@jest/globals';
import { FoodTL1ParserAachen } from '../FoodTL1ParserAachen';
import { FoodTL1Parser_GetRawReportInterface } from '../../FoodTL1Parser_GetRawReportInterface';
import { FoodTL1Parser_RawReportTestReaderAachen } from '../FoodTL1Parser_RawReportTestReaderAachen';
import { FoodTL1Parser } from '../../FoodTL1Parser';
import { FoodsInformationTypeForParser } from '../../FoodParserInterface';

function createParser(reportToReturn?: string): FoodTL1Parser {
  const reader: FoodTL1Parser_GetRawReportInterface = new FoodTL1Parser_RawReportTestReaderAachen(reportToReturn);
  return new FoodTL1ParserAachen(reader);
}

function getSavedWeeklyPlanHtml(): string {
  return FoodTL1Parser_RawReportTestReaderAachen.getSavedWeeklyPlanIframeReportFromFile();
}

describe('FoodTL1ParserAachen', () => {
  it('parses more than one food offer', async () => {
    const parser = createParser(getSavedWeeklyPlanHtml());
    await parser.createNeededData();
    const foodOffers = await parser.getFoodoffersForParser();
    expect(foodOffers.length).toBeGreaterThan(0);
  });

  it('parses the vegetarian soup with correct markings and price', async () => {
    const parser = createParser(getSavedWeeklyPlanHtml());
    await parser.createNeededData();
    const foodOffers = await parser.getFoodoffersForParser();

    const soupOffer = foodOffers.find(offer =>
      offer.basicFoodofferData.alias?.includes('Rauchige schwarze Bohnensuppe')
    );
    expect(soupOffer).toBeDefined();
    if (!soupOffer) {
      return;
    }

    expect(soupOffer.date).toEqual({ day: 29, month: 10, year: 2025 });
    expect(soupOffer.basicFoodofferData.price_student).toBeCloseTo(1.6, 2);
    expect(soupOffer.marking_external_identifiers).toEqual(
      expect.arrayContaining(['B', 'A', 'A1', 'A3', 'A5'])
    );
    expect(soupOffer.marking_external_identifiers).toContain('menu_line_Tellergericht vegetarisch');
  });

  it('creates foods with categories for all entries', async () => {
    const parser = createParser(getSavedWeeklyPlanHtml());
    await parser.createNeededData();
    const foods: FoodsInformationTypeForParser[] = await parser.getFoodsListForParser();

    expect(foods.length).toBeGreaterThan(0);
    expect(foods.every(food => !!food.category_external_identifier)).toBe(true);
  });
});
