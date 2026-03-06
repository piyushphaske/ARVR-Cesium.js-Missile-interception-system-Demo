import * as Cesium from 'cesium';
import { SIM } from './config.js';

export function willIntercept() {
  return Math.random() < SIM.HIT_PROBABILITY;
}

// Compute interceptor path toward a predicted intercept point
export function computeInterceptPath(iLon, iLat, targetLon, targetLat, targetAlt) {
  const start = Cesium.Cartesian3.fromDegrees(iLon, iLat, 0);
  const end   = Cesium.Cartesian3.fromDegrees(targetLon, targetLat, targetAlt);
  const dist  = Cesium.Cartesian3.distance(start, end);
  const duration = dist / SIM.INTERCEPTOR_SPEED_MS;
  return { duration, targetLon, targetLat, targetAlt };
}

export function interceptorPosition(iLon, iLat, targetLon, targetLat, targetAlt, t) {
  const lon = iLon + (targetLon - iLon) * t;
  const lat = iLat + (targetLat - iLat) * t;
  const alt = targetAlt * t;  // climb toward intercept altitude
  return Cesium.Cartesian3.fromDegrees(lon, lat, alt);
}