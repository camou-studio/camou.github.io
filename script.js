(() => {
  "use strict";

  const scene = document.getElementById("scene");
  const sphere = document.getElementById("sphere");
  const panels = [...document.querySelectorAll(".panel")];

  const menu = document.getElementById("menu");
  const menuToggle = document.getElementById("menuToggle");
  const dragCursor = document.getElementById("dragCursor");

  const currentSection = document.getElementById("currentSection");
  const sectionCounter = document.getElementById("sectionCounter");
  const progressFill = document.getElementById("progressFill");

  const sectionNames = ["HOME", "MUSIC", "VISUALS", "ARCHIVE", "CONTACT"];
  const sectionIds = ["home", "music", "visuals", "archive", "contact"];

  const stepAngle = 360 / panels.length;
  const radius = window.innerWidth < 700 ? 330 : 470;

  let rotationX = -7;
  let rotationY = 0;
  let rotationZ = 0;

  let targetX = rotationX;
  let targetY = rotationY;
  let targetZ = rotationZ;

  let activeIndex = 0;
  let isDragging = false;
  let pointerStartX = 0;
  let pointerStartY = 0;
  let rotationStartX = 0;
  let rotationStartY = 0;
  let rotationStartZ = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let velocityX = 0;
  let velocityY = 0;
  let lastMoveTime = 0;
  let animationFrame = null;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // Each section occupies a position around the virtual globe.
  function arrangePanels() {
    const currentRadius = window.innerWidth < 700 ? 330 : 470;

    panels.forEach((panel, index) => {
      const angle = index * stepAngle;
      const radians = (angle * Math.PI) / 180;

      // Slightly vary the vertical position to create a spherical orbit.
      const verticalOffset = Math.sin(radians) * 58;
      const depthOffset = Math.cos(radians) * 22;

      panel.style.transform = `
        rotateY(${angle}deg)
        translateY(${verticalOffset}px)
        translateZ(${currentRadius + depthOffset}px)
      `;
    });
  }

  function normalizeIndex(index) {
    return ((index % panels.length) + panels.length) % panels.length;
  }

  function getIndexFromRotation() {
    return normalizeIndex(Math.round(-rotationY / stepAngle));
  }

  function updateInterface() {
    activeIndex = getIndexFromRotation();

    currentSection.textContent = sectionNames[activeIndex];
    sectionCounter.textContent =
      `${String(activeIndex + 1).padStart(2, "0")} / 05`;

    progressFill.style.width =
      `${((activeIndex + 1) / panels.length) * 100}%`;

    panels.forEach((panel, index) => {
      const distance = Math.abs(
        ((index - activeIndex + panels.length / 2) % panels.length) -
        panels.length / 2
      );

      panel.style.opacity = distance === 0 ? "1" : distance === 1 ? "0.72" : "0.4";
      panel.style.filter = distance === 0 ? "none" : "brightness(0.68)";
      panel.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
    });

    menu.querySelectorAll("a").forEach((link) => {
      const index = Number(link.dataset.target);
      link.classList.toggle("is-active", index === activeIndex);
    });
  }

  function render() {
    if (reducedMotion) {
      rotationX = targetX;
      rotationY = targetY;
      rotationZ = targetZ;
    } else {
      // Smooth, slightly weighty motion.
      rotationX += (targetX - rotationX) * 0.085;
      rotationY += (targetY - rotationY) * 0.085;
      rotationZ += (targetZ - rotationZ) * 0.085;
    }

    sphere.style.transform = `
      rotateX(${rotationX}deg)
      rotateY(${rotationY}deg)
      rotateZ(${rotationZ}deg)
    `;

    updateInterface();

    const stillMoving =
      Math.abs(targetX - rotationX) > 0.02 ||
      Math.abs(targetY - rotationY) > 0.02 ||
      Math.abs(targetZ - rotationZ) > 0.02;

    if (stillMoving) {
      animationFrame = requestAnimationFrame(render);
    } else {
      animationFrame = null;
    }
  }

  function requestRender() {
    if (!animationFrame) {
      animationFrame = requestAnimationFrame(render);
    }
  }

  function nearestEquivalentAngle(index, currentAngle) {
    const baseAngle = -index * stepAngle;
    const fullTurns = Math.round((currentAngle - baseAngle) / 360);
    return baseAngle + fullTurns * 360;
  }

  function goToSection(index) {
    const safeIndex = normalizeIndex(index);

    targetY = nearestEquivalentAngle(safeIndex, targetY);
    targetX = -7;
    targetZ = 0;

    closeMenu();
    requestRender();
  }

  function snapToNearestSection() {
    const nearestIndex = getIndexFromRotation();

    targetY = nearestEquivalentAngle(nearestIndex, rotationY);
    targetX = Math.max(-22, Math.min(22, rotationX));
    targetZ = 0;

    requestRender();
  }

  // Pointer interaction works with mouse, trackpad and touch.
  function onPointerDown(event) {
    if (event.target.closest("a, button")) return;

    isDragging = true;
    scene.setPointerCapture(event.pointerId);
    scene.classList.add("is-dragging");
    document.body.classList.add("is-dragging");

    pointerStartX = event.clientX;
    pointerStartY = event.clientY;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;

    rotationStartX = targetX;
    rotationStartY = targetY;
    rotationStartZ = targetZ;

    velocityX = 0;
    velocityY = 0;
    lastMoveTime = performance.now();
  }

  function onPointerMove(event) {
    dragCursor.style.left = `${event.clientX}px`;
    dragCursor.style.top = `${event.clientY}px`;

    if (!isDragging) return;

    const dx = event.clientX - pointerStartX;
    const dy = event.clientY - pointerStartY;

    const now = performance.now();
    const elapsed = Math.max(1, now - lastMoveTime);

    velocityX = (event.clientX - lastPointerX) / elapsed;
    velocityY = (event.clientY - lastPointerY) / elapsed;

    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    lastMoveTime = now;

    // Horizontal drag rotates around the vertical axis.
    // Vertical drag tilts the globe and adds a diagonal roll.
    targetY = rotationStartY + dx * 0.42;
    targetX = rotationStartX - dy * 0.25;
    targetZ = rotationStartZ + dx * 0.035 - dy * 0.025;

    targetX = Math.max(-48, Math.min(48, targetX));

    requestRender();
  }

  function onPointerUp() {
    if (!isDragging) return;

    isDragging = false;
    scene.classList.remove("is-dragging");
    document.body.classList.remove("is-dragging");

    // Carry a little of the drag momentum into the release.
    targetY += velocityX * 180;
    targetX -= velocityY * 90;
    targetZ *= 0.35;

    snapToNearestSection();
  }

  scene.addEventListener("pointerdown", onPointerDown);
  scene.addEventListener("pointermove", onPointerMove);
  scene.addEventListener("pointerup", onPointerUp);
  scene.addEventListener("pointercancel", onPointerUp);
  scene.addEventListener("lostpointercapture", onPointerUp);

  // Menu open / close.
  function openMenu() {
    menu.classList.add("is-open");
    menu.setAttribute("aria-hidden", "false");
    menuToggle.setAttribute("aria-expanded", "true");
    menuToggle.setAttribute("aria-label", "Menü schließen");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    menu.setAttribute("aria-hidden", "true");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Menü öffnen");
  }

  menuToggle.addEventListener("click", () => {
    if (menu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  menu.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-target]");
    if (!link) return;

    event.preventDefault();
    goToSection(Number(link.dataset.target));
  });

  // Keyboard navigation is available as an alternative to dragging.
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
      return;
    }

    if (menu.classList.contains("is-open")) return;

    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      goToSection(activeIndex + 1);
    }

    if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      goToSection(activeIndex - 1);
    }
  });

  // Keep the sphere centered and correctly spaced after resizing.
  window.addEventListener("resize", () => {
    arrangePanels();
    requestRender();
  });

  // Initial setup.
  arrangePanels();
  updateInterface();
  requestRender();

  // Make the current section directly addressable through its URL hash.
  const initialHash = window.location.hash.replace("#", "");
  const initialIndex = sectionIds.indexOf(initialHash);

  if (initialIndex >= 0) {
    goToSection(initialIndex);
  }
})();
