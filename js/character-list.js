class CharacterList {
    /**
     * @param {HTMLElement} container - The element to render the list into.
     * @param {Array<Object>} characters - The list of characters to display.
     * @param {Object} options - Configuration options.
     * @param {Array<string>} options.attributes - The character attributes to display as columns.
     * @param {'single' | 'multiple'} options.selectionMode - The selection mode.
     * @param {Function} options.onSelectionChange - Callback when selection changes.
     * @param {Array<string>} options.initialSelection - An array of initially selected character IDs.
     */
    constructor(container, characters, options) {
        this.container = container;
        this.characters = [...characters]; // Create a copy to sort
        this.options = {
            attributes: ['name', 'politics', 'leadership', 'charm'],
            selectionMode: 'single',
            onSelectionChange: () => {},
            initialSelection: [],
            ...options,
        };
        this.selectedIds = new Set(this.options.initialSelection);
        this.sortState = {
            column: null,
            direction: 'asc',
        };
        this.render();
    }

    render() {
        this.container.innerHTML = ''; // Clear previous content

        const table = document.createElement('table');
        table.className = 'character-list-table'; // Add a class for styling

        this.renderHeader(table);
        this.renderBody(table);

        this.container.appendChild(table);
    }

    renderHeader(table) {
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        
        // Selection column header
        const thSelection = document.createElement('th');
        thSelection.textContent = 'Select';
        headerRow.appendChild(thSelection);

        // Attribute column headers
        this.options.attributes.forEach(attr => {
            const th = document.createElement('th');
            // Use abbreviation if it's a character attribute, otherwise capitalize first letter
            if (Character.getAttributeAbbreviations()[attr]) {
                th.textContent = Character.getAttributeAbbreviation(attr);
            } else {
                th.textContent = attr.charAt(0).toUpperCase() + attr.slice(1);
            }
            th.style.cursor = 'pointer';
            th.onclick = () => this.sortBy(attr);

            if (this.sortState.column === attr) {
                th.textContent += this.sortState.direction === 'asc' ? ' ▲' : ' ▼';
            }
            headerRow.appendChild(th);
        });
    }

    renderBody(table) {
        const tbody = table.createTBody();
        
        this.characters.forEach(char => {
            const row = tbody.insertRow();

            // Selection cell
            const cellSelection = row.insertCell();
            const input = document.createElement('input');
            input.type = this.options.selectionMode === 'single' ? 'radio' : 'checkbox';
            input.name = 'character-selection'; // Ensures single selection for radio buttons
            input.value = char.id;
            input.checked = this.selectedIds.has(char.id);
            input.onchange = () => this.handleSelection(char.id);
            cellSelection.appendChild(input);

            // Attribute cells
            this.options.attributes.forEach(attr => {
                const cell = row.insertCell();
                cell.textContent = char[attr] || '';
            });
        });
    }

    sortBy(column) {
        if (this.sortState.column === column) {
            this.sortState.direction = this.sortState.direction === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortState.column = column;
            this.sortState.direction = 'asc';
        }

        this.characters.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];

            // Handle numeric and string sorting
            if (typeof valA === 'number' && typeof valB === 'number') {
                return this.sortState.direction === 'asc' ? valA - valB : valB - valA;
            }
            
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) {
                return this.sortState.direction === 'asc' ? -1 : 1;
            }
            if (strA > strB) {
                return this.sortState.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

        this.render();
    }

    handleSelection(characterId) {
        if (this.options.selectionMode === 'single') {
            this.selectedIds.clear();
            this.selectedIds.add(characterId);
        } else { // 'multiple'
            if (this.selectedIds.has(characterId)) {
                this.selectedIds.delete(characterId); // Deselect if already selected
            } else {
                this.selectedIds.add(characterId); // Select
            }
        }
        
        // Re-render to update the checked state for radio buttons
        if (this.options.selectionMode === 'single') {
            this.render();
        }

        this.options.onSelectionChange(this.getSelected());
    }
    
    getSelected() {
        const selectedChars = this.characters.filter(c => this.selectedIds.has(c.id));
        if (this.options.selectionMode === 'single') {
            return selectedChars.length > 0 ? selectedChars[0] : null;
        }
        return selectedChars;
    }
} 