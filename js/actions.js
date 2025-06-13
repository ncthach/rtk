// Task assignment functions
function confirmTaskAssignment(provinceId, taskId) {
    const province = provinces.find(p => p.id === provinceId);
    if (!province || !currentDialog) return;
    
    const selectedChar = province.characters.find(c => c.name === currentDialog.selectedCharacter);
    if (!selectedChar) return;
    
    // Remove task from previous character if any
    const previousChar = province.characters.find(c => c.task === taskId && c.force !== null && !c.traveling);
    if (previousChar) {
        previousChar.task = null;
        previousChar.taskProvince = null;
    }
    
    // Assign task to new character
    selectedChar.task = taskId;
    selectedChar.taskProvince = province;
    selectedChar.actionTaken = false;
    
    closeDialog();
    updateProvinceInfo(province);
}

function removeTaskAssignment(provinceId, taskId) {
    const province = provinces.find(p => p.id === provinceId);
    if (!province) return;
    
    const assignedChar = province.characters.find(c => c.task === taskId && c.force !== null && !c.traveling);
    if (assignedChar) {
        assignedChar.task = null;
        assignedChar.taskProvince = null;
    }
    
    closeDialog();
    updateProvinceInfo(province);
}

// Character movement functions
function moveCharacterAction(charName, provinceId) {
    const province = provinces.find(p => p.id === provinceId);
    const character = province.characters.find(c => c.name === charName);
    
    if (!province || !character || character.traveling) return;
    
    const destinations = provinces.filter(p => 
        p.id !== province.id && 
        province.connections.includes(p.id)
    );
    
    openMoveDialog(character, destinations);
}

function startCharacterMovement(character, destination) {
    if (character.traveling) return false;
    
    const fromIndex = provinces.findIndex(p => p === character.currentProvince);
    const toIndex = provinces.findIndex(p => p === destination);
    const distance = provinceDistances[fromIndex][toIndex];
    
    character.traveling = true;
    character.destination = destination;
    character.turnsRemaining = distance;
    
    // Remove from current province
    const currentProvince = character.currentProvince;
    const charIndex = currentProvince.characters.indexOf(character);
    if (charIndex !== -1) {
        currentProvince.characters.splice(charIndex, 1);
    }
    
    return true;
}

// Character hiring functions
function hireCharacter(charName, provinceId) {
    const province = provinces.find(p => p.id === provinceId);
    const targetChar = province.characters.find(c => c.name === charName);
    
    if (!province || !targetChar || targetChar.force === currentPlayer) return;
    
    const availableChars = province.characters.filter(c => 
        c.force === currentPlayer && 
        !c.traveling && 
        !c.actionTaken
    );
    
    if (availableChars.length === 0) {
        showMessage("No available characters to perform hiring");
        return;
    }
    
    openHireDialog(province, targetChar, availableChars);
}

function executeHire(hirerName, provinceId, targetName, willSucceed) {
    const province = provinces.find(p => p.id === provinceId);
    const hirer = province.characters.find(c => c.name === hirerName);
    const target = province.characters.find(c => c.name === targetName);
    
    if (!province || !hirer || !target) return;
    
    if (willSucceed) {
        target.force = currentPlayer;
        target.loyalty = 50;
        target.hidden = false;
        discoveredCharacters.add(target.name);
        showMessage(`${target.name} has joined your forces!`);
    } else {
        showMessage(`Failed to hire ${target.name}`);
    }
    
    hirer.actionTaken = true;
    
    // Close all dialogs
    while (currentDialog) {
        closeDialog();
    }
    
    updateProvinceInfo(province);
}

// Character reward function
function rewardCharacter(charName, provinceId) {
    const province = provinces.find(p => p.id === provinceId);
    const character = province.characters.find(c => c.name === charName);
    
    if (!province || !character || character.rewardedThisTurn || province.gold < 100) return;
    
    province.gold -= 100;
    character.loyalty = Math.min(100, character.loyalty + 5);
    character.rewardedThisTurn = true;
    
    showMessage(`${character.name}'s loyalty increased to ${character.loyalty}%`);
    updateProvinceInfo(province);
}

// Turn management
function endTurn() {
    // Clear previous turn summary
    turnSummary = [];
    
    // Process character movements
    characters.forEach(char => {
        if (char.traveling) {
            char.turnsRemaining--;
            if (char.turnsRemaining <= 0) {
                char.traveling = false;
                char.currentProvince = char.destination;
                char.destination.characters.push(char);
                char.destination = null;
                
                const summary = turnSummary.find(s => s.name === char.destination.name) || 
                              { name: char.destination.name, changes: [] };
                summary.changes.push({
                    arrival: true,
                    text: `${char.name} has arrived`
                });
            }
        }
    });
    
    // Process tasks
    provinces.forEach(province => {
        if (province.ruler === currentPlayer) {
            const summary = { name: province.name, changes: [] };
            
            province.characters.forEach(char => {
                if (char.task && !char.actionTaken && !char.traveling) {
                    const effectiveness = char.getTaskEffectiveness();
                    let oldValue, newValue;
                    
                    switch(char.task) {
                        case 'develop':
                            oldValue = province.development;
                            province.development = Math.min(100, province.development + effectiveness / 10);
                            newValue = province.development;
                            if (newValue > oldValue) {
                                summary.changes.push({
                                    positive: true,
                                    text: `Development increased from ${oldValue}% to ${newValue}%`
                                });
                            }
                            break;
                        case 'commerce':
                            oldValue = province.commerce;
                            province.commerce = Math.min(100, province.commerce + effectiveness / 10);
                            newValue = province.commerce;
                            const goldEarned = Math.floor(effectiveness * 10);
                            province.gold += goldEarned;
                            if (newValue > oldValue) {
                                summary.changes.push({
                                    positive: true,
                                    text: `Commerce increased from ${oldValue}% to ${newValue}% and earned ${goldEarned} gold`
                                });
                            }
                            break;
                        case 'fortify':
                            oldValue = province.defense;
                            province.defense = Math.min(100, province.defense + effectiveness / 10);
                            newValue = province.defense;
                            if (newValue > oldValue) {
                                summary.changes.push({
                                    positive: true,
                                    text: `Defense increased from ${oldValue}% to ${newValue}%`
                                });
                            }
                            break;
                        case 'recruit':
                            const newSoldiers = Math.floor(effectiveness * 50);
                            if (newSoldiers > 0) {
                                province.soldiers += newSoldiers;
                                summary.changes.push({
                                    positive: true,
                                    text: `Recruited ${newSoldiers} soldiers (Total: ${province.soldiers})`
                                });
                            }
                            break;
                        case 'search':
                            if (Math.random() < effectiveness / 100) {
                                const freeChars = province.characters.filter(c => 
                                    c.force === null && 
                                    !discoveredCharacters.has(c.name)
                                );
                                if (freeChars.length > 0) {
                                    const foundChar = freeChars[Math.floor(Math.random() * freeChars.length)];
                                    foundChar.hidden = false;
                                    discoveredCharacters.add(foundChar.name);
                                    summary.changes.push({
                                        discovery: true,
                                        text: `Discovered ${foundChar.name}!`
                                    });
                                }
                            }
                            break;
                    }
                    
                    char.actionTaken = true;
                }
            });
            
            if (summary.changes.length > 0) {
                turnSummary.push(summary);
            }
        }
    });
    
    // Reset character states
    characters.forEach(char => {
        char.actionTaken = false;
        char.rewardedThisTurn = false;
    });
    
    // Update turn
    const seasonIndex = seasons.indexOf(currentTurn.season);
    if (seasonIndex === 3) {
        currentTurn.year++;
        currentTurn.season = seasons[0];
    } else {
        currentTurn.season = seasons[seasonIndex + 1];
    }
    
    updateTurnDisplay();
    showTurnSummary();
}

// Make functions global
window.confirmTaskAssignment = confirmTaskAssignment;
window.removeTaskAssignment = removeTaskAssignment;
window.moveCharacterAction = moveCharacterAction;
window.hireCharacter = hireCharacter;
window.executeHire = executeHire;
window.rewardCharacter = rewardCharacter;
window.endTurn = endTurn;
