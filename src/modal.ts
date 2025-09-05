import './modal.css';
import { Player, Post, Team } from './model';
import { PlayerHelper } from './player';
import { ExportHelper } from './export';
import { Resources } from './resources';

const ExportMovie = '🎬 Exporter Vidéo';
const ExportZip = '📦 Exporter ZIP';
export class TeamDetailsModal {

    public static show(team: Team): void {
        this.createModal(team);
    }

    public static async exportPlayersAsImage(teamId: string): Promise<void> {
        return ExportHelper.exportPlayersAsImage(teamId);
    }

    public static async exportPlayersAsBundle(teamId: string): Promise<void> {
        // Get the number of players per page from the input
        const playersPerPageInput = document.querySelector(`#players-per-page-${teamId}`) as HTMLInputElement;
        const playersPerPage = playersPerPageInput ? parseInt(playersPerPageInput.value) || 4 : 4;

        // Get the export type from the radio buttons
        const exportTypeRadio = document.querySelector(`input[name="export-type-${teamId}"]:checked`) as HTMLInputElement;
        const exportType = exportTypeRadio ? exportTypeRadio.value : 'zip';

        // Validate the input
        if (playersPerPage < 1 || playersPerPage > 20) {
            alert('Veuillez entrer un nombre entre 1 et 20 pour les joueurs par page');
            return;
        }

        if (exportType === 'movie') {
            return ExportHelper.exportPlayersAsMovie(teamId, playersPerPage);
        } else {
            return ExportHelper.exportPlayersAsBundle(teamId, playersPerPage);
        }
    }

    private static createModal(team: Team): void {
        // Remove existing modal if any
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'modal-close-btn';

        // Add hover effect to close button
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.color = '#333';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.color = '#666';
        });

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

        // Add event listeners for export type radio buttons to update button text
        setTimeout(() => {  // Use setTimeout to ensure DOM is ready
            const radioButtons = document.querySelectorAll(`input[name="export-type-${team.id}"]`);
            const exportButton = document.querySelector('.btn-export-bundle') as HTMLButtonElement;

            radioButtons.forEach(radio => {
                radio.addEventListener('change', function(this: HTMLInputElement) {
                    if (exportButton) {
                        const selectedValue = this.value;
                        if (selectedValue === 'movie') {
                            exportButton.textContent = ExportMovie;
                        } else {
                            exportButton.textContent = ExportZip;
                        }
                    }
                });
            });
        }, 100);
    }

    private static createModalBody(team: Team): string {
        let players: Player[] = Resources.getPlayersData(team.id);

        const playersSection = this.createPlayersSection(players, team);

        let playersCount = players.reduce((count, player) => {
            return count + (player.poste != Post.COACH ? 1 : 0);
        }, 0);
        const baseContent = `
            <h2 class="team-title">${team.name}</h2>
            <p class="team-description">${team.description}</p>
            <div>
                <div class="stats-row">
                    <span class="stats-label">Total Joueurs:</span>
                    <span class="stats-value">${playersCount}</span>
                </div>
            </div>
        `;

        return baseContent + playersSection;
    }

    private static createPlayersSection(players: Player[], team: Team): string {
        // Split players into coaches and regular players
        const coaches = players.filter(player => player.poste === Post.COACH);
        const regularPlayers = players.filter(player => player.poste !== Post.COACH);

        let playersHTML = `
            <div class="players-wrapper">
                <h3 class="main-heading">Membres de l'Équipe</h3>
        `;

        // Add coaches section if there are any coaches
        if (coaches.length > 0) {
            playersHTML += `
                <div class="section-wrapper">
                    <h4 class="section-heading">Staff d'Entraînement</h4>
                    <div class="players-section">
            `;

            coaches.forEach((coach: Player) => {
                playersHTML += PlayerHelper.createPlayer(coach, PlayerHelper.ShowAllWoStats);
            });

            playersHTML += `
                    </div>
                </div>
            `;
        }

        // Add regular players section if there are any
        if (regularPlayers.length > 0) {
            playersHTML += `
                <div>
                    <div class="section-wrapper">
                        <h4 class="section-heading">Joueurs</h4>
                        <div class="export-buttons">
                            <button class="btn export-btn btn-export" onclick="TeamDetailsModal.exportPlayersAsImage('${team.id}')">
                                📸 Exporter comme Image
                            </button>
                            <div class="bundle-export-container">
                                <label for="players-per-page-${team.id}" class="players-per-page-label">Joueurs par page:</label>
                                <input type="number" id="players-per-page-${team.id}" min="1" max="20" value="4" class="players-per-page-input" placeholder="4">

                                <div class="export-type-selector">
                                    <label class="export-type-label">Exporter comme:</label>
                                    <div class="radio-group">
                                        <label class="radio-option">
                                            <input type="radio" name="export-type-${team.id}" value="zip" checked>
                                            <span class="radio-text">📦 Fichiers</span>
                                        </label>
                                        <label class="radio-option">
                                            <input type="radio" name="export-type-${team.id}" value="movie">
                                            <span class="radio-text">🎬 Vidéo</span>
                                        </label>
                                    </div>
                                </div>

                                <button class="btn btn-export-bundle" onclick="TeamDetailsModal.exportPlayersAsBundle('${team.id}')">
                                    ${ExportZip}
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="players-section" id="players-section-${team.id}">
            `;

            regularPlayers.forEach((player: Player) => {
                playersHTML += PlayerHelper.createPlayer(player, PlayerHelper.ShowAll);
            });

            playersHTML += `
                    </div>
                </div>
            `;
        }

        playersHTML += `
            </div>
        `;

        return playersHTML;
    }

    private static closeModal(modalOverlay: HTMLElement): void {
        // Restore body scroll
        document.body.style.overflow = '';

        // Add closing animation
        modalOverlay.style.animation = 'modalSlideOut 0.2s ease-in forwards';

        setTimeout(() => {
            modalOverlay.remove();
        }, 200);
    }
}

// Make TeamDetailsModal available globally for onclick handlers
(window as any).TeamDetailsModal = TeamDetailsModal;

// Gestionnaires globaux pour l'export par double-clic/double-toucher sur les cartes de joueurs
let touchStartTime: number = 0;
let touchCount: number = 0;

(window as any).handlePlayerCardDoubleClick = function(cardElement: HTMLElement) {
    const playerName = cardElement.getAttribute('data-player-name') || 'Joueur Inconnu';
    ExportHelper.exportSinglePlayerCard(cardElement, playerName);
};

(window as any).handlePlayerCardTouchStart = function(cardElement: HTMLElement, event: TouchEvent) {
    const now = Date.now();

    if (now - touchStartTime < 300) {
        touchCount++;
    } else {
        touchCount = 1;
    }

    touchStartTime = now;

    if (touchCount === 2) {
        event.preventDefault();
        const playerName = cardElement.getAttribute('data-player-name') || 'Joueur Inconnu';
        ExportHelper.exportSinglePlayerCard(cardElement, playerName);
        touchCount = 0;
    }
};

(window as any).handlePlayerCardTouchEnd = function() {
    // Réinitialise le compteur de touchers après un délai si aucun second toucher n'a lieu
    setTimeout(() => {
        if (touchCount === 1 && Date.now() - touchStartTime > 300) {
            touchCount = 0;
        }
    }, 350);
};

export type { Team };
