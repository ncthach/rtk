class Character {
    constructor(id, name, power, leadership, politics, charm, intelligence, loyalty, force = null) {
        // Add ID as the first parameter
        this.id = id;
        this.name = name;
        this.power = power;
        this.leadership = leadership;
        this.politics = politics;
        this.charm = charm;
        this.intelligence = intelligence;
        this.loyalty = loyalty;
        this.force = force; // null means free character
        this.task = null;
        this.taskProvince = null;
        this.hidden = force === null; // Free characters start hidden
        this.actionTaken = false; // Track if character took action this turn
        this.currentProvince = null; // Track which province they're in
        this.movementCooldown = 0; // Turns until next movement (for free characters)
        this.rewardedThisTurn = false; // Track if rewarded this turn
        
        // For hired character movement
        this.traveling = false;
        this.destination = null;
        this.turnsRemaining = 0;
    }
    
    static getAttributeAbbreviations() {
        return {
            'power': 'PWR',
            'leadership': 'LDR', 
            'politics': 'POL',
            'charm': 'CHR',
            'intelligence': 'INT',
            'loyalty': 'LOY'
        };
    }
    
    static getAttributeAbbreviation(attributeName) {
        return this.getAttributeAbbreviations()[attributeName] || attributeName.toUpperCase().substring(0, 3);
    }
    
    getTaskEffectiveness() {
        if (!this.task) return 0;
        
        switch(this.task) {
            case 'develop':
            case 'commerce':
                return this.politics;
            case 'fortify':
            case 'recruit':
                return this.leadership;
            case 'search':
                return this.charm;
            default:
                return 50;
        }
    }
    
    getLoyaltyColor() {
        if (this.loyalty < 40) return 'loyalty-low';
        if (this.loyalty < 70) return 'loyalty-medium';
        return 'loyalty-high';
    }
}

class Province {
    constructor(id, name, x, y, connections, ruler = "Independent") {
        this.id = id;
        this.name = name;
        this.x = x;
        this.y = y;
        this.connections = connections;
        this.ruler = ruler;
        
        // Province stats
        this.population = Math.floor(Math.random() * 300000) + 100000;
        this.gold = Math.floor(Math.random() * 5000) + 3000;
        this.food = Math.floor(Math.random() * 50000) + 10000;
        this.soldiers = Math.floor(Math.random() * 10000) + 1000;
        this.defense = Math.floor(Math.random() * 50) + 30;
        this.agriculture = Math.floor(Math.random() * 50) + 20;
        this.commerce = Math.floor(Math.random() * 50) + 20;
        
        // Characters in this province
        this.characters = [];
        
        // Visual properties
        this.radius = 25;
        this.selected = false;
    }
    
    drawConnections(ctx, provinces, cameraX, cameraY, scale) {
        const screenX = (this.x - cameraX) * scale + ctx.canvas.width / 2;
        const screenY = (this.y - cameraY) * scale + ctx.canvas.height / 2;
        
        ctx.strokeStyle = '#4a4030';
        ctx.lineWidth = 2 * scale;
        
        this.connections.forEach(targetId => {
            if (targetId > this.id) {
                const target = provinces.find(p => p.id === targetId);
                if (target) {
                    const targetX = (target.x - cameraX) * scale + ctx.canvas.width / 2;
                    const targetY = (target.y - cameraY) * scale + ctx.canvas.height / 2;
                    
                    const midX = (screenX + targetX) / 2;
                    const midY = (screenY + targetY) / 2;
                    
                    const dx = targetX - screenX;
                    const dy = targetY - screenY;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const offsetScale = Math.min(dist * 0.2, 30 * scale);
                    
                    const perpX = -dy / dist * offsetScale;
                    const perpY = dx / dist * offsetScale;
                    
                    const curveDir = ((this.id + targetId) % 2 === 0) ? 1 : -1;
                    const controlX = midX + perpX * curveDir;
                    const controlY = midY + perpY * curveDir;
                    
                    ctx.beginPath();
                    ctx.moveTo(screenX, screenY);
                    ctx.quadraticCurveTo(controlX, controlY, targetX, targetY);
                    ctx.stroke();
                }
            }
        });
    }
    
    draw(ctx, cameraX, cameraY, scale) {
        const screenX = (this.x - cameraX) * scale + ctx.canvas.width / 2;
        const screenY = (this.y - cameraY) * scale + ctx.canvas.height / 2;
        
        ctx.beginPath();
        ctx.arc(screenX, screenY, this.radius * scale, 0, Math.PI * 2);
        
        const rulerColors = {
            "Cao Cao": "#ff4444",
            "Liu Bei": "#44ff44",
            "Sun Jian": "#4444ff",
            "Dong Zhuo": "#ff44ff",
            "Yuan Shao": "#ffff44",
            "Independent": "#888888"
        };
        
        ctx.fillStyle = rulerColors[this.ruler] || "#888888";
        ctx.fill();
        
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2 * scale;
        ctx.stroke();
        
        if (this.selected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4 * scale;
            ctx.stroke();
        }
        
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3 * scale;
        ctx.font = `bold ${12 * scale}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        ctx.strokeText(this.name, screenX, screenY + (this.radius + 15) * scale);
        ctx.fillText(this.name, screenX, screenY + (this.radius + 15) * scale);
        
        // Draw character count (only owned characters)
        const ownedCharCount = this.characters.filter(c => c.force !== null && !c.traveling).length;
        if (ownedCharCount > 0) {
            ctx.font = `bold ${10 * scale}px Arial`;
            ctx.fillStyle = '#ffff88';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2 * scale;
            const charText = `⚔ ${ownedCharCount}`;
            ctx.strokeText(charText, screenX, screenY - (this.radius + 10) * scale);
            ctx.fillText(charText, screenX, screenY - (this.radius + 10) * scale);
        }
    }
    
    isClicked(mouseX, mouseY, cameraX, cameraY, scale, canvas) {
        const screenX = (this.x - cameraX) * scale + canvas.width / 2;
        const screenY = (this.y - cameraY) * scale + canvas.height / 2;
        const distance = Math.sqrt(
            Math.pow(mouseX - screenX, 2) + 
            Math.pow(mouseY - screenY, 2)
        );
        return distance <= this.radius * scale;
    }
}