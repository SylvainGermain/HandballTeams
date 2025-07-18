import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';

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
            max-width: 700px;
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

    private static createPlayersSection(players: Player[]): string {

        let playersHTML = `
            <div style="margin-top: 25px;">
                <h3 style="color: #333; margin-bottom: 15px; border-bottom: 2px solid #007bff; padding-bottom: 5px;">Individual Player Features</h3>
                <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
        `;

        players.forEach((player: Player) => {
            playersHTML += `
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 15px; background-color: #fafafa;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <h4 style="margin: 0; color: #333;">${player.name}</h4>
                        <span style="background-color: #007bff; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                            ${player.poste.toUpperCase()}
                        </span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px;">
                        ${this.createStatBar('Physique', player.physique)}
                        ${this.createStatBar('Technique', player.technique)}
                        ${this.createStatBar('Defense', player.defense)}
                        ${this.createStatBar('Intelligence', player.intelligence)}
                        ${this.createStatBar('Attaque', player.attaque)}
                        ${this.createStatBar('Vitesse', player.vitesse)}
                    </div>
                </div>
            `;
        });

        playersHTML += `
                </div>
            </div>
        `;

        return playersHTML;
    }

    private static createStatBar(statName: string, value: number): string {
        const percentage = (value / Modal.maxStat) * 100; // Assuming max value is 3
        const color = this.getStatColor(value);

        return `
            <div style="margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                    <span style="font-size: 12px; color: #666; font-weight: 500;">${statName}</span>
                    <span style="font-size: 12px; color: #333; font-weight: bold;">${value}</span>
                </div>
                <div style="background-color: #e0e0e0; border-radius: 10px; height: 6px; overflow: hidden;">
                    <div style="background-color: ${color}; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
            </div>
        `;
    }

    private static getStatColor(value: number): string {
        if (value >= 2.5) return '#4CAF50'; // Green for high values
        if (value >= 1.5) return '#FFC107'; // Yellow for medium values
        if (value >= 0.5) return '#FF9800'; // Orange for low-medium values
        return '#F44336'; // Red for low values
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
