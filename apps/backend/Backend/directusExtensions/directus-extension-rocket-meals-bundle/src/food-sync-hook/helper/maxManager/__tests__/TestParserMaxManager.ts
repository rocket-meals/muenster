import {describe, expect, it} from '@jest/globals';
import {FoodParserInterface} from "../../../FoodParserInterface";
import {MarkingParserInterface} from "../../../MarkingParserInterface";
import {MaxManagerConnector, MaxManagerConnectorConfig} from "../MaxManagerConnector";
import {MaxManagerFileContentReader} from "../MaxManagerFileContentReader";

const configMaxManagerTest = {
  fileContentReader: new MaxManagerFileContentReader()
}

const configMaxManagerTestOnline: MaxManagerConnectorConfig = {
    url: "https://sw-muenster-spl24.maxmanager.xyz",
    fetchAmountDays: 14,
};

function getTestParser(): FoodParserInterface {
  return new MaxManagerConnector(configMaxManagerTest);
}

function getMarkingParser(): MarkingParserInterface {
  return new MaxManagerConnector(configMaxManagerTest);
}

describe('dev', () => {

  it('parses canteens', async () => {
    const parser = getTestParser();
    await parser.createNeededData();
    const canteensList = await parser.getCanteensList();
    expect(canteensList.length).toBeGreaterThan(0);
  });


  it('parses more than one foodoffer', async () => {
    const parser = getTestParser();
    await parser.createNeededData();
    const foodsOfferList = await parser.getFoodoffersForParser();
    expect(foodsOfferList.length).toBeGreaterThan(1);
  });


   it('parses markings', async () => {
    const parser = getMarkingParser();
    await parser.createNeededData();
    const markingsList = await parser.getMarkingsJSONList();

    expect(markingsList.length).toBeGreaterThan(0);

    let expectedMarkingIds: string[] = [];
    // Zusatzstoffe 1,2,3,8
     expectedMarkingIds.push('A');
     expectedMarkingIds.push('ADI');
     expectedMarkingIds.push('F');
     // ....
     expectedMarkingIds.push('HQU');
     // ...
     expectedMarkingIds.push('1');
     expectedMarkingIds.push('10');
     expectedMarkingIds.push('16');

     expectedMarkingIds.push('A.png?v=1'); // alcohol
     expectedMarkingIds.push('R.png?v=1'); // rind
     expectedMarkingIds.push('CO2_bewertung_C.png?v=1'); // CO2 Bewertung C

    for (const expectedMarkingId of expectedMarkingIds) {
      const found = markingsList.find(marking => marking.external_identifier === expectedMarkingId);
      expect(found?.external_identifier).toBe(expectedMarkingId);
      expect(found).toBeDefined();
    }
  });
});
