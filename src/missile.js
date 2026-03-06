import * as Cesium from 'cesium';
import { SIM } from './config.js';

// Compute a ballistic arc point at fraction t (0→1) between two positions
export function ballisticPosition(startLon, startLat, endLon, endLat, t, apogeeKm) {
  // Lerp lon/lat
  const lon = startLon + (endLon - startLon) * t;
  const lat = startLat + (endLat - startLat) * t;
  // Parabolic arc: altitude = 4 * apogee * t * (1-t)
  const altMeters = 4 * apogeeKm * 1000 * t * (1 - t);
  return Cesium.Cartesian3.fromDegrees(lon, lat, altMeters);
}

export function computeFlightDuration(startLon, startLat, endLon, endLat) {
  const start = Cesium.Cartesian3.fromDegrees(startLon, startLat, 0);
  const end   = Cesium.Cartesian3.fromDegrees(endLon, endLat, 0);
  const dist  = Cesium.Cartesian3.distance(start, end);
  return dist / SIM.MISSILE_SPEED_MS; // seconds
}

export function computeInterceptorDuration(iLon, iLat, tLon, tLat, tAlt) {
  const iPos = Cesium.Cartesian3.fromDegrees(iLon, iLat, 0);
  const tPos = Cesium.Cartesian3.fromDegrees(tLon, tLat, tAlt);
  const dist  = Cesium.Cartesian3.distance(iPos, tPos);
  return dist / SIM.INTERCEPTOR_SPEED_MS;
}

// Given a missile's current t and total duration, where will it be in `dt` seconds?
export function predictMissilePosition(startLon, startLat, endLon, endLat, 
                                        currentT, totalDuration, dt, apogeeKm) {
  const futureT = Math.min(1, currentT + dt / totalDuration);
  return {
    position: ballisticPosition(startLon, startLat, endLon, endLat, futureT, apogeeKm),
    t: futureT,
    lon: startLon + (endLon - startLon) * futureT,
    lat: startLat + (endLat - startLat) * futureT,
    alt: 4 * apogeeKm * 1000 * futureT * (1 - futureT),
  };
}