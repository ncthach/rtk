// Dialog functions
function closeDialog() {
    if (currentDialog && currentDialog.overlay) {
        currentDialog.overlay.remove();
        currentDialog = null;
    }
}

function openTaskDialog(province, taskType) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    
    const currentAssigned = province.characters.find(char => 
        char.task === taskType.id && char.force !== null && !char.traveling
    );
    
    let dialogHTML = `<h3>Assign to ${taskType.name}</h3>`;
    dialogHTML += '<div class="character-options">';
    
    province.characters.filter(c => c.force === currentPlayer && !c.traveling).forEach(char => {
        const stat = taskType.stat === 'Politics' ? char.politics : 
                    taskType.stat === 'Leadership' ? char.leadership : char.charm;
        const isAssigned = char === currentAssigned;
        const hasOtherTask = char.task && char.task !== taskType.id;
        
        dialogHTML += `
            <div class="character-option ${isAssigned ? 'selected' : ''}" 
                 onclick="selectCharacterForTask('${char.name}', ${province.id}, '${taskType.id}')">
                <div class="character-option-name">${char.name}</div>
                <div class="character-option-stat">${taskType.stat}: ${stat}</div>
                ${hasOtherTask ? `<div class="character-option-stat">Currently: ${taskTypes.find(t => t.id === char.task).name}</div>` : ''}
            </div>
        `;
    });
    
    dialogHTML += '</div>';
    dialogHTML += `
        <div class="dialog-buttons">
            <button class="dialog-button primary" onclick="confirmTaskAssignment(${province.id}, '${taskType.id}')">Assign</button>
            ${currentAssigned ? `<button class="dialog-button" onclick="removeTaskAssignment(${province.id}, '${taskType.id}')">Remove</button>` : ''}
            <button class="dialog-button" onclick="closeDialog()">Cancel</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { 
        overlay, 
        selectedCharacter: currentAssigned ? currentAssigned.name : null 
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeDialog();
    };
}

function openHireDialog(province, targetChar, availableChars) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    
    let dialogHTML = `<h3>Hire ${targetChar.name}</h3>`;
    dialogHTML += '<p>Select a character to perform the hiring:</p>';
    dialogHTML += '<div class="character-options">';
    
    availableChars.forEach(char => {
        dialogHTML += `
            <div class="character-option" 
                 onclick="selectCharacterForHire('${char.name}', ${province.id}, '${targetChar.name}')">
                <div class="character-option-name">${char.name}</div>
                <div class="character-option-stat">Charm: ${char.charm}</div>
                ${char.task ? `<div class="character-option-stat">Current task: ${taskTypes.find(t => t.id === char.task).name}</div>` : ''}
            </div>
        `;
    });
    
    dialogHTML += '</div>';
    dialogHTML += `
        <div class="dialog-buttons">
            <button class="dialog-button" onclick="closeDialog()">Cancel</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { overlay };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeDialog();
    };
}

function openMoveDialog(character, destinations) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    
    let dialogHTML = `<h3>Move ${character.name}</h3>`;
    dialogHTML += '<p>Select destination:</p>';
    dialogHTML += '<div class="province-options">';
    
    destinations.forEach(dest => {
        const fromIndex = provinces.findIndex(p => p === character.currentProvince);
        const toIndex = provinces.findIndex(p => p === dest);
        const distance = provinceDistances[fromIndex][toIndex];
        
        dialogHTML += `
            <div class="province-option" 
                 onclick="selectDestination('${character.name}', ${dest.id})">
                <div class="province-option-name">${dest.name}</div>
                <div class="province-option-info">Distance: ${distance} turn${distance > 1 ? 's' : ''}</div>
            </div>
        `;
    });
    
    dialogHTML += '</div>';
    dialogHTML += `
        <div class="dialog-buttons">
            <button class="dialog-button" onclick="closeDialog()">Cancel</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { overlay };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeDialog();
    };
}

function showAdvisorPrediction(hirer, target, successChance, actualResult, province) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    
    let dialogHTML = `<h3>Hire Attempt: ${target.name}</h3>`;
    
    if (advisor) {
        const accuracyChance = advisor.intelligence / 100;
        const advisorCorrect = Math.random() < accuracyChance;
        const advisorPrediction = advisorCorrect ? actualResult : !actualResult;
        
        dialogHTML += `
            <div class="advisor-prediction">
                <div class="advisor-says">${advisor.name} says:</div>
                <div class="advisor-message">
                    "${advisorPrediction ? 
                        'My lord, I believe this attempt will succeed!' : 
                        'My lord, I fear this attempt will fail...'}"
                </div>
                <div class="character-option-stat" style="margin-top: 10px;">
                    True chance: ${Math.round(successChance * 100)}%
                </div>
            </div>
        `;
    } else {
        dialogHTML += `
            <div class="advisor-prediction">
                <div class="advisor-message">No advisor to provide counsel</div>
                <div class="character-option-stat">True chance: ${Math.round(successChance * 100)}%</div>
            </div>
        `;
    }
    
    dialogHTML += `
        <p>${hirer.name} (Charm: ${hirer.charm}) attempting to hire ${target.name}${target.force ? ` (Loyalty: ${target.loyalty})` : ''}</p>
    `;
    
    dialogHTML += `
        <div class="dialog-buttons">
            <button class="dialog-button primary" onclick="executeHire('${hirer.name}', ${province.id}, '${target.name}', ${actualResult})">
                Proceed
            </button>
            <button class="dialog-button" onclick="closeDialog()">Cancel</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { overlay };
}

function showTurnSummary() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';
    
    const dialog = document.createElement('div');
    dialog.className = 'dialog';
    dialog.style.maxWidth = '600px';
    
    let dialogHTML = `<h3>Turn Summary - ${currentTurn.season} ${currentTurn.year}</h3>`;
    
    turnSummary.forEach(provinceSummary => {
        dialogHTML += `
            <div class="turn-summary-section">
                <div class="turn-summary-province">${provinceSummary.name}</div>
        `;
        
        provinceSummary.changes.forEach(change => {
            let className = 'turn-summary-item ';
            if (change.discovery) className += 'discovery-message';
            else if (change.movement) className += 'movement-message';
            else if (change.arrival) className += 'arrival-message';
            else if (change.positive) className += 'turn-summary-positive';
            else className += 'turn-summary-negative';
            
            dialogHTML += `<div class="${className}">${change.text}</div>`;
        });
        
        dialogHTML += '</div>';
    });
    
    dialogHTML += `
        <div class="dialog-buttons">
            <button class="dialog-button primary" onclick="closeTurnSummary()">Continue</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { overlay };
}

function closeTurnSummary() {
    closeDialog();
}

// Global dialog helper functions
window.selectCharacterForTask = function(charName, provinceId, taskId) {
    if (currentDialog) {
        currentDialog.selectedCharacter = charName;
        
        const options = document.querySelectorAll('.character-option');
        options.forEach(opt => {
            if (opt.querySelector('.character-option-name').textContent === charName) {
                opt.classList.add('selected');
            } else {
                opt.classList.remove('selected');
            }
        });
    }
}

window.selectCharacterForHire = function(hirerName, provinceId, targetName) {
    const province = provinces.find(p => p.id === provinceId);
    const hirer = province.characters.find(c => c.name === hirerName);
    const target = province.characters.find(c => c.name === targetName);
    
    if (!hirer || !target) return;
    
    let successChance;
    if (target.force === null) {
        const baseChance = 0.3;
        const charmBonus = hirer.charm / 100 * 0.7;
        successChance = baseChance + charmBonus;
    } else {
        const loyaltyFactor = (100 - target.loyalty) / 100;
        const charmFactor = hirer.charm / 100;
        successChance = loyaltyFactor * charmFactor * 0.8;
    }
    
    const willSucceed = Math.random() < successChance;
    showAdvisorPrediction(hirer, target, successChance, willSucceed, province);
}

window.selectDestination = function(charName, destId) {
    const character = characters.find(c => c.name === charName);
    const destination = provinces.find(p => p.id === destId);
    
    if (!character || !destination) return;
    
    if (startCharacterMovement(character, destination)) {
        showMessage(`${character.name} begins journey to ${destination.name}`);
    }
    
    closeDialog();
    if (selectedProvince) {
        updateProvinceInfo(selectedProvince);
    }
}