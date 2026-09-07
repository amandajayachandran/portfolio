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
      // Pull it back up by an estimated fraction of the font size to
      // approximate the true baseline, then a smaller amount further
      // to land at the top of the letters' bottom stroke (not the
      // full letter height).
      var fontSizePx = parseFloat(getComputedStyle(heroMassive).fontSize) || 0;
      var trueBaseline = secondWordRect.bottom - fontSizePx * 0.22;
      var baselineY = trueBaseline - fontSizePx * 0.1;

      heroPhoto.style.left = (gapX - bleedRect.left) + "px";
      heroPhoto.style.top = (baselineY - bleedRect.top) + "px";

      // Find the left edge of the first "R" in "Director" (index 2 of
      // the text node: D-i-r-e-c-t-o-r) via a Range, since there's no
      // per-letter element to measure directly.
      var directorText = heroWords[1].firstChild;
      var firstRLeft = secondWordRect.left;
      if (directorText && directorText.nodeType === Node.TEXT_NODE && directorText.length > 2) {
        var range = document.createRange();
        range.setStart(directorText, 2);
        range.setEnd(directorText, 3);
        var rRect = range.getBoundingClientRect();
        if (rRect.width > 0) {
          firstRLeft = rRect.left;
        }
      }

      var taglineLeft = firstRLeft - bleedRect.left;
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

  // ---- Statement: split each line into letters, then scatter them on
  // scroll — the section "breaks apart" as the user scrolls past it. ----
  var statement = document.querySelector("[data-statement]");
  var statementLines = statement ? statement.querySelectorAll("[data-line]") : null;

  if (statement && statementLines && statementLines.length && !prefersReducedMotion) {
    // Split each line's text into one <span class="letter"> per
    // character, preserving spaces as plain text so words still wrap
    // naturally at narrow widths.
    statementLines.forEach(function (line) {
      var text = line.textContent;
      line.textContent = "";
      text.split("").forEach(function (ch) {
        if (ch === " ") {
          line.appendChild(document.createTextNode(" "));
          return;
        }
        var span = document.createElement("span");
        span.className = "letter";
        span.textContent = ch;
        // Randomize the scatter direction/rotation and stagger the
        // timing slightly per letter for a cascading break-apart feel.
        var angle = Math.random() * Math.PI * 2;
        var distance = 120 + Math.random() * 220;
        span.style.setProperty("--tx", Math.round(Math.cos(angle) * distance) + "px");
        span.style.setProperty("--ty", Math.round(Math.sin(angle) * distance) + "px");
        span.style.setProperty("--rot", Math.round(Math.random() * 720 - 360) + "deg");
        span.style.setProperty("--letter-delay", (Math.random() * 0.35).toFixed(2) + "s");
        line.appendChild(span);
      });
    });

    var scatterOn = function () {
      statement.setAttribute("data-scattered", "");
    };
    var scatterOff = function () {
      statement.removeAttribute("data-scattered");
    };

    if ("IntersectionObserver" in window) {
      // Trigger once the section is mostly scrolled past (little of it
      // left at the top of the viewport); reset if scrolled back above it.
      var observer = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            var rect = entry.boundingClientRect;
            if (!entry.isIntersecting && rect.top < 0) {
              scatterOn();
            } else if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              scatterOff();
            }
          });
        },
        { threshold: [0, 0.6] }
      );
      observer.observe(statement);
    } else {
      // Fallback for browsers without IntersectionObserver support
      window.addEventListener(
        "scroll",
        function () {
          var rect = statement.getBoundingClientRect();
          if (rect.bottom < window.innerHeight * 0.3) {
            scatterOn();
          } else if (rect.top > 0) {
            scatterOff();
          }
        },
        { passive: true }
      );
    }
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
