// Amanda Jayachandran — portfolio skeleton
// Small, deliberate interactions only. No framework required.

(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  var isTouch = window.matchMedia("(hover: none)").matches;

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

  // ---- Ambient glow: follows the pointer within the hero, desktop only ----
  var glow = document.querySelector(".glow");
  var hero = document.querySelector(".hero");

  if (glow && hero && !isTouch && !prefersReducedMotion) {
    hero.addEventListener("pointermove", function (event) {
      var rect = hero.getBoundingClientRect();
      var x = ((event.clientX - rect.left) / rect.width) * 100;
      var y = ((event.clientY - rect.top) / rect.height) * 100;
      glow.style.setProperty("--glow-x", x + "%");
      glow.style.setProperty("--glow-y", y + "%");
    });
  }

  // ---- Magnetic buttons: nudge toward the pointer, desktop only ----
  var magneticEls = document.querySelectorAll("[data-magnetic]");
  if (magneticEls.length && !isTouch && !prefersReducedMotion) {
    var strength = 0.35;
    var maxOffset = 10;

    magneticEls.forEach(function (el) {
      el.addEventListener("pointermove", function (event) {
        var rect = el.getBoundingClientRect();
        var relX = event.clientX - (rect.left + rect.width / 2);
        var relY = event.clientY - (rect.top + rect.height / 2);
        var x = Math.max(Math.min(relX * strength, maxOffset), -maxOffset);
        var y = Math.max(Math.min(relY * strength, maxOffset), -maxOffset);
        el.style.transform = "translate(" + x.toFixed(1) + "px, " + y.toFixed(1) + "px)";
      });
      el.addEventListener("pointerleave", function () {
        el.style.transform = "translate(0, 0)";
      });
    });
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
