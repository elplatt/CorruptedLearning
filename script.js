
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
            "key": [this.row, this.col, this.value, this.estimate, this.override].join(":")
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
        if (row < 0) {
            row += Math.ceil(-1 * row / this.rows) * this.rows;
        }
        if (col < 0) {
            col += Math.ceil(-1 * col / this.cols) * this.cols;
        }
        row = row % this.rows;
        col = col % this.cols;
        return this.states[row][col];
    },
    getNeighbors: function (state) {
        var row = state.row;
        var col = state.col;
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

var Agent = function (state) {
    this.state = state;
};
Agent.prototype = {
    config: {
        "discount": 0.5,
        "learning": 0.5
    },
    setState: function (state) {
        this.state = state;
    },
    getMaxEstimate: function () {
        return (this.config.discount / (1 - this.config.discount));
    },
    update: function (current, neighbors) {
        var estimate = current.estimate;
        // Calculate best neighbor
        var highest = 0.0;
        var bestNeighbors = [];
        //console.log("## updating ##");
        for (var i = 0; i < neighbors.length; i++) {
            //console.log("  " + neighbors[i].row + ", " + neighbors[i].col + ": " + neighbors[i].estimate);
            if (neighbors[i].estimate > highest) {
                bestNeighbors = [neighbors[i]];
                highest = neighbors[i].estimate;
                //console.log("    best!");
            } else if (neighbors[i].estimate == highest) {
                bestNeighbors.push(neighbors[i]);
            }
        }
        var nextIndex = Math.floor(Math.random() * bestNeighbors.length);
        var next = bestNeighbors[nextIndex];
        // Compare best neighbor to current
        if (current.estimate + current.value > highest) {
            //console.log("  current beats best: " + (current.estimate + current.value));
            next = current;
        }
        var error = this.config.discount * (next.value + next.estimate) - estimate;
        var errorSignal = error;
        if (next.override > 0.0) {
            var errorSignal = Math.max(error + next.override, next.override);
        }
        var adjustment = this.config.learning * errorSignal;
        current.estimate += adjustment;
        return next;
    }
};

var HexSimulation = function (rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.space = new HexStateSpace(rows, cols);
    this.agent = new Agent();
    this.currentState = null;
    this.stay = 0;
    this.showGrid = true;
    this.draw();
};
HexSimulation.prototype = {
    config: {
        cellSize: 30,
        border: 5,
        stayLimit: 1
    },
    onReward: function (d) {
        var state = this.space.getState(d.row, d.col);
        if (state.value == 0.0) {
            state.value = 1.0;
            state.override = 0.0;
        } else {
            state.value = 0.0;
        }
        this.draw();
    },
    onAddictive: function (d) {
        var state = this.space.getState(d.row, d.col);
        if (state.override == 0.0) {
            state.override = 1.0;
            state.value = 0.0;
        } else {
            state.override = 0.0;
        }
        this.draw();
    },
    onAgent: function (d) {
        this.currentState = this.space.getState(d.row, d.col);
        this.draw();
    },
    reset: function () {
        for (var ri = 0; ri < this.space.rows; ri++) {
            for (var ci = 0; ci < this.space.cols; ci++) {
                this.space.getState(ri, ci).estimate = 0.0;
            }
        }
        this.playing = false;
        this.draw();
    },
    clear: function () {
        this.currentState = null;
        this.agent = new Agent();
        this.space = new HexStateSpace(this.rows, this.cols);
        this.playing = false;
        this.draw();
    },
    grid: function () {
        this.showGrid = !this.showGrid;
        this.draw();
    },
    update: function () {
        if (this.currentState == null) {
            var row = Math.floor(Math.random() * this.rows);
            var col = Math.floor(Math.random() * this.cols);
            this.currentState = this.space.getState(row, col);
            this.draw();
        } else {
            var lastState = this.currentState;
            var neighbors = this.space.getNeighbors(this.currentState);
            this.currentState = this.agent.update(this.currentState, neighbors);
            this.draw();
            // If there is no change, reset
            if (this.currentState == lastState) {
                this.stay += 1;
                if (this.stay >= this.config.stayLimit) {
                    this.currentState = null;
                    this.stay = 0;
                }
            }
        }
    },
    play: function (set) {
        var that = this;
        if (set) {
            this.playing = true;
        }
        this.update();
        setTimeout(function () {
            if (that.playing) {
                that.play();
            }
        }, 0);
    },
    stop: function () {
        this.playing = false;
    },
    draw: function () {
        var that = this;
        var container = d3.select("svg");
        var xspace = this.config.cellSize * Math.sqrt(3) / 2.0;
        var xoff = xspace / 2.0 + this.config.border;
        var yspace = this.config.cellSize * 0.75;
        var yoff = this.config.cellSize * 0.5 + this.config.border;
        container
            .attr("height", this.rows * yspace + yspace/3.0 + this.config.border * 2.0)
            .attr("width", this.cols * xspace + xspace/2.0 + this.config.border * 2.0);
        var data = this.space.getData();
        var maxEst = Math.max(this.agent.getMaxEstimate(), 1.0);
        var fillScale = d3.scale.linear()
            .domain([0, maxEst, 2*maxEst]).range(["#000", "#00ff00", "#0000ff"]);
        // Draw states
        var sel = container.selectAll(".state").data(data, function (d) { return d.key; });
        sel.exit().remove();
        var cell = sel.enter()
            .append("g")
                .classed("state", true)
                .attr("transform", function (d) {
                    var dx = (d.col + (d.row % 2) / 2.0) * xspace + xoff;
                    var dy = d.row * yspace + yoff; 
                    return "translate(" + dx + "," + dy + ")";
                })
            .on("click", function (d, i) {
                if (document.getElementById("place").mode.value == "reward") {
                    that.onReward(d);
                } else if (document.getElementById("place").mode.value == "addictive") {
                    that.onAddictive(d);
                } else {
                    that.onAgent(d);
                }
            });
        cell.append("circle")
            .classed("estimate", true)
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", this.config.cellSize * Math.sqrt(3) / 4.0 - 1)            
            .attr("stroke", function () { if (that.showGrid) { return "#666"; } return "none"; })
            .attr("stroke-width", "2");
        cell.append("circle")
            .classed("value", true)
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", this.config.cellSize * Math.sqrt(3) / 12.0)
            .attr("stroke", "#666")
            .attr("stroke-width", "2");
        cell.append("circle")
            .classed("override", true)
            .attr("cx", "0")
            .attr("cy", "0")
            .attr("r", this.config.cellSize * Math.sqrt(3) / 12.0)
            .attr("stroke", "#666")
            .attr("stroke-width", "2");
        container.selectAll(".estimate")
            .attr("fill", function (d) { return fillScale(d.estimate); })
            .attr("stroke", function () { if (that.showGrid) { return "#666"; } return "none"; })
        sel.selectAll(".value")
            .attr("fill", function (d) { return fillScale(d.value); })
            .attr("visibility", function (d) {
                return visibility = d.value > 0.0 ? "visible" : "hidden";
            });
        sel.selectAll(".override")
            .attr("fill", "#0000ff")
            .attr("visibility", function (d) {
                return visibility = d.override > 0.0 ? "visible" : "hidden";
            });
        // Draw agent
        if (this.currentState != null) {
            var agentData = [this.currentState.getDatum()];
            container.select(".agent").remove();
            container.selectAll(".agent").data(agentData).enter()
                .append("g").classed("agent", true)
                .append("circle")
                .attr("cx", function (d) {
                    return (d.col + (d.row % 2) / 2.0) * xspace + xoff;
                })
                .attr("cy", function (d) {
                    return d.row * yspace + yoff; 
                })
                .attr("r", this.config.cellSize * Math.sqrt(3) / 4)
                .attr("fill", "none")
                .attr("stroke", "#ffffff")
                .attr("stroke-width", "5");
        }
    }
};

var sim = new HexSimulation(10, 10);