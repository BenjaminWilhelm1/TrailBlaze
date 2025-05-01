// Global variables
let player;
let platforms;
let obstacles;
let buildings;
let birds;
let cursors;
let scoreText;
let jumpSound;
let landSound;
let gameOverSound;
let bgMusic;
let score = 0;
let highScore = localStorage.getItem('trailblazeHighScore') || 0;
let gameSpeed = 300;
let gameOver = false;
let bgColor = 0x000033;
let isPlaying = false;

// Update high score display
document.getElementById('high-score').textContent = highScore;

// Preload function for assets loading
function preload() {
    // Show loading text
    const loadingText = this.add.text(
        this.cameras.main.width / 2,
        this.cameras.main.height / 2, 
        'Loading...', 
        { 
            fontSize: '32px', 
            fill: '#0ff',
            fontFamily: 'Arial'
        }
    ).setOrigin(0.5);
    
    // Display loading progress
    this.load.on('progress', function(value) {
        loadingText.setText(`Loading: ${Math.floor(value * 100)}%`);
    });
    
    this.load.on('complete', function() {
        loadingText.destroy();
    });
    
    // Load game assets
    this.load.image('sky', 'assets/sky.png');
    this.load.image('ground', 'assets/platform.png');
    this.load.image('building', 'assets/building.png');
    this.load.image('obstacle', 'assets/obstacle.png');
    this.load.image('bird', 'assets/obstacle.png');
    
    // Create a default player shape if player image can't be loaded
    this.load.on('loaderror', function(fileObj) {
        if (fileObj.key === 'player') {
            console.log('Player image failed to load - using fallback');
            // Create a canvas with a square shape
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff00ff';
            ctx.fillRect(0, 0, 64, 64);
            
            // Add the canvas as a texture
            this.textures.addCanvas('player', canvas);
        }
    }, this);
    
    // Load player
    this.load.image('player', 'assets/player.png');
    
    // Load audio
    this.load.audio('jump', 'assets/jump.mp3');
    this.load.audio('land', 'assets/land.mp3');
    this.load.audio('gameover', 'assets/gameover.mp3');
    this.load.audio('music', 'assets/music.mp3');
}

// Create game elements
function create() {
    console.log('Create function started');
    
    // Set camera background color
    this.cameras.main.setBackgroundColor('#000033');
    
    // Set up scrolling background
    this.sky = this.add.tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, 'sky');
    this.sky.setOrigin(0, 0);
    this.sky.setTint(bgColor);
    
    // Create sound effects
    jumpSound = this.sound.add('jump');
    landSound = this.sound.add('land');
    gameOverSound = this.sound.add('gameover');
    
    // Background music
    bgMusic = this.sound.add('music', {
        volume: 0.2,
        loop: true
    });
    
    // Create scrolling ground - POSITIONED AT BOTTOM THIRD
    this.ground = this.add.tileSprite(
        0, 
        this.cameras.main.height * 0.85, // Lower position for ground - closer to bottom
        this.cameras.main.width, 
        this.cameras.main.height * 0.15, // Taller platform
        'ground'
    );
    this.ground.setOrigin(0, 0);
    
    // Set up physics for ground
    this.physics.add.existing(this.ground, true);
    this.ground.body.immovable = true;
    this.ground.body.allowGravity = false;
    
    // Create background buildings
    buildings = this.physics.add.group();
    
    // Create obstacles group
    obstacles = this.physics.add.group({
        allowGravity: false
    });
    
    // Create birds group for flying obstacles
    birds = this.physics.add.group({
        allowGravity: false
    });
    
    // Set up player - POSITIONED LOWER
    player = this.physics.add.sprite(100, this.ground.y - 50, 'player'); // Lower position
    player.setBounce(0.2);
    player.setCollideWorldBounds(true);
    player.setTint(0xff00ff);
    player.setDisplaySize(64, 64); // Smaller size
    player.body.gravity.y = 800;
    
    // LARGER COLLISION BOX - fill most of the sprite
    player.body.setSize(60, 60);
    player.body.setOffset(2, 2); // Almost centered
    
    // Debug - show physics bodies when debugging
    if (this.physics.config.debug) {
        console.log("Physics debug mode enabled");
    }
    
    // Set up collisions
    this.physics.add.collider(player, this.ground);
    
    // Define collision handler functions
    const hitObstacle = (player, obstacle) => {
        if (gameOver) return;
        
        console.log("Hit obstacle! Game over. Player:", player.x, player.y, "Obstacle:", obstacle.x, obstacle.y);
        this.physics.pause();
        gameOver = true;
        
        // Camera shake for impact
        this.cameras.main.shake(500, 0.02);
        
        player.setTint(0xff0000);
        gameOverSound.play();
        
        // Check for high score
        if (score > highScore) {
            highScore = score;
            localStorage.setItem('trailblazeHighScore', highScore);
            document.getElementById('high-score').textContent = highScore;
        }
        
        // Game over text with animation
        const gameOverText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 - 50,
            'GAME OVER',
            { fontSize: '64px', fill: '#ff0000', fontFamily: 'Arial' }
        ).setOrigin(0.5);
        
        // Make text scale up and down
        this.tweens.add({
            targets: gameOverText,
            scale: 1.2,
            duration: 700,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        const scoreText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 20,
            'Score: ' + score,
            { fontSize: '32px', fill: '#ffffff', fontFamily: 'Arial' }
        ).setOrigin(0.5);
        
        const restartText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2 + 80,
            'Press SPACE to restart',
            { fontSize: '24px', fill: '#00ffff', fontFamily: 'Arial' }
        ).setOrigin(0.5);
        
        // Flashing restart text
        this.tweens.add({
            targets: restartText,
            alpha: 0.5,
            duration: 500,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
        
        // Allow restart with spacebar
        this.input.keyboard.removeAllListeners();
        
        const spaceRestart = (event) => {
            if (event.code === 'Space') {
                console.log('Space pressed - restarting game');
                document.removeEventListener('keydown', spaceRestart);
                restartGame.call(this);
            }
        };
        
        document.addEventListener('keydown', spaceRestart);
    };
    
    // Add manual overlap checking as a backup
    this.time.addEvent({
        delay: 100, // Check every 100ms
        callback: function() {
            if (gameOver) return;
            
            // Get all obstacles
            const allObstacles = [...obstacles.getChildren(), ...birds.getChildren()];
            
            // Check each obstacle for overlap with player
            allObstacles.forEach(obstacle => {
                const playerBounds = player.getBounds();
                const obstacleBounds = obstacle.getBounds();
                
                if (Phaser.Geom.Rectangle.Overlaps(playerBounds, obstacleBounds)) {
                    // Call the hit function manually if overlap detected
                    hitObstacle(player, obstacle);
                }
            });
        },
        callbackScope: this,
        loop: true
    });
    
    // Use the local function for overlap collisions WITH AN ADDITIONAL PROCESS CALLBACK
    this.physics.add.overlap(player, obstacles, hitObstacle, null, this);
    this.physics.add.overlap(player, birds, hitObstacle, null, this);
    
    // Set up keyboard input
    cursors = this.input.keyboard.createCursorKeys();
    
    // Set up score display
    scoreText = this.add.text(16, 16, 'Score: 0', {
        fontSize: '32px',
        fill: '#00ffff',
        fontFamily: 'Arial'
    }).setScrollFactor(0);
    
    // Start spawning game elements
    this.time.addEvent({
        delay: 1500,
        callback: spawnObstacle,
        callbackScope: this,
        loop: true
    });
    
    this.time.addEvent({
        delay: 2000,
        callback: spawnBuilding,
        callbackScope: this,
        loop: true
    });
    
    // Add birds as flying obstacles
    this.time.addEvent({
        delay: 7000,
        callback: createBird,
        callbackScope: this,
        loop: true
    });
    
    // Gradually increase game speed
    this.time.addEvent({
        delay: 10000,
        callback: function() {
            if (!gameOver) {
                gameSpeed += 25;
                console.log('Game speed increased to', gameSpeed);
                
                // Visual feedback for speed increase
                const speedText = this.add.text(
                    this.cameras.main.width / 2,
                    this.cameras.main.height / 3,
                    'SPEED UP!',
                    { fontSize: '48px', fill: '#ffff00', fontFamily: 'Arial' }
                ).setOrigin(0.5);
                
                this.tweens.add({
                    targets: speedText,
                    alpha: 0,
                    y: speedText.y - 100,
                    duration: 1500,
                    ease: 'Cubic.easeOut',
                    onComplete: function() { speedText.destroy(); }
                });
            }
        },
        callbackScope: this,
        loop: true
    });
    
    // Increment score over time
    this.time.addEvent({
        delay: 1000,
        callback: function() {
            if (!gameOver) {
                updateScore(10);
            }
        },
        callbackScope: this,
        loop: true
    });
    
    // Add event listeners for UI buttons
    document.getElementById('location-btn').addEventListener('click', useGeolocation);
    document.getElementById('music-btn').addEventListener('click', toggleMusic);
    
    console.log('Game creation complete');
}

function update() {
    // Check for game over state
    if (gameOver) {
        // Check for spacebar press as a backup restart method
        if (cursors && cursors.space && cursors.space.isDown) {
            console.log('Space detected in update - restarting');
            restartGame.call(this);
        }
        return;
    }
    
    // Update scrolling backgrounds
    this.sky.tilePositionX += gameSpeed / 300;
    this.ground.tilePositionX += gameSpeed / 100;
    
    // Move buildings (background elements)
    buildings.getChildren().forEach(building => {
        building.x -= gameSpeed / 120;
        
        if (building.x < -building.width) {
            building.destroy();
        }
    });
    
    // Move obstacles
    obstacles.getChildren().forEach(obstacle => {
        obstacle.x -= gameSpeed / 60;
        
        if (obstacle.x < -obstacle.width) {
            obstacle.destroy();
        }
    });
    
    // Move birds
    birds.getChildren().forEach(bird => {
        bird.x -= (gameSpeed / 60) * 1.5; // Birds move faster
        
        if (bird.x < -bird.width) {
            bird.destroy();
        }
    });
    
    // SIMPLIFIED PLAYER CONTROLS - Just jumping and basic left/right
    if (cursors.left.isDown) {
        player.setVelocityX(-300);
    } else if (cursors.right.isDown) {
        player.setVelocityX(300);
    } else {
        // Quick stop when not pressing any direction
        player.setVelocityX(0);
    }
    
    // Simple jump - ONLY WHEN ON GROUND
    if (cursors.up.isDown && player.body.touching.down) {
        player.setVelocityY(-600); // Regular jump height
        jumpSound.play();
    }
    
    // Play land sound when landing
    if (player.body.touching.down && !player.wasOnGround) {
        landSound.play();
    }
    
    // Track if player was on ground last frame
    player.wasOnGround = player.body.touching.down;
}

// Spawn a new building in the background
function spawnBuilding() {
    if (gameOver) return;
    
    const scene = this;
    const buildingHeight = Phaser.Math.Between(100, 300);
    const building = buildings.create(scene.cameras.main.width, scene.ground.y - buildingHeight, 'building');
    
    building.displayHeight = buildingHeight;
    building.displayWidth = Phaser.Math.Between(50, 100);
    building.setOrigin(0, 1);
    building.setImmovable(true);
    building.body.allowGravity = false;
    
    // Apply tint
    building.setTint(0x9900ff);
}

// Spawn a flying bird obstacle
function createBird() {
    if (gameOver) return;
    
    const scene = this;
    
    // Position birds higher in the sky
    const birdY = Phaser.Math.Between(
        scene.cameras.main.height * 0.2,
        scene.cameras.main.height * 0.4
    );
    
    const bird = birds.create(
        scene.cameras.main.width + 50,
        birdY,
        'bird'
    );
    
    // Set bird properties
    bird.setDisplaySize(64, 64); // INCREASED SIZE
    bird.body.setSize(60, 60); // INCREASED hitbox
    bird.body.setOffset(2, 2); // Better centered hitbox
    bird.setTint(0xff6666);
    bird.setVelocityX(-gameSpeed / 40);
    
    // Add bobbing motion for flying effect
    scene.tweens.add({
        targets: bird,
        y: bird.y + 30,
        duration: 1000,
        ease: 'Sine.easeInOut',
        yoyo: true,
        repeat: -1
    });
}

// Spawn an obstacle
function spawnObstacle() {
    if (gameOver) return;
    
    const scene = this;
    const obstacleType = Phaser.Math.Between(1, 3); // Reduced variety
    
    let obstacle;
    
    if (obstacleType === 1) {
        // Ground obstacle
        obstacle = obstacles.create(scene.cameras.main.width, scene.ground.y - 30, 'obstacle');
        obstacle.setDisplaySize(64, 64); // INCREASED SIZE
        obstacle.body.setSize(60, 60); // INCREASED hitbox
        obstacle.body.setOffset(2, 2); // Better centered hitbox
        obstacle.setTint(0xff0000);
    } else if (obstacleType === 2) {
        // Jumping obstacle
        obstacle = obstacles.create(scene.cameras.main.width, scene.ground.y - 80, 'obstacle');
        obstacle.setDisplaySize(64, 64); // INCREASED SIZE
        obstacle.body.setSize(60, 60); // INCREASED hitbox
        obstacle.body.setOffset(2, 2); // Better centered hitbox
        obstacle.setTint(0xff0000);
    } else {
        // Moving obstacle
        obstacle = obstacles.create(scene.cameras.main.width, scene.ground.y - 60, 'obstacle');
        obstacle.setDisplaySize(64, 64); // INCREASED SIZE
        obstacle.body.setSize(60, 60); // INCREASED hitbox
        obstacle.body.setOffset(2, 2); // Better centered hitbox
        obstacle.setTint(0xff0000);
        
        // Add up/down movement
        scene.tweens.add({
            targets: obstacle,
            y: obstacle.y - 80,
            duration: 1000,
            ease: 'Sine.easeInOut',
            yoyo: true,
            repeat: -1
        });
    }
    
    // Set velocity for obstacles
    obstacle.body.velocity.x = -gameSpeed / 60;
    
    // Log obstacle creation for debugging
    console.log("Obstacle created at", obstacle.x, obstacle.y, "with size", obstacle.body.width, obstacle.body.height);
}

// Update score
function updateScore(points) {
    score += points;
    if (scoreText) {
        scoreText.setText('Score: ' + score);
    }
}

// Restart the game
function restartGame() {
    score = 0;
    gameSpeed = 300;
    gameOver = false;
    
    // Reset physics
    this.physics.resume();
    
    // Clear existing objects
    obstacles.clear(true, true);
    buildings.clear(true, true);
    birds.clear(true, true);
    
    // Reset player
    player.setTint(0xff00ff);
    player.setX(100);
    player.setY(this.ground.y - 50); // Reset to correct height
    
    // Restart the scene
    this.scene.restart();
}

// Use geolocation API to get real weather
function useGeolocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                console.log(`Geolocation obtained: ${lat}, ${lon}`);
                
                // Show loading message
                alert('Fetching weather data for your location...');
                
                // Use OpenWeatherMap API to get real weather data
                const apiKey = '7ec0f4d82c83a1b7d4b9ce7b625f06a3'; // Your API key from the original code
                fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}`)
                    .then(response => response.json())
                    .then(data => {
                        // Get weather condition
                        const weatherCondition = data.weather[0].main.toLowerCase();
                        let weatherEffect;
                        
                        // Map API weather to game weather
                        if (weatherCondition.includes('clear') || weatherCondition.includes('sunny')) {
                            weatherEffect = 'clear';
                        } else if (weatherCondition.includes('rain') || weatherCondition.includes('drizzle')) {
                            weatherEffect = 'rain';
                        } else if (weatherCondition.includes('fog') || weatherCondition.includes('mist') || weatherCondition.includes('haze')) {
                            weatherEffect = 'fog';
                        } else if (weatherCondition.includes('thunderstorm') || weatherCondition.includes('storm')) {
                            weatherEffect = 'storm';
                        } else if (weatherCondition.includes('cloud')) {
                            weatherEffect = 'fog'; // Use fog for cloudy weather
                        } else if (weatherCondition.includes('snow')) {
                            weatherEffect = 'rain'; // Use rain for snow (since we don't have snow effect)
                        } else {
                            // Default weather
                            weatherEffect = 'clear';
                        }
                        
                        // Get location name
                        const locationName = data.name;
                        
                        // Update game visuals
                        updateWeatherEffect(weatherEffect);
                        
                        // Show what we found
                        alert(`Current weather in ${locationName}: ${data.weather[0].description}\nGame weather set to: ${weatherEffect}`);
                    })
                    .catch(error => {
                        console.error('Weather API error:', error);
                        // Fallback to manual selection if API fails
                        const weatherChoice = prompt('Weather API failed. Choose weather manually: clear, rain, fog, or storm').toLowerCase();
                        
                        // Validate input
                        let weatherEffect;
                        if (['clear', 'rain', 'fog', 'storm'].includes(weatherChoice)) {
                            weatherEffect = weatherChoice;
                        } else {
                            weatherEffect = 'clear'; // Default
                            alert('Invalid choice. Using clear weather.');
                        }
                        
                        updateWeatherEffect(weatherEffect);
                    });
            },
            // Error callback
            (error) => {
                console.error('Geolocation error:', error);
                alert('Could not get your location. Letting you choose weather manually.');
                
                // Fallback to manual selection
                const weatherChoice = prompt('Choose weather: clear, rain, fog, or storm').toLowerCase();
                
                // Validate input
                let weatherEffect;
                if (['clear', 'rain', 'fog', 'storm'].includes(weatherChoice)) {
                    weatherEffect = weatherChoice;
                } else {
                    weatherEffect = 'clear'; // Default
                    alert('Invalid choice. Using clear weather.');
                }
                
                updateWeatherEffect(weatherEffect);
            }
        );
    } else {
        alert('Geolocation is not supported by your browser. Letting you choose weather manually.');
        
        // Fallback to manual selection
        const weatherChoice = prompt('Choose weather: clear, rain, fog, or storm').toLowerCase();
        
        // Validate input
        let weatherEffect;
        if (['clear', 'rain', 'fog', 'storm'].includes(weatherChoice)) {
            weatherEffect = weatherChoice;
        } else {
            weatherEffect = 'clear'; // Default
            alert('Invalid choice. Using clear weather.');
        }
        
        updateWeatherEffect(weatherEffect);
    }
}

// Update visual elements based on weather
function updateWeatherEffect(weatherEffect) {
    // Change background color
    if (weatherEffect === 'clear') {
        bgColor = 0x000033;
    } else if (weatherEffect === 'rain') {
        bgColor = 0x001133;
    } else if (weatherEffect === 'fog') {
        bgColor = 0x113344;
    } else if (weatherEffect === 'storm') {
        bgColor = 0x330033;
    }
    
    // Update sky tint if it exists
    if (game.scene.scenes[0].sky) {
        game.scene.scenes[0].sky.setTint(bgColor);
    }
    
    // Update existing buildings
    if (buildings) {
        buildings.getChildren().forEach(building => {
            if (weatherEffect === 'clear') {
                building.setTint(0x9900ff); // Purple for clear
            } else if (weatherEffect === 'rain') {
                building.setTint(0x0066ff); // Blue for rain
            } else if (weatherEffect === 'fog') {
                building.setTint(0x66ffff); // Cyan for fog
            } else {
                building.setTint(0xff00ff); // Pink for storm
            }
        });
    }
    
    // Create weather particles if in a scene
    const currentScene = game.scene.scenes[0];
    
    // First, clean up any existing weather effects
    if (currentScene && currentScene.rainParticles) {
        currentScene.rainParticles.destroy();
        currentScene.rainParticles = null;
    }
    
    // Create new weather effects based on current weather
    if (currentScene) {
        if (weatherEffect === 'rain') {
            // Create rain drops using simple graphics objects instead of obstacle image
            currentScene.rainParticles = currentScene.add.graphics();
            
            // Create 50 raindrops
            for (let i = 0; i < 50; i++) {
                createRaindrop(currentScene);
            }
            
            // Set up a timer to continuously add rain
            currentScene.rainTimer = currentScene.time.addEvent({
                delay: 100,
                callback: function() {
                    if (!gameOver) {
                        createRaindrop(currentScene);
                    }
                },
                callbackScope: currentScene,
                loop: true
            });
        } else if (weatherEffect === 'fog') {
            // Add fog effect (a semi-transparent overlay)
            currentScene.fogEffect = currentScene.add.rectangle(
                currentScene.cameras.main.width / 2,
                currentScene.cameras.main.height / 2,
                currentScene.cameras.main.width,
                currentScene.cameras.main.height,
                0xaaccee,
                0.2
            );
            currentScene.fogEffect.setDepth(10); // Make sure it's on top
        } else if (weatherEffect === 'storm') {
            // For storm, add occasional lightning flashes
            currentScene.stormTimer = currentScene.time.addEvent({
                delay: Phaser.Math.Between(2000, 6000), // Random timing
                callback: function() {
                    if (!gameOver) {
                        // Create flash effect
                        this.cameras.main.flash(200, 255, 255, 255, 0.8);
                    }
                },
                callbackScope: currentScene,
                loop: true
            });
        }
    }
}

// Helper function to create individual raindrops
function createRaindrop(scene) {
    // Create a raindrop as a simple line
    const x = Phaser.Math.Between(0, scene.cameras.main.width);
    const y = -10; // Start above the screen
    
    const raindrop = scene.add.line(
        0, 0,           // Object position (will be ignored as we're using absolute points)
        x, y,           // Start point
        x, y + 10,      // End point (10px long)
        0x66aaff,       // Color
        1               // Alpha
    );
    raindrop.setLineWidth(1, 1); // Thin line
    
    // Animate the raindrop falling
    scene.tweens.add({
        targets: raindrop,
        y: scene.cameras.main.height + 50, // Move past bottom of screen
        duration: Phaser.Math.Between(500, 1500), // Random speed
        onComplete: function() {
            raindrop.destroy(); // Remove when animation completes
        }
    });
}

// Toggle background music
function toggleMusic() {
    const musicBtn = document.getElementById('music-btn');
    
    if (isPlaying) {
        // Stop music
        if (bgMusic) {
            bgMusic.stop();
        }
        isPlaying = false;
        musicBtn.textContent = 'Music: OFF';
    } else {
        // Start music
        if (bgMusic) {
            bgMusic.play({
                loop: true
            });
        }
        isPlaying = true;
        musicBtn.textContent = 'Music: ON';
    }
}

// Configure the Phaser game
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false,  // Set to true to see collision boxes
            overlapBias: 10 // Add overlap bias to improve collision detection
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Initialize the game
const game = new Phaser.Game(config);