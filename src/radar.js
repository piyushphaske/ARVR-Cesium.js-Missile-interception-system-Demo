import * as Cesium from 'cesium';
import { SIM } from './config.js';
import { computeInterceptorDuration } from './missile.js';

export function isInRadarRange(missileLon, missileLat, radarLon, radarLat) {
  const missile = Cesium.Cartesian3.fromDegrees(missileLon, missileLat, 0);
  const radar   = Cesium.Cartesian3.fromDegrees(radarLon,   radarLat,   0);
  const dist    = Cesium.Cartesian3.distance(missile, radar);
  return dist <= SIM.RADAR_RANGE_KM * 1000;
}

export function computeInterceptPoint(
  mStartLon, mStartLat, mEndLon, mEndLat, mCurrentT, mTotalDur,
  iLon, iLat, apogeeKm
) {
  // Step forward in time to find where interceptor can catch missile
  let bestT = null;
  let bestPos = null;

  for (let dt = 5; dt <= mTotalDur * (1 - mCurrentT); dt += 5) {
    const futureT = Math.min(1, mCurrentT + dt / mTotalDur);
    const futureLon = mStartLon + (mEndLon - mStartLon) * futureT;
    const futureLat = mStartLat + (mEndLat - mStartLat) * futureT;
    const futureAlt = 4 * apogeeKm * 1000 * futureT * (1 - futureT);

    const iStart = Cesium.Cartesian3.fromDegrees(iLon, iLat, 0);
    const iEnd   = Cesium.Cartesian3.fromDegrees(futureLon, futureLat, futureAlt);
    const iDist  = Cesium.Cartesian3.distance(iStart, iEnd);
    const iTime  = iDist / SIM.INTERCEPTOR_SPEED_MS;

    if (Math.abs(iTime - dt) < 10) { // close enough match
      bestT = futureT;
      bestPos = { lon: futureLon, lat: futureLat, alt: futureAlt };
      break;
    }
  }
  return bestPos || { 
    lon: (mEndLon + mStartLon) / 2, 
    lat: (mEndLat + mStartLat) / 2, 
    alt: apogeeKm * 500 
  };
}