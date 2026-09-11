// mywork gate: request code -> verify code -> load signed video URL.
// No password or content is ever present in this file -- everything is
// validated server-side in /api/request-access, /api/verify-access,
// and /api/video-url.

(function () {
  "use strict";

  var stepEmail = document.getElementById("step-email");
  var stepCode = document.getElementById("step-code");
  var stepVideo = document.getElementById("step-video");

  var requestForm = document.getElementById("request-form");
  var verifyForm = document.getElementById("verify-form");
  var requestStatus = document.getElementById("request-status");
  var verifyStatus = document.getElementById("verify-status");
  var requestNewCodeBtn = document.getElementById("request-new-code");

  var currentEmail = "";

  function showStep(step) {
    [stepEmail, stepCode, stepVideo].forEach(function (el) {
      el.hidden = el !== step;
    });
  }

  requestForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var email = document.getElementById("email-input").value.trim();
    requestStatus.textContent = "Sending...";

    fetch("/api/request-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email }),
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        currentEmail = email;
        requestStatus.textContent = data.message || "If approved, a code has been sent.";
        showStep(stepCode);
      })
      .catch(function () {
        requestStatus.textContent = "Something went wrong. Please try again.";
      });
  });

  verifyForm.addEventListener("submit", function (event) {
    event.preventDefault();
    var code = document.getElementById("code-input").value.trim();
    verifyStatus.textContent = "Verifying...";

    fetch("/api/verify-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: currentEmail, code: code }),
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Verification failed.");
          return data;
        });
      })
      .then(function () {
        loadVideo();
      })
      .catch(function (err) {
        verifyStatus.textContent = err.message;
      });
  });

  requestNewCodeBtn.addEventListener("click", function () {
    showStep(stepEmail);
    requestStatus.textContent = "";
    verifyStatus.textContent = "";
  });

  function loadVideo() {
    fetch("/api/video-url")
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.error || "Could not load video.");
          return data;
        });
      })
      .then(function (data) {
        var video = document.getElementById("mywork-video");
        video.src = data.url;

        var watermark = document.getElementById("video-watermark");
        var stamp = data.email + " -- " + new Date().toLocaleString();
        watermark.textContent = stamp;

        showStep(stepVideo);
        video.play().catch(function () {});
      })
      .catch(function (err) {
        verifyStatus.textContent = err.message;
        showStep(stepCode);
      });
  }

  // Mild friction: pause playback if the tab loses focus.
  document.addEventListener("visibilitychange", function () {
    var video = document.getElementById("mywork-video");
    if (video && document.hidden && !video.paused) {
      video.pause();
    }
  });
})();
