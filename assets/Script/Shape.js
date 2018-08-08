const Board = require('Board');
const getRandomInt = function(min, max) {
  let ratio = cc.random0To1();
  return min + Math.floor((max - min) * ratio);
};

cc.Class({
  extends: cc.Component,

  properties: {
    tileH: 122,
    tileScale: 0.7,
    board: {
      default: null,
      type: Board
    },
    type1: {
      default: null,
      type: cc.SpriteFrame
    },
    type2: {
      default: null,
      type: cc.SpriteFrame
    },
    type3: {
      default: null,
      type: cc.SpriteFrame
    },
    type4: {
      default: null,
      type: cc.SpriteFrame
    },
    type5: {
      default: null,
      type: cc.SpriteFrame
    },
    type6: {
      default: null,
      type: cc.SpriteFrame
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this.setTile();
    this.addTouchEvent();
  },
  setTile() {
    this.tiles = [
      {
        type: 1,
        list: [[[0, 0]]]
      },
      {
        type: 2,
        list: [
          [[1, -1], [0, 0], [1, 0], [0, 1]],
          [[0, 0], [1, 0], [-1, 1], [0, 1]],
          [[0, 0], [1, 0], [0, 1], [1, 1]]
        ]
      },
      {
        type: 3,
        list: [
          [[0, -1], [0, 0], [0, 1], [0, 2]],
          [[0, 0], [1, -1], [-1, 1], [-2, 2]],
          [[-1, 0], [0, 0], [1, 0], [2, 0]]
        ]
      },
      {
        type: 4,
        list: [
          [[0, 0], [0, 1], [0, -1], [-1, 0]],
          [[0, 0], [0, -1], [1, -1], [-1, 1]],
          [[0, 0], [0, 1], [0, -1], [1, 0]],
          [[0, 0], [1, 0], [-1, 0], [1, -1]],
          [[0, 0], [1, 0], [-1, 0], [-1, 1]]
        ]
      },
      {
        type: 5,
        list: [
          [[0, 0], [0, 1], [0, -1], [1, -1]],
          [[0, 0], [1, -1], [-1, 1], [-1, 0]],
          [[0, 0], [1, -1], [-1, 1], [1, 0]],
          [[0, 0], [1, 0], [-1, 0], [0, -1]],
          [[0, 0], [1, 0], [-1, 0], [0, 1]]
        ]
      },
      {
        type: 6,
        list: [
          [[0, -1], [-1, 0], [-1, 1], [0, 1]],
          [[-1, 0], [0, -1], [1, -1], [1, 0]],
          [[0, -1], [1, -1], [1, 0], [0, 1]],
          [[-1, 1], [0, 1], [1, 0], [1, -1]],
          [[-1, 0], [-1, 1], [0, -1], [1, -1]],
          [[-1, 0], [-1, 1], [0, 1], [1, 0]]
        ]
      }
    ];

    const hexData = this.random();

    let hexPx = hexData.list.map(hexArr => {
      return this.hex2pixel(hexArr, this.tileH);
    });

    this.setSpriteFrame(hexPx, this[`type${hexData.type}`]);
    this.node.scale = this.tileScale;
    this.node.ox = this.node.x;
    this.node.oy = this.node.y;
  },
  random: function() {
    const shape = this.tiles[getRandomInt(0, this.tiles.length - 1)];
    const list = shape.list[getRandomInt(0, shape.list.length - 1)];
    return {
      type: shape.type,
      list: list
    };
  },
  hex2pixel(hexArr, h) {
    let size = h / 2;
    let x = size * Math.sqrt(3) * (hexArr[0] + hexArr[1] / 2);
    let y = ((size * 3) / 2) * hexArr[1];
    return cc.p(x, y);
  },
  setSpriteFrame(hexes, tilePic) {
    for (let index = 0; index < hexes.length; index++) {
      let node = new cc.Node('frame');
      let sprite = node.addComponent(cc.Sprite);
      sprite.spriteFrame = tilePic;
      node.x = hexes[index].x;
      node.y = hexes[index].y;
      node.parent = this.node;
    }
  },
  addTouchEvent() {
    this.node.on('touchstart', event => {
      this.node.setScale(1);
      this.node.children.forEach(child => {
        child.setScale(0.8);
      });
    });
    this.node.on('touchmove', event => {
      const { x, y } = event.touch.getDelta();

      this.node.x += x;
      this.node.y += y;
      this.checkCollision(event);

      if (this.checkCanDrop()) {
        this.dropPrompt(true);
      } else {
        this.dropPrompt(false);
      }
    });
    this.node.on('touchend', () => {
      this.tileDrop();
    });
    this.node.on('touchcancel', () => {
      this.tileDrop();
    });
  },
  tileDrop() {
    this.resetBoardFrames();
    if (this.checkCanDrop()) {
      const boardTiles = this.boardTiles;
      const fillTiles = this.fillTiles;
      const fillTilesLength = fillTiles.length;

      for (let i = 0; i < fillTilesLength; i++) {
        const boardTile = boardTiles[i];
        const fillTile = fillTiles[i];
        const fillNode = boardTile.getChildByName('fillNode');
        const spriteFrame = fillTile.getComponent(cc.Sprite).spriteFrame;

        boardTile.isFulled = true;
        fillNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        this.resetTile();
      }
      this.board.curTileLength = fillTiles.length;
      this.board.node.emit('dropSuccess');
    } else {
      this.backSourcePos();
    }
  },
  resetTile() {
    this.node.removeAllChildren();
    this.node.x = this.node.ox;
    this.node.y = this.node.oy;
    this.setTile();
  },
  backSourcePos() {
    this.node.scale = this.tileScale;
    this.node.x = this.node.ox;
    this.node.y = this.node.oy;
    this.node.children.forEach(child => {
      child.setScale(1);
    });
  },
  checkCollision(event) {
    const tiles = this.node.children;
    this.boardTiles = [];
    this.fillTiles = [];
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const offsetPos = cc.pAdd(
        cc.v2(this.node.ox, this.node.oy),
        tile.position
      );
      const pos = cc.pAdd(this.node.position, tile.position);
      const boardTile = this.checkDistance(pos);
      if (boardTile) {
        this.fillTiles.push(tile);
        this.boardTiles.push(boardTile);
      }
    }
  },
  checkDistance(pos) {
    const distance = 20;
    const boardFrameList = this.board.boardFrameList;
    for (let i = 0; i < boardFrameList.length; i++) {
      const frameNode = boardFrameList[i];
      const nodeDistance = cc.pDistance(frameNode.position, pos);
      if (nodeDistance <= distance) {
        return frameNode;
      }
    }
  },
  checkCanDrop() {
    const boardTiles = this.boardTiles;
    const fillTiles = this.node.children;
    const boardTilesLength = boardTiles.length;
    const fillTilesLength = fillTiles.length;

    if (boardTilesLength === 0 || boardTilesLength != fillTilesLength) {
      return false;
    }

    for (let i = 0; i < boardTilesLength; i++) {
      if (this.boardTiles[i].isFulled) {
        return false;
      }
    }

    return true;
  },
  resetBoardFrames() {
    const boardFrameList = this.board.boardFrameList;

    for (let i = 0; i < boardFrameList.length; i++) {
      const shadowNode = boardFrameList[i].getChildByName('shadowNode');
      shadowNode.opacity = 0;
    }
  },
  dropPrompt(canDrop) {
    const boardTiles = this.boardTiles;
    const boardTilesLength = boardTiles.length;
    const fillTiles = this.fillTiles;

    this.resetBoardFrames();
    if (canDrop) {
      for (let i = 0; i < boardTilesLength; i++) {
        const shadowNode = boardTiles[i].getChildByName('shadowNode');
        shadowNode.opacity = 100;
        const spriteFrame = fillTiles[i].getComponent(cc.Sprite).spriteFrame;
        shadowNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
      }
    }
  },
  start() {}

  // update (dt) {},
});
