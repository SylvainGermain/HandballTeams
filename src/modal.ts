import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';
import backgroundImage from '../resources/background.png';

// Interface for team data (importing from main)
interface Team {
    id: string;
    name: string;
    description: string;
}

// Interface for player data
interface Player {
    name: string;
    physique: number;
    technique: number;
    defense: number;
    intelligence: number;
    attaque: number;
    vitesse: number;
    poste: string;
}

export class Modal {
    private static stylesAdded = false;
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

        // Add animation styles if not already added
        this.addModalStyles();

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        modalOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        // Create modal content
        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
            max-width: 900px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            animation: modalSlideIn 0.3s ease-out;
        `;

        // Create close button
        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #666;
            transition: color 0.2s ease;
        `;

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
            return count + (player.poste != 'Coach' ? 1 : 0);
        }, 0);
        const baseContent = `
            <h2 style="margin-top: 0; color: #333; margin-bottom: 15px;">${team.name}</h2>
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">${team.description}</p>
            <div style="margin-top: 20px; padding: 15px; background-color: #f5f5f5; border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #333;">Total Players:</span>
                    <span style="font-size: 18px; color: #007bff; font-weight: bold;">${playersCount}</span>
                </div>
            </div>
        `;

        return baseContent + playersSection;
    }

    private static createPlayer(player: Player): string {
        return `
            <div style="
                position: relative;
                width: 400px;
                height: 400px;
                margin: 20px auto;
                background-image: url('${backgroundImage}');
                background-size: contain;
                background-position: center;
                background-repeat: no-repeat;
                transition: transform 0.2s ease, filter 0.2s ease;
                cursor: pointer;
            " onmouseover="this.style.transform='scale(1.05)'; this.style.filter='brightness(1.1)'" onmouseout="this.style.transform='scale(1)'; this.style.filter='brightness(1)'">

                <!-- Player Info - Top of hexagon -->
                <div style="
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    text-align: center;
                    color: white;
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    z-index: 2;
                ">
                    <div style="
                        background: linear-gradient(135deg, #00ff7b, #00b356);
                        color: white;
                        padding: 4px 12px;
                        border-radius: 15px;
                        font-size: 10px;
                        font-weight: bold;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                        margin-bottom: 8px;
                        display: inline-block;
                        box-shadow: 0 2px 8px rgba(0,123,255,0.4);
                    ">
                        ${player.poste}
                    </div>
                    <h4 style="
                        margin: 10;
                        color: white;
                        font-size: 18px;
                        font-weight: bold;
                        text-shadow: 2px 2px 4px rgba(0,0,0,0.9);
                    ">
                        ${player.name}
                    </h4>
                </div>

                <!-- Player Avatar - Center of hexagon -->
                <div style="
                    position: absolute;
                    top: 40%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    width: 70px;
                    height: 70px;
                    background: rgba(255,255,255,0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 28px;
                    font-weight: bold;
                    color: white;
                    border: 4px solid rgba(255,255,255,0.4);
                    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                    backdrop-filter: blur(2px);
                    z-index: 2;
                ">
                    ${player.name.charAt(0)}
                </div>

                <!-- Stats - Bottom region of hexagon -->
                <div style="
                    position: absolute;
                    bottom: 80px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 200px;
                    padding: 10px;
                    z-index: 2;
                ">
                    <div style="
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 8px;
                        font-size: 11px;
                    ">
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

    private static createHexagonStat(statName: string, value: number): string {
        const starRating = this.createStarRating(value);

        return `
            <div style="
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 3px 3px;

                background: linear-gradient(135deg, #172e22ff, #092e1bff);
                text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
                border-radius: 8px;
                color: white;
                margin-bottom: 2px;
            ">
                <span style="
                    font-weight: bold;
                    font-size: 10px;
                    color: rgba(255,255,255,0.9);
                    min-width: 25px;
                ">${statName}</span>
                <div style="
                    flex: 1;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    margin: 0 6px;
                    font-size: 12px;
                ">
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
                starsHtml += `
                    <span style="
                        color: rgba(255,255,255,0.3);
                        text-shadow: 0 0 2px rgba(0,0,0,0.5);
                        margin: 0 1px;
                    ">★</span>
                `;
            } else if (starFill === 1) {
                // Full star
                starsHtml += `
                    <span style="
                        color: #FFD700;
                        text-shadow: 0 0 3px rgba(255,215,0,0.6);
                        margin: 0 1px;
                    ">★</span>
                `;
            } else {
                // Partially filled star using gradient
                const fillPercentage = Math.round(starFill * 100);
                starsHtml += `
                    <span style="
                        background: linear-gradient(90deg, #FFD700 ${fillPercentage}%, rgba(255,255,255,0.3) ${fillPercentage}%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                        text-shadow: none;
                        margin: 0 1px;
                        position: relative;
                    ">★</span>
                `;
            }
        }

        return starsHtml;
    }
    private static createPlayersSection(players: Player[]): string {
        let playersHTML = `
            <div style="margin-top: 25px;">
                <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Individual Player Features</h3>
                <div style="
                    max-height: 500px;
                    overflow-y: auto;
                    padding: 10px;
                    display: flex;
                    flex-wrap: wrap;
                    justify-content: center;
                    gap: 20px;
                ">
        `;

        players.forEach((player: Player) => {
            playersHTML += this.createPlayer(player);
        });

        playersHTML += `
                </div>
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

    private static addModalStyles(): void {
        if (this.stylesAdded) return;

        const style = document.createElement('style');
        style.id = 'modal-styles';
        style.textContent = `
            @keyframes modalSlideIn {
                from {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
            }

            @keyframes modalSlideOut {
                from {
                    opacity: 1;
                    transform: translateY(0) scale(1);
                }
                to {
                    opacity: 0;
                    transform: translateY(-50px) scale(0.9);
                }
            }
        `;
        document.head.appendChild(style);
        this.stylesAdded = true;
    }
}

export type { Team };
