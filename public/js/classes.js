let canvas;
let ctx;
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

class Ship {
    constructor({xpos, ypos, color, vulnerable, name}) {
        this.xpos = xpos || canvasWidth/2;
        this.ypos = ypos || canvasHeight/2;
        this.xspeed = 0;
        this.yspeed = 0;
        this.acc = .08;
        this.thrust = false;
        this.port = false;
        this.starboard = false;
        this.angle = 1.575;
        this.rotate = .06;
        this.radius = 30;
        this.color = color;
        this.vulnerable = vulnerable;
        this.score = 0;
        this.level = 0;
        this.lives = 0;
        this.counter = 0;
        this.counter2 = 0;
        this.blur = 24;
        this.opacity = 1;
        this.name = name;
    }

    // Used to determine ship's position and orientation when keys are pressed
    // Also keeps the ship on the screen when it starts to travel out of bounds
    update(){
        if (keys['d'] || keys['ArrowRight']){
            this.angle += this.rotate;
        }

        if (keys['a'] || keys['ArrowLeft']){
            this.angle -= this.rotate;
        }

        if (keys['w'] || keys['ArrowUp']){
            this.xspeed += Math.cos(this.angle) * this.acc;
            this.yspeed += Math.sin(this.angle) * this.acc;
            this.xpos -= this.xspeed;
            this.ypos -= this.yspeed;
        }

        this.xspeed = this.xspeed *.99;
        this.yspeed = this.yspeed *.99;
        this.xpos -= this.xspeed;
        this.ypos -= this.yspeed;

        if (this.radius > this.xpos){
            this.xpos = canvasWidth - this.radius;
        }

        if (this.xpos > canvasWidth){
            this.xpos = this.radius;
        }

        if (this.radius > this.ypos){
            this.ypos = canvasHeight - this.radius;
        }

        if (this.ypos > canvasHeight){
            this.ypos = this.radius;
        }

        
    }

    // Orients the ship and then draws the ship based on the given dimensions
    draw() {
        //I don't how I Magavired this but it helps create a pulsing effect when invulnerable
        if(!this.vulnerable){
            if(this.counter <= 25 & this.counter2 == 0){
                this.counter++;

                if(this.counter % 8 == 0){
                    this.blur -= 12;
                    this.opacity -= .2;
                }
                if(this.counter == 24){
                    this.counter2++;
                }
            } 

            if(this.counter2 == 1){
                this.counter--;
                if(this.counter % 8 == 0){
                    this.blur += 12;
                    this.opacity += .2;
                }
                    if(this.counter == 0){
                        this.counter2--;
                    }
            }
        } else if(this.vulnerable){
            this.blur = 24;
            this.opacity = 1;
        }

        //Gave up trying to add conditions to the above conditional statements. Added this to account for negative numbers.
        //If problems persist or cause additional difficulties I will have to remove the line here.
        if (this.blur < 0){
            this.blur = 0;
        }


        ctx.save();

        ctx.translate(this.xpos, this.ypos);
        ctx.rotate(this.angle - 1.575);
        ctx.translate(-this.xpos, -this.ypos);

        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.font = "bold 20px Arial";
        ctx.fillText(this.name, this.xpos, this.ypos + 62)

        ctx.restore();
        ctx.save();

        ctx.translate(this.xpos, this.ypos);
        ctx.rotate(this.angle);
        ctx.translate(-this.xpos, -this.ypos);
        ctx.globalAlpha = this.opacity;
        ctx.shadowBlur = this.blur;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(this.xpos - 15, this.ypos - 4);
        ctx.lineTo(this.xpos + 40, this.ypos - 20);
        ctx.lineTo(this.xpos + 40, this.ypos + 12);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();
    }
}

class Bullet {
    constructor({xpos, ypos, width, height, color}) {
        this.angle;
        // Combines the ship's angle and coordinates to place the bullet
        this.xpos = xpos;
        this.ypos = ypos;
        this.speed = 2;
        this.width = width;
        this.height = height;
        this.radius = 8;
        this.timer = 0;
        this.color = color;
        this.player;
    }

    // Updates the bullet's position and establishes a bullet's 'life span'
    update(){
    }

    // Draws the bullet
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.xpos, this.ypos, this.width, this.height);
    }
}

class Asteroid {
    constructor({width, height, radius, xpos, ypos,}) {
        // Places the asteroid in a random location or is given coordinates
        this.xpos = xpos || Math.floor(Math.random() * canvasWidth);
        this.ypos = ypos || Math.floor(Math.random() * canvasHeight);
        // Gives the asteroid a random orientation
        this.angle = Math.random()*Math.PI*2;
        this.xspeed = Math.cos(this.angle) * 2;
        this.yspeed = Math.sin(this.angle) * 2;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.color = `#663300`;
        this.remove = false;
    }

    // Updates the asteroid's position and keeps the asteroid on the screen
    update(){
        this.xpos -= this.xspeed;
        this.ypos -= this.yspeed;

        if (this.radius > this.xpos){
            this.xpos = canvasWidth - this.radius;
        }

        if (this.xpos > canvasWidth){
            this.xpos = this.radius;
        }

        if (this.radius > this.ypos){
            this.ypos = canvasHeight - this.radius;
        }

        if (this.ypos > canvasHeight){
            this.ypos = this.radius;
        }
    }

    // Draws the asteroid
    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.xpos, this.ypos, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}

class Rock {
    constructor({width, height, radius, xpos, ypos, color}) {
        // Places the asteroid in a random location or is given coordinates
        this.xpos = xpos || Math.floor(Math.random() * canvasWidth);
        this.ypos = ypos || Math.floor(Math.random() * canvasHeight);
        // Gives the asteroid a random orientation
        this.angle = Math.random()*Math.PI*2;
        this.xspeed = Math.cos(this.angle) * 2;
        this.yspeed = Math.sin(this.angle) * 2;
        this.width = width;
        this.height = height;
        this.radius = radius;
        this.color = color;
        this.remove = false;
    }

    // Updates the asteroid's position and keeps the asteroid on the screen
    update(){
        this.xpos -= this.xspeed;
        this.ypos -= this.yspeed;

        if (this.radius > this.xpos){
            this.xpos = canvasWidth - this.radius;
        }

        if (this.xpos > canvasWidth){
            this.xpos = this.radius;
        }

        if (this.radius > this.ypos){
            this.ypos = canvasHeight - this.radius;
        }

        if (this.ypos > canvasHeight){
            this.ypos = this.radius;
        }
    }

    // Draws the asteroid
    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.xpos, this.ypos, this.radius, 0, 2 * Math.PI);
        ctx.stroke();
    }
}