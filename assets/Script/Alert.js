cc.Class({
  extends: cc.Component,

  properties: {},

  // LIFE-CYCLE CALLBACKS:

  // onLoad () {},

  start() {},
  enterCB() {
    cc.director.loadScene('Game');
  }

  // update (dt) {},
});
