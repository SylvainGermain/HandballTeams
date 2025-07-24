import './teamComposition.css';
import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';
import { Player, Post, Team, TeamComposition } from './model';
import { PlayerHelper } from './player';
import { ExportHelper } from './export';


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
            [Post.COACH]: null,
            [Post.GK]: null,
            [Post.PIV]: null,
            [Post.DC]: null,
            [Post.ALG]: null,
            [Post.ARG]: null,
            [Post.ALD]: null,
            [Post.ARD]: null
        },
        substitutes: [
            {} as Player,
            {} as Player,
            {} as Player,
            {} as Player,
            {} as Player
        ]
    };

    public static show(team: Team): void {
        this.currentStep = 1;
        this.resetComposition();
        this.loadFromCookie(team);
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
                [Post.COACH]: null,
                [Post.GK]: null,
                [Post.PIV]: null,
                [Post.DC]: null,
                [Post.ALG]: null,
                [Post.ARG]: null,
                [Post.ALD]: null,
                [Post.ARD]: null
            },
            substitutes: [
                {} as Player,
                {} as Player,
                {} as Player,
                {} as Player,
                {} as Player
            ]
        };
    }

    private static saveToCookie(team: Team): void {
        try {
            const cookieData = {
                teamId: team.id,
                majorPlayers: {} as { [key: string]: string | null },
                substitutes: [] as string[]
            };

            // Save major players (store by name for easier lookup)
            Object.entries(this.teamComposition.majorPlayers).forEach(([position, player]) => {
                cookieData.majorPlayers[position] = player ? this.getDisplayedName(player) : null;
            });

            // Save substitutes (store by name)
            cookieData.substitutes = this.teamComposition.substitutes.map(player =>
                player && (player.nom || player.prenom) ? this.getDisplayedName(player) : ''
            );

            // Store in cookie with team-specific key, expires in 30 days
            const expirationDate = new Date();
            expirationDate.setDate(expirationDate.getDate() + 30);
            document.cookie = `teamComposition_${team.id}=${JSON.stringify(cookieData)}; expires=${expirationDate.toUTCString()}; path=/`;
        } catch (error) {
            console.warn('Failed to save team composition to cookie:', error);
        }
    }

    private static loadFromCookie(team: Team): void {
        try {
            const cookieName = `teamComposition_${team.id}`;
            const cookies = document.cookie.split(';');
            let cookieData = null;

            // Find the cookie for this team
            for (const cookie of cookies) {
                const [name, value] = cookie.trim().split('=');
                if (name === cookieName && value) {
                    cookieData = JSON.parse(decodeURIComponent(value));
                    break;
                }
            }

            if (!cookieData) return;

            const players = this.getPlayersData(team.id);

            // Load major players
            Object.entries(cookieData.majorPlayers || {}).forEach(([position, playerName]) => {
                if (playerName) {
                    const player = players.find(p => this.getDisplayedName(p) === playerName);
                    if (player) {
                        this.teamComposition.majorPlayers[position] = player;
                    }
                }
            });

            // Load substitutes
            if (cookieData.substitutes && Array.isArray(cookieData.substitutes)) {
                cookieData.substitutes.forEach((playerName: string, index: number) => {
                    if (playerName && index < this.teamComposition.substitutes.length) {
                        const player = players.find(p => this.getDisplayedName(p) === playerName);
                        if (player) {
                            this.teamComposition.substitutes[index] = player;
                        }
                    }
                });

                // If there were more substitutes saved than the default 5, extend the array
                if (cookieData.substitutes.length > 5) {
                    for (let i = 5; i < cookieData.substitutes.length; i++) {
                        if (cookieData.substitutes[i]) {
                            const player = players.find(p => this.getDisplayedName(p) === cookieData.substitutes[i]);
                            if (player) {
                                this.teamComposition.substitutes[i] = player;
                            } else {
                                this.teamComposition.substitutes[i] = {} as Player;
                            }
                        } else {
                            this.teamComposition.substitutes[i] = {} as Player;
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Failed to load team composition from cookie:', error);
        }
    }

    private static clearCookie(team: Team): void {
        try {
            // Remove the cookie by setting it to expire in the past
            document.cookie = `teamComposition_${team.id}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
        } catch (error) {
            console.warn('Failed to clear team composition cookie:', error);
        }
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
            content = this.createTeamSelectionStep(team);
        } else if (this.currentStep === 3) {
            content = this.createSummaryStep();
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
                    <span class="step-label">Team Selection</span>
                </div>
                <div class="step ${this.currentStep >= 3 ? 'active' : ''}">
                    <span class="step-number">3</span>
                    <span class="step-label">Summary</span>
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
                        <input type="text" id="opposite-team" value="${this.teamComposition.matchInfo.oppositeTeam}" placeholder="Enter opponent team name">
                    </div>
                    <div class="form-group">
                        <label for="location">Location:</label>
                        <input type="text" id="location" value="${this.teamComposition.matchInfo.location}" placeholder="Enter match location">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="match-date">Date:</label>
                            <input type="date" id="match-date" value="${this.teamComposition.matchInfo.date}">
                        </div>
                        <div class="form-group">
                            <label for="match-time">Time:</label>
                            <input type="time" id="match-time" value="${this.teamComposition.matchInfo.time}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="meeting-place">Meeting Place:</label>
                        <input type="text" id="meeting-place" value="${this.teamComposition.matchInfo.meetingPlace}" placeholder="Enter meeting location">
                    </div>
                </form>
                <div class="step-actions">
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createTeamSelectionStep(team: Team): string {
        const players = this.getPlayersData(team.id);
        const coachPlayers = players.filter(p => p.poste === 'COACH');
        const fieldPlayers = players.filter(p => p.poste !== 'COACH');

        // Get all already selected major players (excluding current position)
        const getSelectedMajorPlayers = (excludePosition?: string) => {
            return Object.entries(this.teamComposition.majorPlayers)
                .filter(([pos, player]) => player !== null && pos !== excludePosition)
                .map(([_, player]) => this.getDisplayedName(player!));
        };

        // Major Players Section
        const positionsHTML = Object.values(Post).map(position => {
            const selectedPlayer = this.teamComposition.majorPlayers[position];
            const alreadySelectedMajors = getSelectedMajorPlayers(position);

            if (position === 'COACH') {
                // Use coach players for COACH position, excluding already selected ones
                const availablePlayersForPosition = coachPlayers.filter(player =>
                    !alreadySelectedMajors.includes(this.getDisplayedName(player))
                );
                return `
                    <div class="position-selection">
                        <h4>${position}</h4>
                        <select id="position-${position}" class="player-select">
                            <option value="">Select Player</option>
                            ${availablePlayersForPosition.map(player => {
                                const displayName = this.getDisplayedName(player);
                                const isSelected = selectedPlayer && this.getDisplayedName(selectedPlayer) === displayName;
                                return `<option value="${displayName}" ${isSelected ? 'selected' : ''}>${displayName}</option>`;
                            }).join('')}
                        </select>
                    </div>
                `;
            } else {
                // For field positions, sort players by position with current position first, excluding already selected
                const currentPositionPlayers = fieldPlayers.filter(p =>
                    (p.poste === position || p.posteb === position || p.postec === position) &&
                    !alreadySelectedMajors.includes(this.getDisplayedName(p))
                );
                const otherPositionPlayers = fieldPlayers.filter(p =>
                    (p.poste !== position && p.posteb !== position && p.postec !== position) &&
                    !alreadySelectedMajors.includes(this.getDisplayedName(p))
                ).sort((a, b) => {
                    // Sort other players by their primary position
                    if (a.poste < b.poste) return -1;
                    if (a.poste > b.poste) return 1;
                    return 0;
                });

                const sortedPlayers = [...currentPositionPlayers, ...otherPositionPlayers];

                return `
                    <div class="position-selection">
                        <h4>${position}</h4>
                        <select id="position-${position}" class="player-select">
                            <option value="">Select Player</option>
                            ${currentPositionPlayers.length > 0 ? `<optgroup label="--- ${position} Players ---">` : ''}
                            ${currentPositionPlayers.map(player => {
                                const displayName = this.getDisplayedName(player);
                                const isSelected = selectedPlayer && this.getDisplayedName(selectedPlayer) === displayName;
                                return `<option value="${displayName}" ${isSelected ? 'selected' : ''}>${displayName} (${player.poste}${player.posteb ? '/' + player.posteb : ''}${player.postec ? '/' + player.postec : ''})</option>`;
                            }).join('')}
                            ${currentPositionPlayers.length > 0 ? '</optgroup>' : ''}
                            ${otherPositionPlayers.length > 0 && currentPositionPlayers.length > 0 ? '<optgroup label="--- Other Players ---">' : ''}
                            ${otherPositionPlayers.map(player => {
                                const displayName = this.getDisplayedName(player);
                                const isSelected = selectedPlayer && this.getDisplayedName(selectedPlayer) === displayName;
                                return `<option value="${displayName}" ${isSelected ? 'selected' : ''}>${displayName} (${player.poste}${player.posteb ? '/' + player.posteb : ''}${player.postec ? '/' + player.postec : ''})</option>`;
                            }).join('')}
                            ${otherPositionPlayers.length > 0 && currentPositionPlayers.length > 0 ? '</optgroup>' : ''}
                            ${currentPositionPlayers.length === 0 ? sortedPlayers.map(player => {
                                const displayName = this.getDisplayedName(player);
                                const isSelected = selectedPlayer && this.getDisplayedName(selectedPlayer) === displayName;
                                return `<option value="${displayName}" ${isSelected ? 'selected' : ''}>${displayName} (${player.poste}${player.posteb ? '/' + player.posteb : ''}${player.postec ? '/' + player.postec : ''})</option>`;
                            }).join('') : ''}
                        </select>
                    </div>
                `;
            }
        }).join('');

        // Get players not selected as majors for substitutes (only field players, no coaches)
        const majorPlayerNames = Object.values(this.teamComposition.majorPlayers)
            .filter(player => player !== null)
            .map(player => this.getDisplayedName(player!));

        const availableForSubstitutes = fieldPlayers.filter(player =>
            !majorPlayerNames.includes(this.getDisplayedName(player))
        );

        // Get already selected substitutes (excluding current index)
        const getSelectedSubstitutes = (excludeIndex?: number) => {
            return this.teamComposition.substitutes
                .map((sub, idx) => ({ player: sub, index: idx }))
                .filter(({ player, index }) =>
                    player && this.getDisplayedName(player) && index !== excludeIndex
                )
                .map(({ player }) => this.getDisplayedName(player));
        };

        // Substitutes Section
        const substitutesHTML = this.teamComposition.substitutes.map((player, index) => {
            const displayName = this.getDisplayedName(player);
            const alreadySelectedSubstitutes = getSelectedSubstitutes(index);

            // Filter out already selected substitutes from available players
            const availableForThisSubstitute = availableForSubstitutes.filter(p =>
                !alreadySelectedSubstitutes.includes(this.getDisplayedName(p))
            );

            // Sort available substitutes by position
            const sortedAvailableForSubstitutes = availableForThisSubstitute.sort((a, b) => {
                if (a.poste < b.poste) return -1;
                if (a.poste > b.poste) return 1;
                return 0;
            });

            return `
                <div class="substitute-selection">
                    <select class="substitute-select" data-index="${index}">
                        <option value="">Select Substitute ${index + 1}</option>
                        ${sortedAvailableForSubstitutes.map(p => {
                            const pDisplayName = this.getDisplayedName(p);
                            return `<option value="${pDisplayName}" ${pDisplayName === displayName ? 'selected' : ''}>${pDisplayName} (${p.poste}${p.posteb ? '/' + p.posteb : ''}${p.postec ? '/' + p.postec : ''})</option>`;
                        }).join('')}
                    </select>
                    ${index >= 5 ? `<button class="btn btn-remove" onclick="TeamCompositionModal.removeSubstitute(${index})">Remove</button>` : ''}
                </div>
            `;
        }).join('');

        return `
            <div class="step-content">
                <div class="match-summary">
                    <h3>Match Summary</h3>
                    <div class="match-summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Opposite Team:</span>
                            <span class="summary-value">${this.teamComposition.matchInfo.oppositeTeam || 'TBD'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Location:</span>
                            <span class="summary-value">${this.teamComposition.matchInfo.location || 'TBD'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Date:</span>
                            <span class="summary-value">${this.teamComposition.matchInfo.date || 'TBD'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Time:</span>
                            <span class="summary-value">${this.teamComposition.matchInfo.time || 'TBD'}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Meeting Place:</span>
                            <span class="summary-value">${this.teamComposition.matchInfo.meetingPlace || 'TBD'}</span>
                        </div>
                    </div>
                </div>

                <div class="team-selection-container">
                    <div class="major-players-section">
                        <h3>Major Players (8 positions including Coach)</h3>
                        <div class="positions-grid">
                            ${positionsHTML}
                        </div>
                    </div>

                    <div class="substitutes-section">
                        <h3>Substitutes (5 base positions + up to 2 additional)</h3>
                        <div class="substitutes-container">
                            ${substitutesHTML}
                            ${this.teamComposition.substitutes.length < 7 ?
                                '<button class="btn btn-add" id="add-substitute-btn">Add Additional Substitute</button>' :
                                '<p class="max-substitutes">Maximum substitutes reached (7)</p>'
                            }
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <button class="btn btn-warning" id="clear-saved-btn" title="Clear all saved player selections">🗑️ Clear Saved Data</button>
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createSummaryStep(): string {
        // Get selected major players (excluding coach)
        const majorPlayers = Object.entries(this.teamComposition.majorPlayers)
            .filter(([position, player]) => position !== 'COACH' && player !== null)
            .map(([_, player]) => player!);

        // Get selected coach
        const coach = this.teamComposition.majorPlayers[Post.COACH];

        // Get selected substitutes (only non-empty ones)
        const substitutes = this.teamComposition.substitutes.filter(player =>
            player && this.getDisplayedName(player) && this.getDisplayedName(player) !== 'Unknown'
        );

        // Generate player cards using PlayerHelper
        const majorPlayersHTML = majorPlayers.map(player => PlayerHelper.createPlayer(player)).join('');
        const substitutesHTML = substitutes.map(player => PlayerHelper.createPlayer(player)).join('');
        const coachHTML = coach ? PlayerHelper.createPlayer(coach) : '';

        return `
            <div class="step-content summary-content">
                <h1 class="match-day-title">Match Day</h1>
                <h2 class="match-title">Montigny vs ${this.teamComposition.matchInfo.oppositeTeam || 'TBD'}</h2>

                <div class="players-summary">
                    ${majorPlayers.length > 0 ? `
                        <div class="section-wrapper">
                            <h3 class="section-heading">Major Players (${majorPlayers.length})</h3>
                            <div class="players-section">
                                ${majorPlayersHTML}
                            </div>
                        </div>
                    ` : ''}

                    ${substitutes.length > 0 ? `
                        <div class="section-wrapper">
                            <h3 class="section-heading">Substitutes (${substitutes.length})</h3>
                            <div class="players-section">
                                ${substitutesHTML}
                            </div>
                        </div>
                    ` : ''}

                    ${coach ? `
                        <div class="section-wrapper">
                            <h3 class="section-heading">Coach</h3>
                            <div class="coaching-staff-section">
                                ${coachHTML}
                            </div>
                        </div>
                    ` : ''}
                </div>

                <div class="match-details">
                    <h3>Match Details</h3>
                    <div class="match-details-grid">
                        <div class="detail-item">
                            <span class="detail-label">Date:</span>
                            <span class="detail-value">${this.teamComposition.matchInfo.date || 'TBD'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Time:</span>
                            <span class="detail-value">${this.teamComposition.matchInfo.time || 'TBD'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${this.teamComposition.matchInfo.location || 'TBD'}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Meeting Place:</span>
                            <span class="detail-value">${this.teamComposition.matchInfo.meetingPlace || 'TBD'}</span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <button class="export-btn btn-export" id="export-summary-btn">📸 Export as JPEG</button>
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

        // Export summary button
        const exportBtn = document.getElementById('export-summary-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSummaryAsImage());
        }

        // Add substitute button
        const addSubBtn = document.getElementById('add-substitute-btn');
        if (addSubBtn) {
            addSubBtn.addEventListener('click', () => this.addSubstitute(team));
        }

        // Clear saved data button
        const clearBtn = document.getElementById('clear-saved-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSavedData(team));
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
        // Allow proceeding without filling match details - they will show as 'TBD' in summary
        return true;
    }

    private static validateMajorPlayers(): boolean {
        const selectedCount = Object.values(this.teamComposition.majorPlayers)
            .filter(player => player !== null).length;

        if (selectedCount < 8) {
            alert('Please select all 8 major players (including coach).');
            return false;
        }
        return true;
    }

    private static saveMatchInfo(): void {
        this.teamComposition.matchInfo = {
            oppositeTeam: (document.getElementById('opposite-team') as HTMLInputElement).value || 'TBD',
            location: (document.getElementById('location') as HTMLInputElement).value || 'TBD',
            date: (document.getElementById('match-date') as HTMLInputElement).value || 'TBD',
            time: (document.getElementById('match-time') as HTMLInputElement).value || 'TBD',
            meetingPlace: (document.getElementById('meeting-place') as HTMLInputElement).value || 'TBD'
        };
    }

    private static updateMajorPlayer(position: string, playerName: string, team: Team): void {
        const players = this.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);
        this.teamComposition.majorPlayers[position] = player || null;
        // Save to cookie whenever a player is updated
        this.saveToCookie(team);
        // Update modal content to refresh dropdown lists and exclude selected players
        this.updateModalContent(team);
    }

    private static updateSubstitute(index: number, playerName: string, team: Team): void {
        const players = this.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);
        if (player) {
            this.teamComposition.substitutes[index] = player;
        } else {
            this.teamComposition.substitutes[index] = {} as Player;
        }
        // Save to cookie whenever a substitute is updated
        this.saveToCookie(team);
        // Update modal content to refresh dropdown lists and exclude selected players
        this.updateModalContent(team);
    }

    public static addSubstitute(team: Team): void {
        if (this.teamComposition.substitutes.length < 7) {
            // Add empty slot for additional substitutes (beyond the 5 base positions)
            this.teamComposition.substitutes.push({} as Player);
            // Save to cookie when adding a substitute slot
            this.saveToCookie(team);
            this.updateModalContent(team);
        }
    }

    public static clearSavedData(team: Team): void {
        // Ask for confirmation before clearing
        if (confirm('Are you sure you want to clear all saved player selections? This cannot be undone.')) {
            // Clear the cookie
            this.clearCookie(team);
            // Reset composition to blank state
            this.resetComposition();
            // Update the modal content to reflect the cleared state
            this.updateModalContent(team);
            // Show confirmation message
            alert('Saved player selections have been cleared successfully.');
        }
    }

    public static removeSubstitute(index: number): void {
        // Only allow removing additional substitutes (index >= 5), not the base 5 positions
        if (index >= 5) {
            this.teamComposition.substitutes.splice(index, 1);
            // Force a page refresh to update the UI - in a real app you'd want better state management
            const modal = document.querySelector('.composition-modal-overlay');
            if (modal) {
                modal.remove();
            }
        }
    }

    private static finishComposition(): void {
        // Since validation is now done in step 2 transition, we can directly finish
        console.log('Team Composition Complete:', this.teamComposition);
        alert('Team composition saved successfully!');
        this.closeModal(document.querySelector('.composition-modal-overlay') as HTMLElement);
    }

    public static async exportSummaryAsImage(): Promise<void> {
        const summarySection = document.querySelector('.summary-content') as HTMLElement;

        if (!summarySection) {
            alert('No summary section found to export');
            return;
        }

        const teamName = this.teamComposition.matchInfo.oppositeTeam || 'TBD';
        const fileName = `match-summary-montigny-vs-${teamName.toLowerCase().replace(/\s+/g, '-')}`;

        return ExportHelper.exportSummaryAsImage(summarySection, fileName);
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
