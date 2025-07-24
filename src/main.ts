import './styles.css';
import teamsData from '../resources/teams.json';
import { TeamDetailsModal} from './modal';
import { type Team } from './model';
import { TeamCompositionModal } from './teamComposition';

class HandballTeamsApp {
    private teams: Team[];
    private container: HTMLElement;

    constructor() {
        this.teams = teamsData.teams;
        const containerElement = document.getElementById('teams-container');
        if (!containerElement) {
            throw new Error('Teams container element not found');
        }
        this.container = containerElement;
        this.init();
    }

    private init(): void {
        this.render();
        this.addEventListeners();
    }

    private addEventListeners(): void {
        // Add event listeners for detail buttons
        const detailButtons = document.querySelectorAll('.btn-details');
        detailButtons.forEach(button => {
            button.addEventListener('click', (event: Event) => {
                const target = event.target as HTMLElement;
                const teamId = target.getAttribute('data-team-id');
                if (teamId) {
                    this.showTeamDetails(teamId);
                }
            });
        });

        // Add event listeners for composition buttons
        const compositionButtons = document.querySelectorAll('.btn-composition');
        compositionButtons.forEach(button => {
            button.addEventListener('click', (event: Event) => {
                const target = event.target as HTMLElement;
                const teamId = target.getAttribute('data-team-id');
                if (teamId) {
                    this.showTeamComposition(teamId);
                }
            });
        });
    }

    private showTeamDetails(teamId: string): void {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            TeamDetailsModal.show(team);
        }
    }

    private showTeamComposition(teamId: string): void {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            TeamCompositionModal.show(team);
        }
    }

    private createTeamCard(team: Team): string {
        return `
            <div class="team-card">
                <h3>${team.name}</h3>
                <p>${team.description}</p>
                <div style="margin-top: 15px; text-align: center; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-details" data-team-id="${team.id}">View Details</button>
                    <button class="btn btn-composition" data-team-id="${team.id}">Team Composition</button>
                </div>
            </div>
        `;
    }

    private render(): void {
        const teamsHTML = this.teams.map(team => this.createTeamCard(team)).join('');
        this.container.innerHTML = `
            <div class="team-grid">
                ${teamsHTML}
            </div>
            <div style="margin-top: 40px; text-align: center;">
                <p><strong>Total Teams:</strong> ${this.teams.length}</p>
            </div>
        `;
    }

    // Public method to get teams data
    public getTeams(): Team[] {
        return [...this.teams];
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new HandballTeamsApp();
    console.log('Handball Teams App initialized successfully!');

    // Expose app to global scope for debugging (optional)
    (window as any).handballApp = app;
});

// Export for potential module usage
export default HandballTeamsApp;
export type { Team };