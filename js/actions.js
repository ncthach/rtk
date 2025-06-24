// Task assignment functions
function confirmTaskAssignment(provinceId, taskId) {
    const province = provinces.find(p => p.id === provinceId);
    if (!province || !currentDialog) return;
    
    const selectedChar = province.characters.find(c => c.id === currentDialog.selectedCharacter);
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
function moveCharacterAction(charId, provinceId) {
    const province = provinces.find(p => p.id === provinceId);
    const character = province.characters.find(c => c.id === charId);
    
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
function hireCharacter(charId, provinceId) {
    const targetProvince = provinces.find(p => p.id === provinceId);
    const targetChar = targetProvince.characters.find(c => c.id === charId);
    
    if (!targetProvince || !targetChar || targetChar.force === currentPlayer) return;
    
    // Get available characters from all player's provinces
    const availableChars = characters.filter(c => 
        c.force === currentPlayer && 
        !c.traveling && 
        !c.actionTaken
    );
    
    if (availableChars.length === 0) {
        showMessage("No available characters to perform hiring");
        return;
    }
    
    openHireDialog(targetProvince, targetChar, availableChars);
}

function executeHire(hirerId, provinceId, targetId, willSucceed) {
    const targetProvince = provinces.find(p => p.id === provinceId);
    const hirer = characters.find(c => c.id === hirerId);
    const target = targetProvince.characters.find(c => c.id === targetId);
    
    if (!targetProvince || !hirer || !target) return;
    
    // Check if target is still available for hiring
    if (target.force !== null) {
        showMessage(`${target.name} is no longer available for hiring`);
        closeDialog();
        return;
    }
    
    // If characters are in the same province, hire immediately
    if (hirer.currentProvince === targetProvince) {
        if (willSucceed) {
            target.force = currentPlayer;
            target.loyalty = 50;
            target.hidden = false;
            discoveredCharacters.add(target.id);
            showMessage(`${target.name} has joined your forces!`);
        } else {
            showMessage(`Failed to hire ${target.name}`);
        }
        hirer.actionTaken = true;
        closeDialog();
        updateProvinceInfo(targetProvince);
        return;
    }
    
    // Calculate travel time for hiring mission
    const fromIndex = provinces.findIndex(p => p === hirer.currentProvince);
    const toIndex = provinces.findIndex(p => p === targetProvince);
    const travelTime = provinceDistances[fromIndex][toIndex];
    
    // Start the hiring mission
    hirer.traveling = true;
    hirer.destination = targetProvince;
    hirer.turnsRemaining = travelTime;
    hirer.hiringMission = {
        target: target,
        willSucceed: willSucceed,
        returnProvince: hirer.currentProvince
    };
    
    // Remove from current province
    const currentProvince = hirer.currentProvince;
    const charIndex = currentProvince.characters.indexOf(hirer);
    if (charIndex !== -1) {
        currentProvince.characters.splice(charIndex, 1);
    }
    
    showMessage(`${hirer.name} begins journey to ${targetProvince.name} to hire ${target.name}`);
    
    // Close all dialogs
    while (currentDialog) {
        closeDialog();
    }
    
    updateProvinceInfo(targetProvince);
}

// Character reward function
function rewardCharacter(charId, provinceId) {
    const province = provinces.find(p => p.id === provinceId);
    const character = province.characters.find(c => c.id === charId);
    
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
    
    // Process character movements and hiring missions
    characters.forEach(char => {
        if (char.traveling) {
            char.turnsRemaining--;
            if (char.turnsRemaining <= 0) {
                char.traveling = false;
                char.currentProvince = char.destination;
                char.destination.characters.push(char);
                
                // Handle hiring mission completion
                if (char.hiringMission) {
                    const target = char.hiringMission.target;
                    // Check if target is still available for hiring
                    if (target.force === null) {
                        if (char.hiringMission.willSucceed) {
                            // Successfully hired the character
                            target.force = currentPlayer;
                            target.loyalty = 50;
                            target.hidden = false;
                            discoveredCharacters.add(target.id);
                            
                            // Start target character's journey to return province
                            target.traveling = true;
                            target.destination = char.hiringMission.returnProvince;
                            target.turnsRemaining = provinceDistances[
                                provinces.findIndex(p => p === target.currentProvince)
                            ][
                                provinces.findIndex(p => p === char.hiringMission.returnProvince)
                            ];
                            
                            // Remove target from current province
                            const targetProvince = target.currentProvince;
                            const targetIndex = targetProvince.characters.indexOf(target);
                            if (targetIndex !== -1) {
                                targetProvince.characters.splice(targetIndex, 1);
                            }
                            
                            showMessage(`${target.name} has joined your forces and is traveling to ${char.hiringMission.returnProvince.name}!`);
                        } else {
                            showMessage(`Failed to hire ${target.name}`);
                        }
                    } else {
                        showMessage(`Cannot hire ${target.name} - they are no longer available`);
                    }
                    
                    // Start return journey for hiring character
                    char.traveling = true;
                    char.destination = char.hiringMission.returnProvince;
                    char.turnsRemaining = provinceDistances[
                        provinces.findIndex(p => p === char.currentProvince)
                    ][
                        provinces.findIndex(p => p === char.hiringMission.returnProvince)
                    ];
                    
                    // Remove from current province
                    const currentProvince = char.currentProvince;
                    const charIndex = currentProvince.characters.indexOf(char);
                    if (charIndex !== -1) {
                        currentProvince.characters.splice(charIndex, 1);
                    }
                    
                    char.hiringMission = null;
                }
                
                char.destination = null;
                
                const summary = turnSummary.find(s => s.name === char.currentProvince.name) || 
                              { name: char.currentProvince.name, changes: [] };
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
                            oldValue = province.agriculture;
                            province.agriculture = Math.min(100, province.agriculture + effectiveness / 10);
                            newValue = province.agriculture;
                            if (newValue > oldValue) {
                                summary.changes.push({
                                    positive: true,
                                    text: `Agriculture increased from ${oldValue}% to ${newValue}%`
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
                            console.log("Searching for free characters with effectiveness: " + effectiveness);
                            if (Math.random() < effectiveness / 100) {
                                const freeChars = province.characters.filter(c => 
                                    c.force === null && 
                                    !discoveredCharacters.has(c.id)
                                );
                                console.log("Found " + freeChars.length + " free characters");
                                if (freeChars.length > 0) {
                                    const foundChar = freeChars[Math.floor(Math.random() * freeChars.length)];
                                    foundChar.hidden = false;
                                    discoveredCharacters.add(foundChar.id);
                                    summary.changes.push({
                                        discovery: true,
                                        text: `Discovered ${foundChar.name}!`
                                    });
                                    // Only update UI if this is the currently selected province
                                    if (selectedProvince === province) {
                                        updateProvinceInfo(province);
                                    }
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
