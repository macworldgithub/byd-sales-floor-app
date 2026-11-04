/**
 * geofencing.ts – Showroom & Dealership Geofence Engine
 * Computes distance and on-site vs off-site status for dealerships.
 */

export interface DealershipSite {
    id: string;
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radiusMeters: number;
}

export const DEALERSHIP_SITES: Record<string, DealershipSite> = {
    'BYD Nunawading': {
        id: 'nunawading',
        name: 'BYD Nunawading',
        address: '88 Whitehorse Rd, Nunawading VIC 3131',
        latitude: -37.8214,
        longitude: 145.1764,
        radiusMeters: 300,
    },
    'BYD Melbourne': {
        id: 'melbourne',
        name: 'BYD Melbourne CBD',
        address: '501 Swanston St, Melbourne VIC 3000',
        latitude: -37.8136,
        longitude: 144.9631,
        radiusMeters: 250,
    },
    'BYD Caroline Springs': {
        id: 'caroline-springs',
        name: 'BYD Caroline Springs',
        address: '2 Innovation Way, Caroline Springs VIC 3023',
        latitude: -37.7548,
        longitude: 144.7381,
        radiusMeters: 350,
    },
};
/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */

export function calculateDistanceMeters(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
}
/**
 * Check if a location is within a dealership site geofence
 */

export function isWithinGeofence(
    latitude: number,
    longitude: number,
    siteName: string = 'BYD Nunawading'
): { isInside: boolean; distanceMeters: number; site: DealershipSite; } {
    const site = DEALERSHIP_SITES[siteName] || DEALERSHIP_SITES['BYD Nunawading'];
    const distance = calculateDistanceMeters(latitude, longitude, site.latitude, site.longitude);
    return {
        isInside: distance <= site.radiusMeters,
        distanceMeters: distance,
        site,
    };
}

export const isLocationInsideGeofence = isWithinGeofence;
