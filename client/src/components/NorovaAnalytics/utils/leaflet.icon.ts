import L, { LatLng, Control } from 'leaflet';

import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

export const DEFAULT_ICON = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconAnchor: [17, 46]
});
