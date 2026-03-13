function smoothScrollTo(targetSelector) {
  var el = document.querySelector(targetSelector);
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function animateBars() {
  var bars = document.querySelectorAll(".sf-bar");
  bars.forEach(function (bar) {
    var target = Number(bar.getAttribute("data-bar") || "0");
    bar.style.transition = "transform 0.7s cubic-bezier(0.33, 1, 0.68, 1)";
    bar.style.transform = "scaleX(" + target / 100 + ")";
  });
}

function animateCounters() {
  var counters = document.querySelectorAll("[data-counter]");
  counters.forEach(function (el) {
    var target = Number(el.getAttribute("data-counter") || "0");
    var isFloat = String(target).indexOf(".") >= 0;
    var duration = 900;
    var startTime = performance.now();

    function step(now) {
      var progress = Math.min(1, (now - startTime) / duration);
      var value = target * progress;
      el.textContent = isFloat ? value.toFixed(1) : Math.round(value).toLocaleString();
      if (progress < 1) requestAnimationFrame(step);
    }

    requestAnimationFrame(step);
  });
}

function randomInRange(min, max, decimals) {
  var factor = Math.pow(10, decimals || 0);
  return Math.round((min + Math.random() * (max - min)) * factor) / factor;
}

function updateInsightsFromBackend(payload) {
  if (!payload || !payload.metrics) return;

  var cleaned = payload.domain || "";
  var metrics = payload.metrics;

  var insightDomain = document.getElementById("insight-domain");
  if (insightDomain && cleaned) {
    insightDomain.textContent = "Showing sample data for " + cleaned;
  }

  var channels = metrics.channels || {};
  var devices = metrics.devices || {};
  var traffic = metrics.traffic || {};
  var geography = metrics.geography || {};

  var searchShare = channels.searchPercent || 0;
  var socialShare = channels.socialPercent || 0;
  var directShare = channels.directAndReferralPercent || 0;

  document.getElementById("metric-search").textContent = searchShare + "%";
  document.getElementById("metric-social").textContent = socialShare + "%";
  document.getElementById("metric-direct").textContent = directShare + "%";
  document.getElementById("insight-search").textContent =
    searchShare + "% of traffic";
  document.getElementById("insight-social").textContent =
    socialShare + "% of traffic";
  document.getElementById("insight-direct").textContent =
    directShare + "% of traffic";

  var desktopShare = devices.desktopPercent || 0;
  var mobileShare = devices.mobilePercent || 0;
  var desktopEl = document.getElementById("metric-desktop");
  if (desktopEl) desktopEl.textContent = desktopShare + "%";
  document.getElementById("insight-desktop").textContent =
    desktopShare + "%";
  document.getElementById("insight-mobile").textContent =
    mobileShare + "%";

  var visitsBase =
    (traffic.estimatedMonthlyVisitsMillions != null
      ? traffic.estimatedMonthlyVisitsMillions
      : 1.8) || 0;
  var visitsEl = document.getElementById("metric-visits");
  if (visitsEl) {
    visitsEl.textContent = visitsBase.toFixed(1) + "M";
  }

  var minutes =
    traffic.avgVisitDuration && typeof traffic.avgVisitDuration.minutes === "number"
      ? traffic.avgVisitDuration.minutes
      : 3;
  var seconds =
    traffic.avgVisitDuration && typeof traffic.avgVisitDuration.seconds === "number"
      ? traffic.avgVisitDuration.seconds
      : 12;
  var paddedSeconds = String(seconds).padStart(2, "0");
  document.getElementById("insight-duration").textContent =
    "0" + minutes + ":" + paddedSeconds;

  document.getElementById("insight-pages").textContent =
    (traffic.pagesPerVisit || 3.7).toFixed
      ? traffic.pagesPerVisit.toFixed(1)
      : String(traffic.pagesPerVisit || 3.7);
  document.getElementById("insight-bounce").textContent =
    String(Math.round(traffic.bounceRatePercent || 42)) + "%";

  document.getElementById("insight-region").textContent =
    geography.topRegion || "North America";

  animateBars();
}

function updateInsightsFallback(domain) {
  var cleaned = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  var insightDomain = document.getElementById("insight-domain");
  if (insightDomain) {
    insightDomain.textContent = "Showing sample data for " + cleaned;
  }

  var seed = cleaned.length || 7;
  var searchShare = 50 + (seed * 7) % 35;
  var socialShare = 10 + (seed * 5) % 25;
  var directShare = Math.max(100 - searchShare - socialShare, 8);

  document.getElementById("metric-search").textContent = searchShare + "%";
  document.getElementById("metric-social").textContent = socialShare + "%";
  document.getElementById("metric-direct").textContent = directShare + "%";
  document.getElementById("insight-search").textContent =
    searchShare + "% of traffic";
  document.getElementById("insight-social").textContent =
    socialShare + "% of traffic";
  document.getElementById("insight-direct").textContent =
    directShare + "% of traffic";

  var desktopShare = 45 + (seed * 3) % 40;
  var mobileShare = 100 - desktopShare - 7;
  var desktopEl = document.getElementById("metric-desktop");
  if (desktopEl) desktopEl.textContent = desktopShare + "%";
  document.getElementById("insight-desktop").textContent =
    desktopShare + "%";
  document.getElementById("insight-mobile").textContent =
    mobileShare + "%";

  var visitsBase = 0.8 + (seed % 14) * 0.12;
  var visitsEl = document.getElementById("metric-visits");
  if (visitsEl) {
    visitsEl.textContent = visitsBase.toFixed(1) + "M";
  }

  document.getElementById("insight-duration").textContent =
    "0" + (2 + (seed % 3)) + ":" + (10 + (seed * 7) % 49).toString().padStart(2, "0");
  document.getElementById("insight-pages").textContent =
    randomInRange(2.3, 5.1, 1).toString();
  document.getElementById("insight-bounce").textContent =
    randomInRange(24, 68, 0) + "%";
  document.getElementById("insight-region").textContent =
    ["North America", "Europe", "LATAM", "APAC"][seed % 4];

  animateBars();
}

function handleDomainForm() {
  var form = document.getElementById("domain-form");
  var input = document.getElementById("domain-input");
  var error = document.getElementById("domain-error");

  if (!form || !input || !error) return;

  form.addEventListener("submit", function (evt) {
    evt.preventDefault();
    var value = (input.value || "").trim();

    if (!value) {
      error.textContent = "Please enter a domain to analyze.";
      input.focus();
      return;
    }

    if (value.indexOf(".") === -1 || /\s/.test(value)) {
      error.textContent = "That doesn’t look like a valid domain.";
      input.focus();
      return;
    }

    error.textContent = "";

    fetch("/api/traffic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ domain: value })
    })
      .then(function (res) {
        if (!res.ok) {
          return res.json().catch(function () {
            throw new Error("Request failed");
          }).then(function (body) {
            throw new Error(body && body.error ? body.error : "Request failed");
          });
        }
        return res.json();
      })
      .then(function (data) {
        updateInsightsFromBackend(data);
        setTimeout(function () {
          smoothScrollTo("#insights");
        }, 80);
      })
      .catch(function () {
        updateInsightsFallback(value);
        setTimeout(function () {
          smoothScrollTo("#insights");
        }, 80);
      });
  });
}

function handleCtaButtons() {
  var buttons = document.querySelectorAll("[data-scroll]");
  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var target = btn.getAttribute("data-scroll");
      if (target) smoothScrollTo(target);
    });
  });
}

function setYear() {
  var yearEl = document.getElementById("sf-year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
}

document.addEventListener("DOMContentLoaded", function () {
  animateBars();
  animateCounters();
  handleDomainForm();
  handleCtaButtons();
  setYear();
});

