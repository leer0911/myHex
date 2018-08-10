# 六边形开发教程

如果没错的话，六边形游戏的鼻祖应该是这个 [hex-frvr](http://hex.frvr.com)，原作者开发用的是 [pixi](http://www.pixijs.com/) 游戏引擎，本着快速开发的理念，本游戏采用 cocos creator，UI 延用 [hex-frvr](http://hex.frvr.com)。学习过程中，有借鉴各路实现。此源码仅供学习使用，谢谢。

## 预览

![](./doc/home.png)

## 功能介绍

六边形游戏本质是俄罗斯方块，理解这个对接下来的开发会有很大的帮助。

本游戏实现功能如下：

- [x] 六边形棋盘绘制、方块随机生成
- [x] 方块能否落入棋盘的判定
- [x] 方块消除与游戏结束的判定
- [x] 各种动画效果
- [x] 游戏计分

## cocos creator

在讲游戏开发思路前，建议先了解 cocos creator

- [文档](http://docs.cocos.com/creator/manual/zh/)
- [API](http://docs.cocos.com/creator/api/zh/)

必须了解的 API 有：

- [Game](http://docs.cocos.com/creator/api/zh/classes/Game.html)
- [Canvas](http://docs.cocos.com/creator/api/zh/classes/Canvas.html)
- [Scene](http://docs.cocos.com/creator/api/zh/classes/Scene.html)
- [Node](http://docs.cocos.com/creator/api/zh/classes/Node.html)
- [Component](http://docs.cocos.com/creator/api/zh/classes/Component.html)
- [Sprite](http://docs.cocos.com/creator/api/zh/classes/Sprite.html)
- [Texture2D](http://docs.cocos.com/creator/api/zh/classes/Texture2D.html)
- [Director](http://docs.cocos.com/creator/api/zh/classes/Director.html)
- [loader](http://docs.cocos.com/creator/api/zh/classes/loader.html)
- [Event](http://docs.cocos.com/creator/api/zh/classes/Event.html)
- [Touch](http://docs.cocos.com/creator/api/zh/classes/Touch.html)
- [Action](http://docs.cocos.com/creator/api/zh/classes/Action.html)
- [Vec2](http://docs.cocos.com/creator/api/zh/classes/Vec2.html)
- [Animation](http://docs.cocos.com/creator/api/zh/classes/Animation.html)
- [AnimationClip](http://docs.cocos.com/creator/api/zh/classes/AnimationClip.html)
- [Prefab](http://docs.cocos.com/creator/api/zh/classes/Prefab.html)
- [sys](http://docs.cocos.com/creator/api/zh/classes/sys.html)

其中，Node、Event、Vec2，是此游戏开发的重点。

## 开发思路

下面从功能逐一介绍开发思路。

## 棋盘绘制

棋盘用的是六角网格布局，电子游戏中六角网格的运用没有方形网格那样常见，先来简单了解下六角网格。

### 六角网格

本文中讨论的六角网格使用的都是正六边形。六角网格最典型的朝向有两种：水平方向( 顶点朝上 )与竖直方形( 边线朝上 )。本游戏用的是，顶点朝上的朝向。

![hex](doc/hex.png)

细心的同学会发现，图中有类似坐标系的东西，称之为轴坐标。

### 轴坐标

轴坐标系，有时也叫做“梯形坐标系”，是从立方坐标系的三个坐标中取两个建立的坐标系。由于我们有约束条件 `x + y + z = 0`，因此第三个坐标其实是多余的。轴坐标适合用于地图数据储存，也适合用于作为面向玩家的显示坐标。类似立方坐标，你也可以使用笛卡尔坐标系中的加，减，乘，除等基本运算。

有许多种立方坐标系，因此，也自然有许多种由其衍生的轴坐标系。本游戏，选用的是 `q = x` 以及 `r = z` 的情况。这里 q 代表列而 r 表示行。

![](doc/s.png)

偏移坐标是人们最先会想到的坐标系，因为它能够直接使用方形网格的笛卡尔坐标。但不幸的是，偏移坐标系中的一个轴总会显得格格不入，并且最终会把问题变得复杂化。立方坐标和轴坐标则显得相得益彰，算法也更简单明了，只是地图存储方面会略微变得复杂一点。所以，使用立方/轴坐标系是较为简单的。

### 从六角网格到像素

大致了解了什么是六角网格，接下来了解如何把六角网格转换为像素。

如果使用的轴坐标，那么可以先观察下图中示意的单位矢量。在下图中，箭头 `A→Q` 表示的是 q 轴的单位矢量而 `A→R` 是 r 轴的单位矢量。像素坐标即 `q_basis _ q + r_basis _ r`。例如，B 点位于 `(1, 1)`，等于 q 与 r 的单位矢量之和。

![](doc/a.png)

在网格为 水平 朝向时，六边形的 高度 为 `高度 = size * 2`. 相邻六边形的 竖直 距离则为 `竖直 = 高度 * 3/4`。

六边形的 宽度 为 `宽度 = sqrt(3)/2 * 高度`。相邻六边形的 水平 距离为 `水平 = 宽度`。

对于本游戏中，取棋盘中心点为，(0,0)。从已知的六角网格坐标(正六边形)以及六边形的高度，就可以得到每个正六边形的坐标。可以得到如下像素转换代码：

```js
  hex2pixel(hex, h) {
    let size = h / 2;
    let x = size * Math.sqrt(3) * (hex.q + hex.r / 2);
    let y = ((size * 3) / 2) * hex.r;
    return cc.p(x, y);
  }
```

### 网格坐标系生成

坐标系转像素问题解决了，接下来，需要获得本游戏中六角网格布局相应的坐标系。

这个问题，本质是轴坐标系统的地图存储。

![](doc/b.png)

对半径为 N 的六边形布局，当`N = max(abs(x), abs(y), abs(z)`，有 `first_column[r] == -N - min(0, r)`。最后你访问的会是 `array[r][q + N + min(0, r)]`。然而，由于我们可能会把一些 `r < 0` 的位置作为起点，因此我们也必须偏移行，有 `array[r + N][q + N + min(0, r)]`。

如本游戏中，棋盘为边界六边形个数为 5 的六角网格布局，生成的坐标系存储代码如下：

```js
  setHexagonGrid() {
    this.hexSide = 5;
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
  }
```

边界个数为 6 的六角网格布局，六边形总数为 61。接着，只需要遍历添加背景即可完成棋盘的绘制。

```js
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
  }
```

至此，棋盘绘制结束。

## 方块随机生成

方块的形状可以千变万化，先来看下本游戏事先约定的 23 种形状。

在前面六角网格的知识基础上，实现这 23 种形状并不难。只需要约定好每个形状对应的轴坐标。

![](doc/tile.png)

代码配置如下：

```js
const Tiles = [
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
```

由于没有涉及方块出现的概率，这里就简单粗暴地用 random 来实现方块随机生成。

```js
const getRandomInt = function(min, max) {
  let ratio = cc.random0To1();
  return min + Math.floor((max - min) * ratio);
};
```

网格和方块都搞定了，蛮喜欢这种简单的 UI 风格，非常适合游戏开发的入门学习。接下来处理游戏交互逻辑。

## 方块落入棋盘逻辑

方块与棋盘之间的交互关系是 Drag 与 Drop ，在 `cocos creator` 中暂时没发现有 Drag 相关的组件，目前是通过 touch 事件来模拟。在方块 `touchmove` 的过程，需要处理两件事，第一，检测拖拽过程中方块是否与棋盘有交叉，就是游戏里所谓的 `碰撞检测`，cc 有提供相应的碰撞组件，但不够灵活，因为我们要得到的是方块与棋盘重合关系(ps：并不需要完全重合)，所以还是用脚本来模拟实现，cc 为此提供了很多 API，主要都与 vec2 有关。第二，检测方块是否可以落入棋盘。

### 碰撞检测 （重合判定）

方块与棋盘其实都是由正六边形组合而成，这里有种比较简单地方式来判断两者是否有重合部分，即判断两个六边形圆心的距离，当小于设定值，则认为有重合。

这边简单起见，特意将棋盘与方块的父节点的坐标系原点设为同一个(中心点)。cocos 坐标系可参考[这篇](http://docs.cocos.com/creator/manual/zh/content-workflow/transform.html)

由于方块是相对于它的父级中心点定位，而它的父级是相对于 Canvas 定位，因此可以通过
`cc.pAdd(this.node.position, tile.position)` 来获取方块相对于棋盘原点的坐标值。接着遍历棋盘内六边形坐标值，来检查拖拽进入的六边形与棋盘哪些存在重合关系。相关代码如下：

```js
  checkCollision(event) {
    const tiles = this.node.children; // this.node 为 方块的父级，拖拽改变的是这个节点的坐标
    this.boardTiles = []; // 保存棋盘与方块重合部分。
    this.fillTiles = []; // 保存方块当前重合的部分。
    for (let i = 0; i < tiles.length; i++) {
      const tile = tiles[i];
      const pos = cc.pAdd(this.node.position, tile.position); // pAdd 是cc早期提供的 api，可用 vec2 中向量相加替换
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
```

在拖拽过程，实时保存棋盘有重合关系的六边形，用于判定方块是否可以落入棋盘

## 落子判定

只要方块的个数与棋盘所在区域可填充部分（棋盘里面没有方块）数目一致，则认为可以落子。

```js
checkCanDrop() {
    const boardTiles = this.boardTiles; // 当前棋盘与方块重合部分。
    const fillTiles = this.node.children; // 当前拖拽的方块总数
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
```

## 落子提示

得到落入与否的判定值后，需要给用户可以落子的提示。这边的一个做法是，在生成棋盘之前就给每个棋盘格子节点新建一个 name 为 `shadowNode` 的子节点。接着只需要修改符合条件的节点的`spriteFrame`为当前拖拽方块的`spriteFrame`，同时降低透明度即可。代码如下：

```js
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
  }
```

## 落入逻辑

至此，方块的 `touchmove` 事件添加完毕。接下来，需要做的是，拖拽结束后的相关逻辑处理。

两种情况，方块可以落入，与方块不能落入。前面已经获取了是否可以落入的判定。那接下来就是添加相应的处理。

可以落入的情况需要做的是在棋盘添加对应方块，方块添加结束后重新随机生成新的方块。不可以落入则让拖拽的方块返回原位置。

在添加方块上用了跟之前说到的落入提示类似的方法，给棋盘内每个格子节点下新增一个名为 `fillNode` 的节点，方块落入都跟这个节点有关。

```js
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
    this.board.checkLose();
  }
```

## 消除逻辑

棋盘有了，也可以判断方块是否可以落入棋盘。接下来要做的就是消除逻辑的处理，之前说，六边形消除游戏就是俄罗斯方块的衍生版，其实就是多了几个消除方向，来看张图：

![](doc/ab.png)

如果把这个棋盘看成数组，即从左斜方向依次添加 `[0,1,2.....]`，最终可以得到如下消除规则：

```js
const DelRules = [
  //左斜角
  [0, 1, 2, 3, 4],
  [5, 6, 7, 8, 9, 10],
  [11, 12, 13, 14, 15, 16, 17],
  [18, 19, 20, 21, 22, 23, 24, 25],
  [26, 27, 28, 29, 30, 31, 32, 33, 34],
  [35, 36, 37, 38, 39, 40, 41, 42],
  [43, 44, 45, 46, 47, 48, 49],
  [50, 51, 52, 53, 54, 55],
  [56, 57, 58, 59, 60],

  //右斜角
  [26, 35, 43, 50, 56],
  [18, 27, 36, 44, 51, 57],
  [11, 19, 28, 37, 45, 52, 58],
  [5, 12, 20, 29, 38, 46, 53, 59],
  [0, 6, 13, 21, 30, 39, 47, 54, 60],
  [1, 7, 14, 22, 31, 40, 48, 55],
  [2, 8, 15, 23, 32, 41, 49],
  [3, 9, 16, 24, 33, 42],
  [4, 10, 17, 25, 34],

  //水平
  [0, 5, 11, 18, 26],
  [1, 6, 12, 19, 27, 35],
  [2, 7, 13, 20, 28, 36, 43],
  [3, 8, 14, 21, 29, 37, 44, 50],
  [4, 9, 15, 22, 30, 38, 45, 51, 56],
  [10, 16, 23, 31, 39, 46, 52, 57],
  [17, 24, 32, 40, 47, 53, 58],
  [25, 33, 41, 48, 54, 59],
  [34, 42, 49, 55, 60]
];
```

规则有了，接着添加消除逻辑，直接看代码：

```js
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
  }
```

## 游戏结束逻辑

三个方块都无法放入棋盘，则认为游戏结束。

首先得到未填充的棋盘格子信息，再将三个方块逐一放入未填充区域判断是否可以放入。代码如下：

```js
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
  }
```

## 计分制

计分规则千变万化，看你需求。一般方块放入与消除均可加分。

```js
  scoreRule(count, isDropAdd) {
    let x = count + 1;
    let addScoreCount = isDropAdd ? x : 2 * x * x;
    return addScoreCount;
  }
```

## 致谢

项目属于入门级别，初次接触 cocos creator 游戏开发，多数参考了网上一些六边形开源游戏。在此感谢开源，项目有融入自己的一些方法，比如处理六角网格那块，但是消除规则，还需要接触更多知识后才能完善。先写这么一篇入门级的，后续再深入，希望对一些像我一样刚接触游戏开发的人能有一些帮助。

[源码](https://github.com/leer0911/myHex)

## 参考

- [hexagons](https://www.redblobgames.com/grids/hexagons/)
- [六角网格](https://indienova.com/indie-game-development/hex-grids-reference/)
- [LBXGame](https://github.com/WuBuzi/LBXGame)
