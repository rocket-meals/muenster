import type { PointTuple } from 'leaflet';

export const MARKER_DEFAULT_SIZE = 48;

export const getDefaultIconAnchor = (
  width: number,
  height: number,
): PointTuple => [width / 2, height];

export class MyMapMarkerIcons {
  static DEBUG_ICON = `<div style='width: ${MARKER_DEFAULT_SIZE}px; height: ${MARKER_DEFAULT_SIZE}px; background-color: #FF000066; position: relative;'><div style='width: ${MARKER_DEFAULT_SIZE}px; height: ${MARKER_DEFAULT_SIZE}px; background-color: #00FF0066; border-radius: 50%; position: absolute; top: 0%; left: 0%;'></div></div>`;

  static getIconForWebByUri(iconUri: string): string {
    // Only return the URI so the webview can create the <img> tag itself
    return iconUri;
  }

  static getIconForWebByBase64(base64: string): string {
    // Only return the base64 data URI. The leaflet web page will convert this
    // string into an <img> tag.
    return `data:image/png;base64,${base64}`;
  }
}
