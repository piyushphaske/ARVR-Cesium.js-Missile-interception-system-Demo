import * as Cesium from 'cesium';
import { SIM, LOCATIONS } from './config.js';
import { ballisticPosition, computeFlightDuration, predictMissilePosition } from './missile.js';
import { willIntercept } from './interceptor.js';
import { isInRadarRange } from './radar.js';
import { createMissileEntity, createExplosionEntity } from './entities.js';
import { logEvent, updateStats } from './ui.js';

const stats = { fired: 0, interceptors: 0, hits: 0, misses: 0 };
let activeSimulations = [];
let tickInterval = null;
let viewer = null;

export function initSimulation(v) {
  viewer = v;
}

export function launchThreatMissile(threatKey, defenseKey) {
  const threat  = LOCATIONS[threatKey];
  const defense = LOCATIONS[defenseKey];
  if (!threat || !defense) return;

  stats.fired++;
  updateStats(stats);

  const missileId = `missile-${Date.now()}`;
  const apogeeKm  = SIM.MAX_APOGEE_KM * (0.6 + Math.random() * 0.4);
  const totalDur  = computeFlightDuration(threat.lon, threat.lat, defense.lon, defense.lat);

  const entity = createMissileEntity(
    viewer, missileId,
    Cesium.Color.RED,
    `☢ ${threat.label} → ${defense.label}`
  );

  logEvent(`🚀 THREAT LAUNCHED: ${threat.label} → ${defense.label}`);

  const sim = {
    id: missileId,
    type: 'threat',
    entity,
    startLon: threat.lon, startLat: threat.lat,
    endLon: defense.lon,  endLat: defense.lat,
    defLon: defense.lon,  defLat: defense.lat,
    defKey: defenseKey,
    apogeeKm,
    totalDur,
    elapsed: 0,
    t: 0,
    radarTriggered: false,
    interceptorLaunched: false,
    interceptors: [],    // active interceptor sims
    terminated: false,
    hitDetermined: false,
  };

  activeSimulations.push(sim);
  if (!tickInterval) startTick();
}

function startTick() {
  tickInterval = setInterval(tick, SIM.TICK_RATE_MS);
}

function tick() {
  const dt = SIM.TICK_RATE_MS / 1000;
  const toRemove = [];

  for (const sim of activeSimulations) {
    if (sim.terminated) { toRemove.push(sim); continue; }

    if (sim.type === 'threat') tickThreat(sim, dt);
    else if (sim.type === 'interceptor') tickInterceptor(sim, dt);
  }

  // Remove terminated sims
  for (const sim of toRemove) {
    activeSimulations = activeSimulations.filter(s => s !== sim);
  }

  if (activeSimulations.length === 0) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

function tickThreat(sim, dt) {
  sim.elapsed += dt;
  sim.t = Math.min(1, sim.elapsed / sim.totalDur);

  const pos = ballisticPosition(
    sim.startLon, sim.startLat,
    sim.endLon,   sim.endLat,
    sim.t, sim.apogeeKm
  );

  if (sim.entity.position) {
    sim.entity.position = new Cesium.ConstantPositionProperty(pos);
  }

  // Radar detection check
  if (!sim.radarTriggered && sim.elapsed > SIM.RADAR_DETECTION_DELAY) {
    const curLon = sim.startLon + (sim.endLon - sim.startLon) * sim.t;
    const curLat = sim.startLat + (sim.endLat - sim.startLat) * sim.t;

    if (isInRadarRange(curLon, curLat, sim.defLon, sim.defLat)) {
      sim.radarTriggered = true;
      logEvent(`📡 RADAR LOCK: Threat detected by ${LOCATIONS[sim.defKey].label}`);
      launchInterceptor(sim);
    }
  }

  // Missile reached target (no intercept)
  if (sim.t >= 1) {
    logEvent(`💥 IMPACT! ${LOCATIONS[sim.defKey].label} struck!`, 'danger');
    createExplosionEntity(viewer, pos, false);
    viewer.entities.remove(sim.entity);
    sim.terminated = true;
  }
}

function launchInterceptor(parentSim, isRetry = false) {
  if (parentSim.terminated) return;

  stats.interceptors++;
  updateStats(stats);

  const hit = willIntercept();
  const intId = `interceptor-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const label = isRetry ? '⚡ RETRY INTERCEPTOR' : '⚡ INTERCEPTOR';

  const entity = createMissileEntity(
    viewer, intId,
    isRetry ? Cesium.Color.YELLOW : Cesium.Color.CYAN,
    label
  );

  logEvent(`${label} LAUNCHED${isRetry ? ' (2nd ATTEMPT)' : ''} from ${LOCATIONS[parentSim.defKey].label}`);

  const intSim = {
    id: intId,
    type: 'interceptor',
    entity,
    // Interceptor starts at the defense site
    curLon: parentSim.defLon,
    curLat: parentSim.defLat,
    curAlt: 0,
    parentSim,
    willHit: hit,
    isRetry,
    terminated: false,
    missHandled: false,
  };

  parentSim.interceptors.push(intSim);
  activeSimulations.push(intSim);
}

function tickInterceptor(sim, dt) {
  const parent = sim.parentSim;
  if (!parent || parent.terminated) {
    // Threat already gone — remove interceptor silently
    viewer.entities.remove(sim.entity);
    sim.terminated = true;
    return;
  }

  // --- Steer interceptor toward the threat's CURRENT position ---
  const threatLon = parent.startLon + (parent.endLon - parent.startLon) * parent.t;
  const threatLat = parent.startLat + (parent.endLat - parent.startLat) * parent.t;
  const threatAlt = 4 * parent.apogeeKm * 1000 * parent.t * (1 - parent.t);

  const stepM = SIM.INTERCEPTOR_SPEED_MS * dt;

  const intPos = Cesium.Cartesian3.fromDegrees(sim.curLon, sim.curLat, sim.curAlt);
  const tgtPos = Cesium.Cartesian3.fromDegrees(threatLon, threatLat, threatAlt);
  const dist = Cesium.Cartesian3.distance(intPos, tgtPos);

  // Move toward threat (linear step in lon/lat/alt space)
  const frac = Math.min(1, stepM / Math.max(dist, 1));
  sim.curLon += (threatLon - sim.curLon) * frac;
  sim.curLat += (threatLat - sim.curLat) * frac;
  sim.curAlt += (threatAlt - sim.curAlt) * frac;

  const newPos = Cesium.Cartesian3.fromDegrees(sim.curLon, sim.curLat, sim.curAlt);
  sim.entity.position = new Cesium.ConstantPositionProperty(newPos);

  // --- Proximity check ---
  const closeDist = Cesium.Cartesian3.distance(newPos, tgtPos);

  if (closeDist <= SIM.INTERCEPT_RADIUS_M) {
    // Close enough — resolve hit or miss
    if (sim.willHit) {
      stats.hits++;
      const altKm = Math.round(sim.curAlt / 1000);
      logEvent(`✅ INTERCEPT SUCCESS! Threat eliminated at ${altKm}km altitude`);
      createExplosionEntity(viewer, newPos, true);

      // Remove both interceptor and threat immediately
      viewer.entities.remove(sim.entity);
      viewer.entities.remove(parent.entity);
      parent.terminated = true;
    } else {
      // Miss — interceptor flies past, remove it
      stats.misses++;
      logEvent(`❌ INTERCEPT MISSED! Flew past threat.`, 'warn');
      createExplosionEntity(viewer, newPos, false);
      viewer.entities.remove(sim.entity);

      if (!sim.isRetry && !parent.terminated) {
        logEvent(`⏳ Retrying in ${SIM.MISS_RETRY_DELAY}s...`, 'warn');
        setTimeout(() => {
          if (!parent.terminated) launchInterceptor(parent, true);
        }, SIM.MISS_RETRY_DELAY * 1000);
      }
    }
    updateStats(stats);
    sim.terminated = true;
  }
}

export function resetSimulation() {
  clearInterval(tickInterval);
  tickInterval = null;

  for (const sim of activeSimulations) {
    if (sim.entity) viewer.entities.remove(sim.entity);
  }
  activeSimulations = [];

  stats.fired = 0; stats.interceptors = 0;
  stats.hits = 0;  stats.misses = 0;
  updateStats(stats);
  document.getElementById('event-log').innerHTML = '';
  logEvent('System reset. Ready.');
}

export { stats };