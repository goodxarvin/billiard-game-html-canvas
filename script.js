class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  copy() {
    return new Vector(this.x, this.y);
  }

  addTo(vector) {
    this.x += vector.x;
    this.y += vector.y;
  }

  multiplyBy(number = 1) {
    return new Vector(this.x * number, this.y * number);
  }

  length() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
}
// const background = new Image();
// background.src = "./imgs/background.jpg";

const BALL_ORIGIN = new Vector(50, 50);
const STICK_ORIGIN = new Vector(700, 39);
const SHOOT_ORIGIN = new Vector(680, 39);
const DELTA = 0.01;

const sprites = {};
let assetsStillLoading = 0;

function loadImage(fileName) {
  assetsStillLoading++;
  let sprite = new Image();
  sprite.src = `./imgs/${fileName}`;

  sprite.addEventListener("load", () => {
    assetsStillLoading--;
  });

  return sprite;
}

function loadAssets(callback) {
  sprites.background = loadImage("background.jpg");
  sprites.stick = loadImage("stick.png");
  sprites.whiteBall = loadImage("ball.png");

  assetLoadingLoop(callback);
}

function assetLoadingLoop(callback) {
  if (assetsStillLoading) {
    requestAnimationFrame(assetLoadingLoop.bind(this, callback));
  } else {
    callback(); // animate()
  }
}

/*
let v1 = new Vector(1, 1);
let v2 = new Vector(2, 2);
let v3 = v1.copy();
let v4 = v1.multiplyBy(3);
v1.addTo(v2);
console.log(v1, v2, v3, v4, v1.length());
*/

class Canvas2D {
  constructor() {
    this._canvas = document.getElementById("screen");
    this.context = this._canvas.getContext("2d");
  }

  clear() {
    this.context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  }

  drawImage(
    image = new Image(),
    position = new Vector(),
    origin = new Vector(),
    rotationAngle = 0,
    {
      imageDimention = new Vector(image.width, image.height),
      canvasDimention = new Vector(this._canvas.width, this._canvas.height),
    } = {},
  ) {
    this.context.save();
    this.context.translate(position.x, position.y);
    this.context.rotate(rotationAngle);
    this.context.drawImage(
      image,
      0,
      0,
      imageDimention.x,
      imageDimention.y,
      -origin.x,
      -origin.y,
      canvasDimention.x,
      canvasDimention.y,
    );
    this.context.restore();
  }

  drawCircleBall(
    image = new Image(),
    position = new Vector(),
    origin = new Vector(),
    imageDimention = new Vector(image.width, image.height),
    canvasDimention = new Vector(this._canvas.width, this._canvas.height),
    rotationAngle = 0,
  ) {
    const radius = 60;
    const imageX = position.x - radius;
    const imageY = position.y - radius;
    this.context.save();
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.context.closePath();
    this.context.clip();
    this.context.drawImage(image, imageX, imageY, radius * 2, radius * 2);
    this.context.beginPath();
    this.context.arc(position.x, position.y, radius, 0, Math.PI * 2);
    this.context.strokeStyle = "#000000";
    this.context.lineWidth = 20;
    this.context.stroke();
    this.context.restore();
  }
}

class GameWorld {
  constructor() {
    this.whiteBall = new Ball(new Vector(413, 413));
    this.stick = new Stick(
      new Vector(413, 413),
      this.whiteBall.shoot.bind(this.whiteBall),
    );
  }
  draw() {
    canvas.drawImage(sprites.background);
    this.whiteBall.draw();
    this.stick.draw();
  }

  update() {
    if (!this.whiteBall.isMoving) {
      this.stick.update();
    }
    this.whiteBall.update(DELTA);
    if (!this.whiteBall.isMoving && this.stick.isShot) {
      this.stick.rePosition(this.whiteBall.position);
      this.stick.isShot = false;
    }
  }
}

class ButtonState {
  constructor(down = false, pressed = false) {
    this.down = down;
    this.pressed = pressed;
  }
}

class MouseHandler {
  constructor(
    left = new ButtonState(),
    middle = new ButtonState(),
    right = new ButtonState(),
    position = new Vector(),
  ) {
    this.left = left;
    this.middle = middle;
    this.right = right;
    this.position = position;
  }

  reset() {
    this.left.pressed = false;
    this.middle.pressed = false;
    this.right.pressed = false;
  }
}

document.addEventListener("mousemove", mouseMoveHandler);
document.addEventListener("mousedown", mouseDownHandler);
document.addEventListener("mouseup", mouseUpHandler);

class Ball {
  constructor(
    position = new Vector(),
    velocity = new Vector(),
    isMoving = false,
  ) {
    this.position = position;
    this.velocity = velocity;
    this.isMoving = isMoving;
  }

  draw() {
    canvas.drawCircleBall(sprites.whiteBall, this.position, BALL_ORIGIN, 0, {
      canvasDimention: new Vector(
        sprites.whiteBall.width,
        sprites.whiteBall.height,
      ),
    });
  }

  update(delta) {
    this.position.addTo(this.velocity.multiplyBy(delta));
    this.velocity = this.velocity.multiplyBy(0.98);
    if (this.velocity.length() <= 5) {
      this.velocity = new Vector();
      this.isMoving = false;
    }
  }

  shoot(power, rotation) {
    this.velocity = new Vector(
      power * Math.cos(rotation),
      power * Math.sin(rotation),
    );
    this.isMoving = true;
  }
}

class Stick {
  constructor(position = new Vector(), onShoot, isShot = false) {
    this.position = position;
    this.rotation = 0;
    this.origin = STICK_ORIGIN.copy();
    this.power = 0;
    this.onShoot = onShoot;
    this.isShot = isShot;
  }

  draw() {
    canvas.drawImage(
      sprites.stick,
      this.position,
      this.origin,
      this.rotation,
      {
        canvasDimention: new Vector(sprites.stick.width, sprites.stick.height),
      },
      // {
      //   canvasDimention: new Vector(100, 100),
      // },
    );
  }

  update() {
    this.rotate();
    if (mouse.left.down) {
      this.increasePower();
    } else if (this.power > 0) {
      this.shoot();
    }
  }

  shoot() {
    this.onShoot(this.power, this.rotation);
    this.power = 0;
    this.origin = SHOOT_ORIGIN.copy();
    this.isShot = true;
  }

  rotate() {
    let opposite = mouse.position.y - this.position.y;
    let adjacent = mouse.position.x - this.position.x;

    this.rotation = Math.atan2(opposite, adjacent);
  }

  increasePower() {
    this.power += 100;
    this.origin.x += 5;
  }

  rePosition(position) {
    this.position = position.copy();
    this.origin = STICK_ORIGIN.copy();
  }
}

function mouseMoveHandler(e) {
  mouse.position.x = e.pageX;
  mouse.position.y = e.pageY;
}

function mouseDownHandler(e) {
  mouseMoveHandler(e);
  const left = 1;
  const middle = 2;
  const right = 3;
  if (e.which == left) {
    mouse.left.pressed = true;
    mouse.left.down = true;
  } else if (e.which == middle) {
    mouse.middle.pressed = true;
    mouse.middle.down = true;
  } else if (e.which == right) {
    mouse.right.pressed = true;
    mouse.right.down = true;
  }
}
function mouseUpHandler(e) {
  mouseMoveHandler(e);
  const left = 1;
  const middle = 2;
  const right = 3;
  if (e.which == left) {
    mouse.left.pressed = false;
    mouse.left.down = false;
  } else if (e.which == middle) {
    mouse.middle.pressed = false;
    mouse.middle.down = false;
  } else if (e.which == right) {
    mouse.right.pressed = false;
    mouse.right.down = false;
  }
}

const canvas = new Canvas2D();
const gameWorld = new GameWorld();
const mouse = new MouseHandler();

function animate() {
  canvas.clear();
  gameWorld.draw();
  gameWorld.update();
  requestAnimationFrame(animate);
}

loadAssets(animate);
