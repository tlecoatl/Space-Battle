let canvas;
let ctx;
let canvasWidth = window.innerWidth;
let canvasHeight = window.innerHeight;

// Serves as the player avatar and stores information necessary for the game
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
        // In conjunction with the blur property, creates a strobing effect that indicates invulnerability by 
        //changing the values for the ship's opacity and shadow.
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

        //Added this to account for negative numbers.
        if (this.blur < 0){
            this.blur = 0;
        }


        ctx.save();

        // Orients the ship into the appropriate position
        ctx.translate(this.xpos, this.ypos);
        ctx.rotate(this.angle - 1.575);
        ctx.translate(-this.xpos, -this.ypos);

        // Adds the player's color and the player's name to the ship
        ctx.fillStyle = this.color;
        ctx.textAlign = 'center';
        ctx.font = "bold 20px Arial";
        ctx.fillText(this.name, this.xpos, this.ypos + 62)

        ctx.restore();
        ctx.save();

        // Draws the ship with its new coordinates and orientation. Also includes properties to create strobing
        // effect.
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

// The projectile object fired by the player. Also keeps track of which player fired it
class Bullet {
    constructor({xpos, ypos, width, height, color}) {
        this.angle;
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

    // Draws the bullet object
    draw() {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.xpos, this.ypos, this.width, this.height);
    }
}

// The primary enemy object that includes important information for spawing the object on the canvas element
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

    // Updates the asteroid's position and keeps the asteroid on the screen. Not currently in use.
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

    // Draws the asteroid object
    draw() {
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(this.xpos, this.ypos, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = "brown";
        ctx.fill();
        ctx.stroke();
    }
}

// Draws the secondary enemy, the rock object
class Rock {
    constructor({radius, xpos, ypos, length}) {
        // Places the rock in a random location or is given coordinates
        this.xpos = xpos || Math.floor(Math.random() * canvasWidth);
        this.ypos = ypos || Math.floor(Math.random() * canvasHeight);
        this.radius = radius;
        this.length = length;
        this.colors = ['#E3170D','#9D1309','#F22C1E']
    }

    // Draws the rock
    draw() {
        ctx.save();

        // Orients the rock into the appropriate position
        ctx.translate(this.xpos, this.ypos);
        ctx.rotate(.785);
        ctx.translate(-this.xpos, -this.ypos);

        ctx.fillStyle=this.colors[0];
        ctx.beginPath();
        ctx.moveTo(this.xpos,this.ypos);
        ctx.lineTo(this.xpos+this.length/2,this.ypos+0.7*this.length);
        ctx.lineTo(this.xpos+this.length/2,this.ypos);
        ctx.fill();
        
        ctx.fillStyle=this.colors[1];
        ctx.beginPath();
        ctx.moveTo(this.xpos+this.length/2, this.ypos);
        ctx.lineTo(this.xpos+this.length/2,this.ypos+0.7*this.length);
        ctx.lineTo(this.xpos+this.length,this.ypos);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(this.xpos+this.length/4,this.ypos-0.3*this.length);
        ctx.lineTo(this.xpos,this.ypos);
        ctx.lineTo(this.xpos+this.length/2,this.ypos);
        ctx.fill();
        
        ctx.fillStyle=this.colors[2];
        ctx.beginPath();
        ctx.moveTo(this.xpos+this.length/4,this.ypos-0.3*this.length);
        ctx.lineTo(this.xpos+this.length/2,this.ypos);
        ctx.lineTo(this.xpos+0.75*this.length,this.ypos-0.3*this.length);
        ctx.fill();
        
        ctx.fillStyle=this.colors[0];
        ctx.beginPath();
        ctx.moveTo(this.xpos+0.75*this.length,this.ypos-0.3*this.length);
        ctx.lineTo(this.xpos+this.length/2,this.ypos);
        ctx.lineTo(this.xpos+this.length,this.ypos);
        ctx.fill();

        ctx.restore();
    }
}

// Draws the secondary enemy, the crystal object
class Crystal {
    constructor({radius, xpos, ypos, length, angle}) {
        // Places the crystal in a random location or is given coordinates
        this.xpos = xpos || Math.floor(Math.random() * canvasWidth);
        this.ypos = ypos || Math.floor(Math.random() * canvasHeight);
        this.radius = radius;
        this.length = length;
        this.angle = angle;
        this.radian = 0;
    }

    // Draws the crystal
    draw() {
        this.radian += this.angle;

        ctx.save();
        ctx.translate(this.xpos, this.ypos);
        ctx.rotate(this.radian);
        ctx.translate(-this.xpos, -this.ypos);

        ctx.fillStyle='cyan';
        ctx.beginPath();
        ctx.moveTo(this.xpos,this.ypos-this.length);
        ctx.lineTo(this.xpos-this.length,this.ypos);
        ctx.lineTo(this.xpos,this.ypos);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle='blue';
        ctx.beginPath();
        ctx.moveTo(this.xpos,this.ypos+this.length);
        ctx.lineTo(this.xpos-this.length,this.ypos);
        ctx.lineTo(this.xpos,this.ypos);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle='blue';
        ctx.beginPath();
        ctx.moveTo(this.xpos,this.ypos-this.length);
        ctx.lineTo(this.xpos+this.length,this.ypos);
        ctx.lineTo(this.xpos,this.ypos);
        ctx.fill();
        ctx.closePath();
        
        ctx.fillStyle='cyan';
        ctx.beginPath();
        ctx.moveTo(this.xpos,this.ypos+this.length);
        ctx.lineTo(this.xpos+this.length,this.ypos);
        ctx.lineTo(this.xpos,this.ypos);
        ctx.fill();
        ctx.closePath();

        ctx.restore();


    }
}