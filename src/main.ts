import './styles.css';

// Interface for team data
interface Team {
    id: number;
    name: string;
    description: string;
    wins: number;
    losses: number;
    players: number;
    founded: number;
}

// Sample handball teams data
const teamsData: Team[] = [
    {
        id: 1,
        name: "Team Alpha",
        description: "A competitive handball team with strong offensive capabilities and excellent teamwork.",
        wins: 15,
        losses: 3,
        players: 12,
        founded: 2018
    },
    {
        id: 2,
        name: "Team Beta",
        description: "Known for their defensive strategies and quick counter-attacks. A formidable opponent.",
        wins: 12,
        losses: 6,
        players: 14,
        founded: 2019
    },
    {
        id: 3,
        name: "Team Gamma",
        description: "A young and energetic team with great potential and innovative playing styles.",
        wins: 8,
        losses: 10,
        players: 11,
        founded: 2020
    }
];

class HandballTeamsApp {
    private teams: Team[];
    private container: HTMLElement;

    constructor() {
        this.teams = teamsData;
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
        // Add event listeners for interactive features
        document.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (target.classList.contains('btn-add-win')) {
                const teamId = parseInt(target.dataset.teamId || '0');
                this.addWin(teamId);
            }
            if (target.classList.contains('btn-add-loss')) {
                const teamId = parseInt(target.dataset.teamId || '0');
                this.addLoss(teamId);
            }
        });
    }

    private addWin(teamId: number): void {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.wins++;
            this.render();
        }
    }

    private addLoss(teamId: number): void {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            team.losses++;
            this.render();
        }
    }

    private createTeamCard(team: Team): string {
        return `
            <div class="team-card">
                <h3>${team.name}</h3>
                <p>${team.description}</p>
                <p><strong>Founded:</strong> ${team.founded}</p>
                <div class="stats">
                    <div class="stat">
                        <div class="stat-number">${team.wins}</div>
                        <div class="stat-label">Wins</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${team.losses}</div>
                        <div class="stat-label">Losses</div>
                    </div>
                    <div class="stat">
                        <div class="stat-number">${team.players}</div>
                        <div class="stat-label">Players</div>
                    </div>
                </div>
                <div style="margin-top: 15px; text-align: center;">
                    <button class="btn btn-success btn-add-win" data-team-id="${team.id}">Add Win</button>
                    <button class="btn btn-add-loss" data-team-id="${team.id}">Add Loss</button>
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
                <h2>About Handball</h2>
                <p>Handball is a team sport in which two teams of seven players each pass a ball using their hands with the aim of throwing it into the goal of the other team. The team with the most goals after two periods of 30 minutes wins.</p>
                <p><strong>Total Teams:</strong> ${this.teams.length} | <strong>Total Players:</strong> ${this.teams.reduce((sum, team) => sum + team.players, 0)}</p>
            </div>
        `;
    }

    // Public method to get teams data
    public getTeams(): Team[] {
        return [...this.teams];
    }

    // Public method to add a new team
    public addTeam(team: Omit<Team, 'id'>): void {
        const newId = Math.max(...this.teams.map(t => t.id)) + 1;
        this.teams.push({ ...team, id: newId });
        this.render();
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