const EARTH_RADIUS_METERS = 6371000;

export const distanceBetween = (a, b) => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};

export const buildCumulativeDistances = (coordinates) => {
  const cumulative = [0];
  for (let i = 1; i < coordinates.length; i++) {
    const segment = distanceBetween(coordinates[i - 1], coordinates[i]);
    cumulative.push(cumulative[i - 1] + segment);
  }
  return cumulative;
};

export const positionAtDistance = (
  coordinates,
  cumulativeDistances,
  targetDistance,
) => {
  const totalDistance = cumulativeDistances[cumulativeDistances.length - 1];
  const clamped = Math.min(Math.max(targetDistance, 0), totalDistance);

  let segmentIndex = cumulativeDistances.findIndex((d) => d >= clamped);
  if (segmentIndex <= 0) segmentIndex = 1;

  const start = coordinates[segmentIndex - 1];
  const end = coordinates[segmentIndex];
  const segmentStart = cumulativeDistances[segmentIndex - 1];
  const segmentEnd = cumulativeDistances[segmentIndex];

  const segmentLength = segmentEnd - segmentStart || 1;
  const progress = (clamped - segmentStart) / segmentLength;

  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
};

// Private

const toRadians = (degrees) => (degrees * Math.PI) / 180;
