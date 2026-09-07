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

  // ---- Hero overlay: position the headshot at the Creative/Director gap
  // (tucked behind the text baseline) and stretch the tagline between the
  // headshot's right edge and the headline's right edge. ----
  var heroTagline = document.querySelector(".hero-tagline");
  var heroPhoto = document.querySelector(".hero-photo");
  var heroMassive = document.querySelector(".hero-massive");
  var heroBleed = document.querySelector(".hero-full-bleed");
  var heroWords = heroMassive ? heroMassive.querySelectorAll("span") : null;

  if (heroTagline && heroPhoto && heroMassive && heroBleed && heroWords && heroWords.length >= 2) {
    var MOBILE_BREAKPOINT = 860;

    var clearOverlayStyles = function () {
      heroPhoto.style.left = "";
      heroPhoto.style.top = "";
      heroTagline.style.left = "";
      heroTagline.style.top = "";
      heroTagline.style.width = "";
    };

    var layoutHeroOverlay = function () {
      if (window.innerWidth <= MOBILE_BREAKPOINT) {
        clearOverlayStyles();
        return;
      }

      var bleedRect = heroBleed.getBoundingClientRect();
      var firstWordRect = heroWords[0].getBoundingClientRect();
      var secondWordRect = heroWords[1].getBoundingClientRect();

      // Horizontal center of the photo: the gap between the two words
      // (the "E" of Creative and the "D" of Director).
      var gapX = (firstWordRect.right + secondWordRect.left) / 2;

      // Vertical anchor: the visual bottom of the letters. A span's
      // bounding-box bottom includes the font's built-in descent
      // allowance, which sits below the visible glyph for an all-caps
      // word — so it reads lower than where the letters actually end.
      // Pull it back up by an estimated fraction of the font size.
      var fontSizePx = parseFloat(getComputedStyle(heroMassive).fontSize) || 0;
      var baselineY = secondWordRect.bottom - fontSizePx * 0.22;

      heroPhoto.style.left = (gapX - bleedRect.left) + "px";
      heroPhoto.style.top = (baselineY - bleedRect.top) + "px";

      var photoRect = heroPhoto.getBoundingClientRect();
      var taglineLeft = photoRect.right - bleedRect.left;
      var taglineRight = secondWordRect.right - bleedRect.left;
      var headlineBottom = heroMassive.getBoundingClientRect().bottom - bleedRect.top;

      heroTagline.style.left = taglineLeft + "px";
      heroTagline.style.width = Math.max(taglineRight - taglineLeft, 40) + "px";
      heroTagline.style.top = (headlineBottom + 12) + "px";
    };

    layoutHeroOverlay();
    window.addEventListener("resize", layoutHeroOverlay);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layoutHeroOverlay);
    }
    window.addEventListener("load", layoutHeroOverlay);
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
