import './styles.css';
import teamsData from '../resources/teams.json';
import { TeamDetailsModal} from './modal';
import { type Team } from './model';
import { TeamCompositionModal } from './teamComposition';
import { Resources } from './resources';
import { ExcelImportModal } from './excelImport';
import asmbhLogo from '../resources/ASMBH_Logo.png';

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
                    <div class="splash-logo">
                        <img src="${asmbhLogo}" alt="ASMBH Logo" class="logo-image" />
                    </div>
                    <h1>ASMB Handball </h1>
                    <p>Système de Gestion d'Équipes</p>
                </div>
                <div class="splash-form">
                    <div class="form-group">
                        <label for="password-input">Entrez le Mot de Passe:</label>
                        <input type="password" id="password-input" class="password-input" placeholder="Mot de passe" />
                    </div>
                    <button id="login-btn" class="btn btn-primary">Accéder au Système</button>
                    <div id="error-message" class="error-message" style="display: none;"></div>
                </div>
                <div class="splash-footer">
                    <p>© 2025 Gestion des Équipes de Handball</p>
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
            this.showError(errorMessage, 'Veuillez entrer un mot de passe');
            return;
        }

        const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
        const originalText = loginBtn.textContent;

        try {
            // Show loading state
            loginBtn.disabled = true;
            loginBtn.textContent = 'Chargement...';
            errorMessage.style.display = 'none';

            // Try to load resources with the provided password
            await Resources.loadResources(password);

            // Success - remove splash screen and initialize app
            this.removeSplashScreen(splashOverlay);
            this.render();
            this.addEventListeners();

        } catch (error) {
            // Show error message
            this.showError(errorMessage, 'Mot de passe invalide. Veuillez réessayer.');
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
        // Add event listener for import Excel button
        const importExcelBtn = document.getElementById('import-excel-btn');
        if (importExcelBtn) {
            importExcelBtn.addEventListener('click', () => {
                ExcelImportModal.show();
            });
        }

        // Add event listener for import equipe button
        const importEquipeBtn = document.getElementById('import-equipe-btn');
        if (importEquipeBtn) {
            importEquipeBtn.addEventListener('click', () => {
                this.handleImportEquipe();
            });
        }

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

    private handleImportEquipe(): void {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '500px';

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Importer Équipes</h2>
            </div>
            <div class="modal-body">
                <p>Choisissez la source du fichier:</p>
                <div style="display: flex; flex-direction: column; gap: 15px; margin: 20px 0;">
                    <button class="btn btn-primary" id="import-local-btn">
                        📁 Fichier Local
                    </button>
                    <button class="btn btn-primary" id="import-gdrive-btn">
                        ☁️ Google Drive
                    </button>
                </div>
                <div id="gdrive-input-section" style="display: none; margin-top: 20px;">
                    <label for="gdrive-url-input" style="display: block; margin-bottom: 8px; font-weight: 600;">
                        URL du fichier Google Drive:
                    </label>
                    <input
                        type="text"
                        id="gdrive-url-input"
                        placeholder="https://drive.google.com/file/d/..."
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; margin-bottom: 10px;"
                    />
                    <button class="btn btn-success" id="gdrive-import-confirm-btn">
                        Importer depuis Google Drive
                    </button>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-import-equipe-btn">Annuler</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        // Get elements
        const localBtn = document.getElementById('import-local-btn') as HTMLButtonElement;
        const gdriveBtn = document.getElementById('import-gdrive-btn') as HTMLButtonElement;
        const gdriveSection = document.getElementById('gdrive-input-section') as HTMLElement;
        const gdriveInput = document.getElementById('gdrive-url-input') as HTMLInputElement;
        const gdriveConfirmBtn = document.getElementById('gdrive-import-confirm-btn') as HTMLButtonElement;
        const cancelBtn = document.getElementById('cancel-import-equipe-btn') as HTMLButtonElement;

        // Handle local file import
        localBtn.addEventListener('click', () => {
            modalOverlay.remove();
            this.importFromLocal();
        });

        // Show Google Drive input section
        gdriveBtn.addEventListener('click', () => {
            gdriveSection.style.display = 'block';
            gdriveInput.focus();
        });

        // Handle Google Drive import
        gdriveConfirmBtn.addEventListener('click', async () => {
            const url = gdriveInput.value.trim();
            if (!url) {
                alert('Veuillez entrer une URL Google Drive');
                return;
            }
            modalOverlay.remove();
            await this.importFromGoogleDrive(url);
        });

        // Handle Enter key in Google Drive input
        gdriveInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                gdriveConfirmBtn.click();
            }
        });

        // Handle cancel/close
        const closeModal = () => modalOverlay.remove();
        cancelBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    private importFromLocal(): void {
        // Create a file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.xls,.xlsx';
        fileInput.style.display = 'none';

        // Handle file selection
        fileInput.addEventListener('change', async (event) => {
            const target = event.target as HTMLInputElement;
            if (target.files && target.files.length > 0) {
                const file = target.files[0];
                try {
                    console.log('Importing equipe from local file:', file.name);
                    await Resources.updateResources(file);
                    alert('Équipes importées avec succès!');
                } catch (error) {
                    console.error('Error importing equipe:', error);
                    alert('Erreur lors de l\'import des équipes');
                }
            }
            // Remove the file input after use
            document.body.removeChild(fileInput);
        });

        // Append to body and trigger click
        document.body.appendChild(fileInput);
        fileInput.click();
    }

    private async importFromGoogleDrive(url: string): Promise<void> {
        try {
            // Extract file ID from Google Drive URL
            let fileId = '';
            const patterns = [
                /\/file\/d\/([^\/]+)/,  // https://drive.google.com/file/d/FILE_ID/view
                /id=([^&]+)/,            // https://drive.google.com/open?id=FILE_ID
                /\/d\/([^\/]+)/          // Generic pattern
            ];

            for (const pattern of patterns) {
                const match = url.match(pattern);
                if (match) {
                    fileId = match[1];
                    break;
                }
            }

            if (!fileId) {
                throw new Error('URL Google Drive invalide');
            }

            // Convert to direct download URL
            const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;

            console.log('Downloading from Google Drive:', downloadUrl);

            // Fetch the file
            const response = await fetch(downloadUrl);
            if (!response.ok) {
                throw new Error('Échec du téléchargement depuis Google Drive');
            }

            // Convert to blob and then to File
            const blob = await response.blob();
            const file = new File([blob], 'equipes.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            // Import using Resources
            await Resources.updateResources(file);
            alert('Équipes importées avec succès depuis Google Drive!');

        } catch (error) {
            console.error('Error importing from Google Drive:', error);
            alert('Erreur lors de l\'import depuis Google Drive: ' + (error as Error).message);
        }
    }

    private createTeamCard(team: Team): string {
        return `
            <div class="team-card">
                <h3>${team.name}</h3>
                <p>${team.description}</p>
                <div style="margin-top: 15px; text-align: center; display: flex; gap: 10px; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-details" data-team-id="${team.id}">Voir Détails</button>
                    <button class="btn btn-composition" data-team-id="${team.id}">Composition d'Équipe</button>
                </div>
            </div>
        `;
    }

    private render(): void {
        const teamsHTML = this.teams.map(team => this.createTeamCard(team)).join('');
        this.container.innerHTML = `
            <div style="margin-bottom: 20px; text-align: center;">
                <button class="btn btn-primary" id="import-excel-btn">Créer com "jour de match"</button>
                <button class="btn btn-primary" id="import-equipe-btn">Importer Equipes</button>
            </div>
            <div class="team-grid">
                ${teamsHTML}
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