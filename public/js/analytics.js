// Activate preloaded Google Fonts stylesheet
document.querySelectorAll('link[media="print"][rel="stylesheet"]').forEach(function (link) {
  link.media = "all";
});

// Google Analytics (GA4)
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag("js", new Date());
gtag("config", "G-RJYVVSG10S");
