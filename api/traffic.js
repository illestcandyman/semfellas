function hashString(input) {
  var hash = 0;
  if (!input) return 0;
  for (var i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

module.exports = function (req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  var domain = (req.body && req.body.domain ? String(req.body.domain) : "").trim();

  if (!domain) {
    return res.status(400).json({ error: "Domain is required." });
  }

  var normalized = domain
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .toLowerCase();

  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
    return res.status(400).json({ error: "Please provide a valid domain." });
  }

  var seed = hashString(normalized);

  function fromSeed(min, max, divisor) {
    var range = max - min;
    var value = min + (seed % (range * (divisor || 1))) / (divisor || 1);
    return clamp(value, min, max);
  }

  var visitsMillions = fromSeed(0.3, 8.5, 10);
  var baseDurationMinutes = fromSeed(1.4, 5.6, 10);
  var minutes = Math.floor(baseDurationMinutes);
  var seconds = Math.round((baseDurationMinutes - minutes) * 60);

  var pagesPerVisit = fromSeed(1.7, 7.8, 10);
  var bounceRate = fromSeed(18, 82, 1);

  var searchShare = clamp(35 + (seed % 50), 35, 85);
  var socialShare = clamp(5 + ((seed >> 3) % 25), 5, 30);
  var directShare = clamp(100 - searchShare - socialShare, 8, 50);

  var desktopShare = clamp(40 + ((seed >> 4) % 50), 40, 90);
  var mobileShare = clamp(100 - desktopShare - 6, 5, 55);
  var tabletShare = clamp(100 - desktopShare - mobileShare, 3, 20);

  var regions = ["North America", "Europe", "LATAM", "APAC", "Middle East & Africa"];
  var region = regions[seed % regions.length];

  res.status(200).json({
    domain: normalized,
    generatedAt: new Date().toISOString(),
    metrics: {
      traffic: {
        estimatedMonthlyVisitsMillions: Number(visitsMillions.toFixed(1)),
        avgVisitDuration: {
          minutes: minutes,
          seconds: seconds
        },
        pagesPerVisit: Number(pagesPerVisit.toFixed(1)),
        bounceRatePercent: Math.round(bounceRate)
      },
      channels: {
        searchPercent: Math.round(searchShare),
        socialPercent: Math.round(socialShare),
        directAndReferralPercent: Math.round(directShare)
      },
      devices: {
        desktopPercent: Math.round(desktopShare),
        mobilePercent: Math.round(mobileShare),
        tabletPercent: Math.round(tabletShare)
      },
      geography: {
        topRegion: region
      }
    }
  });
};

