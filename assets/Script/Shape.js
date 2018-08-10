import Board from 'Board';
import { Tiles } from 'Config';
const getRandomInt = function(min, max) {
  let ratio = cc.random0To1();
  return min + Math.floor((max - min) * ratio);
};
cc.Class({
  extends: cc.Component,

  properties: {
    tileH: 122, // 方块六边形高度
    tileScale: 0.7, // 方块默认缩放值，用于点击后放大效果
    board: {
      // 获取棋盘节点访问
      default: null,
      type: Board
    },
    // 以下为各方块类型图片
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
    this.tiles = Tiles;

    const hexData = this.random();

    let hexPx = hexData.list.map(hexArr => {
      return this.hex2pixel(hexArr, this.tileH);
    });

    this.setSpriteFrame(hexPx, this[`type${hexData.type}`]);
    this.node.scale = this.tileScale;
    this.node.ox = this.node.x;
    this.node.oy = this.node.y;
  },
  random() {
    const shape = this.tiles[getRandomInt(0, this.tiles.length)];
    const list = shape.list[getRandomInt(0, shape.list.length)];
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
      this.boardTiles = [];
      this.fillTiles = [];
    });
    this.node.on('touchmove', event => {
      const { x, y } = event.touch.getDelta();

      this.node.x += x;
      this.node.y += y;
      // 方块与棋盘的触碰检测，并返回重合的部分。
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

        // 棋盘存在方块的标识设置
        boardTile.isFulled = true;
        fillNode.getComponent(cc.Sprite).spriteFrame = spriteFrame;
        // 落子成功后重置方块
        this.resetTile();
      }

      // 这里棋盘需要访问当前方块的六边形总数
      this.board.curTileLength = fillTiles.length;
      // 触发落入成功的事件
      this.board.node.emit('dropSuccess');
    } else {
      this.backSourcePos();
    }
    this.board.checkLose();
  },
  checkLose() {
    let canDropCount = 0;
    const tiles = this.node.children;
    const tilesLength = tiles.length;
    const boardFrameList = this.board.boardFrameList;
    const boardFrameListLength = boardFrameList.length;

    // TODO: 存在无效检测的情况，可优化
    for (let i = 0; i < boardFrameListLength; i++) {
      const boardNode = boardFrameList[i];
      let srcPos = cc.p(boardNode.x, boardNode.y);
      let count = 0;
      if (!boardNode.isFulled) {
        // 过滤出未填充的棋盘格子
        for (let j = 0; j < tilesLength; j++) {
          let len = 27; // 设定重合判定最小间距

          // 将方块移到未填充的棋盘格子原点，并获取当前各方块坐标值
          let tilePos = cc.pAdd(srcPos, cc.p(tiles[j].x, tiles[j].y));

          // 遍历棋盘格子，判断方块中各六边形是否可以放入
          for (let k = 0; k < boardFrameListLength; k++) {
            const boardNode = boardFrameList[k];
            let dis = cc.pDistance(cc.p(boardNode.x, boardNode.y), tilePos);
            if (dis <= len && !boardNode.isFulled) {
              count++;
            }
          }
        }

        if (count === tilesLength) {
          canDropCount++;
        }
      }
    }

    if (canDropCount === 0) {
      return true;
    } else {
      return false;
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
    this.boardTiles = []; // 保存棋盘与方块重合部分。
    this.fillTiles = []; // 保存方块当前重合的部分。
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const pos = cc.pAdd(this.node.position, tile.position);
      const boardTile = this.checkDistance(pos);
      if (boardTile) {
        this.fillTiles.push(tile);
        this.boardTiles.push(boardTile);
      }
    }
  },
  checkDistance(pos) {
    const distance = 50;
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
    const boardTiles = this.boardTiles; // 当前棋盘与方块重合部分。
    const fillTiles = this.node.children; // 当前拖拽的方块总数。
    const boardTilesLength = boardTiles.length;
    const fillTilesLength = fillTiles.length;

    // 如果当前棋盘与方块重合部分为零以及与方块数目不一致，则判定为不能落子。
    if (boardTilesLength === 0 || boardTilesLength != fillTilesLength) {
      return false;
    }

    // 如果方块内以及存在方块，则判定为不能落子。
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
