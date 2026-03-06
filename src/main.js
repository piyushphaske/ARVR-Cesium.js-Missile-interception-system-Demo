import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { CESIUM_TOKEN, LOCATIONS, REGIONS } from './config.js';
import { createRadarRing, createDefenseSite } from './entities.js';
import { initSimulation, launchThreatMissile, resetSimulation } from './simulation.js';

// Set token
Cesium.Ion.defaultAccessToken = CESIUM_TOKEN;

// Create viewer
const viewer = new Cesium.Viewer('cesiumContainer', {
  terrainProvider: await Cesium.createWorldTerrainAsync(),
  baseLayerPicker: false,
  geocoder: false,
  homeButton: false,
  sceneModePicker: true,
  navigationHelpButton: false,
  animation: false,
  timeline: false,
  fullscreenButton: true,
});

// Night-side atmosphere effect
viewer.scene.globe.enableLighting = true;
viewer.scene.skyAtmosphere.show = true;

// Set initial camera
viewer.camera.setView({
  destination: Cesium.Cartesian3.fromDegrees(80, 35, 8000000),
  orientation: { heading: 0, pitch: Cesium.Math.toRadians(-45), roll: 0 }
});

// Init simulation engine
initSimulation(viewer);

// Place defense sites & radar rings for every location
for (const [key, loc] of Object.entries(LOCATIONS)) {
  createDefenseSite(viewer, loc.lon, loc.lat, loc.label);
  createRadarRing(viewer, loc.lon, loc.lat, 800, loc.label);
}

// --- Region / origin / target selector logic ---
let currentRegion = 'NK_SK';

function getSide(regionKey, siteKey) {
  const r = REGIONS[regionKey];
  if (r.sideA.sites.includes(siteKey)) return 'A';
  if (r.sideB.sites.includes(siteKey)) return 'B';
  return null;
}

function populateOrigin(regionKey) {
  const r = REGIONS[regionKey];
  const sel = document.getElementById('sel-origin');
  sel.innerHTML = '';
  for (const [side, group] of [['A', r.sideA], ['B', r.sideB]]) {
    const grp = document.createElement('optgroup');
    grp.label = group.name;
    group.sites.forEach(key => {
      const opt = document.createElement('option');
      opt.value = key;
      opt.textContent = LOCATIONS[key].label;
      grp.appendChild(opt);
    });
    sel.appendChild(grp);
  }
  populateTarget(regionKey, sel.value);
}

function populateTarget(regionKey, originKey) {
  const r = REGIONS[regionKey];
  const side = getSide(regionKey, originKey);
  const targets = side === 'A' ? r.sideB : r.sideA;
  const sel = document.getElementById('sel-target');
  sel.innerHTML = '';
  const grp = document.createElement('optgroup');
  grp.label = targets.name;
  targets.sites.forEach(key => {
    const opt = document.createElement('option');
    opt.value = key;
    opt.textContent = LOCATIONS[key].label;
    grp.appendChild(opt);
  });
  sel.appendChild(grp);
}

// Region button clicks
document.querySelectorAll('.region-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentRegion = btn.dataset.region;
    populateOrigin(currentRegion);
    const cam = REGIONS[currentRegion].camera;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(cam.lon, cam.lat, cam.alt),
      orientation: { heading: 0, pitch: Cesium.Math.toRadians(-50), roll: 0 },
      duration: 2,
    });
  });
});

// Origin change → re-populate targets
document.getElementById('sel-origin').addEventListener('change', e => {
  populateTarget(currentRegion, e.target.value);
});

// Launch
document.getElementById('btn-launch').addEventListener('click', () => {
  const origin = document.getElementById('sel-origin').value;
  const target = document.getElementById('sel-target').value;
  launchThreatMissile(origin, target);
});

// Reset
document.getElementById('btn-reset').addEventListener('click', resetSimulation);

// Initialise dropdowns with default region
populateOrigin(currentRegion);