import './styles.css';
import teamsData from '../resources/teams.json';
import { TeamDetailsModal} from './modal';
import { type Team } from './model';
import { TeamCompositionModal } from './teamComposition';
import { Resources } from './resources';

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
        this.showSplashScreen();
    }

    private showSplashScreen(): void {
        // Create splash screen overlay
        const splashOverlay = document.createElement('div');
        splashOverlay.className = 'splash-overlay';
        splashOverlay.innerHTML = `
            <div class="splash-content">
                <div class="splash-header">
                    <h1>🐊Handball Teams</h1>
                    <p>Team Management System</p>
                </div>
                <div class="splash-form">
                    <div class="form-group">
                        <label for="password-input">Enter Password:</label>
                        <input type="password" id="password-input" class="password-input" placeholder="Password" />
                    </div>
                    <button id="login-btn" class="btn btn-primary">Access System</button>
                    <div id="error-message" class="error-message" style="display: none;"></div>
                </div>
                <div class="splash-footer">
                    <p>© 2025 Handball Teams Management</p>
                </div>
            </div>
        `;

        document.body.appendChild(splashOverlay);

        // Add event listeners
        const passwordInput = document.getElementById('password-input') as HTMLInputElement;
        const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
        const errorMessage = document.getElementById('error-message') as HTMLElement;

        // Handle Enter key press
        passwordInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleLogin(passwordInput.value, splashOverlay, errorMessage);
            }
        });

        // Handle login button click
        loginBtn.addEventListener('click', () => {
            this.handleLogin(passwordInput.value, splashOverlay, errorMessage);
        });

        // Focus on password input
        setTimeout(() => passwordInput.focus(), 100);
    }

    private async handleLogin(password: string, splashOverlay: HTMLElement, errorMessage: HTMLElement): Promise<void> {
        if (!password.trim()) {
            this.showError(errorMessage, 'Please enter a password');
            return;
        }

        const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
        const originalText = loginBtn.textContent;

        try {
            // Show loading state
            loginBtn.disabled = true;
            loginBtn.textContent = 'Loading...';
            errorMessage.style.display = 'none';

            // Try to load resources with the provided password
            await Resources.loadResources(password);

            // Success - remove splash screen and initialize app
            this.removeSplashScreen(splashOverlay);
            this.render();
            this.addEventListeners();

        } catch (error) {
            // Show error message
            this.showError(errorMessage, 'Invalid password. Please try again.');
            loginBtn.disabled = false;
            loginBtn.textContent = originalText;

            // Clear and focus password input
            const passwordInput = document.getElementById('password-input') as HTMLInputElement;
            passwordInput.value = '';
            passwordInput.focus();
        }
    }

    private showError(errorElement: HTMLElement, message: string): void {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        // Auto-hide error after 5 seconds
        setTimeout(() => {
            errorElement.style.display = 'none';
        }, 5000);
    }

    private removeSplashScreen(splashOverlay: HTMLElement): void {
        splashOverlay.style.animation = 'fadeOut 0.5s ease-in forwards';
        setTimeout(() => {
            splashOverlay.remove();
        }, 500);
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