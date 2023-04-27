Promise.all([
  d3.json(
    "https://cdn.jsdelivr.net/npm/visionscarto-world-atlas@0.1.0/world/110m.json"
  ),
  d3.csv("population-total.csv"),
]).then(([geoData, data]) => {
  new BubbleGlobe({
    el: document.querySelector("#bubbleGlobe"),
    geoData,
    data,
  });
});
