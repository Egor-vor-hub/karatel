(() => {
  const stage = document.getElementById("stage");
  const frames = Array.from(stage.querySelectorAll(".frame"));
  const framesWrap = stage.querySelector(".frames");
  const dots = Array.from(document.querySelectorAll(".dot"));
  const dragHint = document.getElementById("dragHint");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let dragging = false;
  let startX = 0;
  let dragDelta = 0;
  let hintDismissed = false;
  const STEP = 90;
  const TAP_THRESHOLD = 6;

  function setFrame(next) {
    index = ((next % frames.length) + frames.length) % frames.length;
    frames.forEach((f) => f.classList.toggle("is-active", Number(f.dataset.frame) === index));
    dots.forEach((d, i) => {
      const active = i === index;
      d.classList.toggle("is-active", active);
      d.setAttribute("aria-selected", String(active));
    });
  }

  function dismissHint() {
    if (hintDismissed) return;
    hintDismissed = true;
    dragHint.classList.add("is-hidden");
  }

  function setTilt(rx, ry) {
    if (reduceMotion) return;
    framesWrap.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  function pointerPercent(e) {
    const rect = stage.getBoundingClientRect();
    return {
      px: ((e.clientX - rect.left) / rect.width) * 100,
      py: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }

  stage.addEventListener("pointermove", (e) => {
    const { px, py } = pointerPercent(e);

    if (dragging) {
      dragDelta = e.clientX - startX;
      setTilt(0, dragDelta / 14);
    } else if (!reduceMotion) {
      const rx = (50 - py) / 10;
      const ry = (px - 50) / 14;
      setTilt(rx, ry);
    }
  });

  stage.addEventListener("pointerdown", (e) => {
    dragging = true;
    startX = e.clientX;
    dragDelta = 0;
    stage.setPointerCapture(e.pointerId);
  });

  function endDrag(e) {
    if (!dragging) return;
    dragging = false;

    if (Math.abs(dragDelta) < TAP_THRESHOLD) {
      const { px } = pointerPercent(e);
      setFrame(index + (px < 50 ? -1 : 1));
      dismissHint();
    } else {
      const steps = Math.round(dragDelta / STEP);
      if (steps !== 0) {
        setFrame(index - steps);
        dismissHint();
      }
    }
    setTilt(0, 0);
  }

  stage.addEventListener("pointerup", endDrag);
  stage.addEventListener("pointercancel", endDrag);
  stage.addEventListener("pointerleave", () => {
    if (!dragging) setTilt(0, 0);
  });

  stage.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") {
      setFrame(index + 1);
      dismissHint();
    } else if (e.key === "ArrowLeft") {
      setFrame(index - 1);
      dismissHint();
    }
  });

  dots.forEach((dot, i) => {
    dot.addEventListener("click", () => {
      setFrame(i);
      dismissHint();
    });
  });

  setFrame(0);
})();

(() => {
  const targets = document.querySelectorAll(".reveal, .specs");
  if (!("IntersectionObserver" in window)) {
    targets.forEach((t) => t.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  targets.forEach((t) => observer.observe(t));
})();

(() => {
  const canHover = window.matchMedia("(hover: hover)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!canHover || reduceMotion) return;

  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);

  let raf = null;

  window.addEventListener("pointermove", (e) => {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      glow.style.setProperty("--mx", `${(e.clientX / window.innerWidth) * 100}%`);
      glow.style.setProperty("--my", `${(e.clientY / window.innerHeight) * 100}%`);
      glow.classList.add("is-active");
      raf = null;
    });
  });

  document.documentElement.addEventListener("mouseleave", () => {
    glow.classList.remove("is-active");
  });
})();
