// UI update functions
function updateAdvisorDisplay() {
    const advisorName = advisor ? advisor.name : "None";
    const advisorLabel = document.getElementById('advisorName');
    advisorLabel.textContent = advisorName;
    
    // Make the advisor label clickable
    advisorLabel.style.cursor = 'pointer';
    advisorLabel.onclick = () => openAdvisorDialog();
    
    // Remove any existing change advisor button
    const existingBtn = document.querySelector('.change-advisor-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
}

function updateTurnDisplay() {
    document.getElementById('turnDisplay').textContent = 
        `Year ${currentTurn.year} - ${currentTurn.season}`;
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase().includes(tabName)) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    if (tabName === 'overview') {
        document.getElementById('overviewTab').classList.add('active');
        document.getElementById('charactersTab').classList.remove('active');
    } else {
        document.getElementById('overviewTab').classList.remove('active');
        document.getElementById('charactersTab').classList.add('active');
    }
}

function updateProvinceInfo(province) {
    document.getElementById('provinceInfo').style.display = 'block';
    document.getElementById('provinceName').textContent = province.name;
    document.getElementById('provinceRuler').textContent = province.ruler;
    document.getElementById('provincePopulation').textContent = province.population.toLocaleString();
    document.getElementById('provinceGold').textContent = province.gold.toLocaleString();
    document.getElementById('provinceFood').textContent = province.food.toLocaleString();
    document.getElementById('provinceSoldiers').textContent = province.soldiers.toLocaleString();
    document.getElementById('provinceDefense').textContent = province.defense + '%';
    document.getElementById('provinceDevelopment').textContent = province.development + '%';
    document.getElementById('provinceCommerce').textContent = province.commerce + '%';
    
    updateTasksList(province);
    updateCharactersList(province);
}

function updateTasksList(province) {
    const tasksList = document.getElementById('tasksList');
    tasksList.innerHTML = '';
    
    taskTypes.forEach(taskType => {
        const assignedChar = province.characters.find(char => 
            char.task === taskType.id && char.force !== null && !char.traveling
        );
        
        const taskDiv = document.createElement('div');
        taskDiv.className = 'task-item';
        
        if (assignedChar) {
            const effectiveness = assignedChar.actionTaken ? 0 : assignedChar.getTaskEffectiveness();
            taskDiv.innerHTML = `
                <div class="task-name">${taskType.name}</div>
                <div class="task-assigned">
                    ${assignedChar.name} (${taskType.stat}: ${assignedChar.getTaskEffectiveness()})
                </div>
                <div class="task-assigned">
                    Effectiveness: ${effectiveness}%
                    ${assignedChar.actionTaken ? ' (Action taken)' : ''}
                </div>
            `;
        } else {
            taskDiv.innerHTML = `
                <div class="task-name">${taskType.name}</div>
                <div class="task-empty">Click to assign character</div>
            `;
        }
        
        if (province.ruler === currentPlayer) {
            taskDiv.onclick = () => openTaskDialog(province, taskType);
        }
        
        tasksList.appendChild(taskDiv);
    });
}

function updateCharactersList(province) {
    const characterList = document.getElementById('characterList');
    characterList.innerHTML = '';
    
    const statBar = (value) => {
        return `<div class="stat-bar"><div class="stat-fill" style="width: ${value}%"></div></div>`;
    };
    
    const visibleChars = province.characters.filter(char => 
        (char.force !== null || discoveredCharacters.has(char.name)) && !char.hidden
    );
    
    const sortedChars = getSortedCharacters(visibleChars);
    
    sortedChars.forEach(char => {
        const charDiv = document.createElement('div');
        let classes = ['character-item'];
        if (char.force === null) classes.push('free');
        if (char.traveling) classes.push('traveling');
        if (char.force !== null && char.force !== currentPlayer && char.force !== province.ruler) classes.push('enemy');
        if (char.rewardedThisTurn) classes.push('rewarded');
        
        charDiv.className = classes.join(' ');
        
        let charHTML = `
            <div class="character-name">${char.name}</div>
            <div class="character-stats">
                <div>POW: ${char.power} ${statBar(char.power)}</div>
                <div>LDR: ${char.leadership} ${statBar(char.leadership)}</div>
                <div>POL: ${char.politics} ${statBar(char.politics)}</div>
                <div>CHM: ${char.charm} ${statBar(char.charm)}</div>
                <div>INT: ${char.intelligence} ${statBar(char.intelligence)}</div>
                <div>LOY: ${char.loyalty} ${statBar(char.loyalty)}</div>
            </div>
        `;
        
        if (char.force !== null) {
            charHTML += `<div class="character-loyalty ${char.getLoyaltyColor()}">Loyalty: ${char.loyalty}% (${char.force})</div>`;
        }
        
        if (char.traveling) {
            charHTML += `<div class="character-traveling">Traveling to ${char.destination.name} (${char.turnsRemaining} turns)</div>`;
        } else if (char.task && char.force !== null) {
            charHTML += `<div class="character-task">Task: ${taskTypes.find(t => t.id === char.task).name}</div>`;
        }
        
        if (char.force === null) {
            charHTML += `<div class="character-status">Free Character</div>`;
        }
        
        if (!char.traveling && province.ruler === currentPlayer) {
            if (char.force === null || char.force !== currentPlayer) {
                charHTML += `<button class="action-button" onclick="hireCharacter('${char.name}', ${province.id})">Hire</button>`;
            } else if (char.force === currentPlayer) {
                charHTML += `<button class="action-button" onclick="moveCharacterAction('${char.name}', ${province.id})">Move</button>`;
                if (!char.rewardedThisTurn && province.gold >= 100) {
                    charHTML += `<button class="action-button reward" onclick="rewardCharacter('${char.name}', ${province.id})">Reward (100g)</button>`;
                }
            }
        }
        
        charDiv.innerHTML = charHTML;
        characterList.appendChild(charDiv);
    });
    
    const allDiscoveredChars = characters.filter(c => 
        c.force === null &&  // Only show free characters
        discoveredCharacters.has(c.name) && 
        c.currentProvince !== province
    );
    
    if (allDiscoveredChars.length > 0) {
        characterList.innerHTML += '<hr style="margin: 20px 0; border-color: #6b5a48;">';
        characterList.innerHTML += '<h4 style="color: #d4af37; margin: 10px 0;">Tracked Characters</h4>';
        
        allDiscoveredChars.forEach(char => {
            const charDiv = document.createElement('div');
            charDiv.className = 'character-item free';
            charDiv.style.opacity = '0.7';
            
            let charHTML = `
                <div class="character-name">${char.name}</div>
                <div class="character-location">Currently in: ${char.currentProvince.name}</div>
                <div class="character-stats">
                    <div>POW: ${char.power}</div>
                    <div>LDR: ${char.leadership}</div>
                    <div>POL: ${char.politics}</div>
                    <div>CHM: ${char.charm}</div>
                </div>
            `;
            
            charDiv.innerHTML = charHTML;
            characterList.appendChild(charDiv);
        });
    }
}

function showMessage(text) {
    const existing = document.querySelector('.message');
    if (existing) {
        existing.remove();
    }
    
    const message = document.createElement('div');
    message.className = 'message';
    message.textContent = text;
    document.body.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 2000);
}

function sortCharacters() {
    characterSortOrder = document.getElementById('characterSort').value;
    if (selectedProvince) {
        updateProvinceInfo(selectedProvince);
    }
}

function getSortedCharacters(charList) {
    return [...charList].sort((a, b) => {
        switch(characterSortOrder) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'power':
                return b.power - a.power;
            case 'leadership':
                return b.leadership - a.leadership;
            case 'politics':
                return b.politics - a.politics;
            case 'charm':
                return b.charm - a.charm;
            case 'intelligence':
                return b.intelligence - a.intelligence;
            case 'loyalty':
                return a.loyalty - b.loyalty;
            default:
                return 0;
        }
    });
}
