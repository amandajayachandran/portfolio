// Amanda Jayachandran — portfolio skeleton
// Small, deliberate interactions only. No framework required.

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  // ---- Header: solid background once the page has scrolled ----
  var header = document.querySelector("[data-header]");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Hero reveal: trigger the single orchestrated load-in ----
  var heroLine = document.querySelector("[data-reveal]");
  if (heroLine) {
    // rAF ensures the browser has painted the initial state first
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        heroLine.classList.add("is-ready");
      });
    });
  }

  // ---- Scroll cue: jump to the target section ----
  var scrollCue = document.querySelector("[data-scroll-to]");
  if (scrollCue) {
    scrollCue.addEventListener("click", function () {
      var target = document.querySelector(scrollCue.getAttribute("data-scroll-to"));
      if (target) {
        target.scrollIntoView({ behavior: prefersReducedMotion ? "auto" : "smooth" });
      }
    });
  }

  // ---- Hero tagline: align its right edge exactly to the headline's ----
  var heroTagline = document.querySelector(".hero-tagline");
  var heroMassive = document.querySelector(".hero-massive");
  var heroBleed = document.querySelector(".hero-full-bleed");

  if (heroTagline && heroMassive && heroBleed) {
    var alignTagline = function () {
      // Reset first so the measurement isn't thrown off by a prior offset
      heroTagline.style.marginRight = "0px";
      var headlineRight = heroMassive.getBoundingClientRect().right;
      var bleedRight = heroBleed.getBoundingClientRect().right;
      var bleedStyles = window.getComputedStyle(heroBleed);
      var bleedPaddingRight = parseFloat(bleedStyles.paddingRight) || 0;
      var innerRight = bleedRight - bleedPaddingRight;
      var offset = innerRight - headlineRight;
      heroTagline.style.marginRight = Math.max(offset, 0) + "px";
    };

    alignTagline();
    window.addEventListener("resize", alignTagline);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(alignTagline);
    }
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
