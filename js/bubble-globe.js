class BubbleGlobe {
  constructor({ el, geoData, data }) {
    this.el = el;
    this.geoData = geoData;
    this.data = data;
    this.init();
  }

  init() {
    const valueMap = new Map(
      this.data.map((d) => [d["Country Code"], +d["2021"]])
    );

    // https://observablehq.com/@washpostgraphics/spike-globe
    const base = (d) => {
      const c = d.geometry.coordinates;
      if (d.geometry.type === "Polygon") {
        return polylabel(c);
      } else {
        let largestArea = 0,
          largestIndex = -1;
        for (let i = 0, l = c.length; i < l; i++) {
          const area = d3.geoArea({ type: "Polygon", coordinates: c[i] });
          if (area > largestArea) {
            largestArea = area;
            largestIndex = i;
          }
        }
        return polylabel(c[largestIndex]);
      }
    };

    this.sphere = { type: "Sphere" };
    this.land = topojson.feature(this.geoData, this.geoData.objects.land);
    this.borders = topojson.mesh(
      this.geoData,
      this.geoData.objects.countries,
      (a, b) => a !== b
    );
    this.graticule = d3.geoGraticule();
    this.countries = topojson.feature(
      this.geoData,
      this.geoData.objects.countries
    ).features;

    this.countries.forEach((d) => {
      d.properties.value = valueMap.get(d.properties.a3) || 0;
      d.base = base(d);
    });

    this.formatValue = new Intl.NumberFormat("en", {
      maximumSignificantDigits: 3,
    }).format;

    this.marginTop = 40;
    this.marginRight = 40;
    this.marginBottom = 120;
    this.marginLeft = 40;
    this.maxRadius = 80;

    this.r = d3
      .scaleSqrt()
      .domain([0, d3.max(valueMap.values())])
      .range([0, this.maxRadius])
      .nice();

    this.projection = d3.geoOrthographic();
    this.path = d3.geoPath(this.projection);

    this.zoom = versorZoom(this.projection).on("zoom", this.render.bind(this));

    this.container = d3.select(this.el).classed("bubble-globe", true);
    this.svg = this.container.append("svg");

    this.tooltip = new Tooltip({ el: this.el });

    this.resizeObserver = new ResizeObserver((entries) => {
      entries.forEach((entry) => {
        this.resized(entry.contentRect);
      });
    });
    this.resizeObserver.observe(this.el);
  }

  resized({ width, height }) {
    if (this.width === width) return;
    this.width = width;
    this.height = height;

    this.projection.fitExtent(
      [
        [this.marginLeft, this.marginTop],
        [this.width - this.marginRight, this.height - this.marginBottom],
      ],
      this.sphere
    );

    this.svg.attr("viewBox", [0, 0, this.width, this.height]).call(this.zoom);

    this.render();
  }

  render() {
    this.renderSphere();
    this.renderGraticules();
    this.renderLand();
    this.renderBorders();
    this.renderBubbles();
  }

  renderSphere() {
    if (!this.spherePath) {
      this.spherePath = this.svg
        .selectAll(".sphere")
        .data([this.sphere])
        .join((enter) => enter.append("path").attr("class", "sphere"));
    }
    this.spherePath.attr("d", this.path);
  }

  renderGraticules() {
    if (!this.graticulesPath) {
      this.graticulesPath = this.svg
        .selectAll(".graticules")
        .data([this.graticule()])
        .join((enter) => enter.append("path").attr("class", "graticules"));
    }
    this.graticulesPath.attr("d", this.path);
  }

  renderLand() {
    if (!this.landPath) {
      this.landPath = this.svg
        .selectAll(".land")
        .data([this.land])
        .join((enter) => enter.append("path").attr("class", "land"));
    }
    this.landPath.attr("d", this.path);
  }

  renderBorders() {
    if (!this.bordersPath) {
      this.bordersPath = this.svg
        .selectAll(".borders")
        .data([this.borders])
        .join((enter) => enter.append("path").attr("class", "borders"));
    }
    this.bordersPath.attr("d", this.path);
  }

  renderBubbles() {
    if (!this.bubble) {
      this.bubble = this.svg
        .append("g")
        .selectAll(".bubble")
        .data(
          this.countries
            .filter((d) => d.properties.value)
            .slice()
            .sort((a, b) =>
              d3.descending(a.properties.value, b.properties.value)
            )
        )
        .join((enter) =>
          enter
            .append("circle")
            .attr("class", "bubble")
            .attr("r", (d) => this.r(d.properties.value))
            .on("pointerenter", this.entered.bind(this))
            .on("pointermove", this.moved.bind(this))
            .on("pointerleave", this.left.bind(this))
        );
    }

    this.bubble
      .classed(
        "hide",
        (d) => !this.path({ type: "Point", coordinates: d.base })
      )
      .attr("transform", (d) => `translate(${this.projection(d.base)})`);
  }

  entered(event, d) {
    const html = `<div>${
      d.properties.name
    }</div><div>Population: ${this.formatValue(d.properties.value)}</div>`;
    this.tooltip.show(html);
  }

  moved(event) {
    this.tooltip.move(event);
  }

  left() {
    this.tooltip.hide();
  }
}
