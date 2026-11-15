
import * as THREE from "three";

/* CAMOU – EXPLORE GLOBE
   Five freely positioned environments
   Navigation / Video / Visuals / Compass / Modals
*/

const CONFIG = {
  radius: 3.2,
  desktopZoom: 8.2,
  mobileZoom: 8.4,
  minZoom: 6,
  maxZoom: 17,
  dragSpeed: 0.0052,
  friction: 0.86,
  visualScale: 0.78
};

const ASSETS = {
  home: new URL("./assets/hero.jpg", import.meta.url).href,
  homeVideo: new URL("./assets/test.webm", import.meta.url).href,
  music: new URL("./assets/release.jpg", import.meta.url).href,
  visuals: new URL("./assets/visuals.jpg", import.meta.url).href,
  visualSlides: [
    new URL("./assets/visuals.jpg", import.meta.url).href,
    new URL("./assets/visuals-01.jpg", import.meta.url).href,
    new URL("./assets/visuals-02.jpg", import.meta.url).href,
    new URL("./assets/visuals-03.jpg", import.meta.url).href
  ],
  archive: new URL("./assets/archive.jpg", import.meta.url).href,
  contact: new URL("./assets/contact.jpg", import.meta.url).href
};

const sections = [
  {
    name: "HOME",
    eyebrow: "01 — NEW PROJECT",
    title: ["c a m o u"],
    body: ["Gleiche Fragen.", "Neue Perspektiven."],
    image: ASSETS.home
  },
  {
    name: "MUSIC",
    eyebrow: "02 — RELEASES",
    title: ["f r a g m e n t e"],
    body: [
      "vom Wind getragen,",
      "zwischen Licht und Schatten.",
      "zwischen dem, was man sieht",
      "und dem, was bleibt."
    ],
    image: ASSETS.music
  },
  {
    name: "VISUALS",
    eyebrow: "03 — VISUAL WORKS",
    title: ["Visuals"],
    body: [
      "Bilder, die bleiben.",
      "Momente, die verschwinden."
    ],
    image: ASSETS.visuals
  },
  {
    name: "ECHOES",
    eyebrow: "04 — HALL",
    title: ["Echoes"],
    body: [
      "Songs und Spuren, die an",
      "verschiedenen Orten widerhallen.",
      "Click & Follow"
    ],
    image: ASSETS.archive
  },
  {
    name: "CONTACT",
    eyebrow: "05 — GET IN TOUCH",
    title: ["Contact"],
    body: [
      "Für Anfragen und Zusammenarbeit.",
      "oder einfach so"
    ],
    image: ASSETS.contact
  }
];

/* =========================================
   HELPERS
========================================= */

const $ = id => document.getElementById(id);

const clamp = (v, min, max) =>
  Math.max(min, Math.min(max, v));

const lerp = (a, b, t) =>
  a + (b - a) * t;

const smooth = t => {
  t = clamp(t, 0, 1);
  return t * t * (3 - 2 * t);
};

const wrapAngle = a =>
  Math.atan2(Math.sin(a), Math.cos(a));

const distance = (a, b) =>
  Math.hypot(a.x - b.x, a.y - b.y);

/* =========================================
   DOM UND THREE.JS
========================================= */

const container = $("globe");
const stage = document.querySelector(".globe-stage");
const navButtons = [
  ...document.querySelectorAll(".nav-link")
];

const mobile = window.matchMedia(
  "(max-width:700px)"
).matches;

const defaultZoom = mobile
  ? CONFIG.mobileZoom
  : CONFIG.desktopZoom;

for (const id of [
  "camou-motion-control",
  "compass-permission"
]) {
  document.getElementById(id)?.remove();
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#091722");

const camera = new THREE.PerspectiveCamera(
  38,
  Math.max(1, container.clientWidth) /
    Math.max(1, container.clientHeight),
  0.1,
  100
);

let currentZoom = defaultZoom;
camera.position.z = currentZoom;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setPixelRatio(
  Math.min(window.devicePixelRatio, 2)
);

renderer.setSize(
  container.clientWidth,
  container.clientHeight
);

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

container.appendChild(renderer.domElement);
// Touch-Gesten an CAMOU übergeben
renderer.domElement.style.touchAction = "none";
stage.style.touchAction = "none";
/* =========================================
   CAMOU COSMOS
   SONNE UND ENTFERNTER PLANET
========================================= */

// Hintergrundobjekte an der Kamera befestigen.
// Dadurch bleiben sie beim Drehen der Kugel
// im Hintergrund und beeinflussen keine Navigation.

scene.add(camera);

// Erzeugt eine runde, weich beleuchtete
// Hintergrundgrafik als Three.js-Textur.
function createCosmicTexture(colors) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;

  const ctx = canvas.getContext("2d");

  const gradient = ctx.createRadialGradient(
    128, 128, 0,
    128, 128, 128
  );

  colors.forEach(([position, color]) => {
    gradient.addColorStop(position, color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

// Entfernte Sonne mit warmem Lichtschein
const camouSunTexture = createCosmicTexture([
  [0.00, "rgba(255,245,202,1)"],
  [0.12, "rgba(255,218,145,1)"],
  [0.25, "rgba(242,166,91,.95)"],
  [0.40, "rgba(223,129,75,.45)"],
  [0.65, "rgba(212,107,64,.12)"],
  [1.00, "rgba(212,107,64,0)"]
]);

const camouSun = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: camouSunTexture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  })
);

// Position wird abhängig vom Bildschirm berechnet
camouSun.position.set(8, 5, -25);
camouSun.scale.set(7, 7, 1);

camouSun.renderOrder = -10;

camera.add(camouSun);


/* =========================================
   CAMOU – MINERALISCHER PLANET
========================================= */

function createRockyPlanetTexture() {
  const size = 256;

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);

  // Reproduzierbare, natuerliche Oberflaechenstruktur
  const hash = (x, y) => {
    let n =
      Math.imul(x, 374761393) +
      Math.imul(y, 668265263);

    n = Math.imul(n ^ (n >>> 13), 1274126177);

    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };

  const noise = (x, y) => {
    const ix = Math.floor(x);
    const iy = Math.floor(y);

    const fx = x - ix;
    const fy = y - iy;

    const sx = fx * fx * (3 - 2 * fx);
    const sy = fy * fy * (3 - 2 * fy);

    const a =
      hash(ix, iy) * (1 - sx) +
      hash(ix + 1, iy) * sx;

    const b =
      hash(ix, iy + 1) * (1 - sx) +
      hash(ix + 1, iy + 1) * sx;

    return a * (1 - sy) + b * sy;
  };

  // Lichteinfall von links oben
  const lx = -0.48;
  const ly = 0.58;
  const lz = Math.sqrt(1 - lx * lx - ly * ly);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx =
        (x + 0.5 - size / 2) / (size * 0.445);

      const ny =
        (size / 2 - y - 0.5) / (size * 0.445);

      const r2 = nx * nx + ny * ny;
      const i = (y * size + x) * 4;

      if (r2 >= 1) continue;

      const nz = Math.sqrt(1 - r2);

      const light = Math.max(
        0,
        nx * lx + ny * ly + nz * lz
      );

      const shade = 0.28 + 0.72 * light;

      // Unterschiedlich grosse Gesteinsstrukturen
      const warp =
        noise(nx * 3.1 + 13, ny * 3.1 + 7) - 0.5;

      const u = nx + warp * 0.17;
      const v = ny - warp * 0.13;

      const large = noise(
        u * 5.2 + 27,
        v * 5.2 + 11
      );

      const medium = noise(
        u * 13.7 + 5,
        v * 13.7 + 19
      );

      const fine = noise(
        u * 31.3 + 21,
        v * 31.3 + 31
      );

      const mineral =
        0.58 * large +
        0.30 * medium +
        0.12 * fine;

      const relief = (mineral - 0.5) * 43;

      // Gedämpftes Schieferblau und Lavendelgrau
      const color = [
        106 + relief + (medium - 0.5) * 11,
        109 + relief * 0.88,
        133 + relief * 1.12 + (large - 0.5) * 12
      ];



      const radius = Math.sqrt(r2);

      // Dezentes Streulicht am oberen linken Planetenrand
      const rimLight =
        Math.pow(1 - nz, 5) *
        Math.max(0, nx * -0.55 + ny * 0.80) *
        0.16;

      const vignette =
        1 -
        0.12 * Math.pow(radius, 3) +
        rimLight;

      // Beleuchtung auf die drei Farbkanäle anwenden
      for (let k = 0; k < 3; k++) {
        image.data[i + k] = Math.max(
          0,
          Math.min(
            255,
            Math.round(
              color[k] * shade * vignette
            )
          )
        );
      }
      // Weicher Kugelrand, kein quadratischer Rand
      const edge = Math.min(
        1,
        (1 - Math.sqrt(r2)) * 110
      );

      image.data[i + 3] =
        Math.round(255 * edge);
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  return texture;
}

const camouPlanetTexture = createRockyPlanetTexture();

const camouPlanet = new THREE.Sprite(
  new THREE.SpriteMaterial({
    map: camouPlanetTexture,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    toneMapped: false
  })
);

// Position wird abhängig vom Bildschirm berechnet
camouPlanet.position.set(-8, -4.5, -25);
camouPlanet.scale.set(2.2, 2.2, 1);

camouPlanet.renderOrder = -9;

camera.add(camouPlanet);
/* =========================================
   CAMOU COSMOS
   RESPONSIVE HIMMELSKOERPER
========================================= */

function updateCosmosPositions() {

  const portrait =
    window.innerWidth <= 700 &&
    window.innerHeight > window.innerWidth;

  if (portrait) {

    // Sichtbaren Kameraausschnitt in der
    // Entfernung der Hintergrundobjekte berechnen.
    const depth = 25;

    const halfHeight =
      Math.tan(
        THREE.MathUtils.degToRad(camera.fov / 2)
      ) * depth;

    const halfWidth =
      halfHeight * camera.aspect;

    // Sonne rechts oben, ausserhalb der Kugel
camouSun.position.set(
  halfWidth * 0.65,
  halfHeight * 0.94,
  -depth
);

camouSun.scale.set(
  halfWidth * 0.85,
  halfWidth * 0.85,
  1
);

// Planet links unten, ausserhalb der Kugel
camouPlanet.position.set(
  -halfWidth * 0.65,
  -halfHeight * 0.94,
  -depth
);

camouPlanet.scale.set(
  halfWidth * 0.45,
  halfWidth * 0.45,
  1
);

  } else {

    // Bisherige Desktop-Darstellung
    camouSun.position.set(8, 5, -25);
    camouSun.scale.set(7, 7, 1);

    camouPlanet.position.set(-8, -4.5, -25);
    camouPlanet.scale.set(2.2, 2.2, 1);
  }

  sceneNeedsRender = true;
}
/* ENDE CAMOU COSMOS */
scene.add(
  new THREE.AmbientLight(0xb8d8e1, 1.15)
);

const light = new THREE.DirectionalLight(
  0xffe2b5, 2.1
);

light.position.set(-3, 4, 5);
scene.add(light);

const rim = new THREE.PointLight(
  0x63c9cf, 24, 15
);

rim.position.set(4, -1, -3);
scene.add(rim);

// Die erprobte Szenenstruktur bleibt unveraendert.
// Den Roll-Ausgleich uebernimmt die Kamera, nicht eine zusaetzliche Kugelgruppe.
const globeGroup = new THREE.Group();
scene.add(globeGroup);

const globe = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius, 160, 112
  ),
  new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.88,
    metalness: 0.02
  })
);

globeGroup.add(globe);

const atmosphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius * 1.012, 96, 64
  ),
  new THREE.MeshBasicMaterial({
    color: 0xa9bd9f,
    transparent: true,
    opacity: 0.055,
    side: THREE.BackSide
  })
);

globeGroup.add(atmosphere);

/* =========================================
   FREIE POSITIONIERUNG AUF DER KUGEL
========================================= */

const MAP_W = 4096;
const MAP_H = 2048;
const RAD = Math.PI / 180;

// Neigung der gesamten Komposition um ihre eigene Kugelmitte.
// HOME, MUSIC, VISUALS, ECHOES, CONTACT.
// Negativ = rechts / im Uhrzeigersinn.
const CAMOU_PANEL_ROLL_DEG = [0, -90, 180, 0, 20];

const PHOTO_W = 440;
const PHOTO_H = 320;
const PHOTO_Y = 136;
const COMPASS_Y = 115;

/*
  lon: Längengrad
  lat: Breitengrad
  tilt: Neigung der gesamten Komposition
  photoTilt: zusätzliche Neigung des Bildes
  imageX: horizontale Bildverschiebung
  textX: horizontale Textverschiebung
*/

const PLACES = [
  // 01 HOME – obere Halbkugel
  {
    lon: -150,
    lat: 45,
    tilt: -7,
    photoTilt: 6,
    imageX: 38,
    textX: -32
  },

  // 02 MUSIC – untere Halbkugel
  {
    lon: -120,
    lat: -45,
    tilt: 11,
    photoTilt: -6,
    imageX: -35,
    textX: 36
  },

  // 03 VISUALS – obere Halbkugel
  {
    lon: 0,
    lat: 45,
    tilt: -12,
    photoTilt: 7,
    imageX: 32,
    textX: -28
  },

  // 04 ECHOES – untere Halbkugel
  {
    lon: -15,
    lat: -45,
    tilt: 10,
    photoTilt: 0,
    imageX: -14,
    textX: 30
  },

  // 05 CONTACT – seitlicher Mittelbereich
  {
    lon: 125,
    lat: -5,
    tilt: -11,
    photoTilt: 8,
    imageX: -30,
    textX: 34
  }
].map(p => {
  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  return {
    ...p,
    x: ((0.25 + p.lon / 360 + 1) % 1) * MAP_W,
    y: (0.5 - p.lat / 180) * MAP_H,
    tiltR: p.tilt * RAD,
    photoR: p.photoTilt * RAD,
    nx: Math.cos(lat) * Math.sin(lon),
    ny: Math.sin(lat),
    nz: Math.cos(lat) * Math.cos(lon)
  };
});

/* =========================================
   ZUSTAND
========================================= */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const pointers = new Map();

let rotationX = PLACES[0].lat * RAD;
let rotationY = -PLACES[0].lon * RAD;

let velocityX = 0;
let velocityY = 0;

let previousX = 0;
let previousY = 0;
let lastTime = 0;

let isDragging = false;
let menuAnimating = false;

/* =========================================
   CAMOU – NAVIGATIONSFLUG
========================================= */

// Grosse Standardansicht
const CAMOU_FOCUS_ZOOM = mobile ? 6.0 : 6.2;

// Kugel-Gesamtansicht
const CAMOU_OVERVIEW_ZOOM = mobile ? 11.4 : 11.6;

// Animationsdauer in Millisekunden
const CAMOU_ZOOM_OUT_MS = 550;
const CAMOU_ROTATE_MS = 1100;
const CAMOU_ZOOM_IN_MS = 800;

// Animationszustand
let camouNavPhase = "idle";
let camouNavStartedAt = 0;

let camouNavZoomFrom = currentZoom;
let camouNavRotFromX = rotationX;
let camouNavRotFromY = rotationY;
let camouNavRollFrom = 0;
let camouNavTargetRoll = 0;

let targetRotationX = 0;
let targetRotationY = 0;
let pointerStart = null;

let pinchDistance = 0;
let pinchZoom = currentZoom;
let pinchAngle = 0;

let globeCanvas = null;
let globeContext = null;
let globeTexture = null;
let baseTextureCanvas = null;
let sceneNeedsRender = true;

let visualImages = [];
let visualIndex = 0;
let visualLeverPointer = null;
let visualLeverMoved = false;
let visualLeverStartY = 0;

/* =========================================
   HOME VIDEO
========================================= */

const homeVideo = document.createElement("video");

homeVideo.src = ASSETS.homeVideo;
homeVideo.loop = true;
homeVideo.playsInline = true;
homeVideo.preload = "none";
homeVideo.volume = 1;

let homeVideoStarted = false;
let homeVideoPlaying = false;
let homeVideoStarting = false;
let homeVideoFrameRequest = null;
let lastVideoFallbackPaint = 0;

function startHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null ||
    typeof homeVideo.requestVideoFrameCallback !== "function"
  ) return;

  const onVideoFrame = () => {
    homeVideoFrameRequest = null;
    if (!homeVideoPlaying) return;

    updateHomeVideoFrame();

    homeVideoFrameRequest =
      homeVideo.requestVideoFrameCallback(onVideoFrame);
  };

  homeVideoFrameRequest =
    homeVideo.requestVideoFrameCallback(onVideoFrame);
}

function stopHomeVideoFrameUpdates() {
  if (
    homeVideoFrameRequest !== null &&
    typeof homeVideo.cancelVideoFrameCallback === "function"
  ) {
    homeVideo.cancelVideoFrameCallback(
      homeVideoFrameRequest
    );
  }

  homeVideoFrameRequest = null;
}

/* =========================================
   BILDER UND GRAFIKEN
========================================= */

function loadImage(src) {
  return new Promise(resolve => {
    const img = new Image();

    img.onload = () => resolve(img);

    img.onerror = () => {
      const canvas = document.createElement("canvas");

      canvas.width = 1024;
      canvas.height = 1024;

      const ctx = canvas.getContext("2d");
      const gradient = ctx.createLinearGradient(
        0, 0, 1024, 1024
      );

      gradient.addColorStop(0, "#354a39");
      gradient.addColorStop(1, "#0a1510");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1024, 1024);

      resolve(canvas);
    };

    img.src = src;
  });
}

function cover(ctx, image, x, y, w, h) {
  const iw =
    image.videoWidth ||
    image.naturalWidth ||
    image.width;

  const ih =
    image.videoHeight ||
    image.naturalHeight ||
    image.height;

  if (!iw || !ih) return;

  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;

  ctx.drawImage(
    image,
    (iw - sw) / 2,
    (ih - sh) / 2,
    sw,
    sh,
    x,
    y,
    w,
    h
  );
}

function playButton(ctx, x, y) {
  ctx.save();

  ctx.beginPath();
  ctx.arc(x, y, 24, 0, Math.PI * 2);

  ctx.fillStyle = "rgba(8,13,10,.72)";
  ctx.fill();

  ctx.strokeStyle = "#f0f2eb";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x - 6, y - 10);
  ctx.lineTo(x + 11, y);
  ctx.lineTo(x - 6, y + 10);
  ctx.closePath();

  ctx.fillStyle = "#f0f2eb";
  ctx.fill();
  ctx.restore();
}

/* =========================================
   ORGANISCHER HINTERGRUND
========================================= */


function drawBackground(ctx, width, height) {
  const small = document.createElement("canvas");
  small.width = 512;
  small.height = 256;

  const g = small.getContext("2d");
  const image = g.createImageData(512, 256);

  // Positionen von VISUALS und ECHOES auf der Kugel
  const centers = [PLACES[2], PLACES[3]].map(p => ({
    lat: p.lat * RAD,
    lon: p.lon * RAD
  }));

  for (let y = 0; y < 256; y++) {
    const v = y / 255;

    const lat = (0.5 - v) * Math.PI;
    const sinLat = Math.sin(lat);
    const cosLat = Math.cos(lat);

    for (let x = 0; x < 512; x++) {
      const u = x / 512;
      const lon = (u - 0.25) * Math.PI * 2;

      // Bisherige Grundfarben erhalten
      const pole = smooth(
        Math.min(
          1,
          Math.min(v, 1 - v) / 0.24
        )
      );

      const wave = Math.sin(
        u * Math.PI * 2 + v * 2.2
      );

      const glow = Math.cos(
        u * Math.PI * 4 - v * 3.1
      );

      // Bestehende organische Stroemungen
      const flow1 = Math.sin(
        u * Math.PI * 6 +
        Math.sin(v * Math.PI * 4) * 1.8
      );

      const flow2 = Math.cos(
        u * Math.PI * 4 +
        Math.sin(v * Math.PI * 6) * 1.5
      );

      const flow3 = Math.sin(
        u * Math.PI * 8 +
        Math.cos(v * Math.PI * 5)
      );

      const organic =
        flow1 * 0.45 +
        flow2 * 0.35 +
        flow3 * 0.20;

      const base = [17, 67, 89];

      const target = [
        32 + wave * 18 + organic * 24,
        131 + glow * 22 + organic * 31,
        145 + wave * 20 + organic * 38
      ];

      const color = base.map((value, i) =>
        lerp(value, target[i], pole)
      );

      const lighting =
        (
          1 +
          0.035 *
          Math.cos(2 * Math.PI * (u - 0.25)) *
          Math.sin(Math.PI * v)
        ) *
        (
          1 -
          0.07 *
          Math.pow(Math.abs(v - 0.5) * 2, 2)
        );

      // Grossflaechige, unregelmaessige Farbstruktur
      const marbling =
        Math.sin(
          u * Math.PI * 8 +
          Math.sin(v * Math.PI * 4) * 1.4
        ) * 0.47 +

        Math.cos(
          u * Math.PI * 12 -
          v * Math.PI * 5
        ) * 0.30 +

        Math.sin(
          v * Math.PI * 7 +
          Math.cos(u * Math.PI * 6)
        ) * 0.23;

      // Gruene Farbanteile um VISUALS und ECHOES
      let greenInfluence = 0;

      for (const center of centers) {
        const dot = clamp(
          sinLat * Math.sin(center.lat) +
          cosLat *
          Math.cos(center.lat) *
          Math.cos(lon - center.lon),
          -1,
          1
        );

        const angle = Math.acos(dot);

        const reach =
          0.34 + 0.10 * marbling;

        const influence =
          1 - smooth(
            (angle - reach) / 1.05
          );


        greenInfluence =
          1 -
          (1 - greenInfluence) *
          (1 - influence);
      }

      // Weicher, grossflaechiger Uebergang
      const mix = clamp(
        greenInfluence *
        (0.66 + 0.09 * organic),
        0,
        0.78
      );

      const forest = [
        12 + marbling * 4,
        48 + marbling * 10,
        34 + marbling * 6
      ];

      const j = (y * 512 + x) * 4;

      for (let k = 0; k < 3; k++) {
        image.data[j + k] = clamp(
          lerp(
            color[k],
            forest[k],
            mix
          ) * lighting,
          0,
          255
        );
      }

      image.data[j + 3] = 255;
    }
  }

  g.putImageData(image, 0, 0);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(
    small,
    0,
    0,
    width,
    height
  );
}

/* =========================================
   ECHOES / KOMPASS / SOCIAL LINKS
========================================= */

const SOCIAL = [
  {
    name: "SPOTIFY",
    angle: -Math.PI / 2,
    url: "https://open.spotify.com/intl-de/artist/7pajHvUWNCnOPhDPyH4M6x"
  },
  {
    name: "APPLE",
    angle: 0,
    url: "https://music.apple.com/ch/artist/b3nn3t/1786857463"
  },
  {
    name: "YOUTUBE",
    angle: Math.PI / 2,
    url: "https://www.youtube.com/@b333nn3t"
  },
  {
    name: "INSTAGRAM",
    angle: Math.PI,
    url: "https://www.instagram.com/b3nn3t"
  }
];

const compassRadius = 132;

let needleAngle = 0;
let targetNeedleAngle = 0;
let fallbackAngle = 0;


let lastGlobeX = rotationX;
let lastGlobeY = rotationY;
let lastCompassDraw = 0;

let motionAngle = 0;
let motionLastAt = 0;

let orientationPrevious = null;
let orientationLastAt = 0;
let motionPreviousTime = 0;

let sensorHeading = null;
let headingLastAt = 0;

let sensorOptIn = false;
let sensorRequestPending = false;
let sensorStatusText = "KUGELSTEUERUNG";

const fresh = (timestamp, ms = 2200) =>
  timestamp > 0 &&
  performance.now() - timestamp < ms;

function registerMotion(delta) {
  if (!Number.isFinite(delta)) return;

  motionAngle = wrapAngle(
    motionAngle + clamp(delta, -0.18, 0.18)
  );

  motionLastAt = performance.now();
}

function onOrientation(event) {
  const now = performance.now();

  const alpha = event.alpha;
  const beta = event.beta;
  const gamma = event.gamma;

  if (
    ![alpha, beta, gamma].some(Number.isFinite)
  ) return;

  if (Number.isFinite(event.webkitCompassHeading)) {
    sensorHeading = event.webkitCompassHeading;
    headingLastAt = now;
  } else if (
    event.absolute === true &&
    Number.isFinite(alpha)
  ) {
    const screenAngle =
      Number.isFinite(screen.orientation?.angle)
        ? screen.orientation.angle
        : 0;

    sensorHeading =
      ((360 - alpha + screenAngle) % 360 + 360) % 360;

    headingLastAt = now;
  }

  const current = { alpha, beta, gamma };

  if (orientationPrevious) {
    const difference = (a, b) =>
      Number.isFinite(a) && Number.isFinite(b)
        ? wrapAngle((a - b) * Math.PI / 180)
        : 0;

    const da = difference(
      alpha, orientationPrevious.alpha
    );

    const db = difference(
      beta, orientationPrevious.beta
    );

    const dg = difference(
      gamma, orientationPrevious.gamma
    );

    registerMotion(
      -da * 0.85 +
      db * 0.35 +
      dg * 0.55
    );
  } else {
    motionLastAt = now;
  }

  orientationPrevious = current;
  orientationLastAt = now;
}

window.addEventListener(
  "deviceorientation",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "deviceorientationabsolute",
  onOrientation,
  { passive: true }
);

window.addEventListener(
  "devicemotion",
  event => {
    const now = performance.now();

    if (now - orientationLastAt < 450) return;

    const rate = event.rotationRate;
    const acceleration =
      event.accelerationIncludingGravity;

    const dt = motionPreviousTime
      ? Math.min(
          0.1,
          (now - motionPreviousTime) / 1000
        )
      : 0.016;

    motionPreviousTime = now;

    if (
      rate &&
      [rate.alpha, rate.beta, rate.gamma]
        .some(Number.isFinite)
    ) {
      registerMotion(
        (
          (Number(rate.alpha) || 0) * -0.85 +
          (Number(rate.beta) || 0) * 0.35 +
          (Number(rate.gamma) || 0) * 0.55
        ) * Math.PI / 180 * dt
      );
    } else if (
      acceleration &&
      Number.isFinite(acceleration.x) &&
      Number.isFinite(acceleration.y)
    ) {
      registerMotion(
        clamp(
          (acceleration.x - acceleration.y) * 0.0005,
          -0.012,
          0.012
        )
      );
    }
  },
  { passive: true }
);

function sensorMode() {
  if (!sensorOptIn) return "KUGELSTEUERUNG";

  if (fresh(headingLastAt)) {
    return "KOMPASS AKTIV";
  }

  if (fresh(motionLastAt)) {
    return "BEWEGUNG AKTIV";
  }

  return "KUGELSTEUERUNG";
}

const SENSOR_CONTROL = {
  y: COMPASS_Y + 207,
  checkboxX: -109,
  labelX: -85,
  hitLeft: -130,
  hitRight: 130,
  hitTop: -21,
  hitBottom: 30
};

function drawSensorControl(ctx, cx) {
  const cy = SENSOR_CONTROL.y;

  ctx.save();

  ctx.textBaseline = "middle";
  ctx.textAlign = "left";

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(225,238,220,.7)";

  ctx.strokeRect(
    cx + SENSOR_CONTROL.checkboxX,
    cy - 7,
    14,
    14
  );

  if (sensorOptIn) {
    ctx.strokeStyle = "#d9e8d2";
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    ctx.moveTo(
      cx + SENSOR_CONTROL.checkboxX + 2,
      cy
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 6,
      cy + 4
    );

    ctx.lineTo(
      cx + SENSOR_CONTROL.checkboxX + 13,
      cy - 5
    );

    ctx.stroke();
  }

  ctx.font = "500 11px 'DM Mono', monospace";
  ctx.fillStyle = "#e5eee0";

  ctx.fillText(
    "SENSOR AKTIVIEREN",
    cx + SENSOR_CONTROL.labelX,
    cy
  );

  ctx.font = "9px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(193,211,188,.82)";

  ctx.fillText(
    sensorStatusText,
    cx,
    cy + 23,
    260
  );

  ctx.restore();
}

function requestSensorAccess() {
  if (sensorRequestPending) return;

  sensorOptIn = !sensorOptIn;

  if (!sensorOptIn) {
    fallbackAngle = needleAngle;
    targetNeedleAngle = needleAngle;
    sensorStatusText = "KUGELSTEUERUNG";
    refreshEchoesTexture();
    return;
  }

  if (!window.isSecureContext) {
    sensorOptIn = false;
    sensorStatusText = "HTTPS ERFORDERLICH";
    refreshEchoesTexture();
    return;
  }

  const requests = [];

  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceOrientationEvent.requestPermission()
      );
    }

    if (
      typeof DeviceMotionEvent !== "undefined" &&
      typeof DeviceMotionEvent.requestPermission ===
        "function"
    ) {
      requests.push(
        DeviceMotionEvent.requestPermission()
      );
    }
  } catch (error) {
    sensorOptIn = false;
    sensorStatusText = "FREIGABE NICHT MÖGLICH";
    refreshEchoesTexture();
    return;
  }

  if (!requests.length) {
    sensorStatusText = "SENSOREN WERDEN GEPRÜFT";
    refreshEchoesTexture();
    return;
  }

  sensorRequestPending = true;
  sensorStatusText = "FREIGABE WIRD GEPRÜFT";
  refreshEchoesTexture();

  Promise.allSettled(requests).then(results => {
    sensorRequestPending = false;

    if (
      results.some(
        result =>
          result.status === "fulfilled" &&
          result.value === "granted"
      )
    ) {
      sensorStatusText = "WARTE AUF SENSORDATEN";
    } else {
      sensorOptIn = false;
      sensorStatusText = "FREIGABE NICHT ERTEILT";
    }

    refreshEchoesTexture();
  });
}

function socialIcon(ctx, name, x, y) {
  ctx.save();
  ctx.translate(x, y);

  ctx.strokeStyle = "#eef5eb";
  ctx.fillStyle = "#eef5eb";
  ctx.lineWidth = 2.7;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  if (name === "SPOTIFY") {
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        0,
        8 + i * 3,
        17 - i * 4,
        Math.PI * 1.18,
        Math.PI * 1.83
      );
      ctx.stroke();
    }
  } else if (name === "APPLE") {


    ctx.font = "bold 28px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("♫", 0, 1);
  } else if (name === "YOUTUBE") {
    ctx.beginPath();
    ctx.roundRect(-17, -12, 34, 24, 7);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-4, -7);
    ctx.lineTo(8, 0);
    ctx.lineTo(-4, 7);
    ctx.closePath();
    ctx.fill();
  } else if (name === "INSTAGRAM") {
    ctx.beginPath();
    ctx.roundRect(-15, -15, 30, 30, 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(9, -9, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawCompass(ctx, cx, cy) {
  ctx.save();

  const gradient = ctx.createRadialGradient(
    cx - 32,
    cy - 44,
    10,
    cx,
    cy,
    185
  );

  gradient.addColorStop(0, "#24372b");
  gradient.addColorStop(0.7, "#0e1912");
  gradient.addColorStop(1, "#050b07");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(cx, cy, 174, 0, Math.PI * 2);
  ctx.fill();


  // Feiner Metallrand mit leicht wechselnder Helligkeit.
  const rimMetal = ctx.createLinearGradient(
    cx - 174, cy - 174,
    cx + 174, cy + 174
  );

  rimMetal.addColorStop(
    0, "rgba(142,177,151,.40)"
  );

  rimMetal.addColorStop(
    0.32, "rgba(207,225,206,.72)"
  );

  rimMetal.addColorStop(
    0.68, "rgba(101,143,117,.38)"
  );

  rimMetal.addColorStop(
    1, "rgba(171,198,175,.58)"
  );

  ctx.strokeStyle = rimMetal;
  ctx.lineWidth = 1.3;
  ctx.stroke();

  // Schmale dunkle Fuge zwischen Gehaeuse und Glas.
  ctx.strokeStyle = "rgba(7,19,14,.72)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 169, 0, Math.PI * 2);
  ctx.stroke();

  // Zurueckhaltender innerer Rand.
  ctx.strokeStyle = "rgba(160,192,166,.19)";
  ctx.lineWidth = 0.8;

  ctx.beginPath();
  ctx.arc(cx, cy, 163, 0, Math.PI * 2);
  ctx.stroke();


  for (let i = 0; i < 120; i++) {
    const angle =
      i * Math.PI / 60 - Math.PI / 2;

    const major = i % 10 === 0;

    const inner = major
      ? 148
      : i % 5 === 0
        ? 154
        : 159;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * inner,
      cy + Math.sin(angle) * inner
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 163,
      cy + Math.sin(angle) * 163
    );

    ctx.strokeStyle = major
      ? "rgba(240,248,237,.9)"
      : "rgba(240,248,237,.5)";

    ctx.lineWidth = major ? 1.8 : 0.8;
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(220,237,216,.18)";
  ctx.lineWidth = 1;

  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4;

    ctx.beginPath();

    ctx.moveTo(
      cx + Math.cos(angle) * 58,
      cy + Math.sin(angle) * 58
    );

    ctx.lineTo(
      cx + Math.cos(angle) * 115,
      cy + Math.sin(angle) * 115
    );

    ctx.stroke();
  }


  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(needleAngle);

  // Sehr weicher Schatten unter der Nadel.
  ctx.shadowColor = "rgba(0,0,0,.55)";
  ctx.shadowBlur = 5;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  // Rote Spitze mit dezenter seitlicher Schattierung.
  const redMetal = ctx.createLinearGradient(
    -12, 0, 12, 0
  );

  redMetal.addColorStop(0, "#a52b25");
  redMetal.addColorStop(0.42, "#ed4438");
  redMetal.addColorStop(1, "#ff6656");

  ctx.fillStyle = redMetal;

  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(-12, 8);
  ctx.lineTo(0, -3);
  ctx.lineTo(12, 8);
  ctx.closePath();
  ctx.fill();

  // Helle Spitze: warmes Metall statt flaches Weiss.
  const paleMetal = ctx.createLinearGradient(
    -12, 0, 12, 0
  );

  paleMetal.addColorStop(0, "#a6b7aa");
  paleMetal.addColorStop(0.45, "#e9eee5");
  paleMetal.addColorStop(1, "#fffdf0");

  ctx.fillStyle = paleMetal;

  ctx.beginPath();
  ctx.moveTo(0, 112);
  ctx.lineTo(-12, -8);
  ctx.lineTo(0, 3);
  ctx.lineTo(12, -8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();



  // =========================================
  // GEWOELBTE GLASABDECKUNG
  // =========================================

  ctx.save();

  // Spiegelungen nur innerhalb des Kompasses
  ctx.beginPath();
  ctx.arc(cx, cy, 169, 0, Math.PI * 2);
  ctx.clip();

  const glass = ctx.createLinearGradient(
    cx - 140,
    cy - 165,
    cx + 135,
    cy + 170
  );

  glass.addColorStop(
    0,
    "rgba(235,251,234,.17)"
  );

  glass.addColorStop(
    0.28,
    "rgba(198,235,213,.045)"
  );

  glass.addColorStop(
    0.55,
    "rgba(255,255,255,0)"
  );

  glass.addColorStop(
    1,
    "rgba(0,15,11,.23)"
  );

  ctx.fillStyle = glass;
  ctx.fillRect(
    cx - 170,
    cy - 170,
    340,
    340
  );

  ctx.restore();

  // =========================================
  // VIER GEWOELBTE SOCIAL-GLASKNOEPFE
  // =========================================

  for (const item of SOCIAL) {
    const x =
      cx + Math.cos(item.angle) * compassRadius;

    const y =
      cy + Math.sin(item.angle) * compassRadius;

    ctx.save();

    // Tiefe unterhalb des Glasknopfes
    ctx.shadowColor = "rgba(0,0,0,.7)";
    ctx.shadowBlur = 13;
    ctx.shadowOffsetY = 4;

    // Gewoelbtes, gruenliches Glas
    const buttonGlass = ctx.createRadialGradient(
      x - 10,
      y - 12,
      2,
      x + 3,
      y + 5,
      39
    );

    buttonGlass.addColorStop(
      0,
      "#789686"
    );

    buttonGlass.addColorStop(
      0.22,
      "#3c6250"
    );

    buttonGlass.addColorStop(
      0.58,
      "#142c23"
    );

    buttonGlass.addColorStop(
      1,
      "#07140f"
    );

    ctx.fillStyle = buttonGlass;

    ctx.beginPath();
    ctx.arc(
      x,
      y,
      31,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // Praegnanter heller Metall-/Glasring

ctx.strokeStyle =
  "rgba(166,204,178,.58)";

ctx.lineWidth = 1.2;
ctx.stroke();


    // Spiegelung auf der Oberseite
    ctx.beginPath();
    ctx.arc(
      x,
      y,
      24,
      Math.PI * 1.12,
      Math.PI * 1.76
    );

ctx.strokeStyle =
  "rgba(205,233,207,.22)";

ctx.lineWidth = 1.1;
ctx.stroke();

    // Bestehendes Spotify-/Apple-/
    // YouTube-/Instagram-Symbol
    socialIcon(
      ctx,
      item.name,
      x,
      y
    );

    ctx.restore();
  }

  ctx.fillStyle = "#15231a";
  ctx.strokeStyle = "#e1ebe0";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#dbe7d6";
  ctx.beginPath();
  ctx.arc(cx, cy, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/* =========================================
   ANALOGER DIA-BETRACHTER
========================================= */

function drawVisualViewer(ctx, cx, iy, iw, ih) {
  const image = visualImages[visualIndex];

  const bodyW = iw + 112;
  const bodyH = ih + 100;

  const bodyX = cx - bodyW / 2;
  const bodyY = iy - 50;

  const windowX = cx - iw / 2 + 13;
  const windowY = iy + 13;

  const windowW = iw - 26;
  const windowH = ih - 26;

  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,.65)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 13;

  const bodyGradient = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY + bodyH
  );

  bodyGradient.addColorStop(0, "#75816e");
  bodyGradient.addColorStop(0.18, "#3b493b");
  bodyGradient.addColorStop(0.55, "#1b281f");
  bodyGradient.addColorStop(0.82, "#354334");
  bodyGradient.addColorStop(1, "#101811");

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();

  ctx.roundRect(
    bodyX, bodyY, bodyW, bodyH, 30
  );

  ctx.fill();
  ctx.restore();

  ctx.save();

  ctx.strokeStyle = "rgba(218,231,207,.65)";
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(
    bodyX, bodyY, bodyW, bodyH, 30
  );
  ctx.stroke();

  ctx.strokeStyle = "rgba(0,0,0,.65)";
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.roundRect(
    bodyX + 7,
    bodyY + 7,
    bodyW - 14,
    bodyH - 14,
    24
  );
  ctx.stroke();

  const highlight = ctx.createLinearGradient(
    bodyX,
    bodyY,
    bodyX + bodyW,
    bodyY
  );

  highlight.addColorStop(0, "rgba(255,255,255,0)");
  highlight.addColorStop(0.25, "rgba(255,255,255,.2)");
  highlight.addColorStop(0.75, "rgba(255,255,255,.08)");
  highlight.addColorStop(1, "rgba(255,255,255,0)");

  ctx.strokeStyle = highlight;
  ctx.lineWidth = 2;

  ctx.beginPath();
  ctx.moveTo(bodyX + 32, bodyY + 10);
  ctx.lineTo(bodyX + bodyW - 32, bodyY + 10);
  ctx.stroke();

  const screws = [
    [bodyX + 22, bodyY + 22],
    [bodyX + bodyW - 22, bodyY + 22],
    [bodyX + 22, bodyY + bodyH - 22],
    [bodyX + bodyW - 22, bodyY + bodyH - 22]
  ];

  for (const [sx, sy] of screws) {
    ctx.fillStyle = "#101711";
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(221,232,213,.55)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.strokeStyle = "rgba(0,0,0,.8)";
    ctx.beginPath();
    ctx.moveTo(sx - 3, sy + 3);
    ctx.lineTo(sx + 3, sy - 3);
    ctx.stroke();
  }

  const frameGradient = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX,
    windowY + windowH
  );

  frameGradient.addColorStop(0, "#050906");
  frameGradient.addColorStop(0.5, "#18231b");
  frameGradient.addColorStop(1, "#050906");

  ctx.fillStyle = frameGradient;

  ctx.beginPath();
  ctx.roundRect(
    windowX - 13,
    windowY - 13,
    windowW + 26,
    windowH + 26,
    14
  );

  ctx.fill();

  ctx.strokeStyle = "rgba(210,225,200,.65)";
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.save();
  ctx.beginPath();

  ctx.roundRect(
    windowX,
    windowY,
    windowW,
    windowH,
    5
  );

  ctx.clip();

  if (image) {
    cover(
      ctx,
      image,
      windowX,
      windowY,
      windowW,
      windowH
    );
  } else {
    ctx.fillStyle = "#101811";
    ctx.fillRect(
      windowX,
      windowY,
      windowW,
      windowH
    );
  }

  const reflection = ctx.createLinearGradient(
    windowX,
    windowY,
    windowX + windowW * 0.8,
    windowY + windowH
  );

  reflection.addColorStop(
    0, "rgba(255,255,255,.18)"
  );
  reflection.addColorStop(
    0.35, "rgba(255,255,255,.035)"
  );
  reflection.addColorStop(
    1, "rgba(255,255,255,0)"
  );

  ctx.fillStyle = reflection;

  ctx.fillRect(
    windowX,
    windowY,
    windowW,
    windowH
  );

  ctx.restore();

  ctx.fillStyle = "rgba(224,235,216,.8)";
  ctx.font = "bold 15px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText(
    "CAMOU  /  VIEWER",
    cx,
    bodyY + bodyH - 15
  );

  const leverX = cx + iw / 2 + 43;
  const leverTop = iy + 15;
  const leverBottom = iy + ih * 0.72;

  const knobY =
    leverTop +
    (leverBottom - leverTop) * 0.30;

  const railGradient = ctx.createLinearGradient(
    leverX - 9,
    0,
    leverX + 9,
    0
  );

  railGradient.addColorStop(0, "#090e0a");
  railGradient.addColorStop(0.5, "#a7b39b");
  railGradient.addColorStop(1, "#101711");

  ctx.fillStyle = railGradient;
  ctx.beginPath();

  ctx.roundRect(
    leverX - 8,
    leverTop,
    16,
    leverBottom - leverTop,
    8
  );

  ctx.fill();
  ctx.strokeStyle = "rgba(220,232,212,.65)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  const rodGradient = ctx.createLinearGradient(
    leverX - 5,
    0,
    leverX + 5,
    0
  );

  rodGradient.addColorStop(0, "#151c16");
  rodGradient.addColorStop(0.45, "#d1d9c9");
  rodGradient.addColorStop(1, "#394638");

  ctx.strokeStyle = rodGradient;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";

  ctx.beginPath();
  ctx.moveTo(leverX, knobY);
  ctx.lineTo(leverX, knobY + 38);
  ctx.stroke();

  const knobGradient = ctx.createRadialGradient(
    leverX - 8,
    knobY - 8,
    2,
    leverX,
    knobY,
    23
  );

  knobGradient.addColorStop(0, "#dce5d3");
  knobGradient.addColorStop(0.35, "#82917a");
  knobGradient.addColorStop(0.75, "#354333");
  knobGradient.addColorStop(1, "#111a12");

  ctx.fillStyle = knobGradient;
  ctx.beginPath();
  ctx.arc(leverX, knobY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(225,237,215,.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  // Dezente PRESS-Markierung.
  ctx.save();

  ctx.shadowColor = "rgba(190,235,165,.65)";
  ctx.shadowBlur = 16;
  ctx.strokeStyle = "#c5e8b6";
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(leverX, knobY, 24, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
  ctx.save();

  ctx.font = "700 15px 'DM Mono', monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#101b12";

  ctx.fillText(
    "PRESS",
    leverX,
    knobY + 1,
    38
  );

  ctx.restore();

  ctx.fillStyle = "rgba(226,237,218,.85)";
  ctx.font = "bold 22px Arial";
  ctx.textAlign = "center";

  ctx.fillText(
    "↓",
    leverX,
    leverBottom + 25
  );

  ctx.fillStyle = "#dce7d5";
  ctx.font = "bold 15px 'DM Mono', monospace";
  ctx.textAlign = "right";

  ctx.fillText(
    `${String(visualIndex + 1).padStart(2, "0")} / ${String(visualImages.length).padStart(2, "0")}`,
    bodyX + bodyW - 25,
    bodyY + bodyH - 15
  );

  ctx.restore();
}


let camouVisualSlideLoading = null;

function camouEnsureVisualSlides() {
  if (camouVisualSlideLoading) {
    return camouVisualSlideLoading;
  }

  camouVisualSlideLoading = Promise.all(
    ASSETS.visualSlides.slice(1).map(loadImage)
  ).then(images => {
    images.forEach((image, i) => {
      visualImages[i + 1] = image;
    });

    refreshVisualsTexture();
  });

  return camouVisualSlideLoading;
}

function advanceVisualSlide() {
  if (!visualImages.length) return;

  if (visualImages.some(image => !image)) {
    camouEnsureVisualSlides().then(() => {
      visualIndex =
        (visualIndex + 1) % visualImages.length;

      refreshVisualsTexture();
    });

    return;
  }

  visualIndex =
    (visualIndex + 1) % visualImages.length;

  refreshVisualsTexture();
}


function refreshVisualsTexture() {
  refreshIsland(2);
}

/* =========================================
   ÖFFNEN-BESCHRIFTUNG
========================================= */

function drawOpenLabel(ctx, cx, ix, iy, iw, ih) {
  ctx.save();

  ctx.beginPath();
  ctx.rect(ix, iy, iw, ih);
  ctx.clip();

  const shade = ctx.createLinearGradient(
    0,
    iy + ih - 100,
    0,
    iy + ih
  );

  shade.addColorStop(
    0, "rgba(5,12,8,0)"
  );

  shade.addColorStop(
    1, "rgba(5,12,8,.85)"
  );

  ctx.fillStyle = shade;

  ctx.fillRect(
    ix,
    iy + ih - 100,
    iw,
    100
  );

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#edf4e9";
  ctx.font = "500 21px 'DM Mono', monospace";

  ctx.fillText(
    "ÖFFNEN  ↗",
    cx,
    iy + ih - 33,
    iw - 24
  );

  ctx.restore();
}

/* =========================================
   FREI PLATZIERTE BEREICHE
========================================= */

function eachIslandInstance(index, callback) {
  const p = PLACES[index];

  for (const shift of [-MAP_W, 0, MAP_W]) {
    if (
      shift !== 0 &&
      p.x + shift < -460
    ) continue;

    if (
      shift !== 0 &&
      p.x + shift > MAP_W + 460
    ) continue;

    callback(p.x + shift, p.y, p);
  }
}

function islandTransform(ctx, x, y, p) {
  ctx.translate(x, y);
  ctx.rotate(p.tiltR);
}

function paintPhoto(
  ctx,
  index,
  image,
  onlyVideo = false
) {
  const p = PLACES[index];

  ctx.save();
  ctx.translate(p.imageX, PHOTO_Y);
  ctx.rotate(p.photoR);

  if (!onlyVideo) {
    ctx.fillStyle = "rgba(7,12,9,.92)";

    ctx.fillRect(
      -PHOTO_W / 2 - 8,
      -PHOTO_H / 2 - 8,
      PHOTO_W + 16,
      PHOTO_H + 16
    );
  }

  ctx.save();

  ctx.beginPath();
  ctx.rect(
    -PHOTO_W / 2,
    -PHOTO_H / 2,
    PHOTO_W,
    PHOTO_H
  );
  ctx.clip();

  if (
    index === 0 &&
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    cover(
      ctx,
      homeVideo,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (homeVideo.paused) {
      playButton(ctx, 0, 0);
    }
  } else if (!onlyVideo) {
    cover(
      ctx,
      image,
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    if (index === 0) {
      playButton(ctx, 0, 0);
    }
  }

  ctx.restore();

  if (!onlyVideo) {
    if (index === 1 || index === 4) {
      drawOpenLabel(
        ctx,
        0,
        -PHOTO_W / 2,
        -PHOTO_H / 2,
        PHOTO_W,
        PHOTO_H
      );
    }

    ctx.strokeStyle = "rgba(225,237,220,.52)";
    ctx.lineWidth = 2;

    ctx.strokeRect(
      -PHOTO_W / 2,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );
  }

  ctx.restore();
}

function drawPanel(ctx, index, image) {
  const section = sections[index];
  const p = PLACES[index];
  const textX = p.textX;

  ctx.save();
  ctx.textAlign = "center";

  // Dezente Linie statt rechteckiger Bereichsgrenze.
  ctx.strokeStyle = "rgba(207,226,200,.27)";
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(textX - 105, -351);
  ctx.lineTo(textX + 105, -351);
  ctx.stroke();

  // Kategorie.
  ctx.fillStyle = "rgba(231,242,225,.65)";
  ctx.font = "500 19px 'DM Mono', monospace";

  ctx.fillText(
    section.eyebrow,
    textX,
    -318,
    610
  );

  // Titel.
  ctx.fillStyle = "#f0f2eb";
  ctx.font = "300 58px Manrope, Arial";

  section.title.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -247 + i * 68,
      600
    );
  });

  // Beschreibung.
  ctx.fillStyle = "rgba(236,242,232,.87)";
  ctx.font = "400 22px Manrope, Arial";

  section.body.forEach((line, i) => {
    ctx.fillText(
      line,
      textX,
      -180 + i * 36,
      650
    );
  });

  if (index === 2) {
    // Visuals – geneigter mechanischer Betrachter.
    ctx.save();

    ctx.translate(p.imageX, PHOTO_Y);
    ctx.rotate(p.photoR);
    ctx.scale(
      CONFIG.visualScale,
      CONFIG.visualScale
    );

    drawVisualViewer(
      ctx,
      0,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    ctx.restore();
  } else if (index === 3) {
    // Echoes – Kompass.
    drawCompass(
      ctx,
      p.imageX,
      COMPASS_Y
    );

    drawSensorControl(
      ctx,
      p.imageX
    );
  } else {
    // Home, Music, Contact.
    paintPhoto(ctx, index, image);
  }

  // Kleine Sektionsnummer.
  ctx.fillStyle = "rgba(225,235,219,.62)";
  ctx.font = "500 17px 'DM Mono', monospace";

  ctx.fillText(
    `${String(index + 1).padStart(2, "0")} / 05`,
    p.imageX + 142,
    376
  );

  ctx.restore();
}

function drawWrappedPanel(ctx, index, image) {
  eachIslandInstance(
    index,
    (x, y, p) => {
      ctx.save();
      islandTransform(ctx, x, y, p);
      drawPanel(ctx, index, image);
      ctx.restore();
    }
  );
}

function refreshIsland(index) {
  if (
    !globeTexture ||
    !globeContext ||
    !baseTextureCanvas
  ) return;

  eachIslandInstance(
    index,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      globeContext.beginPath();
      globeContext.rect(
        -445, -405, 890, 810
      );
      globeContext.clip();

      globeContext.setTransform(
        1, 0, 0, 1, 0, 0
      );

      globeContext.drawImage(
        baseTextureCanvas,
        0,
        0
      );

      globeContext.restore();
    }
  );

  const image = index === 2
    ? visualImages[visualIndex]
    : null;

  drawWrappedPanel(
    globeContext,
    index,
    image
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

function refreshEchoesTexture() {
  refreshIsland(3);
}

/* =========================================
   KUGELTEXTUR ERSTELLEN
========================================= */

async function createGlobeTexture() {
  const canvasFontsReady = document.fonts?.load
    ? Promise.allSettled([
        document.fonts.load("300 58px Manrope"),
        document.fonts.load("400 22px Manrope"),
        document.fonts.load('500 19px "DM Mono"'),
        document.fonts.load('400 19px "DM Mono"')
      ])
    : Promise.resolve();

  const images = await Promise.all([
    ASSETS.home,
    ASSETS.music,
    ASSETS.visuals,
    ASSETS.archive,
    ASSETS.contact
  ].map(loadImage));



  // Erstes VISUALS-Bild bereits vorhanden.
  // Weitere Bilder erst beim Aufruf laden.
  visualImages = [
    images[2],
    ...ASSETS.visualSlides.slice(1).map(() => null)
  ];

  visualIndex = 0;
  await canvasFontsReady;

  globeCanvas = document.createElement("canvas");
  globeCanvas.width = MAP_W;
  globeCanvas.height = MAP_H;
  globeContext = globeCanvas.getContext("2d");

  drawBackground(
    globeContext,
    MAP_W,
    MAP_H
  );

  // Unveränderliche Grundtextur ohne Bilder.
  baseTextureCanvas = document.createElement("canvas");

  baseTextureCanvas.width = MAP_W;
  baseTextureCanvas.height = MAP_H;

  baseTextureCanvas
    .getContext("2d")
    .drawImage(globeCanvas, 0, 0);

  images.forEach((image, index) => {
    drawWrappedPanel(
      globeContext,
      index,
      index === 2 ? visualImages[0] : image
    );
  });

  globeTexture = new THREE.CanvasTexture(
    globeCanvas
  );

  globeTexture.colorSpace = THREE.SRGBColorSpace;
  globeTexture.wrapS = THREE.RepeatWrapping;
globeTexture.wrapT = THREE.ClampToEdgeWrapping;
globeTexture.needsUpdate = true;
   
  globeTexture.anisotropy =
    renderer.capabilities.getMaxAnisotropy();

  return globeTexture;
}

createGlobeTexture()
  .then(texture => {
    globe.material.map = texture;
    globe.material.needsUpdate = true;
    sceneNeedsRender = true;

    console.info(
      "CAMOU: Entdecker-Kugel geladen."
    );
  })
  .catch(error => {
    console.error(
      "CAMOU: Fehler beim Laden der Kugeltextur",
      error
    );
  });

/* =========================================
   VIDEO AUF GENEIGTEM BILDRAHMEN
========================================= */

function updateHomeVideoFrame() {

  if (
    !homeVideoStarted ||
    !globeTexture ||
    homeVideo.readyState < 2
  ) return;

  eachIslandInstance(
    0,
    (x, y, p) => {
      globeContext.save();

      islandTransform(
        globeContext,
        x,
        y,
        p
      );

      paintPhoto(
        globeContext,
        0,
        null,
        true
      );

      globeContext.restore();
    }
  );

  globeTexture.needsUpdate = true;
  sceneNeedsRender = true;
}

/* =========================================
   NAVIGATION / POSITIONEN
========================================= */

function currentIndex() {
  const x =
    -Math.sin(rotationY) * Math.cos(rotationX);

  const y = Math.sin(rotationX);

  const z =
    Math.cos(rotationY) * Math.cos(rotationX);

  let best = 0;
  let bestDot = -Infinity;

  PLACES.forEach((p, i) => {
    const dot =
      x * p.nx +
      y * p.ny +
      z * p.nz;

    if (dot > bestDot) {
      bestDot = dot;
      best = i;
    }
  });

  return best;
}

let lastIndicatorIndex = -1;

function updateIndicator() {
  const index = currentIndex();

  if (index === lastIndicatorIndex) return;
  lastIndicatorIndex = index;

  $("current-section").textContent =
    sections[index].name;

  $("section-number").textContent =
    `${String(index + 1).padStart(2, "0")} / 05`;

  navButtons.forEach((button, i) => {
    button.classList.toggle(
      "active",
      i === index
    );
  });
}

function goToSection(index) {
  const i = ((index % 5) + 5) % 5;
  const p = PLACES[i];

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  pointers.clear();
  pointerStart = null;

  stage.classList.remove("dragging");

  // Zielposition berechnen
  targetRotationX = p.lat * RAD;

  let yaw = -p.lon * RAD;

  while (yaw - rotationY > Math.PI) {
    yaw -= Math.PI * 2;
  }

  while (yaw - rotationY < -Math.PI) {
    yaw += Math.PI * 2;
  }

  targetRotationY = yaw;

  // Die neue Ausrichtung des Zielbereichs beim Zoomen ausgleichen.
  // Roll um die Welt-Z-Achse: Der anvisierte Bereich bleibt frontal
  // und in der Standardansicht so lesbar wie bisher.
  let roll = CAMOU_PANEL_ROLL_DEG[i] * RAD;
  while (roll - camera.rotation.z > Math.PI) roll -= 2 * Math.PI;
  while (roll - camera.rotation.z < -Math.PI) roll += 2 * Math.PI;
  camouNavTargetRoll = roll;

  // Navigationsflug starten
  camouNavPhase = "out";
  camouNavStartedAt = performance.now();
  camouNavZoomFrom = currentZoom;

  menuAnimating = true;
  sceneNeedsRender = true;
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    goToSection(
      Number(button.dataset.section)
    );
  });
});

$("logo")?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    goToSection(0);
  }
);

/* =========================================
   SPOTIFY POPUP
========================================= */

const spotifyModal = $("spotify-modal");
const spotifyPlayer = $("spotify-modal-player");
const spotifyClose = $("spotify-modal-close");

let spotifyOpen = false;

if (spotifyModal) {
  document.body.appendChild(spotifyModal);
}

function openSpotifyModal() {
  if (!spotifyModal || spotifyOpen) return;

  spotifyOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  spotifyModal.hidden = false;
  spotifyModal.style.display = "flex";

  document.body.classList.add(
    "spotify-dialog-open"
  );

  if (spotifyPlayer) {
    spotifyPlayer.src =
      spotifyPlayer.dataset.src ||
      "https://open.spotify.com/embed/artist/7pajHvUWNCnOPhDPyH4M6x?theme=0";
  }

  spotifyClose?.focus({
    preventScroll: true
  });
}

function closeSpotifyModal() {
  if (!spotifyModal) return;

  spotifyOpen = false;

  spotifyModal.hidden = true;
  spotifyModal.style.display = "none";

  document.body.classList.remove(
    "spotify-dialog-open"
  );

  spotifyPlayer?.removeAttribute("src");
}

spotifyClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    event.stopPropagation();
    closeSpotifyModal();
  }
);

spotifyModal?.addEventListener(
  "pointerdown",
  event => {
    if (
      event.target === spotifyModal ||
      event.target.closest?.(
        "[data-close-spotify]"
      )
    ) {
      closeSpotifyModal();
    }
  }
);

/* =========================================
   CONTACT POPUP
========================================= */

const CONTACT_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyx-lPLqnkym7hppwVxu4sTedAtXpAL5iedagg8aA48DiOWKDtELm6nwU4O8Se0In9z/exec";

const contactModal = $("contact-modal");
const contactForm = $("contact-form");

const contactClose = $("contact-modal-close");
const contactStatus = $("contact-status");
const contactSubmit = $("contact-submit");

let contactOpen = false;
let contactSending = false;

if (contactModal) {
  document.body.appendChild(contactModal);
}

function openContactModal() {
  if (!contactModal || contactOpen) return;

  contactOpen = true;

  velocityX = 0;
  velocityY = 0;
  isDragging = false;
  menuAnimating = false;

  contactModal.hidden = false;
  contactModal.style.display = "flex";

  document.body.classList.add(
    "contact-dialog-open"
  );

  contactModal
    .querySelector('input[name="name"]')
    ?.focus({ preventScroll: true });
}

function closeContactModal() {
  if (!contactModal) return;

  contactOpen = false;

  contactModal.hidden = true;
  contactModal.style.display = "none";

  document.body.classList.remove(
    "contact-dialog-open"
  );
}

contactClose?.addEventListener(
  "click",
  event => {
    event.preventDefault();
    closeContactModal();
  }
);

contactModal?.addEventListener(
  "click",
  event => {
    if (
      event.target === contactModal ||
      event.target.closest?.(
        "[data-close-contact]"
      )
    ) {
      closeContactModal();
    }
  }
);

contactForm?.addEventListener(
  "submit",
  async event => {
    event.preventDefault();

    if (
      contactSending ||
      !contactForm.reportValidity()
    ) return;

    contactSending = true;

    if (contactSubmit) {
      contactSubmit.disabled = true;
    }

    if (contactStatus) {
      contactStatus.textContent =
        "Nachricht wird übertragen …";
    }

    const data = new FormData(contactForm);

    data.set("privacy", "on");
    data.set("website", "");

    try {
      await fetch(CONTACT_SCRIPT_URL, {
        method: "POST",
        body: data,
        mode: "no-cors"
      });

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung abgeschlossen. Empfang nicht bestätigt.";
      }
    } catch (error) {
      console.error(
        "CAMOU Kontaktformular:",
        error
      );

      if (contactStatus) {
        contactStatus.textContent =
          "Übertragung fehlgeschlagen.";
      }
    } finally {
      contactSending = false;

      if (contactSubmit) {
        contactSubmit.disabled = false;
      }
    }
  }
);

/* =========================================
   3D KLICKERKENNUNG
========================================= */

function texturePoint(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    (event.clientX - rect.left) /
      rect.width * 2 - 1,

    -(
      (event.clientY - rect.top) /
        rect.height * 2 - 1
    )
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const hit =
    raycaster.intersectObject(globe)[0];

  if (!hit?.uv) return null;

  return {
    x: hit.uv.x * MAP_W,
    y: (1 - hit.uv.y) * MAP_H
  };
}

function islandPoint(point, index) {
  if (!point) return null;

  const p = PLACES[index];

  let dx = point.x - p.x;

  if (dx > MAP_W / 2) {
    dx -= MAP_W;
  }

  if (dx < -MAP_W / 2) {
    dx += MAP_W;
  }

  const dy = point.y - p.y;

  const c = Math.cos(p.tiltR);
  const s = Math.sin(p.tiltR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function photoPoint(point, index) {
  const local = islandPoint(point, index);

  if (!local) return null;

  const p = PLACES[index];

  const dx = local.x - p.imageX;
  const dy = local.y - PHOTO_Y;

  const c = Math.cos(p.photoR);
  const s = Math.sin(p.photoR);

  return {
    x: c * dx + s * dy,
    y: -s * dx + c * dy
  };
}

function inImage(point, index) {
  const q = photoPoint(point, index);

  return !!q &&
    Math.abs(q.x) <= PHOTO_W / 2 &&
    Math.abs(q.y) <= PHOTO_H / 2;
}

function isOnVisualLever(point) {
  const q = photoPoint(point, 2);

  if (!q) return false;

  const dx =
    q.x / CONFIG.visualScale;

  const y =
    q.y / CONFIG.visualScale;

  const leverX =
    PHOTO_W / 2 + 43;

  const leverTop =
    -PHOTO_H / 2 + 15;

  const leverBottom =
    -PHOTO_H / 2 +
    PHOTO_H * 0.72;

  return (
    Math.abs(dx - leverX) < 38 &&
    y >= leverTop - 28 &&
    y <= leverBottom + 35
  );
}

function handleGlobeClick(event) {
  const point = texturePoint(event);

  if (!point) return;

  // Spotify.
  if (inImage(point, 1)) {
    openSpotifyModal();
    return;
  }

  // Contact.
  if (inImage(point, 4)) {
    openContactModal();
    return;
  }

  // Kompass, Checkbox und Social Links.
  const echoPoint = islandPoint(point, 3);

  if (echoPoint) {
    const p = PLACES[3];

    const dx =
      echoPoint.x - p.imageX;

    const dy =
      echoPoint.y - COMPASS_Y;

    const controlY =
      echoPoint.y - SENSOR_CONTROL.y;

    if (
      dx >= SENSOR_CONTROL.hitLeft &&
      dx <= SENSOR_CONTROL.hitRight &&
      controlY >= SENSOR_CONTROL.hitTop &&
      controlY <= SENSOR_CONTROL.hitBottom
    ) {
      requestSensorAccess();
      return;
    }

    const link = SOCIAL.find(item => {
      const x =
        Math.cos(item.angle) * compassRadius;

      const y =
        Math.sin(item.angle) * compassRadius;

      return Math.hypot(
        dx - x,
        dy - y
      ) < 39;
    });

    if (link) {
      window.open(
        link.url,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }
  }

  // Home Video.
  if (
    inImage(point, 0) &&
    !homeVideoStarting
  ) {
    if (
      homeVideoStarted &&
      !homeVideo.paused
    ) {
      homeVideo.pause();
      homeVideoPlaying = false;

      stopHomeVideoFrameUpdates();
      updateHomeVideoFrame();
      return;
    }

    homeVideoStarting = true;

    homeVideo.play()
      .then(() => {
        homeVideoStarted = true;
        homeVideoPlaying = true;
        homeVideoStarting = false;

        updateHomeVideoFrame();
        startHomeVideoFrameUpdates();
      })
      .catch(error => {
        homeVideoStarting = false;

        console.error(
          "CAMOU Home-Video:",
          error
        );

        alert(
          "Das HOME-Video konnte nicht gestartet werden."
        );
      });
  }
}

/* =========================================
   ZOOM
========================================= */

function setZoom(value) {
  currentZoom = clamp(
    value,
    CONFIG.minZoom,
    CONFIG.maxZoom
  );

  camera.position.z = currentZoom;
  sceneNeedsRender = true;
}

$("zoom-in")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom - 0.7);
  }
);

$("zoom-out")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(currentZoom + 0.7);
  }
);

$("zoom-reset")?.addEventListener(
  "click",
  event => {
    event.stopPropagation();
    setZoom(defaultZoom);
  }
);

const zoomControls =
  document.querySelector(".zoom-controls");

for (const type of [
  "pointerdown",
  "pointermove",
  "pointerup",
  "pointercancel"
]) {
  zoomControls?.addEventListener(
    type,
    event => event.stopPropagation()
  );
}

stage.addEventListener(
  "wheel",
  event => {
    if (
      event.target.closest(".zoom-controls")
    ) return;

        if (camouWorldFlight) return;

    setZoom(
      currentZoom +
      event.deltaY * 0.008
    );
  },
  { passive: false }
);

/* =========================================
   DRAG UND TOUCH
========================================= */

stage.addEventListener(
  "pointerdown",
  event => {
        if (
      spotifyOpen ||
      contactOpen ||
      event.target !== renderer.domElement ||
      camouWorldFlight
    ) return;

    const point = texturePoint(event);

    // Visuals Hebel.
    if (
  camouWorldMode !== "planet" &&
  isOnVisualLever(point)
) {
      visualLeverPointer = event.pointerId;
      visualLeverMoved = false;
      visualLeverStartY = event.clientY;

      stage.setPointerCapture(
        event.pointerId
      );
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    pointerStart = {
      x: event.clientX,
      y: event.clientY
    };

    stage.setPointerCapture(
      event.pointerId
    );

    if (pointers.size === 1) {
      isDragging = true;

      previousX = event.clientX;
      previousY = event.clientY;

      lastTime = performance.now();

      velocityX = 0;
      velocityY = 0;
      menuAnimating = false;

      stage.classList.add("dragging");
      $("hint")?.classList.add("hidden");
} else if (pointers.size === 2) {
  isDragging = false;
  pointerStart = null;

  const points = [...pointers.values()];

  // Abstand für Zoom speichern
  pinchDistance = distance(
    points[0],
    points[1]
  );

  pinchZoom = currentZoom;

  // Ausgangswinkel der beiden Finger
  pinchAngle = Math.atan2(
    points[1].y - points[0].y,
    points[1].x - points[0].x
  );

  // Laufende Menüanimation beenden
  menuAnimating = false;

  // Ungewolltes Weiterdrehen verhindern
  velocityX = 0;
  velocityY = 0;
}
  }
);

stage.addEventListener(
  "pointermove",
  event => {
    // Mechanischer Dia-Hebel.
    if (
      visualLeverPointer === event.pointerId
    ) {
      const pullDistance =
        event.clientY - visualLeverStartY;

      if (
        pullDistance > 35 &&
        !visualLeverMoved
      ) {
        visualLeverMoved = true;
        advanceVisualSlide();
      }

      return;
    }

    if (!pointers.has(event.pointerId)) {
      return;
    }

    pointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY
    });

    // Zwei-Finger-Geste: Zoom und intuitive Rotation
if (pointers.size >= 2) {
  const points = [...pointers.values()];

  // Abstand zwischen den Fingern
  const currentDistance = distance(
    points[0],
    points[1]
  );

  // Zoom beibehalten
  if (pinchDistance > 0 && currentDistance > 0) {
    setZoom(
      pinchZoom * (
        pinchDistance / currentDistance
      )
    );
  }

  // Winkel zwischen den Fingern
  const currentAngle = Math.atan2(
    points[1].y - points[0].y,
    points[1].x - points[0].x
  );

  // Winkeländerung berechnen
  const delta = wrapAngle(
    currentAngle - pinchAngle
  );

  // Zwei-Finger-Drehung:
  // CAMOU dreht weiterhin die Kamera.
  // Der Projektplanet dreht sich selbst.
  if (
    camouWorldMode === "planet" &&
    !camouWorldFlight
  ) {
    camouExploreRoll = wrapAngle(
      camouExploreRoll - delta
    );
  } else {
    camera.rotation.z += delta;
  }

  // Winkel für nächste Bewegung speichern
  pinchAngle = currentAngle;

  sceneNeedsRender = true;

  return;
}

    if (!isDragging) return;

    const now = performance.now();

    const dt = Math.max(
      1,
      now - lastTime
    );

    const dx =
      event.clientX - previousX;

    const dy =
      event.clientY - previousY;

    const factor = Math.min(
      dt / 16, 2
    );

// Kameraneigung bei manueller Drehung berücksichtigen

const roll =
  camera.rotation.z +
  (
    camouWorldMode === "planet"
      ? camouExploreRoll
      : 0
  );


const cosRoll = Math.cos(roll);
const sinRoll = Math.sin(roll);

// Mausbewegung in die gedrehte Ansicht umrechnen
const horizontal =
  dx * cosRoll + dy * sinRoll;

const vertical =
  dy * cosRoll - dx * sinRoll;

// Etwas feinfühligere Steuerung
const sensitivity = CONFIG.dragSpeed * 0.80;


const mx = horizontal * sensitivity;
const my = vertical * sensitivity;

// Horizontale Drehrichtung an die
// aktuelle Ausrichtung anpassen.
const horizontalDirection =
  camouHorizontalDirection();

if (camouWorldMode === "planet") {
  camouExploreY += mx * horizontalDirection;
  camouExploreX += my;

  sceneNeedsRender = true;
} else {
  rotationY += mx * horizontalDirection;
  rotationX += my;
}

// Geschwindigkeit in Bildschirmrichtung
// speichern. Die Korrektur erfolgt auch
// beim Nachlaufen separat.
velocityY = mx / factor;
velocityX = my / factor;

    previousX = event.clientX;
    previousY = event.clientY;

    lastTime = now;

    updateIndicator();
  }
);

/* =========================================
   POINTER RELEASE
========================================= */

function releasePointer(event) {
  // Visuals Hebel.
  if (
    visualLeverPointer === event.pointerId
  ) {
    if (
      event.type === "pointerup" &&
      !visualLeverMoved
    ) {
      advanceVisualSlide();
    }

    visualLeverPointer = null;
    visualLeverMoved = false;
    return;
  }

  if (!pointers.has(event.pointerId)) {
    return;
  }

  if (
    event.type === "pointerup" &&
    pointerStart &&
    distance(
      {
        x: event.clientX,
        y: event.clientY
      },
      pointerStart
    ) <= 7 &&
    !spotifyOpen &&
    !contactOpen
  ) {
    handleGlobeClick(event);
  }

  pointerStart = null;
  pointers.delete(event.pointerId);

  if (pointers.size === 0) {
    isDragging = false;
    stage.classList.remove("dragging");
  } else if (pointers.size === 1) {
    const point = [
      ...pointers.values()
    ][0];

    previousX = point.x;
    previousY = point.y;

    lastTime = performance.now();

    velocityX = 0;
    velocityY = 0;
    isDragging = true;
  }
}

stage.addEventListener(
  "pointerup",
  releasePointer
);

stage.addEventListener(
  "pointercancel",
  releasePointer
);

stage.addEventListener(
  "lostpointercapture",
  releasePointer
);

/* =========================================
   TASTATUR
========================================= */

window.addEventListener(
  "keydown",
  event => {
    if (event.key === "Escape") {
      if (contactOpen) {
        closeContactModal();
      } else if (spotifyOpen) {
        closeSpotifyModal();
      }

      return;
    }

    if (spotifyOpen || contactOpen) return;

    if (
      ["INPUT", "TEXTAREA", "SELECT"].includes(
        document.activeElement?.tagName
      )
    ) return;

    
if (camouWorldFlight) return;

if (event.key === "ArrowRight") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreY += 0.25 * camouHorizontalDirection();
    sceneNeedsRender = true;
  } else {
    goToSection(currentIndex() + 1);
  }
}

if (event.key === "ArrowLeft") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreY -= 0.25 * camouHorizontalDirection();
    sceneNeedsRender = true;
  } else {
    goToSection(currentIndex() - 1);
  }
}

if (event.key === "ArrowUp") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreX -= 0.25;
  } else {
    rotationX -= 0.25;
  }

  sceneNeedsRender = true;
}

if (event.key === "ArrowDown") {
  event.preventDefault();

  if (camouWorldMode === "planet") {
    camouExploreX += 0.25;
  } else {
    rotationX += 0.25;
  }

  sceneNeedsRender = true;
}

    if (
      event.key === "+" ||
      event.key === "="
    ) {
      setZoom(currentZoom - 0.7);
    }

    if (event.key === "-") {
      setZoom(currentZoom + 0.7);
    }

    if (event.key === "0") {
      setZoom(defaultZoom);
    }
  }
);

/* =========================================
   ANIMATION
========================================= */

let lastShownSensorMode = "";

const camouProjectYawAxis =
  new THREE.Vector3(0, 1, 0);

const camouProjectYawQuat =
  new THREE.Quaternion();

 
// Freie Erkundung des Projektplaneten.
let camouExploreX = 0;
let camouExploreY = 0;
let camouExploreRoll = 0;

const camouExploreRollAxis =
  new THREE.Vector3(0, 0, 1);

const camouExploreRollQuaternion =
  new THREE.Quaternion();

const camouExploreEuler =
  new THREE.Euler(0, 0, 0, "XYZ");

const camouExploreQuaternion =
  new THREE.Quaternion();

function camouGetExploreQuaternion() {
  camouExploreEuler.set(
    camouExploreX,
    camouExploreY,
    0
  );

  camouExploreQuaternion.setFromEuler(
    camouExploreEuler
  );

  camouExploreRollQuaternion.setFromAxisAngle(
    camouExploreRollAxis,
    camouExploreRoll
  );

  // Die Zwei-Finger-Drehung mit der
  // freien Planetendrehung kombinieren.
  return camouExploreQuaternion.premultiply(
    camouExploreRollQuaternion
  );
}


function camouHorizontalDirection() {
  const tilt = camouWorldMode === "planet"
    ? camouExploreX
    : rotationX;

  // Horizontale Richtung nach
  // einer Ueberkopf-Drehung korrigieren.
  return Math.cos(tilt) < 0 ? -1 : 1;
}

function animate(now = 0) {
  requestAnimationFrame(animate);

  if (camouWorldFlight) camouUpdateWorldFlight(now);

  /* NAVIGATION – DREI PHASEN */

  if (!isDragging && menuAnimating) {

    const elapsed = Math.max(
      0,
      now - camouNavStartedAt
    );

    // Phase 1: Herauszoomen
    if (camouNavPhase === "out") {

      const t = smooth(
        elapsed / CAMOU_ZOOM_OUT_MS
      );

      setZoom(
        lerp(
          camouNavZoomFrom,
          CAMOU_OVERVIEW_ZOOM,
          t
        )
      );

      if (elapsed >= CAMOU_ZOOM_OUT_MS) {
        setZoom(CAMOU_OVERVIEW_ZOOM);

        camouNavRotFromX = rotationX;
        camouNavRotFromY = rotationY;
        camouNavRollFrom = camera.rotation.z;

        camouNavPhase = "turn";
        camouNavStartedAt = now;
      }

    // Phase 2: Kugel drehen
    } else if (camouNavPhase === "turn") {

      const t = smooth(
        elapsed / CAMOU_ROTATE_MS
      );

      rotationX = lerp(
        camouNavRotFromX,
        targetRotationX,
        t
      );

      rotationY = lerp(
        camouNavRotFromY,
        targetRotationY,
        t
      );

      camera.rotation.z = lerp(
        camouNavRollFrom,
        camouNavTargetRoll,
        t
      );

      sceneNeedsRender = true;

      if (elapsed >= CAMOU_ROTATE_MS) {
        rotationX = targetRotationX;
        rotationY = targetRotationY;
        camera.rotation.z = camouNavTargetRoll;

        camouNavPhase = "in";
        camouNavStartedAt = now;
        camouNavZoomFrom = currentZoom;
      }

    // Phase 3: Hineinzoomen
    } else if (camouNavPhase === "in") {

      const t = smooth(
        elapsed / CAMOU_ZOOM_IN_MS
      );

      setZoom(
        lerp(
          camouNavZoomFrom,
          CAMOU_FOCUS_ZOOM,
          t
        )
      );

      if (elapsed >= CAMOU_ZOOM_IN_MS) {
        setZoom(CAMOU_FOCUS_ZOOM);

        menuAnimating = false;
        camouNavPhase = "idle";
      }
    }

     
} else if (!isDragging && !camouWorldFlight) {
  const horizontalDirection =
    camouHorizontalDirection();

  if (camouWorldMode === "planet") {
    camouExploreY +=
      velocityY * horizontalDirection;

    camouExploreX += velocityX;

    if (velocityX !== 0 || velocityY !== 0) {
      sceneNeedsRender = true;
    }
  } else {
    rotationY +=
      velocityY * horizontalDirection;

    rotationX += velocityX;
  }

  velocityY *= CONFIG.friction;
  velocityX *= CONFIG.friction;

  if (Math.abs(velocityY) < 0.00004) {
    velocityY = 0;
  }

  if (Math.abs(velocityX) < 0.00004) {
    velocityX = 0;
  }
}

    globeGroup.rotation.set(
    rotationX,
    rotationY,
    0
  );


if (camouSecondPlanetGroup) {
  const f = camouWorldFlight;

  if (f || camouWorldMode === "planet") {

    if (f?.planetOrientation) {
      // Die beim Rueckflug gespeicherte
      // Erkundungsrichtung verwenden.
      camouProjectYawQuat.copy(
        f.planetOrientation
      );

    } else if (f) {
      // Automatische Drehung beim Hinflug.
      camouProjectYawQuat.setFromAxisAngle(
        camouProjectYawAxis,
        f.planetYaw ?? 0
      );

    } else {
      // Freies Drehen nach dem Hinflug.
      camouProjectYawQuat.copy(
        camouGetExploreQuaternion()
      );
    }

    camouSecondPlanetGroup.quaternion
      .copy(camera.quaternion)
      .multiply(camouProjectYawQuat);

  } else {
    camouSecondPlanetGroup.rotation.set(
      0, 0, 0
    );
  }
}
// Auch bei manueller Bedienung den
// Projektplaneten samt Inhalt skalieren.
camouUpdateExplorePlanetSize();
  // Video nur bei neuen Frames.
  if (
    homeVideoPlaying &&
    typeof homeVideo.requestVideoFrameCallback !== "function" &&
    now - lastVideoFallbackPaint >= 33
  ) {
    lastVideoFallbackPaint = now;
    updateHomeVideoFrame();
  }

  const deltaX =
    rotationX - lastGlobeX;

  const deltaY =
    rotationY - lastGlobeY;

  if (
    Math.abs(deltaX) > 1e-9 ||
    Math.abs(deltaY) > 1e-9
  ) {
    sceneNeedsRender = true;
  }

  lastGlobeX = rotationX;
  lastGlobeY = rotationY;

  fallbackAngle = wrapAngle(
    fallbackAngle +
    deltaY * 0.85 +
    deltaX * 0.35
  );

  const mode = sensorMode();

  if (mode === "KOMPASS AKTIV") {
    targetNeedleAngle =
      -sensorHeading * Math.PI / 180;
  } else if (mode === "BEWEGUNG AKTIV") {
    targetNeedleAngle = motionAngle;
  } else {
    targetNeedleAngle = fallbackAngle;
  }

  if (mode !== lastShownSensorMode) {
    lastShownSensorMode = mode;
    sensorStatusText = mode;
    refreshEchoesTexture();
  }

  const needleDelta = wrapAngle(
    targetNeedleAngle - needleAngle
  );

  if (Math.abs(needleDelta) > 0.0005) {
    needleAngle = wrapAngle(
      needleAngle +
      needleDelta * 0.12
    );

    if (
      currentIndex() === 3 &&
      now - lastCompassDraw > 32
    ) {
      refreshEchoesTexture();
      lastCompassDraw = now;
    }
  }

  // Nur rendern, wenn sich etwas geändert hat.
  if (sceneNeedsRender) {
    sceneNeedsRender = false;

    renderer.render(
      scene,
      camera
    );
  }

  updateIndicator();
}

requestAnimationFrame(animate);

/* =========================================
   RESIZE
========================================= */

function resize() {
  const w = Math.max(
    1, container.clientWidth
  );

  const h = Math.max(
    1, container.clientHeight
  );

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
   updateCosmosPositions();

  renderer.setSize(w, h);

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
  );

  sceneNeedsRender = true;
}

window.addEventListener(
  "resize",
  resize
);
// Cosmos beim ersten Laden positionieren
updateCosmosPositions();
setZoom(defaultZoom);
updateIndicator();

/* ENDE CAMOU – EXPLORE GLOBE */

/* ============================================================
   CAMOU – ENTDECKER-KUGEL V2
   VERZERRUNGSARME INHALTE

   Diesen Block EINMAL am Ende der aktuellen
   script.js einfuegen.
============================================================ */

const CAMOU_V2_W = 960;
const CAMOU_V2_H = 760;
const CAMOU_V2_SCALE = mobile ? 0.00222 : 0.00296;
const CAMOU_MOBILE_SIDE_SCALE = 0.80;

const CAMOU_V2_CANVASES = [];
const CAMOU_V2_TEXTURES = [];
const CAMOU_V2_MESHES = [];
const CAMOU_V2_IMAGES = [];

let CAMOU_V2_SHOW_LABELS = false;

/* =========================================
   NEUE VERTEILUNG DER BEREICHE
========================================= */

const CAMOU_V2_PLACES = [
  {
    lon: -155,
    lat: 32,
    tilt: -4,
    photoTilt: 4,
    imageX: 15,
    textX: -20
  },
  {
    lon: -105,
    lat: -33,
    tilt: 3,
    photoTilt: -4,
    imageX: -205,
    textX: 214
  },
  {
    lon: 5,
    lat: 34,
    tilt: -4,
    photoTilt: 4,
    imageX: 10,
    textX: -20
  },
  {
    lon: -3,
    lat: -35,
    tilt: 3,
    photoTilt: 0,
    imageX: 0,
    textX: 12
  },
  {
    lon: 125,
    lat: 1,
    tilt: -4,
    photoTilt: 5,
    imageX: -205,
    textX: 214
  }
];

for (let i = 0; i < PLACES.length; i++) {
  const p = PLACES[i];

  Object.assign(p, CAMOU_V2_PLACES[i]);

  // Bilder auf Smartphones mittiger platzieren
  if (mobile && i === 1) p.imageX = -95;
  if (mobile && i === 4) p.imageX = 50;

  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  p.tiltR = (p.tilt + CAMOU_PANEL_ROLL_DEG[i]) * RAD;
  p.photoR = p.photoTilt * RAD;

  p.nx = Math.cos(lat) * Math.sin(lon);
  p.ny = Math.sin(lat);
  p.nz = Math.cos(lat) * Math.cos(lon);
}

/* =========================================
   GEKRUEMMTE 3D-INHALTSFLAECHEN
========================================= */

function camouV2Geometry(p) {
  const positions = [];
  const uvs = [];
  const indices = [];

  const columns = 26;
  const rows = 22;

  const lon = p.lon * RAD;
  const lat = p.lat * RAD;

  const normal = new THREE.Vector3(
    Math.cos(lat) * Math.sin(lon),
    Math.sin(lat),
    Math.cos(lat) * Math.cos(lon)
  );

  const east = new THREE.Vector3(
    Math.cos(lon),
    0,
    -Math.sin(lon)
  );

  const north = new THREE.Vector3(
    -Math.sin(lat) * Math.sin(lon),
    Math.cos(lat),
    -Math.sin(lat) * Math.cos(lon)
  );

  const c = Math.cos(p.tiltR);
  const s = Math.sin(p.tiltR);

  for (let row = 0; row <= rows; row++) {
    const v = row / rows;

    for (let col = 0; col <= columns; col++) {
      const u = col / columns;

      const lx =
        (u - 0.5) * CAMOU_V2_W * CAMOU_V2_SCALE;

      const ly =
        (v - 0.5) * CAMOU_V2_H * CAMOU_V2_SCALE;

      const x = lx * c - ly * s;
      const y = lx * s + ly * c;

      const z = Math.sqrt(
        Math.max(
          0.01,
          CONFIG.radius ** 2 - x * x - y * y
        )
      );

      const point = normal
        .clone()
        .multiplyScalar(z + 0.018)
        .addScaledVector(east, x)
        .addScaledVector(north, y);

      positions.push(
        point.x,
        point.y,
        point.z
      );

      uvs.push(u, v);
    }
  }

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < columns; col++) {
      const a = row * (columns + 1) + col;
      const b = a + 1;
      const c = a + columns + 1;
      const d = c + 1;

      indices.push(
        a, c, b,
        b, c, d
      );
    }
  }

  const geometry = new THREE.BufferGeometry();

  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      positions,
      3
    )
  );

  geometry.setAttribute(
    "uv",
    new THREE.Float32BufferAttribute(
      uvs,
      2
    )
  );

  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  return geometry;
}

/* =========================================
   EIGENE TEXTUREN PRO BEREICH
========================================= */

drawWrappedPanel = function(ctx, index, image) {
  CAMOU_V2_IMAGES[index] = image;

  if (!CAMOU_V2_CANVASES[index]) {
    const canvas = document.createElement("canvas");

    canvas.width = CAMOU_V2_W;
    canvas.height = CAMOU_V2_H;

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthTest: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(
      camouV2Geometry(PLACES[index]),
      material
    );

    mesh.renderOrder = 2;
    mesh.userData.sectionIndex = index;

    globeGroup.add(mesh);

    CAMOU_V2_CANVASES[index] = canvas;
    CAMOU_V2_TEXTURES[index] = texture;
    CAMOU_V2_MESHES[index] = mesh;
  }

  refreshIsland(index);
};

/* =========================================
   BILDER / VIDEOS ZEICHNEN
========================================= */

// CONTACT erhält ein eigenes Hochkantformat; alle anderen Bilder bleiben unverändert.
const CAMOU_CONTACT_W = 260;
const CAMOU_CONTACT_H = 400;

// Bild vollständig und unverzerrt in den verfügbaren Rahmen einpassen.
function camouDrawContained(ctx, image, x, y, w, h) {
  const iw = image?.naturalWidth || image?.videoWidth || image?.width;
  const ih = image?.naturalHeight || image?.videoHeight || image?.height;
  if (!iw || !ih) return;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  ctx.drawImage(image, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

paintPhoto = function(ctx, index, image) {
  const p = PLACES[index];
  const isContact = index === 4;
  const photoW = isContact ? CAMOU_CONTACT_W : PHOTO_W;
  const photoH = isContact ? CAMOU_CONTACT_H : PHOTO_H;
  const photoY = mobile && index === 1 ? 150 : 112;

  ctx.save();
  ctx.translate(p.imageX, photoY);

  if (mobile && (index === 1 || index === 4)) {
    ctx.scale(CAMOU_MOBILE_SIDE_SCALE, CAMOU_MOBILE_SIDE_SCALE);
  }
  ctx.rotate(p.photoR);

  ctx.fillStyle = "rgba(8,23,31,.94)";
  ctx.fillRect(-photoW / 2 - 7, -photoH / 2 - 7, photoW + 14, photoH + 14);

  ctx.save();
  ctx.beginPath();
  ctx.rect(-photoW / 2, -photoH / 2, photoW, photoH);
  ctx.clip();

  if (index === 0 && homeVideoStarted && homeVideo.readyState >= 2) {
    cover(ctx, homeVideo, -photoW / 2, -photoH / 2, photoW, photoH);
    if (homeVideo.paused) playButton(ctx, 0, 0);
  } else if (isContact) {
    // Kein cover(): Dadurch wird auf Desktop und Mobil nichts abgeschnitten.
    camouDrawContained(ctx, image, -photoW / 2, -photoH / 2, photoW, photoH);
  } else {
    cover(ctx, image, -photoW / 2, -photoH / 2, photoW, photoH);
    if (index === 0) playButton(ctx, 0, 0);
  }
  ctx.restore();

  if (index === 1 || isContact) {
    // Die Beschriftung bleibt waagrecht lesbar am unteren Bildrand.
    drawOpenLabel(ctx, 0, -photoW / 2, -photoH / 2, photoW, photoH);
  }

  ctx.strokeStyle = "rgba(165,216,211,.65)";
  ctx.lineWidth = 2;
  ctx.strokeRect(-photoW / 2, -photoH / 2, photoW, photoH);
  ctx.restore();
};

/* =========================================
   CAMOU – ORGANISCHE TARNFARBZONEN
   NUR VISUALS UND ECHOES
========================================= */

const camouOrganicZones = new Map();

function camouDrawOrganicZone(ctx, index) {
  if (index !== 2 && index !== 3) return;

  // Muster einmal erzeugen und zwischenspeichern
  if (!camouOrganicZones.has(index)) {
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 256;

    const c = canvas.getContext("2d");
    const image = c.createImageData(
      canvas.width,
      canvas.height
    );

    const data = image.data;
    const seed = index === 2 ? 0.4 : 2.6;

    const fade = value => {
      const t = Math.max(0, Math.min(1, value));
      return t * t * (3 - 2 * t);
    };

    for (let y = 0; y < canvas.height; y++) {
      const v = 2 * y / (canvas.height - 1) - 1;

      for (let x = 0; x < canvas.width; x++) {
        const u = 2 * x / (canvas.width - 1) - 1;

        // Ueberlagerte organische Strukturen
        const wave1 = Math.sin(
          u * 5.7 + v * 3.1 + seed
        );

        const wave2 = Math.cos(
          u * 10.2 - v * 6.3 - seed
        );

        const wave3 = Math.sin(
          u * 15.1 + v * 12.4 + 2 * seed
        );

        const drift =
          0.5 * wave1 +
          0.3 * wave2 +
          0.2 * wave3;

        // Asymmetrische Verformung
        const warpedX =
          u + 0.16 * Math.sin(v * 4.1 + seed);

        const warpedY =
          v + 0.13 * Math.cos(u * 4.5 - seed);

        const distance = Math.hypot(
          warpedX * 0.90,
          warpedY * 0.95
        );

        const angle = Math.atan2(
          warpedY,
          warpedX
        );

        // Unregelmaessige Tarnkonturen
        const perimeter =
          1.05 +
          0.15 * Math.sin(angle * 3 + seed) +
          0.12 * Math.cos(angle * 6 - seed) +
          0.13 * drift;

        const irregular = fade(
          (perimeter - distance + 0.20) / 0.48
        );

        // Weicher Uebergang zur Kugeltextur
        const edge =
          fade((1 - Math.abs(u)) / 0.22) *
          fade((1 - Math.abs(v)) / 0.22);

        const alpha =
          irregular *
          edge *
          (0.80 + 0.12 * drift);

        // Moos- und Waldgruentoene
        const moss = fade(
          (drift + 0.50) / 1.1
        );

        const i =
          (y * canvas.width + x) * 4;

        data[i] = Math.round(
          11 + 17 * moss
        );

        data[i + 1] = Math.round(
          29 + 29 * moss
        );

        data[i + 2] = Math.round(
          22 + 13 * moss
        );

        data[i + 3] = Math.round(
          255 * Math.max(0, alpha)
        );
      }
    }

    c.putImageData(image, 0, 0);
    camouOrganicZones.set(index, canvas);
  }

  // Farbzone hinter dem Bereich zeichnen
  ctx.drawImage(
    camouOrganicZones.get(index),
    -CAMOU_V2_W / 2,
    -CAMOU_V2_H / 2,
    CAMOU_V2_W,
    CAMOU_V2_H
  );
}

drawPanel = function(ctx, index, image) {
  const p = PLACES[index];
  const section = sections[index];

  const side = index === 1 || index === 4;

  ctx.save();

  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";

   /* Kleine Bereichsbezeichnungen */
/* =========================================
   TEXTE UND INHALTE
========================================= */

  if (CAMOU_V2_SHOW_LABELS) {
    ctx.fillStyle =
  "rgba(224,237,232,.80)";
    ctx.lineWidth = 1.5;

    ctx.beginPath();

    ctx.moveTo(-105, -345);
    ctx.lineTo(105, -345);

    ctx.stroke();

    ctx.font =
      "500 19px 'DM Mono', monospace";

    ctx.fillStyle =
      "rgba(231,242,225,.70)";

    ctx.fillText(
      section.eyebrow,
      0,
      -315,
      720
    );
  }

  /* Haupttitel */

  ctx.font = "300 58px Manrope, Arial";
  ctx.fillStyle = "#F4F1E8";

ctx.fillText(
  section.title[0],
  -12,
  index === 3 ? -262 : -217,
  820
);

  /* Beschreibung */

  ctx.font = "400 22px Manrope, Arial";

  ctx.fillStyle =
  "rgba(244,241,232,.94)";

if (side) {

  if (mobile) {

    // MUSIC: Text hochkant rechts vom Bild
    // CONTACT: Text hochkant links vom Bild
    const isMusic = index === 1;

    ctx.save();

    ctx.translate(
      isMusic ? 204 : -185,
      112
    );

    ctx.rotate(
      isMusic ? Math.PI / 2 : -Math.PI / 2
    );

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    section.body.forEach((line, i) => {
      ctx.fillText(
        line,
        0,
        isMusic
          ? -40 + i * 35
          : -18 + i * 38,
        300
      );
    });

    ctx.restore();

  } else {

    // Desktop: bisherige horizontale Darstellung
    section.body.forEach((line, i) => {
      ctx.fillText(
        line,
        p.textX,
        6 + i * 38,
        382
      );
    });

  }

  } else {
    // HOME, VISUALS und ECHOES:
    // Text oberhalb des Motivs.

    section.body.forEach((line, i) => {
      ctx.fillText(
        line,
        p.textX,
        -140 + i * 38 - (index === 3 ? 45 : 0),
        750
      );
    });

  } // Schliessende Klammer für den else-Block

  /* Visuals */

  if (index === 2) {
    ctx.save();

    ctx.translate(p.imageX, 112);
    ctx.rotate(p.photoR);

    ctx.scale(
      CONFIG.visualScale,
      CONFIG.visualScale
    );

    drawVisualViewer(
      ctx,
      0,
      -PHOTO_H / 2,
      PHOTO_W,
      PHOTO_H
    );

    ctx.restore();

  } else if (index === 3) {
    /* Echoes */

    drawCompass(
      ctx,
      p.imageX,
      112
    );

    ctx.save();

    ctx.translate(0, -3);

    drawSensorControl(
      ctx,
      p.imageX
    );

    ctx.restore();

  } else {
    /* Home, Music, Contact */

    paintPhoto(ctx, index, image);
  }

  ctx.restore();
};

/* =========================================
   EINZELNEN BEREICH AKTUALISIEREN
========================================= */

refreshIsland = function(index) {
  const canvas = CAMOU_V2_CANVASES[index];
  const texture = CAMOU_V2_TEXTURES[index];

  if (!canvas || !texture) return;

  const ctx = canvas.getContext("2d");

  ctx.clearRect(
    0,
    0,
    CAMOU_V2_W,
    CAMOU_V2_H
  );

  ctx.save();

  ctx.translate(
    CAMOU_V2_W / 2,
    CAMOU_V2_H / 2
  );

  drawPanel(
    ctx,
    index,
    index === 2
      ? visualImages[visualIndex]
      : CAMOU_V2_IMAGES[index]
  );

  ctx.restore();

  texture.needsUpdate = true;
  sceneNeedsRender = true;
};

/* =========================================
   VIDEO-PERFORMANCE
========================================= */

updateHomeVideoFrame = function() {
  if (
    homeVideoStarted &&
    homeVideo.readyState >= 2
  ) {
    refreshIsland(0);
  }
};

/* =========================================
   KLICKERKENNUNG AUF NEUEN FLÄCHEN
========================================= */

texturePoint = function(event) {
  const rect =
    renderer.domElement.getBoundingClientRect();

  pointer.set(
    (event.clientX - rect.left) /
      rect.width * 2 - 1,

    -(
      (event.clientY - rect.top) /
        rect.height * 2 - 1
    )
  );

  globeGroup.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  raycaster.setFromCamera(
    pointer,
    camera
  );

  const sphereHit =
    raycaster.intersectObject(globe)[0];

  const hit = raycaster
    .intersectObjects(
      CAMOU_V2_MESHES.filter(Boolean),
      false
    )
    .find(result =>
      !sphereHit ||
      result.distance <= sphereHit.distance + 0.05
    );

  if (!hit?.uv) return null;

  return {
    index: hit.object.userData.sectionIndex,

    x:
      (hit.uv.x - 0.5) * CAMOU_V2_W,

    y:
      (0.5 - hit.uv.y) * CAMOU_V2_H
  };
};

islandPoint = function(point, index) {
  return point && point.index === index
    ? {
        x: point.x,
        y: point.y
      }
    : null;
};

photoPoint = function(point, index) {
  const local = islandPoint(point, index);

  if (!local) return null;

  const p = PLACES[index];

  const dx = local.x - p.imageX;
  const imageY = mobile && index === 1 ? 150 : 112;
  const dy = local.y - imageY;

  const c = Math.cos(p.photoR);
  const s = Math.sin(p.photoR);

  // Skalierung der Bilder auf Smartphones
  const scale =
    mobile && (index === 1 || index === 4)
      ? CAMOU_MOBILE_SIDE_SCALE
      : 1;

  // Klickposition auf die Bildgrösse umrechnen
  return {
    x: (c * dx + s * dy) / scale,
    y: (-s * dx + c * dy) / scale
  };
};

/* =========================================
   BEREICHSNUMMERN EIN-/AUSBLENDEN
========================================= */

function camouV2Tags(visible) {
  if (CAMOU_V2_SHOW_LABELS === visible) {
    return;
  }

  CAMOU_V2_SHOW_LABELS = visible;

  CAMOU_V2_CANVASES.forEach((_, i) => {
    refreshIsland(i);
  });
}

/* Navigation: kleine Nummern ausblenden */

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    camouV2Tags(false);
  });
});

$("logo")?.addEventListener(
  "click",
  () => camouV2Tags(false)
);

/* Beim Erkunden wieder einblenden */

stage.addEventListener(
  "pointerdown",
  event => {
    if (event.target === renderer.domElement) {
      camouV2Tags(true);
    }
  }
);

window.addEventListener(
  "keydown",
  event => {
    if (
      event.key === "ArrowUp" ||
      event.key === "ArrowDown"
    ) {
      camouV2Tags(true);
    }
  }
);

/* =========================================
   STANDARD-ZOOM LEICHT VERGRÖSSERN
========================================= */
let camouWorldFlight = null;
const camouV2OriginalZoom = setZoom;

setZoom = function(value) {
  const corrected =
    !menuAnimating &&
    Math.abs(value - defaultZoom) < 1e-8
      ? CAMOU_FOCUS_ZOOM
      : value;

  camouV2OriginalZoom(corrected);

if (!isDragging && !camouWorldFlight) {
  camouV2Tags(
    currentZoom > defaultZoom + 0.4
  );
}
};

/* =========================================
   HOME-STARTPOSITION KORRIGIEREN
========================================= */

rotationX = PLACES[0].lat * RAD;
rotationY = -PLACES[0].lon * RAD;

lastGlobeX = rotationX;
lastGlobeY = rotationY;

velocityX = 0;
velocityY = 0;

globeGroup.rotation.set(
  rotationX,
  rotationY,
  0
);

sceneNeedsRender = true;

setZoom(defaultZoom);
updateIndicator();

/* ENDE CAMOU – ENTDECKER-KUGEL V2 */

// CONTACT-Klickfläche exakt an das neue Hochkantbild anpassen.
const camouOriginalInImage = inImage;
inImage = function(point, index) {
  if (index !== 4) return camouOriginalInImage(point, index);
  const q = photoPoint(point, index);
  return !!q &&
    Math.abs(q.x) <= CAMOU_CONTACT_W / 2 &&
    Math.abs(q.y) <= CAMOU_CONTACT_H / 2;
};

/* ============================================================
   CAMOU PROJEKTPLANET 02
   ERST BEIM AUFRUF LADEN
============================================================ */

let camouSecondPlanetGroup = null;
let camouSecondPlanetReady = null;
let camouWorldMode = "camou";
let camouSpriteHome = null;
let camouPortalView = null;

const CAMOU_WORLD_OVERVIEW = CAMOU_OVERVIEW_ZOOM;
const CAMOU_WORLD_FOCUS = CAMOU_FOCUS_ZOOM;
const CAMOU_SPRITE_TRAVEL_SCALE = 9.0;

// Freier Bereich auf der CAMOU-Kugel.
const camouPortalPlace = {
  lon: 63,
  lat: -4,
  tiltR: -7 * RAD
};

/* =========================================
   SCHAU REIN AUF DER CAMOU-KUGEL
========================================= */

function camouCreatePortal() {
  if (CAMOU_V2_MESHES[5]) return;

  const canvas = document.createElement("canvas");

  // Halbe Aufloesung spart Speicher beim Start.
  canvas.width = CAMOU_V2_W / 2;
  canvas.height = CAMOU_V2_H / 2;

  const c = canvas.getContext("2d");

  c.scale(0.5, 0.5);
  c.translate(
    CAMOU_V2_W / 2,
    CAMOU_V2_H / 2
  );

  c.textAlign = "center";
  c.textBaseline = "middle";
  c.font = "500 28px 'DM Mono', monospace";

  c.shadowColor = "rgba(0,0,0,.7)";
  c.shadowBlur = 14;
  c.fillStyle = "#e6ede5";

  c.fillText("BEAM ME UP  ↗", 0, 0);

  c.shadowBlur = 0;

  c.strokeStyle = "rgba(213,238,216,.38)";
  c.lineWidth = 1;

  c.beginPath();
  c.moveTo(-118, 27);
  c.lineTo(118, 27);
  c.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const mesh = new THREE.Mesh(
    camouV2Geometry(camouPortalPlace),
    new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    })
  );

  mesh.renderOrder = 2;
  mesh.userData.sectionIndex = 5;

  globeGroup.add(mesh);
  CAMOU_V2_MESHES[5] = mesh;

  sceneNeedsRender = true;
}

/* =========================================
   GESTEINSOBERFLAECHE DER ZWEITEN KUGEL
========================================= */


function camouCreateRockyWorldTexture() {
  const width = mobile ? 512 : 768;
  const height = width / 2;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(width, height);

  function hash(x, y, z) {
    let h =
      Math.imul(x, 374761393) ^
      Math.imul(y, 668265263) ^
      Math.imul(z, 1442695041);

    h = Math.imul(
      h ^ (h >>> 13),
      1274126177
    );

    return (
      (h ^ (h >>> 16)) >>> 0
    ) / 4294967295;
  }

  function noise(x, y, z) {
    const ix = Math.floor(x);
    const iy = Math.floor(y);
    const iz = Math.floor(z);

    let fx = x - ix;
    let fy = y - iy;
    let fz = z - iz;

    fx = fx * fx * (3 - 2 * fx);
    fy = fy * fy * (3 - 2 * fy);
    fz = fz * fz * (3 - 2 * fz);

    const mix = (a, b, t) =>
      a + (b - a) * t;

    const layer = dz => {
      const a = mix(
        hash(ix, iy, iz + dz),
        hash(ix + 1, iy, iz + dz),
        fx
      );

      const b = mix(
        hash(ix, iy + 1, iz + dz),
        hash(ix + 1, iy + 1, iz + dz),
        fx
      );

      return mix(a, b, fy);
    };

    return mix(layer(0), layer(1), fz);
  }

  // Echte 3D-Koordinaten verhindern
  // sternfoermige Muster an den Polen.
  for (let y = 0; y < height; y++) {
    const lat =
      Math.PI * (
        0.5 - (y + 0.5) / height
      );

    const cy = Math.sin(lat);
    const cr = Math.cos(lat);

    for (let x = 0; x < width; x++) {
      const lon =
        2 * Math.PI * (
          (x + 0.5) / width
        );

      const nx = -Math.cos(lon) * cr;
      const ny = cy;
      const nz = Math.sin(lon) * cr;

      const large = noise(
        nx * 4.5 + 7,
        ny * 4.5 + 11,
        nz * 4.5 + 19
      );

      const medium = noise(
        nx * 11.2 + 3,
        ny * 11.2 + 17,
        nz * 11.2 + 23
      );

      const fine = noise(
        nx * 28 + 5,
        ny * 28 + 13,
        nz * 28 + 31
      );

      const mineral =
        0.57 * large +
        0.30 * medium +
        0.13 * fine;

      const relief =
        (mineral - 0.5) * 75;

      // Lavendelgraue, mineralische Oberflaeche.
      const light = Math.max(
        0,
        nx * -0.48 +
        ny * 0.58 +
        nz * 0.66
      );

      const shade = 0.40 + 0.60 * light;
      const i = (y * width + x) * 4;

      image.data[i] = Math.max(
        0,
        Math.min(
          255,
          (113 + relief) * shade
        )
      );

      image.data[i + 1] = Math.max(
        0,
        Math.min(
          255,
          (111 + relief * 0.91) * shade
        )
      );

      image.data[i + 2] = Math.max(
        0,
        Math.min(
          255,
          (140 + relief * 1.10) * shade
        )
      );

      image.data[i + 3] = 255;
    }
  }

  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(
    canvas
  );

  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;

  texture.anisotropy = Math.min(
    renderer.capabilities.getMaxAnisotropy(),
    4
  );

  return texture;
}


/* =========================================
   INHALT DES ZWEITEN PROJEKTS
========================================= */

function camouDrawSecondProject(ctx, image) {
  ctx.clearRect(
    0, 0, CAMOU_V2_W, CAMOU_V2_H
  );

  ctx.save();

  ctx.translate(
    CAMOU_V2_W / 2,
    CAMOU_V2_H / 2
  );

  ctx.textAlign = "center";
  ctx.fillStyle = "#f3eee9";

  ctx.font = "500 16px 'DM Mono', monospace";
  ctx.fillText(
    "PROJEKT 02  /  IN ENTSTEHUNG",
    0, -310
  );

  ctx.font = "300 58px Manrope, Arial";
  ctx.fillText(
    "Eine neue Welt",
    0, -233
  );

  ctx.font = "400 21px Manrope, Arial";
  ctx.fillText(
    "Ein neuer Ort für Musik, Bilder und Geschichten.",
    0, -185
  );

  const px = -230;
  const py = -132;
  const pw = 460;
  const ph = 278;

  ctx.fillStyle = "rgba(8,12,18,.75)";

  ctx.fillRect(
    px - 7,
    py - 7,
    pw + 14,
    ph + 14
  );

  if (image) {
    cover(ctx, image, px, py, pw, ph);
  }

  ctx.strokeStyle = "rgba(216,211,230,.75)";
  ctx.lineWidth = 2;
  ctx.strokeRect(px, py, pw, ph);

  ctx.font = "400 20px Manrope, Arial";
  ctx.fillStyle = "#e1dce8";

  ctx.fillText(
    "Hier entsteht das nächste Projekt von b3nn3t.",
    0, 206
  );

  ctx.font = "400 15px 'DM Mono', monospace";
  ctx.fillStyle = "rgba(220,216,236,.78)";

  ctx.fillText(
    "ZURUECK: NAVIGATION ODER BUTTON",
    0, 265
  );

  ctx.restore();
}

// Dieses Bild wird erst beim Besuch angefordert.
function camouLoadSecondProjectImage() {
  const url = new URL(
    "./assets/planet-project.jpg",
    import.meta.url
  ).href;

  return loadImage(url);
}

/* =========================================
   ZWEITEN PLANETEN BEI BEDARF ERSTELLEN
========================================= */
let camouSecondPlanetPanel = null;
let camouSecondPlanetPanelTexture = null;

function camouEnsureSecondPlanet() {
  if (camouSecondPlanetReady) {
    return camouSecondPlanetReady;
  }

  camouSecondPlanetReady =
    Promise.resolve().then(() => {
      const group = new THREE.Group();


const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    CONFIG.radius,
    mobile ? 64 : 96,
    mobile ? 48 : 64
  ),
  new THREE.MeshBasicMaterial({
    map: camouCreateRockyWorldTexture(),

    // Echte, undurchsichtige 3D-Oberflaeche.
    transparent: false,
    depthTest: true,
    depthWrite: true
  })
);

// Die Tiefenpruefung bestimmt, welche
// Kugeloberflaeche vorne liegt.
sphere.renderOrder = 0;

group.add(sphere);

      const canvas = document.createElement("canvas");
      canvas.width = CAMOU_V2_W;
      canvas.height = CAMOU_V2_H;

      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const panel = new THREE.Mesh(
        camouV2Geometry({
          lon: 0,
          lat: 0,
          tiltR: 0
        }),
       
new THREE.MeshBasicMaterial({
  map: texture,
  transparent: true,
  opacity: 0,

  // Die Kugel verdeckt den Inhalt
  // auf ihrer Rueckseite.
  depthTest: true,
  depthWrite: false,
  side: THREE.DoubleSide
})
);

panel.renderOrder = 2;
panel.visible = false;

      group.add(panel);

      camouDrawSecondProject(
        canvas.getContext("2d"),
        null
      );

      texture.needsUpdate = true;

      group.visible = false;
      scene.add(group);

      camouSecondPlanetGroup = group;
      camouSecondPlanetPanel = panel;
      camouSecondPlanetPanelTexture = texture;

      // Auch beim ersten Besuch das Bild
      // vor dem Start des Hinflugs vorbereiten.
      return camouLoadSecondProjectImage().then(image => {
        camouDrawSecondProject(
          canvas.getContext("2d"),
          image
        );

        texture.needsUpdate = true;
        sceneNeedsRender = true;

        return group;
      });
    });

  return camouSecondPlanetReady;
}

/* =========================================
   ZURUECK-BUTTON
========================================= */

const camouReturnButton =
  document.createElement("button");

camouReturnButton.type = "button";
camouReturnButton.textContent =
  "← ZURUECK ZU CAMOU";

camouReturnButton.setAttribute(
  "aria-label",
  "Zurueck zur CAMOU-Kugel"
);

Object.assign(camouReturnButton.style, {
  position: "absolute",
  bottom: "30px",
  left: "24px",
  zIndex: "12",
  padding: "12px 17px",
  cursor: "pointer",
  border: "1px solid rgba(229,230,235,.5)",
  background: "rgba(7,12,20,.78)",
  color: "#f3f0f3",
  font: "500 12px monospace",
  letterSpacing: "1px",
  display: "none",
  borderRadius: "3px"
});

stage.appendChild(camouReturnButton);

camouReturnButton.addEventListener(
  "pointerdown",
  event => event.stopPropagation()
);

camouReturnButton.addEventListener(
  "click",
  () => camouFlyToWorld("camou", 0)
);

/* =========================================
   NAVIGATIONSFLUG ZWISCHEN DEN PLANETEN
========================================= */


/* =========================================
   PLANETENWECHSEL
   ZUERST BEWEGUNG, DANN ANSICHTSWECHSEL
========================================= */

const CAMOU_WORLD_CROSSFADE_MS = 650;
const CAMOU_WORLD_REVEAL_MS = 460;
const CAMOU_PLANET_SPRITE_RADIUS = 0.89;

function camouSpriteFocusScale() {
  // Sprite-Silhouette an die 3D-Kugel anpassen.
  const r = CONFIG.radius;
  const z = CAMOU_WORLD_FOCUS;

  return (
    25 * 2 * r /
    Math.sqrt(z * z - r * r) /
    CAMOU_PLANET_SPRITE_RADIUS
  );
}

const camouGlobeFlightMaterials = new WeakMap();

function camouSetGlobeFlightOpacity(value) {
  const alpha = clamp(value, 0, 1);

  globeGroup.traverse(object => {
    if (!object.isMesh || !object.material) return;

    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];

    for (const material of materials) {
      if (!camouGlobeFlightMaterials.has(material)) {
        camouGlobeFlightMaterials.set(material, {
          opacity: material.opacity,
          transparent: material.transparent,
          depthWrite: material.depthWrite
        });
      }

      const original =
        camouGlobeFlightMaterials.get(material);

      const fading = alpha < 0.999;
      const transparent = fading
        ? true
        : original.transparent;

      const depthWrite = fading
        ? false
        : original.depthWrite;

      if (
        material.transparent !== transparent ||
        material.depthWrite !== depthWrite
      ) {
        material.transparent = transparent;
        material.depthWrite = depthWrite;
        material.needsUpdate = true;
      }

      material.opacity = original.opacity * alpha;
    }
  });

  sceneNeedsRender = true;
}

function camouSetPlanetSpriteForeground(enabled) {
  camouPlanet.material.depthTest = !enabled;
  camouPlanet.material.needsUpdate = true;
  camouPlanet.renderOrder = enabled ? 20 : -9;
}

function camouRestorePlanetSprite() {
  if (!camouSpriteHome) return;

  camouPlanet.position.copy(
    camouSpriteHome.position
  );

  camouPlanet.scale.copy(
    camouSpriteHome.scale
  );

  camouPlanet.material.opacity = 1;
  camouPlanet.visible = true;

  camouSetPlanetSpriteForeground(false);
}


function camouSetSecondProjectInfo() {
  // Alle Markierungen in der Navigation entfernen.
  navButtons.forEach(button => {
    button.classList.remove("active");

    // Auch die Tastatur-Fokusmarkierung entfernen.
    if (document.activeElement === button) {
      button.blur();
    }
  });

  // Beschriftung unten rechts.
  const section = $("current-section");
  const number = $("section-number");

  if (section) {
    section.textContent = "PLANET";
  }

  if (number) {
    number.textContent = "01 / 01";
  }

  // Zurueck-Button anzeigen.
  camouReturnButton.style.display = "block";
}

/* =========================================
   CAMOU: GEMEINSAMER HIN- UND RUECKFLUG
========================================= */

// Kamera-Sprite und echte 3D-Kugel
// auf dieselbe sichtbare Groesse bringen.
function camouSpriteScaleForZoom(zoom) {
  const r = CONFIG.radius;

  return (
    25 * 2 * r /
    Math.sqrt(zoom * zoom - r * r) /
    CAMOU_PLANET_SPRITE_RADIUS
  );
}

const CAMOU_PLANET_TURN_MS = 720;
const CAMOU_PLANET_SWAP_MS = 320;
const CAMOU_PLANET_YAW = -1.85;

const CAMOU_MINI_FRONT_Z =
  CONFIG.radius + 1.4;

const CAMOU_FULL_FRONT_Z = 0.12;

function camouMiniProjectScale() {
  const spriteSlope =
    CAMOU_SPRITE_TRAVEL_SCALE *
    CAMOU_PLANET_SPRITE_RADIUS / 50;

  return (
    (CAMOU_WORLD_OVERVIEW - CAMOU_MINI_FRONT_Z) *
    spriteSlope /
    (
      CONFIG.radius *
      Math.sqrt(1 + spriteSlope ** 2)
    )
  );
}

// Manueller Zoom mit derselben Bewegung
// wie beim animierten Hin- und Rueckflug.
function camouUpdateExplorePlanetSize() {
  if (
    camouWorldMode !== "planet" ||
    camouWorldFlight ||
    !camouSecondPlanetGroup
  ) return;

  const u = clamp(
    (currentZoom - CAMOU_WORLD_FOCUS) /
    (CAMOU_WORLD_OVERVIEW - CAMOU_WORLD_FOCUS),
    0,
    1
  );

  const z = lerp(
    CAMOU_FULL_FRONT_Z,
    CAMOU_MINI_FRONT_Z,
    u
  );

  const scale = lerp(
    1,
    camouMiniProjectScale(),
    u
  );

  if (
    Math.abs(camouSecondPlanetGroup.position.z - z) > 1e-7 ||
    Math.abs(camouSecondPlanetGroup.scale.x - scale) > 1e-7
  ) {
    camouSecondPlanetGroup.position.z = z;
    camouSecondPlanetGroup.scale.setScalar(scale);
    sceneNeedsRender = true;
  }
}

function camouFlyToWorld(world, sectionIndex = 0) {
  if (camouWorldFlight) return;
  if (world === camouWorldMode) return;

  velocityX = 0;
  velocityY = 0;

  isDragging = false;
  menuAnimating = false;
  camouNavPhase = "idle";

  pointers.clear();
  pointerStart = null;
  stage.classList.remove("dragging");

  if (world === "planet") {
    // Exakte Ausgangsansicht von SCHAU REIN.
    camouPortalView = {
      x: rotationX,
      y: rotationY,
      roll: camera.rotation.z
    };

    // Urspruengliche Position links unten.
    camouSpriteHome = {
      position: camouPlanet.position.clone(),
      scale: camouPlanet.scale.clone()
    };

    camouWorldFlight = {
      to: "planet",
      index: sectionIndex,
      phase: "prepare",
      start: performance.now(),
      fromZoom: currentZoom,
      ready: false,
      planetYaw: CAMOU_PLANET_YAW
    };

    const flight = camouWorldFlight;

    // Auch der erste Besuch verwendet
    // dieselbe fertige Projektoberflaeche.
    camouEnsureSecondPlanet()
      .then(() => {
        if (camouWorldFlight === flight) {
          flight.ready = true;
        }
      })
      .catch(error => {
        console.error(
          "CAMOU Projektplanet:",
          error
        );

        if (camouWorldFlight === flight) {
          camouWorldFlight = null;
        }
      });

  
} else {
  // Die zuletzt erkundete Ausrichtung sichern.
  const exploredOrientation =
    camouGetExploreQuaternion().clone();

  camouWorldFlight = {
    to: "camou",
    index: sectionIndex,
    phase: "returnZoom",
    start: performance.now(),
    fromZoom: currentZoom,
fromPlanetZ:
  camouSecondPlanetGroup.position.z,

fromPlanetScale:
  camouSecondPlanetGroup.scale.x,
    planetOrientation:
      exploredOrientation.clone(),

    returnFromOrientation:
      exploredOrientation,

    returnToOrientation:
      new THREE.Quaternion().setFromAxisAngle(
        camouProjectYawAxis,
        CAMOU_PLANET_YAW
      )
  };
    
// CAMOU steht bereits beim Beginn des
// Rueckflugs hinter dem Projektplaneten.
rotationX = camouPortalView.x;
rotationY = camouPortalView.y;

camera.rotation.z =
  camouPortalView.roll;

globeGroup.rotation.set(
  rotationX,
  rotationY,
  0
);

globeGroup.visible = true;
camouSetGlobeFlightOpacity(1);

    camouReturnButton.style.display = "none";
  }

  sceneNeedsRender = true;
}

function camouUpdateWorldFlight(now) {
  const f = camouWorldFlight;
  if (!f) return;

  const elapsed = Math.max(0, now - f.start);

  const progress = duration =>
    smooth(elapsed / duration);

  const next = phase => {
    f.phase = phase;
    f.start = now;
  };

  const portal = camouPortalView;
  const home = camouSpriteHome;

  const overview = CAMOU_WORLD_OVERVIEW;
  const focus = CAMOU_WORLD_FOCUS;

const spriteSlope =
  CAMOU_SPRITE_TRAVEL_SCALE *
  CAMOU_PLANET_SPRITE_RADIUS / 50;

const miniScale =
  (overview - CAMOU_MINI_FRONT_Z) *
  spriteSlope /
  (
    CONFIG.radius *
    Math.sqrt(1 + spriteSlope ** 2)
  );

  /* =====================================
     HINFLUG 1: PLANET ZUR MITTE
  ===================================== */

  if (f.phase === "prepare") {
    if (!f.ready) return;

   
camouSecondPlanetGroup.visible = false;

camouSecondPlanetGroup.position.z =
  CAMOU_MINI_FRONT_Z;

camouSecondPlanetGroup.scale.setScalar(
  miniScale
);

globeGroup.visible = true;
camouSetGlobeFlightOpacity(1);

    camouSecondPlanetPanel.visible = true;
    camouSecondPlanetPanel.material.opacity = 1;

    camouPlanet.visible = true;
    camouPlanet.material.opacity = 1;

    camouSetPlanetSpriteForeground(true);

    next("move");
  }

  else if (f.phase === "move") {
    const u = progress(CAMOU_ROTATE_MS);

    // CAMOU wird kleiner, waehrend
    // der Planet zur Mitte wandert.
    setZoom(
      lerp(f.fromZoom, overview, u)
    );

    camouPlanet.position
      .copy(home.position)
      .lerp(
        new THREE.Vector3(0, 0, -25),
        u
      );

    const scale = lerp(
      home.scale.x,
      CAMOU_SPRITE_TRAVEL_SCALE,
      u
    );

    camouPlanet.scale.set(
      scale,
      scale,
      1
    );

    if (u >= 1) {
  camouSecondPlanetGroup.scale.setScalar(miniScale);
  camouSecondPlanetGroup.visible = true;
  next("swapIn");
}
}
  
  /* =====================================
     HINFLUG 3: ZUR ECHTEN 3D-KUGEL
  ===================================== */

else if (f.phase === "swapIn") {
  const u = progress(CAMOU_PLANET_SWAP_MS);

  // Der kleine 2D-Planet wird zur 3D-Kugel.
  camouPlanet.material.opacity = 1 - u;

  // CAMOU bleibt die ganze Zeit dahinter.
  if (u >= 1) {
    camouPlanet.visible = false;
    next("planetTurn");
  }
}

    /* =====================================
     HINFLUG 4: PROJEKTBEREICH ANDREHEN
  ===================================== */

  else if (f.phase === "planetTurn") {
    const u = progress(CAMOU_PLANET_TURN_MS);

    // Projektinhalt dreht sich frontal,
    // solange die 3D-Kugel noch klein ist.
    f.planetYaw = lerp(
      CAMOU_PLANET_YAW,
      0,
      u
    );

    if (elapsed >= CAMOU_PLANET_TURN_MS) {
      f.planetYaw = 0;
      next("zoomIn");
    }
  }

  /* =====================================
     HINFLUG 5: MIT INHALT HERANZOOMEN
  ===================================== */

else if (f.phase === "zoomIn") {
  const u = progress(CAMOU_ZOOM_IN_MS);

  camouSecondPlanetGroup.position.z =
    lerp(
      CAMOU_MINI_FRONT_Z,
      CAMOU_FULL_FRONT_Z,
      u
    );

  camouSecondPlanetGroup.scale.setScalar(
    lerp(miniScale, 1, u)
  );

  setZoom(lerp(overview, focus, u));

  if (elapsed >= CAMOU_ZOOM_IN_MS) {
    camouSecondPlanetGroup.position.z =
      CAMOU_FULL_FRONT_Z;

    camouSecondPlanetGroup.scale.setScalar(1);
    setZoom(focus);
      
// CAMOU bleibt hinter dem Projektplaneten
// auf der gespeicherten SCHAU-REIN-Ansicht.
rotationX = camouPortalView.x;
rotationY = camouPortalView.y;
camera.rotation.z = camouPortalView.roll;

camouExploreX = 0;
camouExploreY = 0;
camouExploreRoll = 0;
     
camouWorldMode = "planet";
camouSetSecondProjectInfo();
     
      // Material fuer den spaeteren
      // Rueckflug wiederherstellen.
      camouSetGlobeFlightOpacity(1);

      camouWorldFlight = null;
    }
  }

  /* =====================================
     RUECKFLUG 1: MIT INHALT VERKLEINERN
  ===================================== */



else if (f.phase === "returnZoom") {
  const u = progress(CAMOU_ZOOM_IN_MS);

  // Umgekehrter Hinzoom:
  // Planet, Bild und Text werden kleiner.

// Von der aktuellen manuellen Zoomposition
// ohne Groessensprung zurueckfliegen.
camouSecondPlanetGroup.position.z = lerp(
  f.fromPlanetZ,
  CAMOU_MINI_FRONT_Z,
  u
);

camouSecondPlanetGroup.scale.setScalar(
  lerp(f.fromPlanetScale, miniScale, u)
);

setZoom(
  lerp(f.fromZoom, overview, u)
);

  // CAMOU bleibt unveraendert dahinter.

  if (elapsed >= CAMOU_ZOOM_IN_MS) {
    camouSecondPlanetGroup.position.z =
      CAMOU_MINI_FRONT_Z;

    camouSecondPlanetGroup.scale.setScalar(
      miniScale
    );

    setZoom(overview);
    next("returnTurn");
  }
}

  /* =====================================
     RUECKFLUG 2: PROJEKTBEREICH WEGDREHEN
  ===================================== */

  else if (f.phase === "returnTurn") {
    const u = progress(CAMOU_PLANET_TURN_MS);

    // Der Inhaltsbereich verschwindet
    // durch die Rotation der 3D-Kugel.

// Von der zuletzt erkundeten Ausrichtung
// sanft zur Rueckflugposition drehen.
f.planetOrientation
  .copy(f.returnFromOrientation)
  .slerp(f.returnToOrientation, u);

if (elapsed >= CAMOU_PLANET_TURN_MS) {
  f.planetOrientation.copy(
    f.returnToOrientation
  );

      // Kleine Planetenansicht
      // passend zur 3D-Kugel vorbereiten.
      camouPlanet.position.set(
        0, 0, -25
      );

camouPlanet.scale.set(
  CAMOU_SPRITE_TRAVEL_SCALE,
  CAMOU_SPRITE_TRAVEL_SCALE,
  1
);
      camouPlanet.material.opacity = 0;
      camouPlanet.visible = true;

      camouSetPlanetSpriteForeground(true);

      next("swapOut");
    }
  }

  /* =====================================
     RUECKFLUG 3: ZUR KLEINEN PLANETENANSICHT
  ===================================== */


else if (f.phase === "swapOut") {
  const u = progress(CAMOU_PLANET_SWAP_MS);

  // Gleich grosse kleine Planetendarstellung
  // uebernimmt die 3D-Kugel.
  camouPlanet.material.opacity = u;

  // CAMOU steht dahinter bereits auf
  // SCHAU REIN und bleibt unveraendert.

  if (u >= 1) {
    camouSecondPlanetGroup.visible = false;
    next("returnMove");
  }
}

  /* =====================================
     RUECKFLUG 5: NACH LINKS UNTEN
  ===================================== */

  else if (f.phase === "returnMove") {
    const u = progress(CAMOU_ROTATE_MS);

    // CAMOU zeigt waehrend der gesamten
    // Rueckbewegung unveraendert SCHAU REIN.
    camouPlanet.position
      .set(0, 0, -25)
      .lerp(home.position, u);

    const scale = lerp(
      CAMOU_SPRITE_TRAVEL_SCALE,
      home.scale.x,
      u
    );

    camouPlanet.scale.set(
      scale,
      scale,
      1
    );

    if (u >= 1) {
      camouRestorePlanetSprite();

      camouWorldMode = "camou";

      // Erst jetzt CAMOU-Drehung
      // zum gewaehlten Bereich vorbereiten.
      const p = PLACES[f.index];

      f.fromX = rotationX;
      f.fromY = rotationY;
      f.fromRoll = camera.rotation.z;

      f.toX = p.lat * RAD;
      f.toY = -p.lon * RAD;
      f.toRoll =
        CAMOU_PANEL_ROLL_DEG[f.index] * RAD;

      // Kuerzester Drehweg.
      while (f.toY - f.fromY > Math.PI) {
        f.toY -= 2 * Math.PI;
      }

      while (f.toY - f.fromY < -Math.PI) {
        f.toY += 2 * Math.PI;
      }

      while (
        f.toRoll - f.fromRoll > Math.PI
      ) {
        f.toRoll -= 2 * Math.PI;
      }

      while (
        f.toRoll - f.fromRoll < -Math.PI
      ) {
        f.toRoll += 2 * Math.PI;
      }

      next("returnRotate");
    }
  }

  /* =====================================
     RUECKFLUG 6: CAMOU ZUM ZIEL DREHEN
  ===================================== */

  else if (f.phase === "returnRotate") {
    const u = progress(CAMOU_ROTATE_MS);

    rotationX = lerp(
      f.fromX,
      f.toX,
      u
    );

    rotationY = lerp(
      f.fromY,
      f.toY,
      u
    );

    camera.rotation.z = lerp(
      f.fromRoll,
      f.toRoll,
      u
    );

    if (elapsed >= CAMOU_ROTATE_MS) {
      rotationX = f.toX;
      rotationY = f.toY;
      camera.rotation.z = f.toRoll;

      next("returnFocus");
    }
  }

  /* =====================================
     RUECKFLUG 7: CAMOU HERANZOOMEN
  ===================================== */

  else if (f.phase === "returnFocus") {
    const u = progress(CAMOU_ZOOM_IN_MS);

    setZoom(
      lerp(overview, focus, u)
    );

    if (elapsed >= CAMOU_ZOOM_IN_MS) {
      setZoom(focus);

      camouRestorePlanetSprite();

      camouWorldFlight = null;

      lastIndicatorIndex = -1;
      camouOriginalIndicator();
    }
  }

  sceneNeedsRender = true;
}

/* =========================================
   BESTEHENDE NAVIGATION ANBINDEN
========================================= */

const camouOriginalGoToSection = goToSection;

goToSection = function(index) {
  // VISUALS-Bilder erst bei Aufruf laden.
  if (index === 2) {
    void camouEnsureVisualSlides();
  }

  // Vom zweiten Planeten zu CAMOU zurueck.
  if (camouWorldMode === "planet") {
    camouFlyToWorld(
      "camou",
      ((index % 5) + 5) % 5
    );
    return;
  }

  if (camouWorldFlight) return;

  camouOriginalGoToSection(index);
};

const camouOriginalIndicator = updateIndicator;


updateIndicator = function() {
  // Auf dem Projektplaneten bleibt PLANET aktiv.
  if (
    camouWorldMode === "planet" &&
    !camouWorldFlight
  ) {
    camouSetSecondProjectInfo();
    return;
  }

  // Waehrend des Hin- und Rueckflugs
  // keine automatische Anzeige aktualisieren.
  if (camouWorldFlight) return;

  // Zurueck auf CAMOU:
  // normale Bereichsanzeige wiederherstellen.
  camouOriginalIndicator();
};

/* =========================================
   KLICK AUF SCHAU REIN
========================================= */

const camouOriginalGlobeClick =
  handleGlobeClick;

handleGlobeClick = function(event) {
  if (camouWorldMode === "planet") return;

  const point = texturePoint(event);

  if (
    point?.index === 5 &&
    Math.abs(point.x) < 210 &&
    Math.abs(point.y) < 90
  ) {
    camouFlyToWorld("planet");
    return;
  }

  camouOriginalGlobeClick(event);
};

// Portal auf der Hauptkugel erzeugen.
camouCreatePortal();

/* ENDE CAMOU PROJEKTPLANET 02 */

