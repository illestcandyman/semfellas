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

function countUp(el, endValue, opts) {
  if (!el) return;
  opts = opts || {};
  var duration = opts.duration || 1000;
  var suffix = opts.suffix != null ? opts.suffix : "";
  var prefix = opts.prefix != null ? opts.prefix : "";
  var decimals = opts.decimals != null ? opts.decimals : 0;
  var startValue = opts.startValue != null ? opts.startValue : 0;
  var startTime = performance.now();

  function step(now) {
    var t = Math.min(1, (now - startTime) / duration);
    var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    var value = startValue + (endValue - startValue) * eased;
    var str = decimals > 0 ? value.toFixed(decimals) : Math.round(value);
    el.textContent = prefix + str + suffix;
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

var LOADING_MIN_MS = 3500;

function setLoading(loading) {
  var btn = document.getElementById("domain-submit-btn");
  if (!btn) return;
  if (loading) {
    btn.classList.add("is-loading");
    btn.disabled = true;
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "Analyzing…";
  } else {
    btn.classList.remove("is-loading");
    btn.disabled = false;
    btn.textContent = btn.dataset.originalText || "Get insights";
  }
}

function showLoadingOverlay(domain) {
  var overlay = document.getElementById("sf-loading-overlay");
  var domainEl = document.getElementById("sf-loading-domain");
  if (overlay) overlay.classList.add("is-visible");
  if (domainEl) domainEl.textContent = domain || "domain";
}

function hideLoadingOverlay() {
  var overlay = document.getElementById("sf-loading-overlay");
  if (overlay) overlay.classList.remove("is-visible");
}

function formatTraffic(num) {
  if (num >= 1e6) return (num / 1e6).toFixed(1) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(1) + "K";
  return String(num);
}

function applyVisualization(data) {
  var m = data.metrics || {};
  var channels = m.channels || {};
  var devices = m.devices || {};
  var traffic = m.traffic || {};
  var geography = m.geography || {};
  var domain = data.domain || "";

  var searchShare = channels.searchPercent || 0;
  var socialShare = channels.socialPercent || 0;
  var directShare = channels.directAndReferralPercent || 0;
  var desktopShare = devices.desktopPercent || 0;
  var mobileShare = devices.mobilePercent || 0;
  var tabletShare = devices.tabletPercent || 0;
  if (!tabletShare && desktopShare + mobileShare < 100) {
    tabletShare = Math.max(0, 100 - desktopShare - mobileShare);
  }

  var panelDomain = document.getElementById("panel-domain");
  if (panelDomain) panelDomain.textContent = domain ? domain : "Enter a domain to see insights";

  var totalVisits = traffic.totalVisits != null ? traffic.totalVisits : (traffic.estimatedMonthlyVisitsMillions != null ? Math.round(traffic.estimatedMonthlyVisitsMillions * 1e6) : 0);
  var totalEl = document.getElementById("total-traffic-value");
  if (totalEl) totalEl.textContent = totalVisits ? formatTraffic(totalVisits) : "—";

  var dailyTraffic = traffic.dailyTraffic || [];
  var dailyContainer = document.getElementById("daily-chart-bars");
  if (dailyContainer) {
    dailyContainer.innerHTML = "";
    var maxDaily = Math.max.apply(null, dailyTraffic) || 1;
    dailyTraffic.forEach(function (val, i) {
      var bar = document.createElement("div");
      bar.className = "sf-daily-bar";
      bar.setAttribute("role", "img");
      bar.setAttribute("aria-label", "Day " + (i + 1) + " " + val + " visits");
      bar.style.height = "0%";
      bar.setAttribute("data-height", String(maxDaily ? (val / maxDaily) * 100 : 0));
      dailyContainer.appendChild(bar);
    });
    requestAnimationFrame(function () {
      dailyContainer.querySelectorAll(".sf-daily-bar").forEach(function (bar) {
        bar.style.height = (bar.getAttribute("data-height") || "0") + "%";
      });
    });
  }

  var byCountry = (geography && geography.byCountry) ? geography.byCountry : [];
  var countriesList = document.getElementById("countries-list");
  if (countriesList) {
    countriesList.innerHTML = "";
    byCountry.forEach(function (row, i) {
      var pct = row.percent != null ? row.percent : 0;
      var tr = document.createElement("div");
      tr.className = "sf-country-row";
      tr.innerHTML = "<span class=\"sf-country-name\">" + (row.country || "") + "</span>" +
        "<div class=\"sf-country-bar-wrap\">" +
        "<div class=\"sf-country-bar-track\"><div class=\"sf-country-bar-fill\" style=\"width: 0%\" data-pct=\"" + pct + "\"></div></div>" +
        "<span class=\"sf-country-pct\">" + pct + "%</span>" +
        "</div>";
      countriesList.appendChild(tr);
    });
    requestAnimationFrame(function () {
      countriesList.querySelectorAll(".sf-country-bar-fill").forEach(function (fill) {
        var pct = Number(fill.getAttribute("data-pct") || "0");
        fill.style.width = pct + "%";
      });
    });
  }

  var insightDomain = document.getElementById("insight-domain");
  if (insightDomain) {
    insightDomain.textContent = domain ? "Showing sample data for " + domain : "Try a domain to personalize.";
  }

  var donutEl = document.getElementById("donut-channels");
  var deviceDonut = document.getElementById("device-donut");
  if (donutEl) {
    donutEl.style.setProperty("--seg1", "0");
    donutEl.style.setProperty("--seg2", "0");
    donutEl.style.setProperty("--seg3", "0");
  }
  if (deviceDonut) {
    deviceDonut.style.setProperty("--d1", "0");
    deviceDonut.style.setProperty("--d2", "0");
    deviceDonut.style.setProperty("--d3", "0");
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      if (donutEl) {
        donutEl.style.setProperty("--seg1", String(searchShare));
        donutEl.style.setProperty("--seg2", String(socialShare));
        donutEl.style.setProperty("--seg3", String(directShare));
      }
      if (deviceDonut) {
        deviceDonut.style.setProperty("--d1", String(desktopShare));
        deviceDonut.style.setProperty("--d2", String(mobileShare));
        deviceDonut.style.setProperty("--d3", String(tabletShare));
      }
    });
  });

  function setBar(id, pct) {
    var fill = document.getElementById(id);
    var pctEl = document.getElementById(id + "-pct");
    if (fill) {
      fill.setAttribute("data-pct", String(pct));
      fill.style.width = pct + "%";
    }
    if (pctEl) pctEl.textContent = Math.round(pct) + "%";
  }
  setBar("viz-bar-search", searchShare);
  setBar("viz-bar-social", socialShare);
  setBar("viz-bar-direct", directShare);

  var vizSearchPct = document.getElementById("viz-search-pct");
  var vizSocialPct = document.getElementById("viz-social-pct");
  var vizDirectPct = document.getElementById("viz-direct-pct");
  if (vizSearchPct) vizSearchPct.textContent = Math.round(searchShare) + "%";
  if (vizSocialPct) vizSocialPct.textContent = Math.round(socialShare) + "%";
  if (vizDirectPct) vizDirectPct.textContent = Math.round(directShare) + "%";

  var vizDesktop = document.getElementById("viz-device-desktop");
  var vizMobile = document.getElementById("viz-device-mobile");
  var vizTablet = document.getElementById("viz-device-tablet");
  if (vizDesktop) vizDesktop.textContent = Math.round(desktopShare) + "%";
  if (vizMobile) vizMobile.textContent = Math.round(mobileShare) + "%";
  if (vizTablet) vizTablet.textContent = Math.round(tabletShare) + "%";

  var regionEl = document.getElementById("viz-region");
  var region = geography.topRegion || "North America";
  if (regionEl) regionEl.textContent = region;

  var minutes = (traffic.avgVisitDuration && typeof traffic.avgVisitDuration.minutes === "number") ? traffic.avgVisitDuration.minutes : 3;
  var seconds = (traffic.avgVisitDuration && typeof traffic.avgVisitDuration.seconds === "number") ? traffic.avgVisitDuration.seconds : 12;
  var durationStr = "0" + minutes + ":" + String(seconds).padStart(2, "0");
  var pagesVal = traffic.pagesPerVisit != null ? Number(traffic.pagesPerVisit) : 3.7;
  var bounceVal = Math.round(traffic.bounceRatePercent != null ? traffic.bounceRatePercent : 42);

  var ringDurationPath = document.getElementById("ring-duration-path");
  var ringPagesPath = document.getElementById("ring-pages-path");
  var ringBouncePath = document.getElementById("ring-bounce-path");
  var ringDurationValue = document.getElementById("ring-duration-value");
  var ringPagesValue = document.getElementById("ring-pages-value");
  var ringBounceValue = document.getElementById("ring-bounce-value");

  var durationPct = Math.min(100, (minutes * 60 + seconds) / (5 * 60) * 100);
  var pagesPct = Math.min(100, (pagesVal / 10) * 100);
  if (ringDurationPath) ringDurationPath.setAttribute("stroke-dasharray", durationPct + ", 100");
  if (ringPagesPath) ringPagesPath.setAttribute("stroke-dasharray", pagesPct + ", 100");
  if (ringBouncePath) ringBouncePath.setAttribute("stroke-dasharray", bounceVal + ", 100");
  if (ringDurationValue) ringDurationValue.textContent = durationStr;
  if (ringPagesValue) countUp(ringPagesValue, pagesVal, { decimals: 1, duration: 800 });
  if (ringBounceValue) countUp(ringBounceValue, bounceVal, { suffix: "%", duration: 800 });

  var insightSearch = document.getElementById("insight-search");
  var insightSocial = document.getElementById("insight-social");
  var insightDirect = document.getElementById("insight-direct");
  if (insightSearch) countUp(insightSearch, searchShare, { suffix: "% of traffic", duration: 700 });
  if (insightSocial) countUp(insightSocial, socialShare, { suffix: "% of traffic", duration: 700 });
  if (insightDirect) countUp(insightDirect, directShare, { suffix: "% of traffic", duration: 700 });

  var insightDuration = document.getElementById("insight-duration");
  var insightPages = document.getElementById("insight-pages");
  var insightBounce = document.getElementById("insight-bounce");
  if (insightDuration) insightDuration.textContent = durationStr;
  if (insightPages) countUp(insightPages, pagesVal, { decimals: 1, duration: 700 });
  if (insightBounce) countUp(insightBounce, bounceVal, { suffix: "%", duration: 700 });

  var insightDesktop = document.getElementById("insight-desktop");
  var insightMobile = document.getElementById("insight-mobile");
  var insightRegion = document.getElementById("insight-region");
  if (insightDesktop) countUp(insightDesktop, desktopShare, { suffix: "%", duration: 700 });
  if (insightMobile) countUp(insightMobile, mobileShare, { suffix: "%", duration: 700 });
  if (insightRegion) insightRegion.textContent = region;

  var visitsBase = (traffic.estimatedMonthlyVisitsMillions != null ? traffic.estimatedMonthlyVisitsMillions : 1.8) || 0;
  var visitsEl = document.getElementById("metric-visits");
  var metricSearch = document.getElementById("metric-search");
  var metricSocial = document.getElementById("metric-social");
  var metricDirect = document.getElementById("metric-direct");
  var metricDesktop = document.getElementById("metric-desktop");
  var metricDuration = document.getElementById("metric-duration");

  if (visitsEl) countUp(visitsEl, visitsBase, { suffix: "M", decimals: 1, duration: 900 });
  var heroBars = document.querySelectorAll(".sf-hero-card .sf-chart-bars .sf-bar-group .sf-bar");
  if (metricSearch) { metricSearch.textContent = Math.round(searchShare) + "%"; if (heroBars[0]) { heroBars[0].setAttribute("data-bar", searchShare); heroBars[0].style.width = searchShare + "%"; } }
  if (metricSocial) { metricSocial.textContent = Math.round(socialShare) + "%"; if (heroBars[1]) { heroBars[1].setAttribute("data-bar", socialShare); heroBars[1].style.width = socialShare + "%"; } }
  if (metricDirect) { metricDirect.textContent = Math.round(directShare) + "%"; if (heroBars[2]) { heroBars[2].setAttribute("data-bar", directShare); heroBars[2].style.width = directShare + "%"; } }
  if (metricDesktop) metricDesktop.textContent = Math.round(desktopShare) + "%";
  if (metricDuration) metricDuration.textContent = durationStr;

  var heroPie = document.getElementById("hero-device-pie");
  if (heroPie) {
    var end1 = desktopShare;
    var end2 = desktopShare + mobileShare;
    heroPie.style.background = "conic-gradient(#22e1ff 0 " + end1 + "%, #ff6b3d " + end1 + "% " + end2 + "%, #ffc857 " + end2 + "% 100%)";
  }

  animateBars();
}

function updateInsightsFromBackend(payload) {
  if (!payload || !payload.metrics) return;
  applyVisualization({ domain: payload.domain || "", metrics: payload.metrics });
}

function updateInsightsFallback(domain) {
  var cleaned = domain.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  var seed = cleaned.length || 7;
  var searchShare = 50 + (seed * 7) % 35;
  var socialShare = 10 + (seed * 5) % 25;
  var directShare = Math.max(100 - searchShare - socialShare, 8);
  var desktopShare = 45 + (seed * 3) % 40;
  var mobileShare = 100 - desktopShare - 7;
  var tabletShare = 7;
  var visitsBase = 0.8 + (seed % 14) * 0.12;
  var totalVisits = Math.round(visitsBase * 1e6);
  var dailyBase = totalVisits / 30;
  var dailyTraffic = [];
  for (var d = 0; d < 14; d++) {
    dailyTraffic.push(Math.round(dailyBase * (0.7 + (seed * (d + 1)) % 40 / 100)));
  }
  var min = 2 + (seed % 3);
  var sec = 10 + (seed * 7) % 49;
  var pagesVal = randomInRange(2.3, 5.1, 1);
  var bounceVal = randomInRange(24, 68, 0);
  var regions = ["North America", "Europe", "LATAM", "APAC"];
  var region = regions[seed % regions.length];
  var countryNames = ["United States", "United Kingdom", "India", "Canada", "Germany", "Australia"];
  var byCountry = [
    { country: countryNames[seed % 6], percent: 42 + (seed % 25) },
    { country: countryNames[(seed + 1) % 6], percent: 12 + (seed >> 2) % 10 },
    { country: countryNames[(seed + 2) % 6], percent: 8 + (seed >> 4) % 6 },
    { country: countryNames[(seed + 3) % 6], percent: 5 + (seed >> 6) % 5 },
    { country: countryNames[(seed + 4) % 6], percent: 4 },
    { country: countryNames[(seed + 5) % 6], percent: 3 }
  ];
  var sum = byCountry.reduce(function (a, x) { return a + x.percent; }, 0);
  if (sum !== 100) byCountry[0].percent = (byCountry[0].percent || 0) + (100 - sum);

  applyVisualization({
    domain: cleaned,
    metrics: {
      channels: { searchPercent: searchShare, socialPercent: socialShare, directAndReferralPercent: directShare },
      devices: { desktopPercent: desktopShare, mobilePercent: mobileShare, tabletPercent: tabletShare },
      traffic: {
        estimatedMonthlyVisitsMillions: visitsBase,
        totalVisits: totalVisits,
        dailyTraffic: dailyTraffic,
        avgVisitDuration: { minutes: min, seconds: sec },
        pagesPerVisit: pagesVal,
        bounceRatePercent: bounceVal
      },
      geography: { topRegion: region, byCountry: byCountry }
    }
  });
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
    setLoading(true);
    showLoadingOverlay(value);

    var delayPromise = new Promise(function (resolve) {
      setTimeout(resolve, LOADING_MIN_MS);
    });

    var fetchPromise = fetch("/api/traffic", {
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
      .catch(function () {
        return null;
      });

    Promise.all([delayPromise, fetchPromise])
      .then(function (results) {
        var data = results[1];
        hideLoadingOverlay();
        setLoading(false);
        if (data && data.metrics) {
          updateInsightsFromBackend(data);
        } else {
          updateInsightsFallback(value);
        }
        setTimeout(function () {
          smoothScrollTo("#insights");
        }, 120);
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

function initVizBars() {
  var fills = document.querySelectorAll(".sf-viz-bar-fill");
  fills.forEach(function (fill) {
    var pct = Number(fill.getAttribute("data-pct") || "0");
    fill.style.width = "0%";
    fill.offsetHeight;
    requestAnimationFrame(function () {
      fill.style.width = pct + "%";
    });
  });
  var donut = document.getElementById("donut-channels");
  var deviceDonut = document.getElementById("device-donut");
  if (donut) {
    donut.style.setProperty("--seg1", "68");
    donut.style.setProperty("--seg2", "17");
    donut.style.setProperty("--seg3", "15");
  }
  if (deviceDonut) {
    deviceDonut.style.setProperty("--d1", "65");
    deviceDonut.style.setProperty("--d2", "28");
    deviceDonut.style.setProperty("--d3", "7");
  }
  var ringDuration = document.getElementById("ring-duration-path");
  var ringPages = document.getElementById("ring-pages-path");
  var ringBounce = document.getElementById("ring-bounce-path");
  if (ringDuration) ringDuration.setAttribute("stroke-dasharray", "64, 100");
  if (ringPages) ringPages.setAttribute("stroke-dasharray", "37, 100");
  if (ringBounce) ringBounce.setAttribute("stroke-dasharray", "42, 100");
}

document.addEventListener("DOMContentLoaded", function () {
  animateBars();
  animateCounters();
  initVizBars();
  handleDomainForm();
  handleCtaButtons();
  setYear();
});

