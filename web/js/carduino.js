/**
 * Carduino - Graphics for carduino frontend using RaphaelJS
 * Check https://github.com/AvalonInnovation/carduino-server for official releases
 * Licensed under MIT.
 * @author Anders Jakobsson (andersja@kth.se)
 **/

SpeedGauge = function(id) {
    this.w = getStyle(document.getElementById(id), "width").slice(0, -2) * 1;
    this.h = getStyle(document.getElementById(id), "height").slice(0, -2) * 1;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.r = this.w / 2;
    this.angle = -140;
    this.major = 20;
    this.minor = 5;
    this.unit = "cm/s"
    this.label = "SPEED"

    // Colors of the gauge
    this.cbase = "#d0d0d0"
    this.ctext = "#303030"
    this.chl = "#fe0000"
    this.cdetail = "#d0d0d0"

    // Creates canvas
    this.paper = Raphael(id, "100%", "100%");
    // Background circle
    this.paper.circle(this.cx, this.cy, this.r).attr({
        fill: "#1c1c1c",
        stroke: "#a0a0a0",
        "stroke-width": this.r * 0.02
    });
    var value = 0;
    while (this.angle <= 140) {
        // Create grading
        var stroke = (this.angle % this.major == 0) ? this.cy * 0.02 : this.cy * 0.01;
        var len = (this.angle % this.major == 0) ? this.cy * 0.15 : this.cy * 0.1;

        this.paper.path("M" + this.cx + "," + 0 + "L" + this.cx + "," + len).attr({
            stroke: "#a0a0a0",
            fill: "#a0a0a0",
            transform: "r" + this.angle + " " + this.cx + " " + this.cy,
            "stroke-width": stroke
        });

        // Print text markings
        if (value % this.major == 0) {
            var rot = 360 - this.angle;
            this.paper.text(this.cx, this.cy * 0.25, "" + value).attr({
                "font-family": "sans-serif",
                "font-style": "bold",
                "font-size": "" + this.r / 8,
                fill: "#fff",
                transform: "r" + this.angle + " " + this.cx + " " + this.cy + "r" + rot
            });
        }
        value += 5;
        this.angle += this.minor;
    }
    // Print unit label
    this.paper.text(this.cx, this.cy * 0.60, this.unit).attr({
        "font-family": "sans-serif",
        "font-style": "bold",
        "font-size": "" + this.r / 7,
        fill: "#fff"
    });
    // Print unit label
    this.paper.text(this.cx, this.cy * 1.30, this.label).attr({
        "font-family": "sans-serif",
        "font-style": "bold",
        "font-size": "" + this.r / 6,
        fill: "#fff"
    });
    // Crate gauge needle
    this.token = this.paper.set();
    this.token.push(this.paper.path("M" + this.cx + "," + this.r * 0.05 + "L" + this.cx + "," + this.cy).attr({
        fill: "#fe0000",
        stroke: "#fe0000",
        "stroke-width": this.r * 0.03
    }));
    this.token.push(this.paper.circle(this.cx, this.cy, this.r * 0.075).attr({
        fill: "#ffffff",
        "stroke-width": this.r * 0.02
    }));
    this.token.attr({
        stroke: "#fe0000"
    });

    this.refresh = function(value) {
        this.value = value;
        this.token.animate({
            transform: "r" + this.value + " " + this.cx + " " + this.cy
        }, 100, ">");
    };
};

GyroGauge = function(id) {
    this.w = getStyle(document.getElementById(id), "width").slice(0, -2) * 1;
    this.h = getStyle(document.getElementById(id), "height").slice(0, -2) * 1;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.r = this.w / 2;
    this.angle = -135;
    this.major = 15;
    this.minor = 5;
    this.unit = "deg(°)/s"
    this.label = "Angular\nVelocity"
    // Creates canvas
    this.paper = Raphael(id, "100%", "100%");
    // Background circle
    this.paper.circle(this.cx, this.cy, this.r).attr({
        fill: "#1c1c1c",
        stroke: "#a0a0a0",
        "stroke-width": this.r * 0.02
    });
    var value = this.angle;
    while (this.angle <= 135) {
        // Create grading
        var stroke = (this.angle % this.major == 0) ? this.cy * 0.02 : this.cy * 0.01;
        var len = (this.angle % this.major == 0) ? this.cy * 0.15 : this.cy * 0.1;

        this.paper.path("M" + this.cx + "," + 0 + "L" + this.cx + "," + len).attr({
            stroke: "#a0a0a0",
            fill: "#a0a0a0",
            transform: "r" + this.angle + " " + this.cx + " " + this.cy,
            "stroke-width": stroke
        });

        // Print text markings
        if (value % this.major == 0) {
            var rot = 360 - this.angle;
            this.paper.text(this.cx, this.cy * 0.25, "" + value).attr({
                "font-family": "sans-serif",
                "font-style": "bold",
                "font-size": "" + this.r / 8,
                fill: "#fff",
                transform: "r" + this.angle + " " + this.cx + " " + this.cy + "r" + rot
            });
        }
        value += this.minor;
        this.angle += this.minor;
    }
    // Print unit label
    this.paper.text(this.cx, this.cy * 0.60, this.unit).attr({
        "font-family": "sans-serif",
        "font-style": "bold",
        "font-size": "" + this.r / 7,
        fill: "#fff"
    });

    // Print unit label
    this.paper.text(this.cx, this.cy * 1.30, this.label).attr({
        "font-family": "sans-serif",
        "font-style": "bold",
        "font-size": "" + this.r / 6,
        fill: "#fff"
    });

    // Crate gauge needle
    this.token = this.paper.set();
    this.token.push(this.paper.path("M" + this.cx + "," + this.r * 0.05 + "L" + this.cx + "," + this.cy).attr({
        fill: "#fe0000",
        stroke: "#fe0000",
        "stroke-width": this.r * 0.03
    }));
    this.token.push(this.paper.circle(this.cx, this.cy, this.r * 0.075).attr({
        fill: "#ffffff",
        "stroke-width": this.r * 0.02
    }));
    this.token.attr({
        stroke: "#fe0000"
    });

    this.refresh = function(value) {
        //debug
        this.value = value;
        this.token.animate({
            transform: "r" + this.value + " " + this.cx + " " + this.cy
        }, 100, ">");
    };
};

AccGauge = function(id) {
    this.w = getStyle(document.getElementById(id), "width").slice(0, -2) * 1;
    this.h = getStyle(document.getElementById(id), "height").slice(0, -2) * 1;
    this.cx = this.w / 2;
    this.cy = this.h / 2;
    this.r = this.w / 2;
    this.angle = -90;
    this.major = 15;
    this.minor = 5;
    this.unit = "m/s²"
    this.label = "FORCE"

    // Creates canvas
    this.paper = Raphael(id, "100%", "100%");
    // Background circle
    this.paper.circle(this.cx, this.cy, this.r).attr({
        fill: "#1c1c1c",
        stroke: "#a0a0a0",
        "stroke-width": this.r * 0.02
    });

    // Grading circles
    this.paper.circle(this.cx, this.cy, this.r * 0.75).attr({
        stroke: "#a0a0a0"
    });
    this.paper.circle(this.cx, this.cy, this.r * 0.5).attr({
        stroke: "#a0a0a0"
    });
    this.paper.circle(this.cx, this.cy, this.r * 0.25).attr({
        stroke: "#a0a0a0"
    });

    // X-Y Axis crosshair
    this.paper.path("M" + this.cx + " " + 0 + "V" + this.r * 2).attr({
        stroke: "#a0a0a0"
    });
    this.paper.path("M" + 0 + " " + this.cy + "H" + this.r * 2).attr({
        stroke: "#a0a0a0"
    });

    // Print unit label
    this.paper.text(this.cx, this.cy * 0.60, this.unit).attr({
        "font-family": "sans-serif",
        "font-style": "bold",
        "font-size": "" + this.r / 7,
        fill: "#fff"
    });

    // The token showing the car
    this.token = this.paper.circle(this.cx, this.cy, this.r * 0.075).attr({
        fill: "#ff0000",
        "fill-opacity": .9
    });

    this.refresh = function(gx, gy) {

        this.token.animate({
            transform: "t" + gx + " " + gy
        }, 100, ">");
    };
};

/**  Get style  */
function getStyle(oElm, strCssRule) {
  var strValue = "";
  if (document.defaultView && document.defaultView.getComputedStyle) {
    strValue = document.defaultView.getComputedStyle(oElm, "").getPropertyValue(strCssRule);
  } else if (oElm.currentStyle) {
    strCssRule = strCssRule.replace(/\-(\w)/g, function(strMatch, p1) {
      return p1.toUpperCase();
    });
    strValue = oElm.currentStyle[strCssRule];
  }
  return strValue;
}

/** Random integer  */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
