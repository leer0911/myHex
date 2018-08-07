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
  },
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
    }
  },
  setShadowNode(node) {
    const newNode = new cc.Node('frame');
    newNode.addComponent(cc.Sprite)
    newNode.name = 'shadowNode';
    newNode.opacity = 150;
    newNode.parent = node;
    this.boardFrameList.push(node);
  },
  start() {}

  // update (dt) {},
});
