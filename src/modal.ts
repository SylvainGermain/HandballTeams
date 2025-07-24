import U18PlayersData from '../resources/U18Players.json';
import U15PlayersData from '../resources/U15Players.json';
import U13PlayersData from '../resources/U13Players.json';
import O16PlayersData from '../resources/O16Players.json';

import './modal.css';
import { Player, Post, Team } from './model';
import { PlayerHelper } from './player';
import { ExportHelper } from './export';

export class Modal {

    public static show(team: Team): void {
        this.createModal(team);
    }

    public static async exportPlayersAsImage(teamId: string): Promise<void> {
        const playersSection = document.querySelector(`#players-section-${teamId}`) as HTMLElement;

        if (!playersSection) {
            alert('No players section found to export');
            return;
        }

        return ExportHelper.exportPlayersAsImage(playersSection, teamId);
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

        const playersSection = this.createPlayersSection(players, team);

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

    private static createPlayersSection(players: Player[], team: Team): string {
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
                playersHTML += PlayerHelper.createPlayer(coach);
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
                    <div class="players-header">
                        <h4 class="section-heading">Players</h4>
                        <button class="export-btn btn-export" onclick="Modal.exportPlayersAsImage('${team.id}')">
                            📸 Export Players as JPEG
                        </button>
                    </div>
                    <div class="players-section" id="players-section-${team.id}">
            `;

            regularPlayers.forEach((player: Player) => {
                playersHTML += PlayerHelper.createPlayer(player);
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

// Make Modal available globally for onclick handlers
(window as any).Modal = Modal;

export type { Team };
