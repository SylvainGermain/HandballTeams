import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';
import backgroundImage from '../resources/background.png';
import './modal.css';

// Interface for team data (importing from main)
interface Team {
    id: string;
    name: string;
    description: string;
}

enum Post {
  COACH = "COACH",
  DC = "DC",
  ALG = "ALG",
  ARG = "ARG",
  GK = "GK",
  ALD = "ALD",
  ARD = "ARD"
}
// type PostString = "COACH" | "DC" | "ALG" | "ARG" | "GK" | "ALD" | "ARD";

// Interface for player data
interface Player {
    nom?: string;
    prenom?: string;
    surnom?: string
    physique: string;
    technique: string;
    defense: string;
    intelligence: string;
    attaque: string;
    vitesse: string;
    poste: string;
    posteb?: string;
    postec?: string;
    groupe: string;
}

export class Modal {
    private static maxStat = 3;

    public static show(team: Team): void {
        this.createModal(team);
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
    }

    private static createModalBody(team: Team): string {

        let players: Player[] = [];
        // If this is the U18 team, show individual player features
        if (team.id === 'U18') {
          players = U18PlayersData.players;
        } else if (team.id === 'U15') {
          players = U15PlayersData.players;
        } else if (team.id === 'U13') {
          players = U13PlayersData.players;
        } else if (team.id === 'O16') {
          players = O16PlayersData.players;
        }

        const playersSection = this.createPlayersSection(players);

        let playersCount = players.reduce((count, player) => {
            return count + (player.poste != Post.COACH ? 1 : 0);
        }, 0);
        const baseContent = `
            <h2 class="team-title">${team.name}</h2>
            <p class="team-description">${team.description}</p>
            <div class="stats-container">
                <div class="stats-row">
                    <span class="stats-label">Total Players:</span>
                    <span class="stats-value">${playersCount}</span>
                </div>
            </div>
        `;

        return baseContent + playersSection;
    }

    private static getDisplayedName(player: Player): string {
      return player.surnom ?? player.prenom ?? player.nom ?? 'Unknown';
    }

    private static getI(input: string | undefined): string {
      return  input ? input.charAt(0) : '';
    }

    private static getAvatarInitial(player: Player) {
      const s = player.nom?.charAt(0);
      if (s !== undefined) {
        return s;
      }
      const name = `${this.getI(player.prenom)}${this.getI(player.nom)}`
        return (name.length > 0) ? name : 'U';
    }

    private static getGroupDiv(player: Player): string {
      return player.poste === Post.COACH || player.groupe === '2' ? ''
              : ` <div class="flaming player-group">
                    <span>★</span>
                  </div>`;
    }
    private static createPlayer(player: Player): string {
        return `
            <div class="player-card" style="background-image: url('${backgroundImage}');">

                <!-- Player Info - Top of hexagon -->
                <div class="player-info">
                    <div class="player-position">
                        ${player.poste}
                    </div>
                    <h4 class="player-name">
                        ${this.getDisplayedName(player)}
                    </h4>
                </div>

                <!-- Player group - Right of hexagon -->
                ${this.getGroupDiv(player)}

                <!-- Player Avatar - Center of hexagon -->
                <div class="player-avatar">
                    ${this.getAvatarInitial(player)}
                </div>

                <!-- Stats - Bottom region of hexagon -->
                <div class="player-stats">
                    <div class="stats-grid">
                        ${this.createHexagonStat('PHY', player.physique)}
                        ${this.createHexagonStat('TEC', player.technique)}
                        ${this.createHexagonStat('DEF', player.defense)}
                        ${this.createHexagonStat('INT', player.intelligence)}
                        ${this.createHexagonStat('ATT', player.attaque)}
                        ${this.createHexagonStat('VIT', player.vitesse)}
                    </div>
                </div>
            </div>
        `;
    }

    private static createHexagonStat(statName: string, value: string): string {
        const starRating = this.createStarRating(parseFloat(value));

        return `
            <div class="stat-item">
                <span class="stat-name">${statName}</span>
                <div class="stat-stars">
                    ${starRating}
                </div>
            </div>
        `;
    }

    private static createStarRating(value: number): string {
        const maxStars = 3;
        const percentage = value / Modal.maxStat; // Normalize to 0-1
        const filledStars = percentage * maxStars; // Get filled stars as decimal

        let starsHtml = '';

        for (let i = 0; i < maxStars; i++) {
            const starFill = Math.max(0, Math.min(1, filledStars - i)); // Calculate fill for this star (0-1)

            if (starFill === 0) {
                // Empty star
                starsHtml += `<span class="star-empty">★</span>`;
            } else if (starFill === 1) {
                // Full star
                starsHtml += `<span class="star-full">★</span>`;
            } else {
                // Partially filled star using gradient
                const fillPercentage = Math.round(starFill * 100);
                starsHtml += `
                    <span class="star-partial" style="
                        background: linear-gradient(90deg, #FFD700 ${fillPercentage}%, rgba(255,255,255,0.3) ${fillPercentage}%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    ">★</span>
                `;
            }
        }

        return starsHtml;
    }
    private static createPlayersSection(players: Player[]): string {
        // Split players into coaches and regular players
        const coaches = players.filter(player => player.poste === Post.COACH);
        const regularPlayers = players.filter(player => player.poste !== Post.COACH);

        let playersHTML = `
            <div class="players-wrapper">
                <h3 class="main-heading">Team Members</h3>
        `;

        // Add coaches section if there are any coaches
        if (coaches.length > 0) {
            playersHTML += `
                <div class="section-wrapper">
                    <h4 class="section-heading">Coaching Staff</h4>
                    <div class="coaching-staff-section">
            `;

            coaches.forEach((coach: Player) => {
                playersHTML += this.createPlayer(coach);
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
                    <h4 class="section-heading">Players</h4>
                    <div class="players-section">
            `;

            regularPlayers.forEach((player: Player) => {
                playersHTML += this.createPlayer(player);
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

export type { Team };
