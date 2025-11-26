import {describe, expect, it} from '@jest/globals';
import {FoodParserInterface} from "../../../FoodParserInterface";
import {MarkingParserInterface} from "../../../MarkingParserInterface";
import {MaxManagerConnector, MaxManagerConnectorConfig} from "../MaxManagerConnector";
import {MaxManagerFileContentReader} from "../MaxManagerFileContentReader";



const configMaxManagerTestLocal = {
  fileContentReader: new MaxManagerFileContentReader(),
  fetchAmountDays: 3,
}

const configMaxManagerTestOnline: MaxManagerConnectorConfig = {
    url: "https://sw-muenster-spl24.maxmanager.xyz",
    fetchAmountDays: 3,
};

const configMaxManagerTest = configMaxManagerTestLocal;
const amountDaysToFetch = configMaxManagerTest.fetchAmountDays || 14;

let foodParser: FoodParserInterface;
let markingParser: MarkingParserInterface;

describe('MaxManagerConnector Parser Tests', () => {

    beforeAll(async () => {
        let foodAndMarkingParser = new MaxManagerConnector(configMaxManagerTestOnline);
        await foodAndMarkingParser.createNeededData();

        foodParser = foodAndMarkingParser;
        markingParser = foodAndMarkingParser;
    });

  it('parses canteens', async () => {
    const canteensList = await foodParser.getCanteensList();
    expect(canteensList.length).toBeGreaterThan(0);
  });


  it('parses more than one foodoffer', async () => {
    const foodsOfferList = await foodParser.getFoodoffersForParser();
    expect(foodsOfferList.length).toBeGreaterThan(1);
  });

    it('parses more than one foodoffer', async () => {
        const foodsOfferList = await foodParser.getFoodoffersForParser();
        let datesFoundDict: {[key: string]: boolean} = {};
        for (const foodOffer of foodsOfferList) {
            const dateStr = foodOffer.date.year+"-"+String(foodOffer.date.month).padStart(2,'0')+"-"+String(foodOffer.date.day).padStart(2,'0');
            datesFoundDict[dateStr] = true;
        }
        const datesFound = Object.keys(datesFoundDict);
        console.log(datesFound);
        expect(datesFound.length).toBeGreaterThan(amountDaysToFetch -1);
    });

   it('parses markings', async () => {
    const markingsList = await markingParser.getMarkingsJSONList();

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
