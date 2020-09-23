document.addEventListener('DOMContentLoaded',start,false);

var borderWidth = 4;
var halfBorder = borderWidth / 2;
var canvasWidth;
var canvasHeight;
var boxesWide = 30;
var boxesHigh = 30;
var boxWidth = 20;
var boxHeight = 20;
var xStep = borderWidth + boxWidth;
var yStep = borderWidth + boxHeight;
var colProb = 70;
var rowProb = 70;
var mazeConfig;
var maze = [];
var delay = 25;
var stepcount = 0;
var exit;
var stepping;
var exited = false;
var entrance = null;
var algoState = 0;

class priorityQueue {
    constructor() {
        this.list = [];
    }

    shift() {
        if (this.list.length > 0) {
            return this.list.shift().element;
        }
    }

    push(element, priority) {
        this.list.push({element: element, priority: priority});
        this.list.sort((a, b) => b.priority - a.priority);
    }

    length() {
        return this.list.length;
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
        this.x = x;
        this.y = y;
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
        ctx.arc(this.topLeft[0] + boxWidth / 2, this.topLeft[1] + boxHeight / 2, (bowWidth / 2) - 3, 0, 2 * Math.PI, false);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#003300';
        ctx.stroke();
    }
}

function algoChange() {
    algoState =   parseInt(document.getElementById("algo").value);
}

function restart() {
    boxesWide =   parseInt(document.getElementById("boxes-wide").value);
    boxesHigh =   parseInt(document.getElementById("boxes-high").value);
    borderWidth = parseInt(document.getElementById("border-width").value);
    boxWidth =    parseInt(document.getElementById("box-width").value);
    boxHeight =   parseInt(document.getElementById("box-height").value);
    rowProb =     parseInt(document.getElementById("row-prob").value);
    colProb =     parseInt(document.getElementById("col-prob").value);
    algoState =   parseInt(document.getElementById("algo").value);

    var canvas = document.getElementById('c');
    var ctx = canvas.getContext('2d');
    ctx.clearRect(0,0,canvasWidth,canvasHeight);
    exited = false;
    nodeList = new priorityQueue();
    maze = [];
    entrance = null;
    halfBorder = borderWidth / 2;
    xStep = borderWidth + boxWidth;
    yStep = borderWidth + boxHeight;
    start();
}

function start() {
    document.getElementById("boxes-wide").value =    boxesWide;
    document.getElementById("boxes-high").value =    boxesHigh;
    document.getElementById("border-width").value =  borderWidth;
    document.getElementById("box-width").value =     boxWidth;
    document.getElementById("box-height").value =    boxHeight;
    document.getElementById("row-prob").value =      rowProb;
    document.getElementById("col-prob").value =      colProb;
    document.getElementById("algo").value =          algoState;

    canvasWidth = boxWidth * boxesWide + borderWidth * (boxesWide + 1);
    canvasHeight = boxHeight * boxesHigh + borderWidth * (boxesHigh + 1);

    var canvas = document.getElementById('c');
    var ctx = canvas.getContext('2d');
    ctx.canvas.width  = canvasWidth;
    ctx.canvas.height = canvasHeight;
    ctx.fillStyle = 'black';
    //ctx.fillRect(0, 0, canvasWidth, canvasHeight);

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
    exit = maze[exitX][exitY];
    
    canvas.addEventListener('click', (e) => {
        if (entrance != null) {
            exit.markCircle(ctx, 'green');
            for (var i = 0; i < boxesWide; i++) {
                for (var j = 0; j < boxesHigh; j++) {
                    maze[i][j].fillSquare(ctx, 'white');
                    maze[i][j] = new Box(i, j, mazeConfig);
                    nodeList = new priorityQueue();
                }
            }
            maze[exitX][exitY].exit = true;
            maze[exitX][exitY].markCircle(ctx, 'green');
    
            exited = false;
        }
        let rect = canvas.getBoundingClientRect(); 
        let x = Math.floor((e.clientX - rect.left) / xStep) - 1;
        let y = Math.floor((e.clientY - rect.top) / yStep) - 1;
        maze[x][y].entrance = true;
        maze[x][y].markCircle(ctx, 'blue');
        entrance = maze[x][y];
        entrance.nodePath = [];
        nodeList.push(entrance, 0);
    });

    stepping = setInterval(function() { 
        var limit = nodeList.length() / 3;
        for (var i = 0; i < limit; i ++) {
            if (entrance != null && nodeList.length() > 0 && !exited) {
                explore(ctx);
            } 
        }
        incrementColor(5);
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

var state = 0;
var r = 0;
var g = 255;
var b = 255;
function incrementColor(colorMod) {
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

var nodeList = new priorityQueue();
function explore(ctx) {
    node = nodeList.shift();
    node.nodePath.push(node);

    if (node.exit) {
        exited = true;
        markPath(node.nodePath, ctx);
    } else if (!node.explored) {
        node.explored = true;
        node.fillSquare(ctx, 'rgb(' + r + ', ' + g + ', ' + b +')');
        if (node.up && node.up.explored == false) {
            node.up.nodePath = [...node.nodePath];
            nodeList.push(node.up, priority(node.up));
        }
        if (node.down && node.down.explored == false) {
            node.down.nodePath = [...node.nodePath];
            nodeList.push(node.down, priority(node.down));
        }
        if (node.left && node.left.explored == false) {
            node.left.nodePath = [...node.nodePath];
            nodeList.push(node.left, priority(node.left));
        }
        if (node.right && node.right.explored == false) {
            node.right.nodePath = [...node.nodePath];
            nodeList.push(node.right, priority(node.right));
        }
    }
}

function priority(node) {
    let exitDist = (Math.abs(node.x - exit.x) + Math.abs(node.y - exit.y));
    let entranceDist = (Math.abs(node.x - entrance.x) + Math.abs(node.y - entrance.y));
    let nodePathLength = node.nodePath.length;
    if (algoState == 0) {
        return 0 - nodePathLength;
    } else if (algoState == 1) {
        return -exitDist + nodePathLength;
    } else {
        return entranceDist - 5 * exitDist - nodePathLength;
    }
}

function markPath(nodePath, ctx) {
    while (nodePath.length > 0) {
        nodePath.shift().fillSquare(ctx, 'red');
    }
}

