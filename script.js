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

  // ---- Hero overlay: position the headshot at the Creative/Director gap
  // (tucked behind the text baseline) and stretch the tagline between the
  // headshot's right edge and the headline's right edge. ----
  var heroTagline = document.querySelector(".hero-tagline");
  var heroPhoto = document.querySelector(".hero-photo");
  var heroMassive = document.querySelector(".hero-massive");
  var heroBleed = document.querySelector(".hero-full-bleed");
  var heroSpecialties = document.querySelector(".hero-specialties");
  var heroSection = document.querySelector(".hero");
  var heroWords = heroMassive ? heroMassive.querySelectorAll("span") : null;

  if (heroTagline && heroPhoto && heroMassive && heroBleed && heroWords && heroWords.length >= 2) {
    var MOBILE_BREAKPOINT = 860;

    var clearOverlayStyles = function () {
      heroPhoto.style.left = "";
      heroPhoto.style.top = "";
      heroTagline.style.left = "";
      heroTagline.style.top = "";
      heroTagline.style.width = "";
      if (heroSpecialties) {
        heroSpecialties.style.marginLeft = "";
      }
      if (heroSection) {
        heroSection.style.paddingBottom = "";
      }
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
      // (the "E" of Creative and the "D" of Director) — but never let
      // the photo's own left edge cross left of the "E", regardless of
      // how wide the photo renders at a given viewport size.
      var gapX = (firstWordRect.right + secondWordRect.left) / 2;

      var creativeText = heroWords[0].firstChild;
      var lastELeft = firstWordRect.right;
      if (creativeText && creativeText.nodeType === Node.TEXT_NODE && creativeText.length > 0) {
        var eRange = document.createRange();
        var lastIndex = creativeText.length - 1;
        eRange.setStart(creativeText, lastIndex);
        eRange.setEnd(creativeText, lastIndex + 1);
        var eRect = eRange.getBoundingClientRect();
        if (eRect.width > 0) {
          lastELeft = eRect.left;
        }
      }

      var fontSizePx = parseFloat(getComputedStyle(heroMassive).fontSize) || 0;

      var photoWidth = heroPhoto.getBoundingClientRect().width;
      // Small safety margin beyond the measured "E" edge: a DOM Range's
      // rect reflects that character's advance box, which can sit a
      // few pixels inside the glyph's actual visual ink depending on
      // the font's side bearing. Padding out by a fraction of the
      // headline's font size (rather than a fixed px value) keeps the
      // margin proportional at any viewport width.
      var edgeSafetyMargin = fontSizePx * 0.05;
      var minCenterX = lastELeft + edgeSafetyMargin + photoWidth / 2;
      var centerX = Math.max(gapX, minCenterX);

      // Vertical anchor: the visual bottom of the letters. A span's
      // bounding-box bottom includes the font's built-in descent
      // allowance, which sits below the visible glyph for an all-caps
      // word — so it reads lower than where the letters actually end.
      // Pull it back up by an estimated fraction of the font size to
      // approximate the true baseline, then a smaller amount further
      // to land at the top of the letters' bottom stroke (not the
      // full letter height).
      var trueBaseline = secondWordRect.bottom - fontSizePx * 0.22;
      var baselineY = trueBaseline - fontSizePx * 0.1;

      heroPhoto.style.left = (centerX - bleedRect.left) + "px";
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

      // Specialty list: pull its left edge (the first "/") to sit
      // exactly 200px from the headshot's left edge, regardless of
      // where the list naturally falls in normal flow.
      if (heroSpecialties) {
        heroSpecialties.style.marginLeft = "0px";
        var specialtiesRect = heroSpecialties.getBoundingClientRect();
        var photoLeftViewport = heroPhoto.getBoundingClientRect().left;
        var desiredLeftViewport = photoLeftViewport - 200;
        var marginAdjustment = desiredLeftViewport - specialtiesRect.left;
        heroSpecialties.style.marginLeft = marginAdjustment + "px";
      }

      // Guard: the headshot hangs below the headline via an absolute
      // top offset, so at some viewport sizes its bottom edge can sit
      // past the hero section's own bottom padding and visually touch
      // the section below. Force enough clearance regardless of font
      // metrics or screen size.
      if (heroSection) {
        heroSection.style.paddingBottom = "";
        var heroSectionRect = heroSection.getBoundingClientRect();
        var photoBottomViewport = heroPhoto.getBoundingClientRect().bottom;
        var clearance = 48;
        var overflowPast = photoBottomViewport + clearance - heroSectionRect.bottom;
        if (overflowPast > 0) {
          var currentPaddingBottom = parseFloat(getComputedStyle(heroSection).paddingBottom) || 0;
          heroSection.style.paddingBottom = (currentPaddingBottom + overflowPast) + "px";
        }
      }
    };

    layoutHeroOverlay();
    window.addEventListener("resize", layoutHeroOverlay);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(layoutHeroOverlay);
    }
    window.addEventListener("load", layoutHeroOverlay);

    // Recalculate again once the headshot image itself has loaded —
    // on some connections it finishes after the above have already run.
    var heroPhotoImg = heroPhoto.querySelector("img");
    if (heroPhotoImg && !heroPhotoImg.complete) {
      heroPhotoImg.addEventListener("load", layoutHeroOverlay);
    }

    // Safety net: on a cold cache (first visit, no cached fonts), the
    // custom font can finish swapping in slightly after fonts.ready
    // and the load event both fire, leaving the overlay positioned
    // against fallback-font metrics until a manual reload. A couple
    // of short delayed re-checks catch that without needing one.
    setTimeout(layoutHeroOverlay, 300);
    setTimeout(layoutHeroOverlay, 1000);
  }

  // ---- Statement: letters push away from the cursor and dim to grey,
  // then spring back to white and rest once the cursor moves on. ----
  var statement = document.querySelector("[data-statement]");
  var statementText = statement ? statement.querySelector(".statement-text") : null;
  var statementLines = statement ? statement.querySelectorAll("[data-line]") : null;

  if (statement && statementText && statementLines && statementLines.length) {
    // Simple entrance: fade the whole block in once it scrolls into view.
    if ("IntersectionObserver" in window) {
      var revealObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              statementText.classList.add("is-visible");
              revealObserver.unobserve(statement);
            }
          });
        },
        { threshold: 0.2 }
      );
      revealObserver.observe(statement);
    } else {
      statementText.classList.add("is-visible");
    }

    if (!prefersReducedMotion) {
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
          line.appendChild(span);
        });
      });

      var letters = Array.prototype.slice.call(statement.querySelectorAll(".letter"));
      // Each letter gets a small fixed personality — a touch of extra
      // jitter added on top of the pure push-away-from-cursor vector —
      // so the reaction reads as organic scattering rather than a
      // mechanically perfect radial push.
      var letterData = letters.map(function (el) {
        return {
          el: el,
          cx: 0,
          cy: 0,
          active: false,
          jitterX: (Math.random() - 0.5) * 40,
          jitterY: (Math.random() - 0.5) * 40,
          jitterRot: (Math.random() - 0.5) * 60
        };
      });

      var RADIUS = 130;
      var MAX_PUSH = 42;

      var cacheLetterPositions = function () {
        var sectionRect = statement.getBoundingClientRect();
        letterData.forEach(function (d) {
          var r = d.el.getBoundingClientRect();
          d.cx = r.left + r.width / 2 - sectionRect.left;
          d.cy = r.top + r.height / 2 - sectionRect.top;
        });
      };

      cacheLetterPositions();
      window.addEventListener("resize", cacheLetterPositions);
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(cacheLetterPositions);
      }

      var pointerActive = false;
      var pointerX = 0;
      var pointerY = 0;
      var ticking = false;

      var applyPointerEffect = function () {
        ticking = false;
        letterData.forEach(function (d) {
          var dx = d.cx - pointerX;
          var dy = d.cy - pointerY;
          var dist = Math.sqrt(dx * dx + dy * dy);

          if (pointerActive && dist < RADIUS) {
            var factor = 1 - dist / RADIUS;
            var norm = dist === 0 ? 0 : 1 / dist;
            var pushX = dx * norm * MAX_PUSH * factor + d.jitterX * factor;
            var pushY = dy * norm * MAX_PUSH * factor + d.jitterY * factor;
            var rot = d.jitterRot * factor;
            d.el.style.transform =
              "translate(" + pushX.toFixed(1) + "px, " + pushY.toFixed(1) + "px) rotate(" + rot.toFixed(1) + "deg)";
            d.el.style.color = "#D4DC55";
            d.active = true;
          } else if (d.active) {
            d.el.style.transform = "";
            d.el.style.color = "";
            d.active = false;
          }
        });
      };

      var requestUpdate = function () {
        if (!ticking) {
          ticking = true;
          requestAnimationFrame(applyPointerEffect);
        }
      };

      statement.addEventListener("pointermove", function (event) {
        var sectionRect = statement.getBoundingClientRect();
        pointerX = event.clientX - sectionRect.left;
        pointerY = event.clientY - sectionRect.top;
        pointerActive = true;
        requestUpdate();
      });

      statement.addEventListener("pointerleave", function () {
        pointerActive = false;
        requestUpdate();
      });

      // Scroll sweep: drive the same push/dim effect from scroll
      // position too, so it fires without the person needing to move
      // their mouse — a synthetic "cursor" travels straight down the
      // horizontal middle of the text as the section scrolls through
      // the viewport, inviting a pause to interact directly.
      var lastScrollY = window.scrollY;

      var applyScrollSweep = function () {
        var sectionRect = statement.getBoundingClientRect();
        var localY = window.innerHeight / 2 - sectionRect.top;

        if (localY >= 0 && localY <= sectionRect.height) {
          pointerX = sectionRect.width / 2;
          pointerY = localY;
          pointerActive = true;
          requestUpdate();
        } else if (pointerActive) {
          pointerActive = false;
          requestUpdate();
        }
      };

      var scrollTicking = false;
      window.addEventListener(
        "scroll",
        function () {
          lastScrollY = window.scrollY;
          if (!scrollTicking) {
            scrollTicking = true;
            requestAnimationFrame(function () {
              scrollTicking = false;
              applyScrollSweep();
            });
          }
        },
        { passive: true }
      );

      // In case the section is already in view on load.
      applyScrollSweep();
    }
  }

  // ---- Footer year ----
  var yearEl = document.querySelector("[data-year]");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }
})();
