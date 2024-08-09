/*    Author: Carlos Rios
      Date: 05/19/24  

      Filename: game.js
*/

// Continously displays all of the game's elements
function Generate(){
    setInterval(() =>{
        // Creates the background for the game
        canvasWidth = window.innerWidth;
        canvasHeight = window.innerHeight;

        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Implements player prediction on the client-side and draws all ships in the players array
        for (const id in players){
            if (id == socket.id){
            players[id].update();
            }
            players[id].draw();
        }

        
        // Draws enemy objects as long as there are objects in the enemy arrays
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

        if (Object.keys(crystals).length > 0){
            for (const id in crystals){
                crystals[id].draw();
            }
        }
        
        // Draws bullet objects as long as their is an object in the bullets array
        if (Object.keys(bullets).length > 0){
            for (const id in bullets){
                bullets[id].draw();
            }
        }

        ScoreDisplay();
        LevelDisplay();
        Lives();
        highScoreDisplay();

        star();
        saveAchievements();
        setEnemies();
   
    }, 15)
}

// Creates an event listener that sets the canvas element as soon as the page loads
document.addEventListener('DOMContentLoaded', SetCanvas);

// Add additional event listeners and serves as the function that initiates the game
function SetCanvas(){
    canvas = document.getElementById("canvas");
    ctx = canvas.getContext("2d");

    window.addEventListener('resize', resizeCanvas, false);
    document.body.addEventListener('keydown', keyDown);
    document.body.addEventListener('keyup', keyUp);
    document.querySelector("#nameForm").addEventListener('submit', submit);

    // A function that attempts to reset the dimensions of the canvas as the window screen changes size
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

