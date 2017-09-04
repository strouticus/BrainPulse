var game = new Phaser.Game(1280, 720, Phaser.AUTO, '', { preload: preload, create: create, update: update });

function preload() {

    // Sprite loading


    // Sound loading
    game.load.audio("beat_sfx", "sound/beat.wav");
}

function Conductor (bpm) {
    this.bpm = bpm;
    this.beat = (1000 * 60) / this.bpm;
    this.beatNumber = 0;
    this.lastBeat = game.time.now;
    this.sinceBeat = 0;

    this.paused = false;
    this.pauseTime;

    this.update = function () {
        if (!this.paused) {
            this.sinceBeat = game.time.now - this.lastBeat;

            if (this.sinceBeat >= this.beat) {
                // HANDLE BEAT HERE
                for (var i = 0; i < instruments.length; i++) {
                    instruments[i].beat();
                }
                beatSound.play();
                this.lastBeat += this.beat;
            }
        }
    }

    this.pause = function () {
        console.info("PAUSING CONDUCTOR");
        this.paused = true;
        this.pauseTime = game.time.now;
    }

    this.resume = function () {
        console.info("RESUMING CONDUCTOR");
        this.paused = false;
        this.lastBeat += (game.time.now - this.pauseTime);
    }
}

var instruments = [];

function Instrument () {
    instruments.push(this);

    this.beat = function () {

    }
}

var pulseList = [];
function Pulse (startNodeID, beatsPerMove) {
    Instrument.call(this);

    this.currentNode = findNodeByID(startNodeID);
    this.previousNode = undefined;
    this.beatsPerMove = beatsPerMove;
    this.beatCountdown = 0;
    this.initialized = false;

    this.x = this.currentNode.x;
    this.y = this.currentNode.y;
    this.width = 50;
    this.height = 50;

    this.sprite = game.add.sprite(this.x, this.y, pulseParentTexture);
    this.sprite.anchor.setTo(0.5, 0.5);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    this.spriteOutTweens  = [];
    this.spriteInTweens  = [];
    spriteLayer.add(this.sprite);

    for (var i = 0; i < this.beatsPerMove; i++) {
        var newSprite = game.add.sprite(0, 0, pulseTextures.wedges[this.beatsPerMove]);
        newSprite.anchor.setTo(0.5, 0.5);
        newSprite.width = this.width;
        newSprite.height = this.height;
        newSprite.rotation = (((2 * Math.PI) / this.beatsPerMove) * i) - (Math.PI / 2);
        newSprite.alpha = 0.8;

        var newOutTween = game.add.tween(newSprite).to({alpha: 0.25}, 150);
        var newInTween = game.add.tween(newSprite).to({alpha: 0.8}, 75);
        
        this.sprite.addChild(newSprite);
        this.spriteOutTweens.push(newOutTween);
        this.spriteInTweens.push(newInTween);
    }

    if (this.beatsPerMove !== 1) {
        var lineSprite = game.add.sprite(0, 0, pulseTextures.lines[this.beatsPerMove]);
        lineSprite.anchor.setTo(0.5, 0.5);
        lineSprite.width = this.width;
        lineSprite.height = this.height;
        lineSprite.alpha = 0.8;
        this.sprite.addChild(lineSprite);
    }

    this.fuseSprite = game.add.sprite(0, 0, pulseFuseTexture);
    this.fuseSprite.anchor.setTo(0.5, 0.5);
    this.fuseSprite.width = 60;
    this.fuseSprite.height = 60;
    this.fuseSprite.rotation = -(Math.PI / 2);
    this.fuseSprite.alpha = 0.8;
    this.sprite.addChild(this.fuseSprite);

    this.fuseTween = game.add.tween(this.fuseSprite).to({rotation: (3 * (Math.PI / 2))}, conductor.beat * this.beatsPerMove);

    this.beat = function () {

        this.beatCountdown -= 1;
        if (this.beatCountdown <= 0) {
            this.beatCountdown = this.beatsPerMove;
            for (var i = 0; i < this.spriteInTweens.length; i++) {
                this.spriteInTweens[i].start();
            }
            this.fuseTween.stop();
            this.fuseSprite.rotation = -(Math.PI / 2);
            this.fuseTween = game.add.tween(this.fuseSprite).to({rotation: (3 * (Math.PI / 2))}, conductor.beat * this.beatsPerMove);
            this.fuseTween.start();

            if (this.initialized) {
                var nodeIDsToMove = [];
                for (var i = 0; i < this.currentNode.edges.length; i++) {
                    var otherNode = this.currentNode.edges[i].getOtherNode(this.currentNode);
                    if (this.currentNode.edges[i].active && otherNode !== this.previousNode) {
                        // this.move(otherNode.id);
                        nodeIDsToMove.push(otherNode.id);
                    }
                }

                for (var i = 0; i < nodeIDsToMove.length; i++) {
                    // this.move(nodeIDsToMove[i]);
                    if (i === nodeIDsToMove.length-1) {
                        this.move(nodeIDsToMove[i]);
                    } else {
                        var newPulse = new Pulse(this.currentNode.id, this.beatsPerMove);
                        newPulse.move(nodeIDsToMove[i]);
                    }
                }
            } else {
                this.initialized = true;
            }

        } else {
            this.spriteOutTweens[this.beatsPerMove - this.beatCountdown - 1].start();
        }
    }

    this.move = function (newNodeID) {
        this.previousNode = this.currentNode;
        this.currentNode = findNodeByID(newNodeID);

        this.x = this.currentNode.x;
        this.y = this.currentNode.y;

        // this.sprite.x = this.x;
        // this.sprite.y = this.y;

        var newTween = game.add.tween(this.sprite).to({x: this.x, y: this.y}, 400, Phaser.Easing.Exponential.Out);
        newTween.start();
    }

    pulseList.push(this);
}

var nodeList = [];
function Node (id, x, y) {
    Instrument.call(this);

    this.id = id;
    this.x = x;
    this.y = y;
    this.width = 20;
    this.height = 20;
    this.edges = [];

    this.sprite = game.add.sprite(this.x, this.y, nodeTexture);
    this.sprite.anchor.setTo(0.5, 0.5);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    spriteLayer.add(this.sprite);

    this.beatTween = game.add.tween(this.sprite).to({width: this.width, height: this.height}, 150);

    this.beat = function () {
        this.sprite.width = this.width * 1.5;
        this.sprite.height = this.height * 1.5;
        this.beatTween.start();
    }

    this.hasSwitcherEdge = function (switcherID) {
        for (var i = 0; i < this.edges.length; i++) {
            if (this.edges[i].switcherID === switcherID) {
                return true;
            }
        }
        return false;
    }

    nodeList.push(this);
}

function Switcher (id, x, y, switcherTint) {
    Node.call(this, id, x, y);

    this.isSwitcher = true;
    this.switcherTint = switcherTint;

    this.sprite.tint = switcherTint;
}

function findNodeByID (id) {
    for (var i = 0; i < nodeList.length; i++) {
        if (nodeList[i].id === id) {
            return nodeList[i];
        }
    }
}

var edgeList = [];
function Edge (node1ID, node2ID, switcherID) {
    Instrument.call(this);
    
    this.nodeIDs = [node1ID, node2ID];
    var node1 = findNodeByID(node1ID);
    var node2 = findNodeByID(node2ID);

    this.x = node1.x;
    this.y = node1.y;
    this.width = Phaser.Math.distance(node1.x, node1.y, node2.x, node2.y);
    this.height = 55;
    this.angle = Phaser.Math.angleBetween(node1.x, node1.y, node2.x, node2.y);

    this.active = true;
    if (switcherID !== undefined) {
        this.switcherID = switcherID;
    }

    this.sprite = game.add.sprite(this.x, this.y, edgeTexture);
    this.sprite.anchor.setTo(0, 0.5);
    this.sprite.width = this.width;
    this.sprite.height = this.height;
    this.sprite.rotation = this.angle;
    edgeLayer.add(this.sprite);

    this.sprite.inputEnabled = true;

    this.sprite.events.onInputDown.add(function() {
        if (this.switcherID !== undefined) {
            var switcher = findNodeByID(this.switcherID);
            for (var i = 0; i < switcher.edges.length; i++) {
                if (switcher.edges[i].switcherID === this.switcherID) {
                    switcher.edges[i].deactivate();
                }
            }
            this.activate();
        }
    }, this);

    this.addToNode = function (node) {
        node.edges.push(this);
    }

    this.deactivate = function () {
        this.active = false;
        this.sprite.alpha = 0.3;
    }

    this.activate = function () {
        this.active = true;
        this.sprite.alpha = 1;
    }

    this.getOtherNode = function (originalNode) {
        if (originalNode.id === this.nodeIDs[0]) {
            return findNodeByID(this.nodeIDs[1]);
        } else {
            return findNodeByID(this.nodeIDs[0]);
        }
    }

    this.findSwitcherNode = function () {
        for (var i = 0; i < this.nodeIDs.length; i++) {
            var curNode = findNodeByID(this.nodeIDs[i]);
            if (curNode.isSwitcher) {
                return curNode;
            }
        }
    }

    if (this.switcherID !== undefined) {
        var switcherNode = findNodeByID(this.switcherID);
        this.sprite.tint = switcherNode.switcherTint;
        if (switcherNode.hasSwitcherEdge(this.switcherID)) {
            this.deactivate();
        }
    }

    this.addToNode(node1);
    this.addToNode(node2);
    edgeList.push(this);
}

function makeNewID (idVar) {
    var retID = idVar;
    idVar++;
    return retID;
}

// Globals
var conductor;

var beatSound;

var nodeTexture;
var edgeTexture;
var pulseParentTexture;
var pulseFuseTexture;

var pulseTextures = {
    wedges: {},
    lines: {},
};

var edgeLayer;
var spriteLayer;
var HUDLayer;

var pointerDown;

function create() {

    // game.add.image(0, 0, 'sky');

    // var tempGraphics = game.add.graphics(0, 0);
    // tempGraphics.beginFill(0x000000);
    // tempGraphics.drawRect(0, 0, PX_SIZE * GRID_X, PX_SIZE * GRID_Y);
    // tempGraphics.endFill();
    // blackSquare = tempGraphics.generateTexture();

    game.input.mouse.capture = true;

    if (game.input.activePointer.isDown) {

    }

    var tempGraphics = game.add.graphics(0, 0);
    tempGraphics.beginFill(0xFFFFFF);
    tempGraphics.drawEllipse(10, 10, 10, 10);
    tempGraphics.endFill();
    nodeTexture = tempGraphics.generateTexture();
    tempGraphics.destroy();

    var tempGraphics2 = game.add.graphics(0, 0);
    tempGraphics2.drawRect(0, 0, 1024, 55);
    tempGraphics2.beginFill(0xFFFFFF);
    tempGraphics2.drawRect(0, 25, 1024, 5);
    tempGraphics2.endFill();
    edgeTexture = tempGraphics2.generateTexture();
    tempGraphics2.destroy();

    var tempGraphics3 = game.add.graphics(0, 0);
    tempGraphics3.drawEllipse(25, 25, 25, 25);
    pulseParentTexture = tempGraphics3.generateTexture();
    tempGraphics3.destroy();

    for (var i = 1; i <= 6; i++) {
        var tempPulseGraphics = game.add.graphics(0, 0);
        tempPulseGraphics.drawEllipse(25, 25, 25, 25);
        tempPulseGraphics.beginFill(0xAAFFFF);
        tempPulseGraphics.moveTo(25, 25);
        tempPulseGraphics.arc(25, 25, 25, 0, (2*Math.PI)/i);
        tempPulseGraphics.lineTo(25, 25);
        tempPulseGraphics.endFill();
        // tempPulseGraphics.moveTo(26, 25);
        // tempPulseGraphics.lineStyle(1, 0x000000, 1);
        // tempPulseGraphics.lineTo(49, 25);
        pulseTextures.wedges[i] = tempPulseGraphics.generateTexture();
        tempPulseGraphics.destroy();

        if (i > 1) {
            var tempPulseGraphics2 = game.add.graphics(0, 0);
            // tempPulseGraphics2.beginFill(0x00FF00);
            tempPulseGraphics2.drawEllipse(25, 25, 25, 25);
            // tempPulseGraphics2.endFill();
            tempPulseGraphics2.lineStyle(1, 0x003333, 1);
            for (var j = 1; j <= i; j++) {
                var lineAngle = (((2 * Math.PI) / i) * j) - (Math.PI / 2);
                var lineX = 25 + 25 * Math.cos(lineAngle);
                var lineY = 25 + 25 * Math.sin(lineAngle);
                tempPulseGraphics2.moveTo(25, 25);
                tempPulseGraphics2.lineTo(lineX, lineY);
            }
            pulseTextures.lines[i] = tempPulseGraphics2.generateTexture();
            tempPulseGraphics2.destroy();
        }
    }

    var tempGraphics4 = game.add.graphics(0, 0);
    tempGraphics4.drawEllipse(30, 30, 30, 30);
    tempGraphics4.beginFill(0xAAFFFF);
    tempGraphics4.drawEllipse(55, 30, 5, 5);
    tempGraphics4.endFill();
    pulseFuseTexture = tempGraphics4.generateTexture();
    tempGraphics4.destroy();


    beatSound = game.add.audio("beat_sfx");

    edgeLayer = game.add.group();
    spriteLayer = game.add.group();
    HUDLayer = game.add.group();

    game.onPause.add(onGamePause, this);
    game.onResume.add(onGameResume, this);

    conductor = new Conductor(120);

    // new Node(0, 100, 200);
    // new Node(1, 200, 200);
    // new Node(2, 300, 100);
    // new Node(3, 400, 300);
    // new Node(4, 500, 200);
    // new Node(5, 600, 200);
    // new Edge(0, 1);
    // new Edge(1, 2);
    // new Edge(2, 3);
    // new Edge(3, 4);
    // new Edge(4, 5);

    // new Pulse(0, 4);
    // new Pulse(1, 2);
    // new Pulse(2, 3);
    // new Pulse(3, 4);
    // new Pulse(4, 5);
    // new Pulse(5, 6);

    // new Node(0, 100, 200);
    // new Switcher(1, 200, 200, 0x77FF77);
    // new Node(2, 200, 100);
    // new Node(3, 300, 200);
    // new Node(4, 200, 300);
    // new Node(5, 300, 100);
    // new Node(6, 400, 200);
    // new Node(7, 300, 300);
    // new Edge(0, 1);
    // new Edge(1, 2, true);
    // new Edge(1, 3, true);
    // new Edge(1, 4, true);
    // new Edge(2, 5);
    // new Edge(3, 6);
    // new Edge(4, 7);
    // new Pulse(0, 4);

    new Node(0, 100, 100);
    new Switcher(1, 200, 100, 0xFF7777);
    new Node(2, 300, 100);
    new Switcher(3, 300, 200, 0x77FF77);
    new Node(4, 400, 200);
    new Switcher(5, 400, 300, 0x7777FF);
    new Node(6, 500, 300);
    new Node(7, 600, 300);
    new Node(8, 600, 400);
    new Edge(0, 1);
    new Edge(1, 2, 1);
    new Edge(1, 3, 1);
    new Edge(3, 4, 3);
    new Edge(3, 5, 3);
    new Edge(5, 6, 5);
    new Edge(6, 7);
    new Edge(5, 8, 5);
    new Pulse(0, 4);
}

function update() {
    conductor.update();
}

function onGamePause () {
    // p1GainNode.disconnect(audioCtx.destination);
    conductor.pause();

}

function onGameResume () {
    // p1GainNode.connect(audioCtx.destination);
    conductor.resume();
}