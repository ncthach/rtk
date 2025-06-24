// Main initialization and event handlers
function initializeGame() {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Add canvas event listeners here, after canvas is initialized
    canvas.addEventListener('mousedown', (e) => {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        let clickedProvince = null;
        for (const province of provinces) {
            if (province.isClicked(mouseX, mouseY, camera.x, camera.y, camera.scale, canvas)) {
                clickedProvince = province;
                break;
            }
        }
        
        if (clickedProvince) {
            if (selectedProvince) {
                selectedProvince.selected = false;
            }
            selectedProvince = clickedProvince;
            selectedProvince.selected = true;
            updateProvinceInfo(selectedProvince);
        } else {
            isDragging = true;
            dragStartX = mouseX;
            dragStartY = mouseY;
            cameraStartX = camera.x;
            cameraStartY = camera.y;
        }
    });

    canvas.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;
            
            camera.x = cameraStartX - (mouseX - dragStartX) / camera.scale;
            camera.y = cameraStartY - (mouseY - dragStartY) / camera.scale;
        }
    });

    canvas.addEventListener('mouseup', () => {
        isDragging = false;
    });

    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomSpeed = 0.1;
        
        if (e.deltaY < 0) {
            camera.targetScale = Math.min(camera.targetScale + zoomSpeed, 2);
        } else {
            camera.targetScale = Math.max(camera.targetScale - zoomSpeed, 0.5);
        }
    });
    
    computeProvinceDistances();
    assignStartingCharacters();
    updateAdvisorDisplay();
    
    // Start with Yanzhou selected
    selectedProvince = provinces[6];
    selectedProvince.selected = true;
    updateProvinceInfo(selectedProvince);
    
    // Start game loop
    gameLoop();
}

function resizeCanvas() {
    const container = document.getElementById('mapContainer');
    canvas.width = container.clientWidth - 40;
    canvas.height = container.clientHeight - 40;
}

function computeProvinceDistances() {
    const n = provinces.length;
    const INF = 999999;
    
    provinceDistances = Array(n).fill(null).map(() => Array(n).fill(INF));
    
    for (let i = 0; i < n; i++) {
        provinceDistances[i][i] = 0;
    }
    
    provinces.forEach((province, i) => {
        province.connections.forEach(connId => {
            const j = provinces.findIndex(p => p.id === connId);
            if (j !== -1) {
                provinceDistances[i][j] = 1;
            }
        });
    });
    
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (provinceDistances[i][k] + provinceDistances[k][j] < provinceDistances[i][j]) {
                    provinceDistances[i][j] = provinceDistances[i][k] + provinceDistances[k][j];
                }
            }
        }
    }
}

function assignStartingCharacters() {
    // Cao Cao's forces
    provinces[6].characters.push(characters[0], characters[1], characters[4]); // Yanzhou
    characters[0].currentProvince = provinces[6];
    characters[1].currentProvince = provinces[6];
    characters[4].currentProvince = provinces[6];
    
    provinces[8].characters.push(characters[2], characters[3], characters[5]); // Yuzhou
    characters[2].currentProvince = provinces[8];
    characters[3].currentProvince = provinces[8];
    characters[5].currentProvince = provinces[8];
    
    // Set Xun Yu as initial advisor
    advisor = characters[4];
    
    // Liu Bei's characters
    provinces[9].characters.push(characters[6], characters[7], characters[8]); // Jingzhou
    characters[6].currentProvince = provinces[9];
    characters[7].currentProvince = provinces[9];
    characters[8].currentProvince = provinces[9];
    
    provinces[16].characters.push(characters[9]); // Jiangxia
    characters[9].currentProvince = provinces[16];
    
    // Sun Jian's characters
    provinces[10].characters.push(characters[10], characters[11]); // Yangzhou
    characters[10].currentProvince = provinces[10];
    characters[11].currentProvince = provinces[10];
    
    provinces[11].characters.push(characters[12], characters[13]); // Jianye
    characters[12].currentProvince = provinces[11];
    characters[13].currentProvince = provinces[11];
    
    // Dong Zhuo's characters
    provinces[5].characters.push(characters[14], characters[15]); // Yongzhou
    characters[14].currentProvince = provinces[5];
    characters[15].currentProvince = provinces[5];
    
    provinces[7].characters.push(characters[16]); // Luoyang
    characters[16].currentProvince = provinces[7];
    
    // Yuan Shao's characters
    provinces[0].characters.push(characters[17]); // Youzhou
    characters[17].currentProvince = provinces[0];
    
    provinces[1].characters.push(characters[18], characters[19]); // Jizhou
    characters[18].currentProvince = provinces[1];
    characters[19].currentProvince = provinces[1];
    
    // Randomly place free characters
    const freeCharacters = characters.filter(c => c.force === null);
    freeCharacters.forEach(char => {
        const randomProvince = provinces[Math.floor(Math.random() * provinces.length)];
        randomProvince.characters.push(char);
        char.currentProvince = randomProvince;
        char.movementCooldown = Math.floor(Math.random() * 3) + 1;
    });

    console.log("Free Characters at Start:");
    characters.filter(c => c.force === null).forEach(char => {
        console.log(`${char.name} in ${char.currentProvince.name}`);
    });
}

// Mouse controls
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let cameraStartX = 0;
let cameraStartY = 0;

// Make functions global
window.switchTab = switchTab;
window.sortCharacters = sortCharacters;
window.closeTurnSummary = closeTurnSummary;

// Initialize game when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeGame);
} else {
    initializeGame();
}