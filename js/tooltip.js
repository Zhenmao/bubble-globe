class Tooltip {
  constructor({ el }) {
    this.el = el;
    this.tooltip = d3
      .select(this.el)
      .classed("tooltip-parent", true)
      .append("div")
      .attr("class", "tooltip");
  }

  show(html) {
    this.tooltip.html(html).classed("show", true);
    this.tooltipRect = this.tooltip.node().getBoundingClientRect();
    this.elRect = this.el.getBoundingClientRect();
  }

  move(event) {
    const [x0, y0] = d3.pointer(event, this.el);
    const offset = 8;
    let x, y;
    if (x0 < this.elRect.width / 2) {
      x = x0 + offset;
    } else {
      x = x0 - offset - this.tooltipRect.width;
    }
    if (y0 < this.elRect.height / 2) {
      y = y0 + offset;
    } else {
      y = y0 - offset - this.tooltipRect.height;
    }
    this.tooltip.style("transform", `translate(${x}px,${y}px)`);
  }

  hide() {
    this.tooltip.classed("show", false);
  }
}
