import './teamComposition.css';
import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';
import { Player, Post, Team, TeamComposition } from './model';


// enum Post {
//     GK = "GK",
//     PIV = "PIV",
//     DC = "DC",
//     ALG = "ALG",
//     ARG = "ARG",
//     ALD = "ALD",
//     ARD = "ARD"
// }

export class TeamCompositionModal {
    private static currentStep: number = 1;
    private static teamComposition: TeamComposition = {
        matchInfo: {
            oppositeTeam: '',
            location: '',
            date: '',
            time: '',
            meetingPlace: ''
        },
        majorPlayers: {
            [Post.GK]: null,
            [Post.PIV]: null,
            [Post.DC]: null,
            [Post.ALG]: null,
            [Post.ARG]: null,
            [Post.ALD]: null,
            [Post.ARD]: null
        },
        substitutes: []
    };

    public static show(team: Team): void {
        this.currentStep = 1;
        this.resetComposition();
        this.createModal(team);
    }

    private static resetComposition(): void {
        this.teamComposition = {
            matchInfo: {
                oppositeTeam: '',
                location: '',
                date: '',
                time: '',
                meetingPlace: ''
            },
            majorPlayers: {
                [Post.GK]: null,
                [Post.PIV]: null,
                [Post.DC]: null,
                [Post.ALG]: null,
                [Post.ARG]: null,
                [Post.ALD]: null,
                [Post.ARD]: null
            },
            substitutes: []
        };
    }

    private static createModal(team: Team): void {
        // Remove existing modal if any
        const existingModal = document.querySelector('.composition-modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'composition-modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'composition-modal-content';

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'composition-modal-close-btn';
        closeButton.addEventListener('click', () => {
            this.closeModal(modalOverlay);
        });

        // Create modal body
        const modalBodyContent = this.createModalBody(team);
        modalContent.innerHTML = modalBodyContent;
        modalContent.appendChild(closeButton);
        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                this.closeModal(modalOverlay);
            }
        });

        // Close modal with Escape key
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                this.closeModal(modalOverlay);
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';

        // Add event listeners after modal is created
        this.addEventListeners(team);
    }

    private static createModalBody(team: Team): string {
        const stepIndicator = this.createStepIndicator();

        let content = '';
        if (this.currentStep === 1) {
            content = this.createMatchInfoStep();
        } else if (this.currentStep === 2) {
            content = this.createMajorPlayersStep(team);
        } else if (this.currentStep === 3) {
            content = this.createSubstitutesStep(team);
        }

        return `
            <h2 class="composition-title">Team Composition - ${team.name}</h2>
            ${stepIndicator}
            ${content}
        `;
    }

    private static createStepIndicator(): string {
        return `
            <div class="step-indicator">
                <div class="step ${this.currentStep >= 1 ? 'active' : ''} ${this.currentStep > 1 ? 'completed' : ''}">
                    <span class="step-number">1</span>
                    <span class="step-label">Match Info</span>
                </div>
                <div class="step ${this.currentStep >= 2 ? 'active' : ''} ${this.currentStep > 2 ? 'completed' : ''}">
                    <span class="step-number">2</span>
                    <span class="step-label">Major Players</span>
                </div>
                <div class="step ${this.currentStep >= 3 ? 'active' : ''}">
                    <span class="step-number">3</span>
                    <span class="step-label">Substitutes</span>
                </div>
            </div>
        `;
    }

    private static createMatchInfoStep(): string {
        return `
            <div class="step-content">
                <h3>Match Information</h3>
                <form class="match-info-form">
                    <div class="form-group">
                        <label for="opposite-team">Opposite Team:</label>
                        <input type="text" id="opposite-team" value="${this.teamComposition.matchInfo.oppositeTeam}" required>
                    </div>
                    <div class="form-group">
                        <label for="location">Location:</label>
                        <input type="text" id="location" value="${this.teamComposition.matchInfo.location}" required>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="match-date">Date:</label>
                            <input type="date" id="match-date" value="${this.teamComposition.matchInfo.date}" required>
                        </div>
                        <div class="form-group">
                            <label for="match-time">Time:</label>
                            <input type="time" id="match-time" value="${this.teamComposition.matchInfo.time}" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="meeting-place">Meeting Place:</label>
                        <input type="text" id="meeting-place" value="${this.teamComposition.matchInfo.meetingPlace}" required>
                    </div>
                </form>
                <div class="step-actions">
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createMajorPlayersStep(team: Team): string {
        const players = this.getPlayersData(team.id);
        const availablePlayers = players.filter(p => p.poste !== 'COACH');

        const positionsHTML = Object.values(Post).map(position => {
            const selectedPlayer = this.teamComposition.majorPlayers[position];
            return `
                <div class="position-selection">
                    <h4>${position}</h4>
                    <select id="position-${position}" class="player-select">
                        <option value="">Select Player</option>
                        ${availablePlayers.map(player => {
                            const displayName = this.getDisplayedName(player);
                            const isSelected = selectedPlayer && this.getDisplayedName(selectedPlayer) === displayName;
                            return `<option value="${displayName}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                        }).join('')}
                    </select>
                </div>
            `;
        }).join('');

        return `
            <div class="step-content">
                <h3>Select Major Players (7 positions)</h3>
                <div class="positions-grid">
                    ${positionsHTML}
                </div>
                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createSubstitutesStep(team: Team): string {
        const players = this.getPlayersData(team.id);
        const availablePlayers = players.filter(p => p.poste !== 'COACH');

        // Get players not selected as majors
        const majorPlayerNames = Object.values(this.teamComposition.majorPlayers)
            .filter(player => player !== null)
            .map(player => this.getDisplayedName(player!));

        const availableForSubstitutes = availablePlayers.filter(player =>
            !majorPlayerNames.includes(this.getDisplayedName(player))
        );

        const substitutesHTML = this.teamComposition.substitutes.map((player, index) => {
            const displayName = this.getDisplayedName(player);
            return `
                <div class="substitute-selection">
                    <select class="substitute-select" data-index="${index}">
                        <option value="">Select Substitute ${index + 1}</option>
                        ${availableForSubstitutes.map(p => {
                            const pDisplayName = this.getDisplayedName(p);
                            return `<option value="${pDisplayName}" ${pDisplayName === displayName ? 'selected' : ''}>${pDisplayName}</option>`;
                        }).join('')}
                    </select>
                    <button class="btn btn-remove" onclick="TeamCompositionModal.removeSubstitute(${index})">Remove</button>
                </div>
            `;
        }).join('');

        return `
            <div class="step-content">
                <h3>Select Substitutes (up to 7 players)</h3>
                <div class="substitutes-container">
                    ${substitutesHTML}
                    ${this.teamComposition.substitutes.length < 7 ?
                        '<button class="btn btn-add" id="add-substitute-btn">Add Substitute</button>' :
                        '<p class="max-substitutes">Maximum substitutes reached (7)</p>'
                    }
                </div>
                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <button class="btn btn-success" id="finish-composition-btn">Finish Composition</button>
                </div>
            </div>
        `;
    }

    private static addEventListeners(team: Team): void {
        // Next step button
        const nextBtn = document.getElementById('next-step-btn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextStep(team));
        }

        // Previous step button
        const prevBtn = document.getElementById('prev-step-btn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousStep(team));
        }

        // Finish composition button
        const finishBtn = document.getElementById('finish-composition-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishComposition());
        }

        // Add substitute button
        const addSubBtn = document.getElementById('add-substitute-btn');
        if (addSubBtn) {
            addSubBtn.addEventListener('click', () => this.addSubstitute(team));
        }

        // Player selection for major positions
        const playerSelects = document.querySelectorAll('.player-select');
        playerSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                const position = target.id.replace('position-', '') as keyof typeof Post;
                this.updateMajorPlayer(position, target.value, team);
            });
        });

        // Substitute selection
        const substituteSelects = document.querySelectorAll('.substitute-select');
        substituteSelects.forEach(select => {
            select.addEventListener('change', (e) => {
                const target = e.target as HTMLSelectElement;
                const index = parseInt(target.dataset.index || '0');
                this.updateSubstitute(index, target.value, team);
            });
        });
    }

    private static nextStep(team: Team): void {
        if (this.currentStep === 1) {
            if (this.validateMatchInfo()) {
                this.saveMatchInfo();
                this.currentStep = 2;
                this.updateModalContent(team);
            }
        } else if (this.currentStep === 2) {
            if (this.validateMajorPlayers()) {
                this.currentStep = 3;
                this.updateModalContent(team);
            }
        }
    }

    private static previousStep(team: Team): void {
        if (this.currentStep > 1) {
            this.currentStep--;
            this.updateModalContent(team);
        }
    }

    private static validateMatchInfo(): boolean {
        const oppositeTeam = (document.getElementById('opposite-team') as HTMLInputElement).value;
        const location = (document.getElementById('location') as HTMLInputElement).value;
        const date = (document.getElementById('match-date') as HTMLInputElement).value;
        const time = (document.getElementById('match-time') as HTMLInputElement).value;
        const meetingPlace = (document.getElementById('meeting-place') as HTMLInputElement).value;

        if (!oppositeTeam || !location || !date || !time || !meetingPlace) {
            alert('Please fill in all match information fields.');
            return false;
        }
        return true;
    }

    private static validateMajorPlayers(): boolean {
        const selectedCount = Object.values(this.teamComposition.majorPlayers)
            .filter(player => player !== null).length;

        if (selectedCount < 7) {
            alert('Please select all 7 major players.');
            return false;
        }
        return true;
    }

    private static saveMatchInfo(): void {
        this.teamComposition.matchInfo = {
            oppositeTeam: (document.getElementById('opposite-team') as HTMLInputElement).value,
            location: (document.getElementById('location') as HTMLInputElement).value,
            date: (document.getElementById('match-date') as HTMLInputElement).value,
            time: (document.getElementById('match-time') as HTMLInputElement).value,
            meetingPlace: (document.getElementById('meeting-place') as HTMLInputElement).value
        };
    }

    private static updateMajorPlayer(position: string, playerName: string, team: Team): void {
        const players = this.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);
        this.teamComposition.majorPlayers[position] = player || null;
    }

    private static updateSubstitute(index: number, playerName: string, team: Team): void {
        const players = this.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);
        if (player) {
            this.teamComposition.substitutes[index] = player;
        }
    }

    public static addSubstitute(team: Team): void {
        if (this.teamComposition.substitutes.length < 7) {
            // Add empty slot
            this.teamComposition.substitutes.push({} as Player);
            this.updateModalContent(team);
        }
    }

    public static removeSubstitute(index: number): void {
        this.teamComposition.substitutes.splice(index, 1);
        // Force a page refresh to update the UI - in a real app you'd want better state management
        const modal = document.querySelector('.composition-modal-overlay');
        if (modal) {
            modal.remove();
        }
    }

    private static finishComposition(): void {
        console.log('Team Composition Complete:', this.teamComposition);
        alert('Team composition saved successfully!');
        this.closeModal(document.querySelector('.composition-modal-overlay') as HTMLElement);
    }

    private static updateModalContent(team: Team): void {
        const modalContent = document.querySelector('.composition-modal-content');
        if (modalContent) {
            const closeBtn = modalContent.querySelector('.composition-modal-close-btn');
            modalContent.innerHTML = this.createModalBody(team);
            if (closeBtn) {
                modalContent.appendChild(closeBtn);
            }
            this.addEventListeners(team);
        }
    }

    private static getPlayersData(teamId: string): Player[] {
        if (teamId === 'U18') {
            return U18PlayersData.players;
        } else if (teamId === 'U15') {
            return U15PlayersData.players;
        } else if (teamId === 'U13') {
            return U13PlayersData.players;
        } else if (teamId === 'O16') {
            return O16PlayersData.players;
        }
        return [];
    }

    private static getDisplayedName(player: Player): string {
        return player.surnom ?? player.prenom ?? player.nom ?? 'Unknown';
    }

    private static closeModal(modalOverlay: HTMLElement): void {
        // Restore body scroll
        document.body.style.overflow = '';
        modalOverlay.remove();
    }
}

// Make TeamCompositionModal available globally for onclick handlers
(window as any).TeamCompositionModal = TeamCompositionModal;

export type { Team };
