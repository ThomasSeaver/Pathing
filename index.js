document.addEventListener('DOMContentLoaded',start,false);

var borderWidth = 2;
var halfBorder = borderWidth / 2;
var canvasWidth;
var canvasHeight;
var boxesWide = 250;
var boxesHigh = 100;
var boxWidth = 5;
var boxHeight = 5;
var xStep = borderWidth + boxWidth;
var yStep = borderWidth + boxHeight;
var colProb = 60;
var rowProb = 60;
var mazeConfig;
var maze = [];
var delay = 100;
var entrance = [];
var stepcount = 0;
var stepping;
var exited = false;
var entrance = null;

function start() {

    canvasWidth = boxWidth * boxesWide + borderWidth * (boxesWide + 1);
    canvasHeight = boxHeight * boxesHigh + borderWidth * (boxesHigh + 1);

    var canvas = document.getElementById('c');
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = canvasWidth;
    ctx.canvas.height = canvasHeight;

    mazeConfig = generateMaze(ctx);

    for (var x = 0; x < boxesWide; x++) {
        maze.push([]);
        for (var y = 0; y < boxesHigh; y++) {
            maze[x].push(new Box(x, y, mazeConfig));
        }
    }
    let exitX = Math.floor(Math.random() * boxesWide);
    let exitY = Math.floor(Math.random() * boxesHigh);
    maze[exitX][exitY].exit = true;
    maze[exitX][exitY].markCircle(ctx, 'green');
    
    var entranceExists = false;

    canvas.addEventListener('click', (e) => {
        let rect = canvas.getBoundingClientRect(); 
        let x = Math.floor((e.clientX - rect.left) / xStep) - 1;
        let y = Math.floor((e.clientY - rect.top) / yStep) - 1;
        maze[x][y].entrance = true;
        maze[x][y].markCircle(ctx, 'blue');
        entrance = maze[x][y];
    });

    stepping = setInterval(function() { 
        if (exited) {
            clearInterval(stepping);
        } else if (entrance != null) {
            stepAlgo(ctx);
            stepcount++;
        }
    }, delay);
}

function generateMaze(ctx) {
    var cols = [];
    for (var x = 0; x < boxesWide; x++) {
        var col = [];
        for (var y = 0; y <= boxesHigh; y++) {
            var drawCol = y == 0 || y == boxesHigh || Math.random() * 100 > colProb; 
            col.push(drawCol ? 1 : 0);
        }
        cols.push(col);
    }
    
    var rows = [];
    for (var y = 0; y < boxesHigh; y++) {
        var row = [];
        for (var x = 0; x <= boxesWide; x++) {
            var drawRow = x == 0 || x == boxesWide || Math.random() * 100 > rowProb; 
            row.push(drawRow ? 1 : 0);
        }
        rows.push(row);
    }

    for (var x = 0; x < boxesWide; x++) {
        var col = cols[x];
        for (var y = 0; y <= boxesHigh; y++) {
            ctx.beginPath();
            ctx.lineWidth = borderWidth;
            ctx.moveTo(halfBorder + x * xStep, halfBorder + y * yStep);
            if (col[y] == 1) {
                ctx.strokeStyle = "#000";
            } else {
                ctx.strokeStyle = "#CCC";
            }
            ctx.lineTo(halfBorder + (x + 1) * xStep, halfBorder + y * yStep);
            ctx.closePath();
            ctx.stroke();
        }
    }

    for (var y = 0; y < boxesHigh; y++) {
        var row = rows[y];
        for (var x = 0; x <= boxesWide; x++) {
            ctx.beginPath();
            ctx.lineWidth = borderWidth;
            ctx.moveTo(halfBorder + x * xStep, halfBorder + y * yStep);
            if (row[x] == 1) {
                ctx.strokeStyle = "#000";
            } else {
                ctx.strokeStyle = "#CCC";
            }
            ctx.lineTo(halfBorder + x * xStep, halfBorder + (y + 1) * yStep);
            ctx.closePath();
            ctx.stroke();
        }
    }

    return {rows: rows, cols: cols};
}

function incrementColor() {
    var colorMod = 5;
    if (r == 0) {
        state = 0;
    } else if (g == 0) {
        state = 1;
    } else if (b == 0) {
        state = 2;
    }
    if (state == 0) {
        r += colorMod;
        g -= colorMod;
    } else if (state == 1) {
        g += colorMod;
        b -= colorMod;
    } else if (state == 2) {
        b += colorMod;
        r -= colorMod;
    }
}

function stepAlgo(ctx) {
    nodeList.push(entrance);
    entrance.nodePath = [];
    while (nodeList.length > 0) {
        explore(ctx);
    }
    incrementColor();
}

var nodeList = [];
var state = 0;
var r = 0;
var g = 255;
var b = 255;
function explore(ctx) {
    node = nodeList.shift();
    node.nodePath.push(node);

    if (node.exit) {
        exited = true;
        markPath(node.nodePath, ctx);
    } else if (!node.explored) {
        node.explored = true;
        node.fillSquare(ctx, 'rgb(' + r + ', ' + g + ', ' + b +')');
        node.stepcount = stepcount;
    } else {
        if (node.up && node.up.stepcount != stepcount) {
            node.up.stepcount = stepcount;
            node.up.nodePath = [...node.nodePath];
            nodeList.push(node.up);
        }
        if (node.down && node.down.stepcount != stepcount) {
            node.down.stepcount = stepcount;
            node.down.nodePath = [...node.nodePath];
            nodeList.push(node.down);
        }
        if (node.left && node.left.stepcount != stepcount) {
            node.left.stepcount = stepcount;
            node.left.nodePath = [...node.nodePath];
            nodeList.push(node.left);
        }
        if (node.right && node.right.stepcount != stepcount) {
            node.right.stepcount = stepcount;
            node.right.nodePath = [...node.nodePath];
            nodeList.push(node.right);
        }
    }
}

function markPath(nodePath, ctx) {
    while (nodePath.length > 0) {
        nodePath.shift().fillSquare(ctx, 'red');
    }
}

class Box {
    constructor(x, y, mazeConfig) {
        this.topLeft = [borderWidth + x * xStep, borderWidth + y * yStep];

        if (mazeConfig.rows[y][x] != 1) {
            this.left = maze[x - 1][y];
            this.left.right = this;
        } else {
            this.left = false;
        }
        if (mazeConfig.cols[x][y] != 1) {
            this.up = maze[x][y - 1];
            this.up.down = this;
        } else {
            this.up = false;
        }
        this.entrance = false;
        this.exit = false;
        this.explored = false;
        this.stepcount = -1;
    }

    fillSquare(ctx, color) {
        ctx.fillStyle = color;
        ctx.fillRect(this.topLeft[0], this.topLeft[1], boxWidth, boxHeight);
    }

    fillAdjacents(ctx) {
        if (this.up) {
            this.up.fillSquare(ctx);
        }
        if (this.down) {
            this.down.fillSquare(ctx);
        }
        if (this.left) {
            this.left.fillSquare(ctx);
        }
        if (this.right) {
            this.right.fillSquare(ctx);
        }
        this.fillSquare(ctx);
    }

    markCircle(ctx, color) {
        ctx.beginPath();
        ctx.arc(this.topLeft[0] + boxWidth / 2, this.topLeft[1] + boxHeight / 2, 15, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
}