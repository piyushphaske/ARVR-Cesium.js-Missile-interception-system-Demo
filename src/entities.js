import * as Cesium from 'cesium';

export function createMissileEntity(viewer, id, color, label) {
  return viewer.entities.add({
    id,
    name: label,
    position: Cesium.Cartesian3.fromDegrees(0, 0, 0),
    point: {
      pixelSize: 8,
      color: color,
      outlineColor: Cesium.Color.WHITE,
      outlineWidth: 1,
    },
    label: {
      text: label,
      font: '11px Courier New',
      fillColor: color,
      outlineColor: Cesium.Color.BLACK,
      outlineWidth: 2,
      style: Cesium.LabelStyle.FILL_AND_OUTLINE,
      verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
      pixelOffset: new Cesium.Cartesian2(0, -14),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.2,
        color: color.withAlpha(0.7),
      }),
      width: 2,
      leadTime: 0,
      trailTime: 20,
    }
  });
}

export function createExplosionEntity(viewer, position, isHit) {
  const color = isHit ? Cesium.Color.ORANGE : Cesium.Color.GRAY;
  const e = viewer.entities.add({
    position,
    ellipsoid: {
      radii: new Cesium.Cartesian3(1000, 1000, 1000),
      material: color.withAlpha(0.7),
    }
  });
  // Animate expansion then remove
  let size = 1000;
  const interval = setInterval(() => {
    size += 8000;
    if (e && e.ellipsoid) {
      e.ellipsoid.radii = new Cesium.ConstantProperty(
        new Cesium.Cartesian3(size, size, size)
      );
    }
    if (size > 120000) {
      clearInterval(interval);
      viewer.entities.remove(e);
    }
  }, 50);
  return e;
}

export function createRadarRing(viewer, lon, lat, rangeKm, label) {
  return viewer.entities.add({
    name: `Radar: ${label}`,
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
    ellipse: {
      semiMajorAxis: rangeKm * 1000,
      semiMinorAxis: rangeKm * 1000,
      material: new Cesium.ColorMaterialProperty(
        Cesium.Color.CYAN.withAlpha(0.08)
      ),
      outline: true,
      outlineColor: Cesium.Color.CYAN.withAlpha(0.4),
      outlineWidth: 1,
      height: 0,
    },
    label: {
      text: `◎ ${label}`,
      font: '12px Courier New',
      fillColor: Cesium.Color.CYAN,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    }
  });
}

export function createDefenseSite(viewer, lon, lat, label) {
  return viewer.entities.add({
    position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
    billboard: {
      image: createDefenseIcon(),
      width: 32, height: 32,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    },
    label: {
      text: label,
      font: '11px Courier New',
      fillColor: Cesium.Color.LIME,
      pixelOffset: new Cesium.Cartesian2(0, -36),
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
    }
  });
}

function createDefenseIcon() {
  const canvas = document.createElement('canvas');
  canvas.width = 32; canvas.height = 32;
  const ctx = canvas.getContext('2d');
  ctx.strokeStyle = '#00ff00';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(16, 16, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(16, 4); ctx.lineTo(16, 28); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(4, 16); ctx.lineTo(28, 16); ctx.stroke();
  ctx.fillStyle = '#00ff00';
  ctx.beginPath(); ctx.arc(16, 16, 3, 0, Math.PI * 2); ctx.fill();
  return canvas.toDataURL();
}