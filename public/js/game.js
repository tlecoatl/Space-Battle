/*    Author: Carlos Rios
      Date: 05/19/24  

      Filename: game.js
*/
//function createShip(){
    //ships.push(new Ship());
//}

// Hosts the game logic and continously displays all of the game's elements
function Generate(){
    setInterval(() =>{
        // Creates the background for the game
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draws ship objects as long as there is an object in the ships array
        //Added. Currently work with the if condition. Previously was shaking the other ship
        for (const id in players){
            if (id == socket.id){
            players[id].update();
            }
            players[id].draw();
        }

        
        // Draws asteroid objects as long as there is an object in the asteroids
        // array
        if (Object.keys(asteroids).length > 0){
            for (const id in asteroids){
                asteroids[id].draw();
            }
        }

        if (Object.keys(rocks).length > 0){
            for (const id in rocks){
                rocks[id].draw();
            }
        }

        // Adds a bullet to the bullets array when ' ' is pushed and at a set rate
        //if (keys[' ']){
            //rate += 1;
            //if (rate % 10 == 0)
                //bullets.push(new Bullet(Object.values(players)[0].angle)); 
        //}

        
        // Draws bullet objects as long as their is an object in the bullets array
        if (Object.keys(bullets).length > 0){
            for (const id in bullets){
                bullets[id].draw();
            }
        }

        /*
        // Will test for ship-asteroid collisions as long as there is asteroid
        // objects
        if (asteroids.length != 0) {
            // Collisions will only occur if the ship is vulnerable
            if (ships[0].vulnerable){
                for(let a = 0; a < asteroids.length; a++){
                    // Resets ship to original position upon collision
                    if(Collision(ships[0].xpos, ships[0].ypos, ships[0].radius, 
                        asteroids[a].xpos, asteroids[a].ypos, asteroids[a].radius)){
                            ships[0].xpos = canvasWidth/2;
                            ships[0].ypos = canvasHeight/2;
                            ships[0].xspeed = 0;
                            ships[0].yspeed = 0;
                            lives[0] -= 1;
                    }
                }
            }
        }

        // Will test for bullet-asteroid collisions while there are bullet and 
        // asteroid objects
        if (asteroids.length != 0 && bullets.length != 0) {
            for (let a = 0; a < asteroids.length; a++){
                for(let b = 0; b < bullets.length; b++){
                    // Upon collision adjusts the dimensions of the asteroid and
                    // marks the bullet object for removal
                    if(Collision(asteroids[a].xpos, asteroids[a].ypos, asteroids[a].radius, 
                        bullets[b].xpos, bullets[b].ypos, bullets[b].radius)){
                        asteroids[a].radius -= 5;
                        bullets[b].remove = true;
                        // Adds two new asteroid objects after a certain size, 
                        // adds to score, and marks previous asteroid for removal.
                        if(asteroids[a].radius == 45){
                            asteroids.push(new Asteroid(35,35,35, asteroids[a].xpos, asteroids[a].ypos));
                            asteroids.push(new Asteroid(35,35,35, asteroids[a].xpos, asteroids[a].ypos));
                            score += 40;
                            asteroids[a].remove = true;
                        }
                        // Adds to score and marks asteroid for removal
                        else if (asteroids[a].radius == 25){
                            score += 20;
                            asteroids[a].remove = true;
                        }
                    }
                }
            }
        }

        // Removes asteroids that have been marked for removal
        for (let a = 0; a < asteroids.length; a++){
            if (asteroids[a].remove){
                asteroids.splice(a,1);
            }
        }

        // Removes bullets that have been marked for removal
        for (let b = 0; b < bullets.length; b++){
            if (bullets[b].remove){
                bullets.splice(b,1);
            }
        }

        // Adjusts level and adds more asteroids
        if (asteroids.length == 0){
            level += 1;
            let multi = 2 * level;
            for (let b = 0; b < multi; b++){
                asteroids.push(new Asteroid(55,55,55));
            }
        }

        saveHighScore(score);

        console.log('The high score is: ', highScore);

        // Displays all relevant information
        
        highScoreDisplay();

        */
        ScoreDisplay();
        LevelDisplay();
        Lives();
        highScoreDisplay();

        star();
   
    }, 15)
}


document.addEventListener('DOMContentLoaded', SetCanvas);

// Sets canvas, player ship, and event listeners
function SetCanvas(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    window.addEventListener('resize', resizeCanvas, false);
    document.body.addEventListener('keydown', keyDown);
    document.body.addEventListener('keyup', keyUp);
    document.querySelector("#nameForm").addEventListener('submit', submit);

    function resizeCanvas(){
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        star();

        Generate();
    }

    resizeCanvas();

}

