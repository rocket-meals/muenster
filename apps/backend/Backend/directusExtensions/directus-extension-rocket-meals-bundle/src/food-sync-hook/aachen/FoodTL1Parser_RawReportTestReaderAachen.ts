import { FoodTL1Parser_GetRawReportInterface } from '../FoodTL1Parser_GetRawReportInterface';
import { readFileSync } from 'fs';
import { join } from 'path';

export class FoodTL1Parser_RawReportTestReaderAachen implements FoodTL1Parser_GetRawReportInterface {
  private readonly reportToReturn: string | undefined;

  constructor(reportToReturn?: string | undefined) {
    this.reportToReturn = reportToReturn;
  }

  async getRawReport(): Promise<string | undefined> {
    if (this.reportToReturn) {
      return this.reportToReturn;
    }
    return this.getSavedRawReport();
  }

  public static getSavedRawReportFromFile(): string {
    const filePath = join(__dirname, 'mensa-academica-wochenplan.html');
    return readFileSync(filePath, 'utf-8');
  }

  public static getSavedWeeklyPlanIframeReportFromFile(): string {
    const filePath = join(__dirname, 'speiseplaene', 'academica-w.html');
    return readFileSync(filePath, 'utf-8');
  }

  private async getSavedRawReport(): Promise<string | undefined> {
    try {
      return FoodTL1Parser_RawReportTestReaderAachen.getSavedRawReportFromFile();
    } catch (error) {
      console.log('Failed to load saved raw report for Aachen');
    }
    return undefined;
  }
}
