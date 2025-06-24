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
    const characterListContainer = document.createElement('div');
    characterListContainer.className = 'character-options';
    
    dialog.innerHTML = dialogHTML;
    dialog.appendChild(characterListContainer);

    const availableChars = province.characters.filter(c => c.force === currentPlayer && !c.traveling);
    const augmentedChars = availableChars.map(char => ({
        ...char,
        id: char.id,
        name: char.name,
        politics: char.politics,
        leadership: char.leadership,
        charm: char.charm,
        intelligence: char.intelligence,
        power: char.power,
        loyalty: char.loyalty,
        currentTask: char.task ? taskTypes.find(t => t.id === char.task).name : 'None'
    }));
    
    const characterList = new CharacterList(characterListContainer, augmentedChars, {
        attributes: ['name', taskType.stat.toLowerCase(), 'currentTask'],
        selectionMode: 'single',
        initialSelection: currentAssigned ? [currentAssigned.id] : [],
        onSelectionChange: (selected) => {
            if (selected) {
                currentDialog.selectedCharacter = selected.id;
            } else {
                currentDialog.selectedCharacter = null;
            }
        }
    });

    const buttons = document.createElement('div');
    buttons.className = 'dialog-buttons';
    buttons.innerHTML = `
        <button class="dialog-button primary" onclick="confirmTaskAssignment(${province.id}, '${taskType.id}')">Assign</button>
        ${currentAssigned ? `<button class="dialog-button" onclick="removeTaskAssignment(${province.id}, '${taskType.id}')">Remove</button>` : ''}
        <button class="dialog-button" onclick="closeDialog()">Cancel</button>
    `;
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { 
        overlay, 
        selectedCharacter: currentAssigned ? currentAssigned.id : null,
        provinceId: province.id,
        characterList: characterList // Store reference to the list instance
    };
    
    overlay.onclick = (e) => {
        if (e.target === overlay) closeDialog();
    };
}

// Add a variable to store the previous dialog state
let previousDialogState = null;

function openHireDialog(province, targetChar, availableChars) {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    let dialogHTML = `<h3>Hire ${targetChar.name}</h3>`;
    dialogHTML += '<p>Select a character to perform the hiring:</p>';
    const characterListContainer = document.createElement('div');
    characterListContainer.className = 'character-options';
    
    dialog.innerHTML = dialogHTML;
    dialog.appendChild(characterListContainer);

    const augmentedChars = availableChars.map(char => {
        const fromIndex = provinces.findIndex(p => p === char.currentProvince);
        const toIndex = provinces.findIndex(p => p.id === province.id);
        const distance = provinceDistances[fromIndex][toIndex];
        return {
            ...char,
            id: char.id,
            name: char.name,
            charm: char.charm,
            turnsToHire: distance > 0 ? distance : 'Same Province'
        };
    });

    const characterList = new CharacterList(characterListContainer, augmentedChars, {
        attributes: ['name', 'charm', 'turnsToHire'],
        selectionMode: 'single',
        onSelectionChange: (selected) => {
            if (selected) {
                // Since this dialog doesn't have a confirm button and acts on selection,
                // we'll call the action function directly.
                selectCharacterForHire(selected.name, province.id, targetChar.name);
            }
        }
    });

    const buttons = document.createElement('div');
    buttons.className = 'dialog-buttons';
    buttons.innerHTML = `<button class="dialog-button" onclick="closeDialog()">Cancel</button>`;
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    currentDialog = { 
        overlay,
        characterList: characterList
    };
}

function selectCharacterForHire(hirerName, provinceId, targetName) {
    const province = provinces.find(p => p.id === provinceId);
    const hirer = characters.find(c => c.name === hirerName);
    const target = characters.find(c => c.name === targetName);
    
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
    
    // Store current dialog state before closing
    previousDialogState = {
        province,
        targetChar: target,
        availableChars: province.characters.filter(c => 
            c.force === currentPlayer && 
            !c.traveling && 
            !c.actionTaken
        )
    };
    
    // Close current dialog and show advisor prediction
    closeDialog();
    showAdvisorPrediction(hirer, target, successChance, willSucceed, province);
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
            <button class="dialog-button primary" onclick="executeHire('${hirer.id}', ${province.id}, '${target.id}', ${actualResult})">
                Proceed
            </button>
            <button class="dialog-button" onclick="cancelHireAttempt()">Cancel</button>
        </div>
    `;
    
    dialog.innerHTML = dialogHTML;
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    currentDialog = { overlay };
}

function cancelHireAttempt() {
    closeDialog();
    // Reopen the character selection dialog
    if (previousDialogState) {
        openHireDialog(
            previousDialogState.province,
            previousDialogState.targetChar,
            previousDialogState.availableChars
        );
        previousDialogState = null;
    }
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

// Make functions global
window.cancelHireAttempt = cancelHireAttempt;

function openAdvisorDialog() {
    const overlay = document.createElement('div');
    overlay.className = 'dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'dialog';

    let dialogHTML = `<h3>Select New Advisor</h3>`;
    dialogHTML += '<p>Choose a character to serve as your advisor:</p>';
    const characterListContainer = document.createElement('div');
    characterListContainer.className = 'character-options';
    
    dialog.innerHTML = dialogHTML;
    dialog.appendChild(characterListContainer);

    const availableAdvisors = characters.filter(c =>
        c.force === currentPlayer &&
        !c.traveling
    );
    
    const characterList = new CharacterList(characterListContainer, availableAdvisors, {
        attributes: ['name', 'intelligence'],
        selectionMode: 'single',
        initialSelection: advisor ? [advisor.id] : [],
        onSelectionChange: (selected) => {
            if (selected) {
                currentDialog.selectedAdvisor = selected.name;
            } else {
                currentDialog.selectedAdvisor = null;
            }
        }
    });

    const buttons = document.createElement('div');
    buttons.className = 'dialog-buttons';
    buttons.innerHTML = `
        <button class="dialog-button primary" onclick="confirmAdvisorChange()">Confirm</button>
        <button class="dialog-button" onclick="closeDialog()">Cancel</button>
    `;
    dialog.appendChild(buttons);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    currentDialog = {
        overlay,
        selectedAdvisor: advisor ? advisor.name : null,
        characterList: characterList
    };
}

function confirmAdvisorChange() {
    if (!currentDialog || !currentDialog.selectedAdvisor) return;
    
    const newAdvisor = characters.find(c => c.name === currentDialog.selectedAdvisor);
    if (newAdvisor) {
        advisor = newAdvisor;
        updateAdvisorDisplay();
        showMessage(`${newAdvisor.name} is now your advisor`);
    }
    
    closeDialog();
}

// Make functions global
window.openAdvisorDialog = openAdvisorDialog;
window.confirmAdvisorChange = confirmAdvisorChange;