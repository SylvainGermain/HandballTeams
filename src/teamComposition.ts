import './teamComposition.css';
import { Player, Post, Team, TeamCompositionSummary } from './model';
import { ExportHelper, SummaryExportMode } from './export';
import { Resources } from './resources';
import { SummaryRenderer, PlayerLayout, PlayerSectionOptions } from './summaryRenderer';
import html2canvas from 'html2canvas';

export class TeamCompositionModal {
    private static currentStep: number = 1;
    private static teamCompositionSummary: TeamCompositionSummary = TeamCompositionModal.initComposition();

    public static show(team: Team): void {
        this.currentStep = 1;
        this.resetComposition();
        this.loadFromCookie(team);
        this.createModal(team);
    }

    private static resetComposition() {
        this.teamCompositionSummary = this.initComposition();
    }

    private static initComposition(): TeamCompositionSummary{
        return {
            matchInfo: {
                oppositeTeam: '',
                location: '',
                date: '',
                time: '',
                meetingPlace: '',
                isHome: true
            },
            majorPlayers: [],
            coach: null,
            substitutes: [],
            summary: {
                totalPlayers: 0,
                majorPlayersCount: 0,
                substitutesCount: 0,
                hasCoach: false
            },
            matchResults: null,
            createdAt: new Date().toISOString()
        };
    }

    private static saveToCookie(team: Team): void {
        if (!this.teamCompositionSummary) return;

        try {
            const cookieData = {
                teamId: team.id,
                summaryJSON: this.teamCompositionSummary
            };

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

            if (!cookieData?.summaryJSON) return;

            // Load the teamCompositionSummary directly
            this.teamCompositionSummary = cookieData.summaryJSON;
        } catch (error) {
            console.warn('Failed to load team composition from cookie:', error);
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
        modalContent.className = 'modal-content';
        modalContent.id = 'composition-modal-content';

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

        // // Close modal when clicking outside
        // modalOverlay.addEventListener('mousedown', (e) => {
        //     if (e.target === modalOverlay) {
        //         this.closeModal(modalOverlay);
        //     }
        // });

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
        } else if (this.currentStep === 4) {
            content = this.createMatchResultsStep();
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
                <div class="step ${this.currentStep >= 3 ? 'active' : ''} ${this.currentStep > 3 ? 'completed' : ''}">
                    <span class="step-number">3</span>
                    <span class="step-label">Summary</span>
                </div>
                <div class="step ${this.currentStep >= 4 ? 'active' : ''}">
                    <span class="step-number">4</span>
                    <span class="step-label">Match Results</span>
                </div>
            </div>
        `;
    }

    private static createMatchInfoStep(): string {
        const matchInfo = this.teamCompositionSummary?.matchInfo || {
            oppositeTeam: '',
            location: '',
            date: '',
            time: '',
            meetingPlace: '',
            isHome: true
        };

        // Get adversaire data for the dropdown
        let adversaireOptions = '';
        try {
            const adversaires = Resources.getAdversaire(); // Empty string as parameter since it's not used
            adversaireOptions = adversaires.map(adversaire => {
                return `<option value="${adversaire.nom}"></option>`;
            }).join('');
        } catch (error) {
            console.warn('Failed to load adversaire data:', error);
            // Fallback to empty options if adversaire data is not available
        }

        return `
            <div class="step-content">
                <h3>Match Information</h3>
                <form class="match-info-form">
                    <div class="form-group-compo">
                        <label for="opposite-team">Opposite Team:</label>
                        <input type="text" id="opposite-team" list="adversaire-list" value="${matchInfo.oppositeTeam}" placeholder="Select from list or type opponent team name" autocomplete="off">
                        <datalist id="adversaire-list">
                            ${adversaireOptions}
                        </datalist>
                    </div>
                    <div class="form-group-compo">
                        <label for="location">Location:</label>
                        <input type="text" id="location" value="${matchInfo.location}" placeholder="Enter match location">
                    </div>
                    <div class="form-row">
                        <div class="form-group-compo">
                            <label for="match-date">Date:</label>
                            <input type="date" id="match-date" value="${matchInfo.date}">
                        </div>
                        <div class="form-group-compo">
                            <label for="match-time">Time:</label>
                            <input type="time" id="match-time" value="${matchInfo.time}">
                        </div>
                    </div>
                    <div class="form-group-compo">
                        <label for="meeting-place">Meeting Place:</label>
                        <input type="text" id="meeting-place" value="${matchInfo.meetingPlace}" placeholder="Enter meeting location">
                    </div>
                    <div class="form-group-compo">
                        <label class="checkbox-label">
                            <input type="checkbox" id="is-home" ${matchInfo.isHome ? 'checked' : ''}>
                            <span class="checkbox-text">Montigny is receiving (playing at home)</span>
                        </label>
                    </div>
                </form>

                <div class="step-actions">
                    <button class="btn btn-warning" id="clear-match-data-btn" title="Clear all match information">🗑️ Clear Match Data</button>
                    <input type="file" id="load-composition-file" accept=".json" style="display: none;" load-mode="all">
                    <button class="btn btn-info" id="load-composition-btn">📁 Load Match </button>
                    <button class="btn btn-save" id="save-composition-btn">💾 Save Match</button>
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createTeamSelectionStep(team: Team): string {

        const players = Resources.getPlayersData(team.id);
        const coachPlayers = players.filter(p => p.poste === 'COACH');
        const fieldPlayers = players.filter(p => p.poste !== 'COACH');

        // Get all already selected major players
        const getSelectedMajorPlayers = (excludePosition?: string) => {
            if (!this.teamCompositionSummary) return [];
            const selectedPlayers = [];

            // Add major players
            for (const majorPlayer of this.teamCompositionSummary.majorPlayers) {
                if (majorPlayer.position !== excludePosition) {
                    selectedPlayers.push(this.getDisplayedName(majorPlayer.player));
                }
            }

            // Add coach if not excluded
            if (this.teamCompositionSummary.coach && excludePosition !== 'COACH') {
                selectedPlayers.push(this.getDisplayedName(this.teamCompositionSummary.coach));
            }

            return selectedPlayers;
        };

        // Major Players Section
        const positionsHTML = Object.values(Post).map(position => {
            const alreadySelectedMajors = getSelectedMajorPlayers(position);
            let selectedPlayer = null;

            if (position === 'COACH') {
                selectedPlayer = this.teamCompositionSummary?.coach || null;
            } else {
                selectedPlayer = this.teamCompositionSummary?.majorPlayers.find(mp => mp.position === position)?.player || null;
            }            if (position === 'COACH') {
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
        const majorPlayerNames: string[] = [];
        if (this.teamCompositionSummary) {
            // Add major players
            for (const majorPlayer of this.teamCompositionSummary.majorPlayers) {
                majorPlayerNames.push(this.getDisplayedName(majorPlayer.player));
            }
            // Add coach
            if (this.teamCompositionSummary.coach) {
                majorPlayerNames.push(this.getDisplayedName(this.teamCompositionSummary.coach));
            }
        }

        const availableForSubstitutes = fieldPlayers.filter(player =>
            !majorPlayerNames.includes(this.getDisplayedName(player))
        );

        // Get already selected substitutes (excluding current index)
        const getSelectedSubstitutes = (excludeIndex?: number) => {
            if (!this.teamCompositionSummary) return [];
            return this.teamCompositionSummary.substitutes
                .map((sub, idx) => ({ player: sub, index: idx }))
                .filter(({ player, index }) =>
                    player && this.getDisplayedName(player) && index !== excludeIndex
                )
                .map(({ player }) => this.getDisplayedName(player));
        };

        // Ensure we have at least 5 substitute slots
        const substituteSlots = Math.max(5, this.teamCompositionSummary?.substitutes.length || 0);
        const substitutesArray = Array.from({ length: substituteSlots }, (_, index) =>
            this.teamCompositionSummary?.substitutes[index] || null
        );        // Substitutes Section
        const substitutesHTML = substitutesArray.map((player, index) => {
            const displayName = player ? this.getDisplayedName(player) : '';
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

        const matchInfo = this.teamCompositionSummary?.matchInfo || {
            oppositeTeam: 'TBD',
            location: 'TBD',
            date: 'TBD',
            time: 'TBD',
            meetingPlace: 'TBD',
            isHome: true
        };

        return `
            <div class="step-content">
                <div class="match-summary">
                    <h3>Match Summary</h3>
                    <div class="match-summary-grid">
                        <div class="summary-item">
                            <span class="summary-label">Opposite Team:</span>
                            <span class="summary-value">${matchInfo.oppositeTeam}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Location:</span>
                            <span class="summary-value">${matchInfo.location}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Date:</span>
                            <span class="summary-value">${matchInfo.date}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Time:</span>
                            <span class="summary-value">${matchInfo.time}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Meeting Place:</span>
                            <span class="summary-value">${matchInfo.meetingPlace}</span>
                        </div>
                        <div class="summary-item">
                            <span class="summary-label">Match Type:</span>
                            <span class="summary-value">${matchInfo.isHome ? '🏠 Home Game (Receiving)' : '✈️ Away Game'}</span>
                        </div>
                    </div>
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn-top">Previous</button>
                    <button class="btn btn-warning" id="clear-saved-btn-top" title="Clear all saved player selections">🗑️ Clear Saved Data</button>
                    <input type="file" id="load-composition-file" accept=".json" style="display: none;" load-mode="composition">
                    <button class="btn btn-info" id="load-composition-btn" load-mode="composition">📁 Load Composition</button>
                    <button class="btn btn-save" id="save-composition-btn">💾 Save Match</button>
                    <button class="btn btn-primary" id="next-step-btn-top">Next Step</button>
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
                            ${substituteSlots < 7 ?
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
        this.updateSummaryCounts();

        // Default options for the summary step
        const stack: PlayerSectionOptions = {
            layout: PlayerLayout.GRID
        };

        return `
            <div class="step-content summary-content">
                ${SummaryRenderer.createSummaryTitle(this.teamCompositionSummary)}
                ${SummaryRenderer.createPlayersAndCoachSection(this.teamCompositionSummary, stack)}
                ${SummaryRenderer.createMatchDetailsSection(this.teamCompositionSummary)}

                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <button class="btn btn-export" id="export-summary-btn">📸 Export as JPEG</button>
                    <button class="btn btn-save" id="save-composition-btn">💾 Save Match</button>
                    <button class="btn btn-primary" id="next-step-btn">Next Step</button>
                </div>
            </div>
        `;
    }

    private static createMatchResultsStep(): string {
        const matchResults = this.teamCompositionSummary?.matchResults || {
            homeScore: 0,
            awayScore: 0,
            matchStatus: 'pending' as const,
            highlights: [],
            postMatchNotes: ''
        };

        const matchInfo = this.teamCompositionSummary?.matchInfo || {
            oppositeTeam: 'TBD',
            location: 'TBD',
            date: 'TBD',
            time: 'TBD',
            meetingPlace: 'TBD',
            isHome: true
        };

        return `
            <div class="step-content">
                <h3>Match Results</h3>
                <div class="match-results-form">
                    <div class="score-section">
                        <h4>Final Score</h4>
                        <div class="score-input-container">
                            <div class="team-score">
                                <label for="home-score">${matchInfo.isHome ? 'Montigny' : matchInfo.oppositeTeam} (Home):</label>
                                <input type="number" id="home-score" value="${matchResults.homeScore}" min="0" max="99">
                            </div>
                            <div class="score-separator">-</div>
                            <div class="team-score">
                                <label for="away-score">${matchInfo.isHome ? matchInfo.oppositeTeam : 'Montigny'} (Away):</label>
                                <input type="number" id="away-score" value="${matchResults.awayScore}" min="0" max="99">
                            </div>
                        </div>
                    </div>


                    <div class="highlights-section">
                        <h4>Match Highlights</h4>
                        <div class="highlights-container">
                            ${matchResults.highlights.map((highlight, index) => `
                                <div class="highlight-item">
                                    <input type="text" class="highlight-input" data-index="${index}" value="${highlight}" placeholder="Enter match highlight">
                                    <button class="btn btn-remove-small" onclick="TeamCompositionModal.removeHighlight(${index})">×</button>
                                </div>
                            `).join('')}
                            <button class="btn btn-add-small" id="add-highlight-btn">+ Add Highlight</button>
                        </div>
                    </div>

                    <div class="post-match-notes-section">
                        <h4>Post-Match Notes</h4>
                        <textarea id="post-match-notes" placeholder="Add any additional notes about the match...">${matchResults.postMatchNotes}</textarea>
                    </div>
                </div>

                <div class="step-actions">
                    <button class="btn btn-secondary" id="prev-step-btn">Previous</button>
                    <input type="file" id="load-composition-file" accept=".json" style="display: none;" load-mode="all">
                    <button class="btn btn-info" id="load-composition-btn">📁 Load Match </button>
                    <button class="btn btn-export" id="export-match-result-btn">📱 Export for Social Media</button>
                    <button class="btn btn-success" id="finish-composition-btn">Finish</button>
                </div>
            </div>
        `;
    }

    private static addEventListeners(team: Team): void {
        // Next step buttons (both top and bottom)
        const nextBtns = document.querySelectorAll('#next-step-btn, #next-step-btn-top');
        nextBtns.forEach(btn => {
            btn.addEventListener('click', () => this.nextStep(team));
        });

        // Previous step buttons (both top and bottom)
        const prevBtns = document.querySelectorAll('#prev-step-btn, #prev-step-btn-top');
        prevBtns.forEach(btn => {
            btn.addEventListener('click', () => this.previousStep(team));
        });

        // Clear saved data buttons (both top and bottom)
        const clearBtns = document.querySelectorAll('#clear-saved-btn, #clear-saved-btn-top');
        clearBtns.forEach(btn => {
            btn.addEventListener('click', () => this.clearSavedData(team));
        });

        // Clear match data button (step 1 only)
        const clearMatchDataBtn = document.getElementById('clear-match-data-btn');
        if (clearMatchDataBtn) {
            clearMatchDataBtn.addEventListener('click', () => this.clearMatchData(team));
        }

        // Finish composition button
        const finishBtn = document.getElementById('finish-composition-btn');
        if (finishBtn) {
            finishBtn.addEventListener('click', () => this.finishComposition());
        }

        // Export summary button
        const exportBtn = document.getElementById('export-summary-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSummary(SummaryExportMode.PREMATCH));
        }

        // Save composition button
        const saveCompositionBtn = document.getElementById('save-composition-btn');
        if (saveCompositionBtn) {
            saveCompositionBtn.addEventListener('click', () => this.saveCompositionToFile());
        }

        // Load composition button and file input
        const loadCompositionBtn = document.getElementById('load-composition-btn');
        const loadCompositionFile = document.getElementById('load-composition-file') as HTMLInputElement;

        if (loadCompositionBtn) {
            loadCompositionBtn.addEventListener('click', () => {
                loadCompositionFile?.click();
            });
        }

        if (loadCompositionFile) {
            loadCompositionFile.addEventListener('change', (eL: Event) => {
                const target = eL.target as HTMLInputElement;
                const onlyComposition = target.getAttribute('data-team-id') === 'composition';
                this.loadCompositionFromFile(eL, team, onlyComposition);
            });
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

        // Match results event listeners
        this.addMatchResultsEventListeners(team);
    }

    private static addMatchResultsEventListeners(team: Team): void {
        // Score inputs
        const homeScoreInput = document.getElementById('home-score') as HTMLInputElement;
        const awayScoreInput = document.getElementById('away-score') as HTMLInputElement;

        if (homeScoreInput) {
            homeScoreInput.addEventListener('change', () => this.updateMatchResults(team));
        }
        if (awayScoreInput) {
            awayScoreInput.addEventListener('change', () => this.updateMatchResults(team));
        }

        // Status buttons
        const statusBtns = document.querySelectorAll('.status-btn');
        statusBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLButtonElement;
                const status = target.dataset.status as 'victory' | 'defeat' | 'draw' | 'pending';
                this.setMatchStatus(status, team);
            });
        });

        // Highlight inputs
        const highlightInputs = document.querySelectorAll('.highlight-input');
        highlightInputs.forEach(input => {
            input.addEventListener('change', () => this.updateMatchResults(team));
        });

        // Add highlight button
        const addHighlightBtn = document.getElementById('add-highlight-btn');
        if (addHighlightBtn) {
            addHighlightBtn.addEventListener('click', () => this.addHighlight(team));
        }

        // Post-match notes
        const postMatchNotes = document.getElementById('post-match-notes') as HTMLTextAreaElement;
        if (postMatchNotes) {
            postMatchNotes.addEventListener('change', () => this.updateMatchResults(team));
        }

        // Export match result button
        const exportMatchResultBtn = document.getElementById('export-match-result-btn');
        if (exportMatchResultBtn) {
            exportMatchResultBtn.addEventListener('click', () => this.exportMatchResults());
        }
    }

    private static nextStep(team: Team): void {
        if (this.currentStep === 1) {
            if (this.validateMatchInfo()) {
                this.saveMatchInfo(team);
                this.currentStep = 2;
                this.updateModalContent(team);
            }
        } else if (this.currentStep === 2) {
            if (this.validateMajorPlayers()) {
                this.currentStep = 3;
                this.updateModalContent(team);
            }
        } else if (this.currentStep === 3) {
            this.currentStep = 4;
            this.updateModalContent(team);
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
        if (!this.teamCompositionSummary) return false;

        const totalSelected = this.teamCompositionSummary.majorPlayers.length + (this.teamCompositionSummary.coach ? 1 : 0);

        if (totalSelected < 8) {
            alert('Please select all 8 major players (including coach).');
            return false;
        }
        return true;
    }

    private static saveMatchInfo(team: Team): void {
        // Get opposite team value from the input field (which can be filled from datalist or typed manually)
        const oppositeTeamInput = document.getElementById('opposite-team') as HTMLInputElement;
        const isHomeCheckbox = document.getElementById('is-home') as HTMLInputElement;

        this.teamCompositionSummary!.matchInfo = {
            oppositeTeam: oppositeTeamInput?.value || 'TBD',
            location: (document.getElementById('location') as HTMLInputElement).value || 'TBD',
            date: (document.getElementById('match-date') as HTMLInputElement).value || 'TBD',
            time: (document.getElementById('match-time') as HTMLInputElement).value || 'TBD',
            meetingPlace: (document.getElementById('meeting-place') as HTMLInputElement).value || 'TBD',
            isHome: isHomeCheckbox?.checked ?? true
        };

        // Save the updated match info to cookies
        this.saveToCookie(team);
    }    private static updateMajorPlayer(position: string, playerName: string, team: Team): void {

        const players = Resources.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);

        if (position === 'COACH') {
            // Update coach
            this.teamCompositionSummary!.coach = player || null;
        } else {
            // Update major player
            if (player) {
                // Remove existing player at this position if any
                this.teamCompositionSummary!.majorPlayers = this.teamCompositionSummary!.majorPlayers.filter(mp => mp.position !== position);
                // Add new player
                this.teamCompositionSummary!.majorPlayers.push({
                    position,
                    player: player
                });
            } else {
                // Remove player from this position
                this.teamCompositionSummary!.majorPlayers = this.teamCompositionSummary!.majorPlayers.filter(mp => mp.position !== position);
            }
        }

        // Update summary counts
        this.updateSummaryCounts();

        // Save to cookie whenever a player is updated
        this.saveToCookie(team);
        // Update modal content to refresh dropdown lists and exclude selected players
        this.updateModalContent(team);
    }

    private static updateSubstitute(index: number, playerName: string, team: Team): void {

        const players = Resources.getPlayersData(team.id);
        const player = players.find(p => this.getDisplayedName(p) === playerName);

        // Ensure substitutes array is large enough
        while (this.teamCompositionSummary!.substitutes.length <= index) {
            this.teamCompositionSummary!.substitutes.push({} as Player);
        }

        if (player) {
            this.teamCompositionSummary!.substitutes[index] = player;
        } else {
            // Remove the substitute
            this.teamCompositionSummary!.substitutes.splice(index, 1);
        }

        // Update summary counts
        this.updateSummaryCounts();

        // Save to cookie whenever a substitute is updated
        this.saveToCookie(team);
        // Update modal content to refresh dropdown lists and exclude selected players
        this.updateModalContent(team);
    }

    private static updateSummaryCounts(): void {
        if (!this.teamCompositionSummary) return;

        this.teamCompositionSummary.summary = {
            totalPlayers: this.teamCompositionSummary.majorPlayers.length + this.teamCompositionSummary.substitutes.length + (this.teamCompositionSummary.coach ? 1 : 0),
            majorPlayersCount: this.teamCompositionSummary.majorPlayers.length,
            substitutesCount: this.teamCompositionSummary.substitutes.length,
            hasCoach: this.teamCompositionSummary.coach !== null
        };
    }

    public static addSubstitute(team: Team): void {

        if (this.teamCompositionSummary!.substitutes.length < 7) {
            // Add empty slot for additional substitutes (beyond the 5 base positions)
            this.teamCompositionSummary!.substitutes.push({} as Player);
            // Update summary counts
            this.updateSummaryCounts();
            // Save to cookie when adding a substitute slot
            this.saveToCookie(team);
            this.updateModalContent(team);
        }
    }

    public static clearSavedData(team: Team): void {
        // Ask for confirmation before clearing
        if (confirm('Are you sure you want to clear all saved player selections? This will keep match information but clear all player selections.')) {
            // Store current match info before clearing
            const currentMatchInfo = this.teamCompositionSummary?.matchInfo || this.initComposition().matchInfo;

            // Reset composition to blank state
            this.resetComposition();

            // Restore the match info
            this.teamCompositionSummary!.matchInfo = currentMatchInfo;

            // Save to cookie to persist the cleared composition with preserved match info
            this.saveToCookie(team);
            // Update the modal content to reflect the cleared state
            this.updateModalContent(team);
            // Show confirmation message
            alert('Player selections have been cleared successfully. Match information has been preserved.');
        }
    }

    public static clearMatchData(team: Team): void {
        // Ask for confirmation before clearing
        if (confirm('Are you sure you want to clear all match information? This will only clear the match details, not player selections.')) {
            // Reset only the match info
            this.teamCompositionSummary!.matchInfo = {
                oppositeTeam: '',
                location: '',
                date: '',
                time: '',
                meetingPlace: '',
                isHome: true
            };
            // Save to cookie to persist the cleared match data
            this.saveToCookie(team);
            // Update the modal content to reflect the cleared match info
            this.updateModalContent(team);
            // Show confirmation message
            alert('Match information has been cleared successfully.');
        }
    }

    // Match Results Methods
    private static updateMatchResults(team: Team): void {
        if (!this.teamCompositionSummary) return;

        // Initialize matchResults if it doesn't exist
        if (!this.teamCompositionSummary.matchResults) {
            this.teamCompositionSummary.matchResults = {
                homeScore: 0,
                awayScore: 0,
                matchStatus: 'pending',
                highlights: [],
                postMatchNotes: ''
            };
        }

        // Update scores
        const homeScoreInput = document.getElementById('home-score') as HTMLInputElement;
        const awayScoreInput = document.getElementById('away-score') as HTMLInputElement;

        if (homeScoreInput) {
            this.teamCompositionSummary.matchResults.homeScore = parseInt(homeScoreInput.value) || 0;
        }
        if (awayScoreInput) {
            this.teamCompositionSummary.matchResults.awayScore = parseInt(awayScoreInput.value) || 0;
        }

        // Update highlights
        const highlightInputs = document.querySelectorAll('.highlight-input') as NodeListOf<HTMLInputElement>;
        this.teamCompositionSummary.matchResults.highlights = Array.from(highlightInputs)
            .map(input => input.value.trim())
            .filter(value => value !== '');

        // Update post-match notes
        const postMatchNotes = document.getElementById('post-match-notes') as HTMLTextAreaElement;
        if (postMatchNotes) {
            this.teamCompositionSummary.matchResults.postMatchNotes = postMatchNotes.value;
        }

        // Auto-determine match status based on scores if not manually set
        if (this.teamCompositionSummary.matchResults.matchStatus === 'pending') {
            const homeScore = this.teamCompositionSummary.matchResults.homeScore;
            const awayScore = this.teamCompositionSummary.matchResults.awayScore;

            if (homeScore > awayScore) {
                this.teamCompositionSummary.matchResults.matchStatus = 'victory';
            } else if (homeScore < awayScore) {
                this.teamCompositionSummary.matchResults.matchStatus = 'defeat';
            } else if (homeScore === awayScore && homeScore > 0) {
                this.teamCompositionSummary.matchResults.matchStatus = 'draw';
            }
        }

        // Save to cookie
        this.saveToCookie(team);
    }

    private static setMatchStatus(status: 'victory' | 'defeat' | 'draw' | 'pending', team: Team): void {
        if (!this.teamCompositionSummary) return;

        // Initialize matchResults if it doesn't exist
        if (!this.teamCompositionSummary.matchResults) {
            this.teamCompositionSummary.matchResults = {
                homeScore: 0,
                awayScore: 0,
                matchStatus: 'pending',
                highlights: [],
                postMatchNotes: ''
            };
        }

        this.teamCompositionSummary.matchResults.matchStatus = status;

        // Update button states
        const statusBtns = document.querySelectorAll('.status-btn');
        statusBtns.forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-status') === status) {
                btn.classList.add('active');
            }
        });

        // Save to cookie
        this.saveToCookie(team);
    }

    public static addHighlight(team: Team): void {
        if (!this.teamCompositionSummary) return;

        // Initialize matchResults if it doesn't exist
        if (!this.teamCompositionSummary.matchResults) {
            this.teamCompositionSummary.matchResults = {
                homeScore: 0,
                awayScore: 0,
                matchStatus: 'pending',
                highlights: [],
                postMatchNotes: ''
            };
        }

        this.teamCompositionSummary.matchResults.highlights.push('');
        this.saveToCookie(team);
        this.updateModalContent(team);
    }

    public static removeHighlight(index: number): void {
        if (!this.teamCompositionSummary?.matchResults) return;

        this.teamCompositionSummary.matchResults.highlights.splice(index, 1);
        // For simplicity, we'll reload the modal - in a real app you'd want better state management
        const team = { id: 'current', name: 'Current Team', description: '' }; // This is a simplified approach
        this.updateModalContent(team);
    }

    private static async exportMatchResults(): Promise<void> {
        if (!this.teamCompositionSummary?.matchResults) {
            alert('No match results to export.');
            return;
        }

        try {
            // Show progress message
            const exportBtn = document.getElementById('export-match-result-btn') as HTMLButtonElement;
            if (exportBtn) {
                exportBtn.textContent = 'Creating GIF...';
                exportBtn.disabled = true;
            }

            // Create 3 frames for the GIF
            const frames = await this.createMatchResultFrames();

            if (frames.length === 0) {
                throw new Error('Failed to create all frames');
            }

            const progressCallback = (_: number) => {};
            const endCallback = () => {};

            const matchInfo = this.teamCompositionSummary!.matchInfo;
            const matchResults = this.teamCompositionSummary!.matchResults!;
            const opponentName = matchInfo.oppositeTeam || 'Unknown';
            const dateStr = matchInfo.date || 'NoDate';
            const scoreStr = `${matchResults.homeScore}-${matchResults.awayScore}`;

            await ExportHelper.exportGIFFrames(frames, `match-result-montigny-vs-${opponentName.toLowerCase().replace(/\s+/g, '-')}-${scoreStr}-${dateStr}`,
                progressCallback, endCallback);

        } catch (error) {
            console.error('Failed to export match results as GIF:', error);
            alert('Failed to create GIF. Please try again.');
        } finally {
            // Restore button state
            const exportBtn = document.getElementById('export-match-result-btn') as HTMLButtonElement;
            if (exportBtn) {
                exportBtn.textContent = '📱 Export for Social Media';
                exportBtn.disabled = false;
            }
        }
    }

    /**
     * Creates 3 frames for the match result GIF animation
     * Frame 1: Match information and teams
     * Frame 2: Final score reveal
     * Frame 3: Celebration/result status
     */
    private static async createMatchResultFrames(): Promise<HTMLCanvasElement[]> {
        const frames: HTMLCanvasElement[] = [];
        const frameWidth = 1200;
        const frameHeight = 1200;

        try {
            // Frame 1: Match Information and Teams
            const frame1 = await this.createHeadFrame(frameWidth, frameHeight);
            frames.push(frame1);

            // Frame 2: Score Reveal
            const frame2 = await this.createCompoFrame(frameWidth, frameHeight);
            frames.push(frame2);

            // Frame 3: Result Status and Celebration
            const frame3 = await this.createResultFrame(frameWidth, frameHeight);
            frames.push(frame3);

            return frames;
        } catch (error) {
            console.error('Error creating match result frames:', error);
            throw error;
        }
    }

    /**
     * Frame 1: Shows match information, teams, and basic details
     */
    private static async createHeadFrame(width: number, height: number):
        Promise<HTMLCanvasElement> {
        return new Promise( (resolve, reject) => {
            // Create a temporary container to render the composition
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = `${width}px`;
            tempContainer.style.height = `${height}px`;
            tempContainer.style.padding = '20px';
            tempContainer.style.boxSizing = 'border-box';
            tempContainer.classList.add('export-match-summary-container');

            // Generate the composition content (title + players/coach section only)
            tempContainer.innerHTML = `
                <div class="composition-frame-content">
                    ${SummaryRenderer.createSummaryTitle(this.teamCompositionSummary)}
                </div>
            `;

            // Add to DOM temporarily to allow CSS to be applied
            document.body.appendChild(tempContainer);

            try {
                // Capture the composition as canvas
                html2canvas(tempContainer, {
                    width: width,
                    height: height,
                    scale: 1,
                    backgroundColor: 'white',
                    useCORS: false,
                    allowTaint: true
                }).then(canvas => {
                    document.body.removeChild(tempContainer);
                    resolve(canvas);
                });
            } catch (error) {
                console.warn('Failed to render composition with html2canvas, using fallback:', error);
                reject(error);
            }
        });
    }

    /**
     * Frame 2: Shows the team composition with tactical layout
     */
    private static async createCompoFrame(width: number, height: number):
        Promise<HTMLCanvasElement> {
        return new Promise( (resolve, reject) => {
            // Create a temporary container to render the composition
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = `${width}px`;
            tempContainer.style.height = `${height}px`;
            tempContainer.style.padding = '20px';
            tempContainer.style.boxSizing = 'border-box';
            tempContainer.classList.add('export-match-summary-container');

            // Use TACTICAL layout for this frame
            const tacticalOptions: PlayerSectionOptions = {
                layout: PlayerLayout.TACTICAL
            };

            // Generate the composition content (title + players/coach section only)
            tempContainer.innerHTML = `
                <div class="composition-frame-content">
                    ${SummaryRenderer.createSummaryTitle(this.teamCompositionSummary)}
                    ${SummaryRenderer.createPlayersAndCoachSection(this.teamCompositionSummary, tacticalOptions)}
                </div>
            `;

            // Add to DOM temporarily to allow CSS to be applied
            document.body.appendChild(tempContainer);

            try {
                // Capture the composition as canvas
                html2canvas(tempContainer, {
                    width: width,
                    height: height,
                    scale: 1,
                    backgroundColor: 'white',
                    useCORS: false,
                    allowTaint: true
                }).then(canvas => {
                    document.body.removeChild(tempContainer);
                    resolve(canvas);
                });
            } catch (error) {
                console.warn('Failed to render composition with html2canvas, using fallback:', error);
                reject(error);
            }
        });
    }

    /**
     * Frame 3: Shows the result status with appropriate celebration or consolation
     */
    private static async createResultFrame(width: number, height: number):
        Promise<HTMLCanvasElement> {
        return new Promise( (resolve, reject) => {
            // Create a temporary container to render the composition
            const tempContainer = document.createElement('div');
            tempContainer.style.position = 'absolute';
            tempContainer.style.left = '-9999px';
            tempContainer.style.top = '-9999px';
            tempContainer.style.width = `${width}px`;
            tempContainer.style.height = `${height}px`;
            tempContainer.style.padding = '20px';
            tempContainer.style.boxSizing = 'border-box';
            tempContainer.classList.add('export-match-summary-container');

            // Generate the composition content (title + match result section)
            const matchResults = this.teamCompositionSummary!.matchResults!;
            const matchInfo = this.teamCompositionSummary!.matchInfo!;

            const teams = matchInfo.isHome ? ['Montigny', matchInfo.oppositeTeam] : [matchInfo.oppositeTeam, 'Montigny'];
            const classes = matchInfo.isHome ? ['home-team-name', 'away-team-name'] : ['away-team-name', 'home-team-name'];

            // Get team logos
            const team1Logo = Resources.getTeamLogo(teams[0]);
            const team2Logo = Resources.getTeamLogo(teams[1]);

            tempContainer.innerHTML = `
                <div class="composition-frame-content">
                    <div class="match-glow">
                        <h1 class="match-day-title">Final Score</h1>
                        <h2 class="match-title">
                            <div class="team-container-with-watermark" ${team1Logo ? `style="background-size: 300px 300px; background-repeat: no-repeat; background-position: center; background-opacity: 0.3;"` : ''}>
                                ${team1Logo ? `<div class="team-logo-watermark" style="background-image: url('${team1Logo}'); opacity: 0.15;"></div>` : ''}
                                <span class="${classes[0]}">${teams[0]}: ${matchResults.homeScore}</span>
                            </div>
                        </h2>
                        <h2 class="match-title">
                            <span class="match-day-titler"> - </span>
                        </h2>
                        <h2 class="match-title">
                            <div class="team-container-with-watermark" ${team2Logo ? `style="background-size: 300px 300px; background-repeat: no-repeat; background-position: center; background-opacity: 0.3;"` : ''}>
                               ${team2Logo ? `<div class="team-logo-watermark" style="background-image: url('${team2Logo}'); opacity: 0.15;"></div>` : ''}
                               <span class="${classes[1]}">${teams[1]}: ${matchResults.awayScore}</span>

                            </div>
                        </h2>
                    </div>
                </div>
            `;

            // Add to DOM temporarily to allow CSS to be applied
            document.body.appendChild(tempContainer);

            try {
                // Capture the composition as canvas
                html2canvas(tempContainer, {
                    width: width,
                    height: height,
                    scale: 1,
                    backgroundColor: 'white',
                    useCORS: false,
                    allowTaint: true
                }).then(canvas => {
                    document.body.removeChild(tempContainer);
                    resolve(canvas);
                });
            } catch (error) {
                console.warn('Failed to render composition with html2canvas, using fallback:', error);
                reject(error);
            }
        });
    }

    private static saveCompositionToFile(): void {
        if (!this.teamCompositionSummary) {
            alert('No team composition to save.');
            return;
        }

        try {
            // Create a blob with the team composition data
            const compositionData = {
                version: '1.0',
                savedAt: new Date().toISOString(),
                teamComposition: this.teamCompositionSummary
            };

            const jsonString = JSON.stringify(compositionData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;

            // Generate filename based on match info
            const matchInfo = this.teamCompositionSummary.matchInfo;
            const opponentName = matchInfo.oppositeTeam || 'Unknown';
            const matchDate = matchInfo.date || 'NoDate';
            a.download = `team-composition-vs-${opponentName.toLowerCase().replace(/\s+/g, '-')}-${matchDate}.json`;

            // Trigger download
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('Team composition saved successfully! 💾');
        } catch (error) {
            console.error('Failed to save team composition:', error);
            alert('Failed to save team composition. Please try again.');
        }
    }

    private static loadCompositionFromFile(event: Event, team: Team, onlyComposition: boolean): void {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];

        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonContent = e.target?.result as string;
                const loadedData = JSON.parse(jsonContent);

                // Validate the loaded data structure
                if (!loadedData.teamComposition) {
                    throw new Error('Invalid file format: missing teamComposition data');
                }

                const loadedComposition = loadedData.teamComposition as TeamCompositionSummary;

                // Validate required fields
                if (!loadedComposition.matchInfo || !loadedComposition.summary) {
                    throw new Error('Invalid file format: missing required fields');
                }

                // Ask for confirmation before replacing current data


                const confirmMessage = onlyComposition ?
                        `This will replace your current team composition with the loaded data.\n\nLoaded composition:\n- Players: ${loadedComposition.summary.totalPlayers}\n\nDo you want to continue?` :
                        `This will replace your current match information and team composition with the loaded data.\n\nLoaded match information:\n- Opponent: ${loadedComposition.matchInfo.oppositeTeam || 'TBD'}\n- Date: ${loadedComposition.matchInfo.date || 'TBD'}\n- Players: ${loadedComposition.summary.totalPlayers}\n\nDo you want to continue?`;

                if (confirm(confirmMessage)) {
                    // Replace current composition with loaded data
                    if (onlyComposition) {
                        this.teamCompositionSummary.majorPlayers = loadedComposition.majorPlayers;
                        this.teamCompositionSummary.coach = loadedComposition.coach;
                        this.teamCompositionSummary.substitutes = loadedComposition.substitutes;
                    } else {
                        this.teamCompositionSummary = loadedComposition;
                    }

                    this.updateSummaryCounts();
// Save to cookie for persistence
                    this.saveToCookie(team);

                    // Update the modal content to reflect the loaded data
                    this.updateModalContent(team);

                    alert('Team composition loaded successfully! 📁');
                }
            } catch (error) {
                console.error('Failed to load team composition:', error);
                alert('Failed to load team composition. Please ensure you selected a valid composition file.');
            } finally {
                // Clear the file input
                input.value = '';
            }
        };

        reader.onerror = () => {
            alert('Failed to read the file. Please try again.');
            input.value = '';
        };

        reader.readAsText(file);
    }

    public static removeSubstitute(index: number): void {
        // Only allow removing additional substitutes (index >= 5), not the base 5 positions
        if (index >= 5 && this.teamCompositionSummary) {
            this.teamCompositionSummary.substitutes.splice(index, 1);
            // Update summary counts
            this.updateSummaryCounts();
            // Force a page refresh to update the UI - in a real app you'd want better state management
            const modal = document.querySelector('.composition-modal-overlay');
            if (modal) {
                modal.remove();
            }
        }
    }

    private static finishComposition(): void {
        // Since validation is now done in step 2 transition, we can directly finish
        console.log('Team Composition Complete:', this.teamCompositionSummary);
        alert('Team composition saved successfully!');
        this.closeModal(document.querySelector('.composition-modal-overlay') as HTMLElement);
    }

    public static getSummaryJSON(): TeamCompositionSummary | null {
        return this.teamCompositionSummary;
    }

    public static async exportSummary(mode: SummaryExportMode): Promise<void> {
        const teamName = this.teamCompositionSummary?.matchInfo.oppositeTeam || 'TBD';
        const fileName = `match-summary-montigny-vs-${teamName.toLowerCase().replace(/\s+/g, '-')}`;

        return ExportHelper.exportSummary(this.teamCompositionSummary!, fileName, mode);
    }

    private static updateModalContent(team: Team): void {
        const modalContent = document.querySelector('#composition-modal-content');
        if (modalContent) {
            const closeBtn = modalContent.querySelector('.composition-modal-close-btn');
            modalContent.innerHTML = this.createModalBody(team);
            if (closeBtn) {
                modalContent.appendChild(closeBtn);
            }
            this.addEventListeners(team);
        }
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
export { PlayerLayout };
export type { PlayerSectionOptions };
