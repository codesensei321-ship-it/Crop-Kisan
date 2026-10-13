import { LocationContext } from '../types.ts';

/**
 * Calculates current agricultural season based on month and geographical region
 */
export function getAgriculturalSeason(date: Date = new Date(), latitude?: number): string {
  const month = date.getMonth(); // 0 = Jan, 9 = Oct

  // In India and South Asia (lat between ~8 and 37 N)
  const isSouthAsia = latitude !== undefined ? latitude > 5 && latitude < 38 : true;

  if (isSouthAsia) {
    if (month >= 5 && month <= 8) {
      return 'Kharif / Monsoon Season (High Humidity)';
    } else if (month === 9) {
      return 'Post-Monsoon / Late Kharif (October Transition)';
    } else if (month >= 10 || month <= 1) {
      return 'Rabi / Winter Sowing Season (Moderate Temp)';
    } else {
      return 'Zaid / Summer Season (Dry & Hot)';
    }
  }

  // General Northern Hemisphere fallback
  if (month >= 2 && month <= 4) return 'Spring Sowing';
  if (month >= 5 && month <= 7) return 'Summer Cultivation';
  if (month >= 8 && month <= 10) return 'Autumn Harvest';
  return 'Winter Dormancy';
}

/**
 * Reverse geocode latitude and longitude to district/city, state, country
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<Partial<LocationContext>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'KisanDrCropApp/1.0',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const district = addr.county || addr.district || addr.state_district || addr.city || addr.town;
      const state = addr.state || addr.region;
      const country = addr.country;

      return {
        district,
        city: addr.city || addr.town || addr.village || district,
        state,
        country,
      };
    }
  } catch (err) {
    console.warn('Reverse geocode failed or rate-limited, continuing with coordinates:', err);
  }

  return {
    district: 'Local Farm District',
    state: 'Agricultural Region',
    country: 'India',
  };
}

/**
 * Request location from browser Geolocation API
 */
export async function detectUserLocation(): Promise<LocationContext> {
  const now = new Date();
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const month = monthNames[now.getMonth()];
  const dateStr = now.toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    return {
      district: 'Mandya / Bengaluru Rural',
      state: 'Karnataka',
      country: 'India',
      season: getAgriculturalSeason(now, 12.97),
      month,
      dateStr,
    };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const geoInfo = await reverseGeocode(latitude, longitude);
        resolve({
          latitude,
          longitude,
          district: geoInfo.district || 'Local District',
          city: geoInfo.city,
          state: geoInfo.state || 'Karnataka',
          country: geoInfo.country || 'India',
          season: getAgriculturalSeason(now, latitude),
          month,
          dateStr,
        });
      },
      (_err) => {
        // Fallback context if user denies location permission
        resolve({
          district: 'Dharwad / Mandya',
          state: 'Karnataka',
          country: 'India',
          season: getAgriculturalSeason(now, 15.45),
          month,
          dateStr,
        });
      },
      { timeout: 7000, enableHighAccuracy: false }
    );
  });
}
