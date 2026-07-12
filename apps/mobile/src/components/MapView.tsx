/**
 * Native MapView — re-exports react-native-maps.
 * Metro swaps this for MapView.web.tsx on web (see metro.config.js).
 */

import MapView, { Marker, type Region } from "react-native-maps";

export { Marker };
export type { Region };
export default MapView;
