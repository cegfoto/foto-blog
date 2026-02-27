// Elementos das linhas
const lineLeft = document.getElementById('line-left');
const lineRight = document.getElementById('line-right');
const ball = document.getElementById('ball');
const gameOverOverlay = document.getElementById('gameOverOverlay');
const startButton = document.getElementById('startButton');
const speedValue = document.getElementById('speedValue');
const bounceCount = document.getElementById('bounceCount');
const gameContainer = document.getElementById('gameContainer');

// Estado do jogo
let gameRunning = true;
let lineCollisionCount = 0;

// Valores de referência (para escala a partir do layout original)
const REF_WIDTH = 800;
const REF_HEIGHT = 600;
const REF_LINE_HEIGHT = 80;
const REF_LINE_WIDTH = 10;
const REF_LINE_OFFSET = 10; // distância das linhas às bordas no layout original
const REF_BALL_RADIUS = 10;
const moveDistance = 10;

// Posição da linha como proporção da altura do container
let linePositionRatio = 260 / REF_HEIGHT; // posição inicial relativa

// Dimensões atuais (serão atualizadas em runtime)
let containerWidth, containerHeight, lineHeight, lineWidth, ballRadius, lineLeftX, lineRightX, scale;

// Posição da bola em coordenadas do container (centro)
let ballX, ballY;

// Função para mover as linhas
function moveLines(direction) {
    updateDimensions();
    let newPosition = linePositionRatio * containerHeight;
    if (direction === 'up') newPosition -= moveDistance;
    else if (direction === 'down') newPosition += moveDistance;

    // Verificar limites
    if (newPosition < 0) newPosition = 0;
    if (newPosition > containerHeight - lineHeight) newPosition = containerHeight - lineHeight;

    linePositionRatio = newPosition / containerHeight;
    const absolutePos = newPosition;
    lineLeft.style.top = absolutePos + 'px';
    lineRight.style.top = absolutePos + 'px';
}

// Event listener para as teclas
document.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowUp') {
        moveLines('up');
        event.preventDefault();
    } else if (event.key === 'ArrowDown') {
        moveLines('down');
        event.preventDefault();
    }
});

// Event listener para o movimento do mouse
document.addEventListener('mousemove', (event) => {
    updateDimensions();
    const rect = gameContainer.getBoundingClientRect();
    const mouseY = event.clientY - rect.top;
    let newPosition = mouseY - lineHeight / 2;
    if (newPosition < 0) newPosition = 0;
    if (newPosition > containerHeight - lineHeight) newPosition = containerHeight - lineHeight;
    linePositionRatio = newPosition / containerHeight;
    lineLeft.style.top = newPosition + 'px';
    lineRight.style.top = newPosition + 'px';
});

// Elementos e configurações iniciais
let ballSpeed = 150; // px por segundo (variável para aumentar com colisões)

// Atualiza dimensões e estilos escalados conforme o tamanho do container
function updateDimensions() {
    const rect = gameContainer.getBoundingClientRect();
    containerWidth = rect.width;
    containerHeight = rect.height;
    scale = containerWidth / REF_WIDTH;
    lineHeight = REF_LINE_HEIGHT * scale;
    lineWidth = REF_LINE_WIDTH * scale;
    ballRadius = REF_BALL_RADIUS * scale;
    const offset = REF_LINE_OFFSET * scale;
    lineLeftX = offset;
    lineRightX = containerWidth - offset - lineWidth;

    // Aplicar estilos escalados
    lineLeft.style.width = lineWidth + 'px';
    lineLeft.style.height = lineHeight + 'px';
    lineLeft.style.left = offset + 'px';

    lineRight.style.width = lineWidth + 'px';
    lineRight.style.height = lineHeight + 'px';
    lineRight.style.right = offset + 'px';

    ball.style.width = (ballRadius * 2) + 'px';
    ball.style.height = (ballRadius * 2) + 'px';
    ball.style.borderRadius = (ballRadius) + 'px';

    // Atualizar posição da linha com base na proporção armazenada
    const absoluteLinePos = Math.max(0, Math.min(containerHeight - lineHeight, linePositionRatio * containerHeight));
    lineLeft.style.top = absoluteLinePos + 'px';
    lineRight.style.top = absoluteLinePos + 'px';

    // Se ballX/Y não inicializados, colocá-los no centro
    if (typeof ballX === 'undefined' || typeof ballY === 'undefined') {
        ballX = containerWidth / 2;
        ballY = containerHeight / 2;
    }
}

// Posição inicial (será ajustada por updateDimensions)
updateDimensions();

// Velocidade da bola
let ballVelocityX = 0;
let ballVelocityY = 0;

// Função para gerar direção aleatória com velocidade de 10px/s
function initializeBallDirection() {
    const angle = Math.random() * 2 * Math.PI;
    ballVelocityX = Math.cos(angle) * ballSpeed;
    ballVelocityY = Math.sin(angle) * ballSpeed;
}

// Função para aumentar a velocidade mantendo a direção
function increaseSpeed(increment) {
    const currentSpeed = Math.sqrt(ballVelocityX ** 2 + ballVelocityY ** 2);
    const newSpeed = currentSpeed + increment;
    
    // Se a velocidade atual é zero, evitar divisão por zero
    if (currentSpeed === 0) {
        ballSpeed += increment;
        return;
    }
    
    // Manter a proporção da velocidade em X e Y
    const ratio = newSpeed / currentSpeed;
    ballVelocityX *= ratio;
    ballVelocityY *= ratio;
    ballSpeed = newSpeed;
}

// Função para atualizar posição da bola
function updateBall(deltaTime) {
    updateDimensions();
    // Atualizar posição
    ballX += ballVelocityX * (deltaTime / 1000);
    ballY += ballVelocityY * (deltaTime / 1000);
    
    // Verificar game over (bola saiu dos limites verticais)
    if (ballX - ballRadius < 0 || ballX + ballRadius > containerWidth) {
        endGame();
        return;
    }
    
    // Verificar colisão com bordas (y)
    if (ballY - ballRadius <= 0) {
        ballY = ballRadius;
        ballVelocityY = Math.abs(ballVelocityY);
        increaseSpeed(10); // Aumenta 10px quando bate na parede superior
    } else if (ballY + ballRadius >= containerHeight) {
        ballY = containerHeight - ballRadius;
        ballVelocityY = -Math.abs(ballVelocityY);
        increaseSpeed(10); // Aumenta 10px quando bate na parede inferior
    }
    
    // Verificar colisão com as linhas verticais
    checkLineCollision();

    // Atualizar posição na tela (centrando pelo raio)
    ball.style.left = (ballX - ballRadius) + 'px';
    ball.style.top = (ballY - ballRadius) + 'px';
    
    // Atualizar velocidade na tela
    speedValue.textContent = Math.round(ballSpeed);
}

// Função para gerar ângulo aleatório de rebatimento
function setRandomBounceAngle(direction) {
    // direction: 'left' ou 'right' indicando a direção da parede
    // Ângulo aleatório entre 1 e 189 graus
    const randomAngle = 1 + Math.random() * 188;
    
    let angle;
    if (direction === 'right') {
        // Linha direita: ângulo entre 1-189° (apontando para esquerda)
        angle = randomAngle;
    } else {
        // Linha esquerda: ângulo entre 1-189° + 180° (apontando para direita)
        angle = randomAngle + 180;
    }
    
    // Converter para radianos
    const angleInRadians = (angle * Math.PI) / 180;
    
    // Aplicar nova velocidade mantendo a velocidade atual
    ballVelocityX = Math.cos(angleInRadians) * ballSpeed;
    ballVelocityY = Math.sin(angleInRadians) * ballSpeed;
}

// Função para verificar colisão com as linhas
function checkLineCollision() {
    const ballTop = ballY - ballRadius;
    const ballBottom = ballY + ballRadius;
    const ballLeft = ballX - ballRadius;
    const ballRight = ballX + ballRadius;
    const linePosition = linePositionRatio * containerHeight;
    
    // Colisão com linha esquerda
    if (ballLeft < lineLeftX + lineWidth && ballRight > lineLeftX &&
        ballTop < linePosition + lineHeight && ballBottom > linePosition) {
        // posiciona a bola logo à direita da linha esquerda
        ballX = lineLeftX + lineWidth + ballRadius;
        setRandomBounceAngle('left'); // Ângulo aleatório para rebater para direita
        increaseSpeed(25); // Aumenta 5px quando bate na linha vertical
        lineCollisionCount++;
        bounceCount.textContent = lineCollisionCount;
    }
    
    // Colisão com linha direita
    if (ballLeft < lineRightX + lineWidth && ballRight > lineRightX &&
        ballTop < linePosition + lineHeight && ballBottom > linePosition) {
        // posiciona a bola logo à esquerda da linha direita
        ballX = lineRightX - ballRadius;
        setRandomBounceAngle('right'); // Ângulo aleatório para rebater para esquerda
        increaseSpeed(25); // Aumenta 5px quando bate na linha vertical
        lineCollisionCount++;
        bounceCount.textContent = lineCollisionCount;
    }
}

// Função para encerrar o jogo
function endGame() {
    gameRunning = false;
    ball.style.display = 'none';
    gameOverOverlay.classList.add('show');
}

// Animation loop
let lastTime = Date.now();
function gameLoop() {
    if (!gameRunning) return;
    
    const currentTime = Date.now();
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    updateBall(deltaTime);
    requestAnimationFrame(gameLoop);
}

// Event listener para o botão Start
startButton.addEventListener('click', () => {
    location.reload();
});

// Inicializar bola e começar o loop
initializeBallDirection();
gameLoop();
