
var State = function (row, col) {
    this.value = 0.0;
    this.override = 0.0;
    this.estimate = 0.0;
    this.row = row;
    this.col = col;
};
State.prototype = {
    getDatum: function () {
        return {
            "row": this.row,
            "col": this.col,
            "value": this.value,
            "estimate": this.estimate,
            "override": this.override,
        };
    }
};

var HexStateSpace = function (rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.states = []
    for (var ri = 0; ri < this.rows; ri++) {
        var row = [];
        for (var ci = 0; ci < this.cols; ci++) {
            row.push(new State(ri, ci));
        }
        this.states.push(row);
    }
};
HexStateSpace.prototype = {
    getState: function (row, col) {
        console.log([row, col]);
        if (row < 0) {
            row += Math.ceil(-1 * row / this.rows) * this.rows;
        }
        if (col < 0) {
            col += Math.ceil(-1 * col / this.cols) * this.cols;
        }
        row = row % this.rows;
        col = col % this.cols;
        console.log([row, col]);
        return this.states[row][col];
    },
    getNeighbors: function (row, col) {
        left = this.getState(row, col - 1);
        right = this.getState(row, col + 1);
        if (row % 2 == 0) {
            leftCol = col - 1;
            rightCol = col;
        } else {
            leftCol = col;
            rightCol = col + 1;
        }
        upLeft = this.getState(row - 1, leftCol);
        upRight = this.getState(row - 1, rightCol);
        downLeft = this.getState(row + 1, leftCol);
        downRight = this.getState(row + 1, rightCol);
        return [left, upLeft, upRight, right, downRight, downLeft];
    },
    getData: function () {
        data = [];
        for (var ri = 0; ri < this.rows; ri++) {
            for (var ci = 0; ci < this.cols; ci++) {
                data.push(this.states[ri][ci].getDatum());
            }
        }
        return data;
    }
};

var HexSimulation = function (rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.space = new HexStateSpace(rows, cols);
    this.draw();
};
HexSimulation.prototype = {
    config: {
        cellSize: 30
    },
    draw: function () {
        var container = d3.select("svg");
        var xspace = this.config.cellSize * Math.sqrt(3) / 2.0;
        var xoff = xspace / 2.0;
        var yspace = this.config.cellSize * 0.75;
        var yoff = this.config.cellSize * 0.5;
        var data = this.space.getData();
        var fillScale = d3.scale.linear()
            .domain([0, 1]).range(["#ccc", "#f73"]);
        var sel = container.selectAll(".state").data(data);
        var cell = sel.enter()
            .append("g")
                .classed("state", true)
                .attr("transform", function (d) {
                    var dx = (d.col + (d.row % 2) / 2.0) * xspace + xoff;
                    var dy = d.row * yspace + yoff; 
                    return "translate(" + dx + "," + dy + ")";
                });
        cell.append("circle")
            .classed("estimate", true)
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", this.config.cellSize * Math.sqrt(3) / 4.0 - 1)            
            .attr("stroke", "#ccc")
            .attr("stroke-width", "2")
            .attr("fill", function (d) { return fillScale(d.estimate); });
        cell.append("circle")
            .classed("value", true)
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", this.config.cellSize * Math.sqrt(3) / 12.0)
            .attr("stroke", "#666")
            .attr("stroke-width", "2")
            .attr("fill", function (d) { return fillScale(d.value); })
            .attr("visibility", function (d) {
                return d.value > 0.0 ? "visible" : "hidden"; });
    }
};

new HexSimulation(16, 16);