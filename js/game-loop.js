// Game rendering and main loop
function gameLoop() {
    ctx.fillStyle = '#2a2416';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    camera.scale += (camera.targetScale - camera.scale) * 0.1;
    
    // Draw grid
    ctx.strokeStyle = '#3a3426';
    ctx.lineWidth = 1;
    const gridSize = 50;
    
    for (let x = -1000; x < 1000; x += gridSize) {
        const screenX = (x - camera.x) * camera.scale + canvas.width / 2;
        ctx.beginPath();
        ctx.moveTo(screenX, 0);
        ctx.lineTo(screenX, canvas.height);
        ctx.stroke();
    }
    
    for (let y = -1000; y < 1000; y += gridSize) {
        const screenY = (y - camera.y) * camera.scale + canvas.height / 2;
        ctx.beginPath();
        ctx.moveTo(0, screenY);
        ctx.lineTo(canvas.width, screenY);
        ctx.stroke();
    }
    
    // Draw province connections
    provinces.forEach(province => {
        province.drawConnections(ctx, provinces, camera.x, camera.y, camera.scale);
    });
    
    // Draw provinces
    provinces.forEach(province => {
        province.draw(ctx, camera.x, camera.y, camera.scale);
    });
    
    requestAnimationFrame(gameLoop);
}