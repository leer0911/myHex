const DelRules = require('DelRules');
let theScore = 0;

cc.Class({
  extends: cc.Component,

  properties: {
    hexSide: 5,
    tileH: 110,
    tilePic: {
      default: null,
      type: cc.SpriteFrame
    }
  },

  // LIFE-CYCLE CALLBACKS:

  onLoad() {
    this.setHexagonGrid();
    this.node.on('dropSuccess', this.deleteTile, this);
  },
  start() {},
  deleteTile() {
    let fulledTilesIndex = [];
    let readyDelTiles = [];
    const boardFrameList = this.boardFrameList;

    this.addScore(this.curTileLength, true);

    for (let i = 0; i < boardFrameList.length; i++) {
      const boardFrame = boardFrameList[i];
      if (boardFrame.isFulled) {
        fulledTilesIndex.push(i);
      }
    }

    for (let i = 0; i < DelRules.length; i++) {
      const delRule = DelRules[i];
      let intersectArr = this.arrIntersect(fulledTilesIndex, delRule);
      if (intersectArr.length > 0) {
        const isReadyDel = this.checkArrIsEqual(delRule, intersectArr);
        if (isReadyDel) {
          readyDelTiles.push(delRule);
        }
      }
    }

    let count = 0;
    for (let i = 0; i < readyDelTiles.length; i++) {
      const readyDelTile = readyDelTiles[i];
      for (let j = 0; j < readyDelTile.length; j++) {
        const delTileIndex = readyDelTile[j];
        const boardFrame = this.boardFrameList[delTileIndex];
        const delNode = boardFrame.getChildByName('fillNode');
        boardFrame.isFulled = false;
        delNode.getComponent(cc.Sprite).spriteFrame = null;
      }
      count++;
    }

    this.checkLose();
    this.addScore(count);
  },
  arrIntersect(arr1, arr2) {
    const intersectArr = [];
    for (let i = 0; i < arr1.length; i++) {
      for (let j = 0; j < arr2.length; j++) {
        if (arr2[j] == arr1[i]) {
          intersectArr.push(arr2[j]);
        }
      }
    }
    return intersectArr;
  },
  checkArrIsEqual: function(arr1, arr2) {
    for (var i = 0; i < arr1.length; i++) {
      if (arr2[i] != arr1[i]) {
        return false;
      }
    }
    return true;
  },
  addScore(count, isDropAdd) {
    var addScoreCount = this.scoreRule(count, isDropAdd);
    var node = cc.find('Canvas/score');
    var label = node.getComponent(cc.Label);
    label.string = addScoreCount + Number(label.string);
    theScore = Number(label.string);
  },
  scoreRule: function(count, isDropAdd) {
    var x = count + 1;
    var addScoreCount = isDropAdd ? x : 2 * x * x; //数量的平方
    return addScoreCount;
  },
  checkLose() {},
  setHexagonGrid() {
    this.hexes = [];
    this.boardFrameList = [];
    this.hexSide--;
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
