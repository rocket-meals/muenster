import * as https from 'https';
import fetch from 'node-fetch';

export class FetchIngoreSelfSignedCertHelper {

  public static async fetch(url: string, options: any = {}): Promise<any> {
    // Agent für SSL-Zertifikatsprüfung deaktivieren
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false // Ignoriert selbst-signierte Zertifikate
    });

    // Füge den Agenten zu den Optionen hinzu
    options.agent = httpsAgent;

    // Führe den Fetch-Aufruf durch
    return fetch(url, options);
  }

}