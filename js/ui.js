// UI update functions
function updateAdvisorDisplay() {
    const advisorName = advisor ? advisor.name : "None";
    const advisorLabel = document.getElementById('advisorName');
    advisorLabel.textContent = advisorName;
    advisorLabel.style.cursor = 'pointer';
    advisorLabel.onclick = () => openAdvisorDialog();
}

function updateTurnDisplay() {
    document.getElementById('turnDisplay').textContent = 
        `Year ${currentTurn.year} - ${currentTurn.season}`;
}

function updateForceDisplay() {
    document.getElementById('forceName').textContent = currentPlayer;
}

function switchTab(tabName) {
    const tabs = document.querySelectorAll('.tab');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabs.forEach(tab => {
        if (tab.textContent.toLowerCase() === tabName.toLowerCase()) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
    
    tabContents.forEach(content => {
        if (content.id === `${tabName}Tab`) {
            content.classList.add('active');
        } else {
            content.classList.remove('active');
        }
    });
}

function updateProvinceInfo(province) {
    document.getElementById('provinceInfo').style.display = 'block';
    document.getElementById('provinceQuickInfo').style.display = 'block';
    
    // Update province name
    document.getElementById('provinceName').textContent = province.name;
    
    // Update quick info section with emojis
    document.getElementById('quickProvinceRuler').textContent = province.ruler;
    document.getElementById('quickProvincePopulation').textContent = province.population.toLocaleString();
    document.getElementById('quickProvinceGold').textContent = province.gold.toLocaleString();
    document.getElementById('quickProvinceFood').textContent = province.food.toLocaleString();
    document.getElementById('quickProvinceSoldiers').textContent = province.soldiers.toLocaleString();
    document.getElementById('quickProvinceDefense').textContent = province.defense + '%';
    document.getElementById('quickProvinceAgriculture').textContent = province.agriculture + '%';
    document.getElementById('quickProvinceCommerce').textContent = province.commerce + '%';
    
    // Update detailed info tab
    document.getElementById('provinceRuler').textContent = province.ruler;
    document.getElementById('provincePopulation').textContent = province.population.toLocaleString();
    document.getElementById('provinceGold').textContent = province.gold.toLocaleString();
    document.getElementById('provinceFood').textContent = province.food.toLocaleString();
    document.getElementById('provinceSoldiers').textContent = province.soldiers.toLocaleString();
    document.getElementById('provinceDefense').textContent = province.defense + '%';
    document.getElementById('provinceAgriculture').textContent = province.agriculture + '%';
    document.getElementById('provinceCommerce').textContent = province.commerce + '%';
    
    // Update the appropriate tab content based on which tab is active
    const activeTab = document.querySelector('.tab.active');
    if (activeTab) {
        switchTab(activeTab.textContent.toLowerCase());
    }
    
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
                    ${assignedChar.name} (${Character.getAttributeAbbreviation(taskType.stat.toLowerCase())}: ${assignedChar.getTaskEffectiveness()})
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
        (char.force !== null || discoveredCharacters.has(char.id)) && !char.hidden
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
                <div>${Character.getAttributeAbbreviation('power')}: ${char.power} ${statBar(char.power)}</div>
                <div>${Character.getAttributeAbbreviation('leadership')}: ${char.leadership} ${statBar(char.leadership)}</div>
                <div>${Character.getAttributeAbbreviation('politics')}: ${char.politics} ${statBar(char.politics)}</div>
                <div>${Character.getAttributeAbbreviation('charm')}: ${char.charm} ${statBar(char.charm)}</div>
                <div>${Character.getAttributeAbbreviation('intelligence')}: ${char.intelligence} ${statBar(char.intelligence)}</div>
                <div>${Character.getAttributeAbbreviation('loyalty')}: ${char.loyalty} ${statBar(char.loyalty)}</div>
            </div>
        `;
        
        if (char.force !== null) {
            charHTML += `<div class="character-loyalty ${char.getLoyaltyColor()}">Loyalty: ${char.loyalty}% (${char.force})</div>`;
        }
        
        if (char.traveling) {
            if (char.hiringMission) {
                charHTML += `<div class="character-traveling">On hiring mission to ${char.destination.name} (${char.turnsRemaining} turns)</div>`;
            } else {
                charHTML += `<div class="character-traveling">Traveling to ${char.destination.name} (${char.turnsRemaining} turns)</div>`;
            }
        } else if (char.task && char.force !== null) {
            charHTML += `<div class="character-task">Task: ${taskTypes.find(t => t.id === char.task).name}</div>`;
        }
        
        if (char.force === null) {
            charHTML += `<div class="character-status">Free Character</div>`;
        }
        
        if (!char.traveling) {
            if (char.force !== currentPlayer && char.name !== char.force) {  // Don't show hire button for rulers
                charHTML += `<button class="action-button" onclick="hireCharacter('${char.id}', ${char.currentProvince.id})">Hire</button>`;
            } else if (char.force === currentPlayer) {
                charHTML += `<button class="action-button" onclick="moveCharacterAction('${char.id}', ${province.id})">Move</button>`;
                if (!char.rewardedThisTurn && province.gold >= 100) {
                    charHTML += `<button class="action-button reward" onclick="rewardCharacter('${char.id}', ${province.id})">Reward (100g)</button>`;
                }
            }
        }
        
        charDiv.innerHTML = charHTML;
        characterList.appendChild(charDiv);
    });
    
    const allDiscoveredChars = characters.filter(c => 
        c.force === null &&  // Only show free characters
        discoveredCharacters.has(c.id) && 
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
                    <div>${Character.getAttributeAbbreviation('power')}: ${char.power}</div>
                    <div>${Character.getAttributeAbbreviation('leadership')}: ${char.leadership}</div>
                    <div>${Character.getAttributeAbbreviation('politics')}: ${char.politics}</div>
                    <div>${Character.getAttributeAbbreviation('charm')}: ${char.charm}</div>
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
