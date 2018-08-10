import { DelRules } from 'Config';
import _ from './util/Util';

let theScore = 0;

cc.Class({
  extends: cc.Component,

  properties: {
    hexSide: 5, // 需要生成的六边形布局的边界个数
    tileH: 110, // 六边形高度
    tilePic: {
      // 棋盘背景
      default: null,
      type: cc.SpriteFrame
    }
  },

  // LIFE-CYCLE CALLBACKS:
  start() {},
  onLoad() {
    this.setHexagonGrid();
    this.node.on('dropSuccess', this.deleteTile, this);
    this.getOldScore();
  },
  // Methods
  getOldScore() {
    const oldScore = cc.sys.localStorage.getItem('score');
    let node = cc.find('Canvas/OldScore');
    let label = node.getComponent(cc.Label);
    label.string = Number(oldScore);
  },
  deleteTile() {
    let fulledTilesIndex = []; // 存储棋盘内有方块的的索引
    let readyDelTiles = []; // 存储待消除方块
    const boardFrameList = this.boardFrameList;
    this.isDeleting = true; // 方块正在消除的标识，用于后期添加动画时，充当异步状态锁
    this.addScore(this.curTileLength, true);

    // 首先获取棋盘内存在方块的格子信息
    for (let i = 0; i < boardFrameList.length; i++) {
      const boardFrame = boardFrameList[i];
      if (boardFrame.isFulled) {
        fulledTilesIndex.push(i);
      }
    }

    for (let i = 0; i < DelRules.length; i++) {
      const delRule = DelRules[i]; // 消除规则获取
      // 逐一获取规则数组与存在方块格子数组的交集
      let intersectArr = _.arrIntersect(fulledTilesIndex, delRule);
      if (intersectArr.length > 0) {
        // 判断两数组是否相同，相同则将方块添加到待消除数组里
        const isReadyDel = _.checkArrIsEqual(delRule, intersectArr);
        if (isReadyDel) {
          readyDelTiles.push(delRule);
        }
      }
    }

    // 开始消除
    let count = 0;
    for (let i = 0; i < readyDelTiles.length; i++) {
      const readyDelTile = readyDelTiles[i];
      for (let j = 0; j < readyDelTile.length; j++) {
        const delTileIndex = readyDelTile[j];
        const boardFrame = this.boardFrameList[delTileIndex];
        const delNode = boardFrame.getChildByName('fillNode');
        boardFrame.isFulled = false;

        // 这里可以添加相应消除动画
        const finished = cc.callFunc(() => {
          delNode.getComponent(cc.Sprite).spriteFrame = null;
          delNode.opacity = 255;
          count++;
        }, this);
        delNode.runAction(cc.sequence(cc.fadeOut(0.3), finished));
      }
    }

    if (count !== 0) {
      this.addScore(count);
      this.checkLose();
    }

    this.isDeleting = false;
  },

  addScore(count, isDropAdd) {
    let addScoreCount = this.scoreRule(count, isDropAdd);
    let node = cc.find('Canvas/Score');
    let label = node.getComponent(cc.Label);
    label.string = addScoreCount + Number(label.string);
    theScore = Number(label.string);
  },
  scoreRule(count, isDropAdd) {
    // 规则你定!
    let x = count + 1;
    let addScoreCount = isDropAdd ? x : 2 * x * x;
    return addScoreCount;
  },
  checkLose() {
    if (this.isDeleting) return;

    const fillTiles = this.node.parent.getChildByName('TileContainer').children;
    const fillTilesLength = fillTiles.length;
    let count = 0;

    for (let i = 0; i < fillTilesLength; i++) {
      const fillTile = fillTiles[i];
      const fillTileScript = fillTile.getComponent('Shape'); // 直接获取方块节点下的脚本组件
      if (fillTileScript.checkLose()) {
        count++;
        fillTile.opacity = 125;
      } else {
        fillTile.opacity = 255;
      }
    }
    if (count === 3) {
      const oldScore = cc.sys.localStorage.getItem('score');
      if (oldScore < theScore) {
        cc.sys.localStorage.setItem('score', theScore);
      }
      this.gameOver();
    }
  },
  gameOver() {
    const Failed = cc.find('Canvas/Failed');
    Failed.active = true;
    Failed.runAction(cc.fadeIn(0.3));
  },
  setHexagonGrid() {
    this.hexes = [];
    this.boardFrameList = [];
    this.hexSide--;
    // 棋盘六角网格布局，坐标系存储方法
    for (let q = -this.hexSide; q <= this.hexSide; q++) {
      let r1 = Math.max(-this.hexSide, -q - this.hexSide);
      let r2 = Math.min(this.hexSide, -q + this.hexSide);
      for (let r = r1; r <= r2; r++) {
        let col = q + this.hexSide;
        let row = r - r1;
        if (!this.hexes[col]) {
          this.hexes[col] = [];
        }
        this.hexes[col][row] = this.hex2pixel({ q, r }, this.tileH);
      }
    }
    this.hexes.forEach(hexs => {
      this.setSpriteFrame(hexs);
    });
  },
  hex2pixel(hex, h) {
    // 棋盘六角网格，坐标系转换像素方法
    let size = h / 2;
    let x = size * Math.sqrt(3) * (hex.q + hex.r / 2);
    let y = ((size * 3) / 2) * hex.r;
    return cc.p(x, y);
  },
  setSpriteFrame(hexes) {
    for (let index = 0; index < hexes.length; index++) {
      let node = new cc.Node('frame');
      let sprite = node.addComponent(cc.Sprite);
      sprite.spriteFrame = this.tilePic;
      node.x = hexes[index].x;
      node.y = hexes[index].y;
      node.parent = this.node;
      hexes[index].spriteFrame = node;
      this.setShadowNode(node);
      this.setFillNode(node);
      // 保存当前棋盘格子的信息，用于后面落子判定及消除逻辑等。
      this.boardFrameList.push(node);
    }
  },
  setShadowNode(node) {
    const newNode = new cc.Node('frame');
    newNode.addComponent(cc.Sprite);
    newNode.name = 'shadowNode';
    newNode.opacity = 150;
    newNode.parent = node;
  },
  setFillNode(node) {
    const newNode = new cc.Node('frame');
    newNode.addComponent(cc.Sprite);
    newNode.name = 'fillNode';
    newNode.parent = node;
  }

  // update (dt) {},
});
