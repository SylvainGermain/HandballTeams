import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';

// TypeScript interface for match data
interface MatchData {
    WE: string;
    'Catég.': string;
    'Niv.': string;
    Rencontre: string;
    Maillots: string;
    J: string;
    Heure: string;
    Gymnase: string;
    RdV: string;
    Arbitres: string;
}

// Excel Import Modal
export class ExcelImportModal {
    /**
     * Create a div element displaying matches in two sections:
     * 1. Home games (Saturday/Sunday)
     * 2. Away games (Saturday/Sunday)
     * Each section is a two-column layout.
     */
    public static createMatchDiv(filteredJson: MatchData[]): HTMLDivElement {
        // Helper to determine if match is at home
        const isHome = (match: MatchData) => {
            // If ASMB is first in Rencontre, it's home
            return match.Rencontre.trim().startsWith('ASMB') || match.Rencontre.trim().startsWith('SQY');
        };
        // Helper to determine if match is Saturday or Sunday
        const isSaturday = (match: MatchData) => match.J.trim().toUpperCase() === 'S';
        const isSunday = (match: MatchData) => match.J.trim().toUpperCase() === 'D';

        // Split matches
        const homeSaturday = filteredJson.filter(m => isHome(m) && isSaturday(m));
        const homeSunday = filteredJson.filter(m => isHome(m) && isSunday(m));
        const awaySaturday = filteredJson.filter(m => !isHome(m) && isSaturday(m));
        const awaySunday = filteredJson.filter(m => !isHome(m) && isSunday(m));

        // Create main container
        const container = document.createElement('div');
        container.className = 'match-sections';
        container.style.width = '1024px';
        container.style.margin = '0 auto';
        container.style.padding = '20px';
        // container.style.backgroundColor = '#ffffff';
        container.style.fontFamily = 'Arial, sans-serif';
        container.style.background = 'var(--background-color1)';

        const titleContainer = document.createElement('div');
        titleContainer.className = 'match-glow';
        const title = document.createElement('h1');
        title.className = 'match-day-title';
        title.textContent = `Matchs du Weekend`;
        titleContainer.appendChild(title);
        container.appendChild(titleContainer);

        // Section 1: Home games
        const homeSection = document.createElement('div');
        homeSection.className = 'section-wrapper';
        homeSection.style.marginBottom = '2rem';

        const homeTitle = document.createElement('h2');
        homeTitle.className = 'match-glow match-title';
        homeTitle.style.textAlign = 'center';
        homeTitle.textContent = 'Domicile';
        homeSection.appendChild(homeTitle);

        const homeGrid = document.createElement('div');
        homeGrid.className = 'match-details-grid';
        homeGrid.style.display = 'grid';
        homeGrid.style.gridTemplateColumns = '1fr 1fr';
        homeGrid.style.gap = '20px';

        // Saturday column
        const homeSatCol = document.createElement('div');
        homeSatCol.className = 'match-col';
        const homeSatTitle = document.createElement('h4');
        homeSatTitle.className = 'match-glow';
        homeSatTitle.textContent = 'Samedi';
        homeSatTitle.style.textAlign = 'center';
        homeSatTitle.style.marginBottom = '1rem';
        homeSatTitle.style.color = 'black';
        homeSatCol.appendChild(homeSatTitle);
        homeSatCol.appendChild(this.createMatchList(homeSaturday));

        // Sunday column
        const homeSunCol = document.createElement('div');
        homeSunCol.className = 'match-col';
        const homeSunTitle = document.createElement('h4');
        homeSunTitle.className = 'match-glow';
        homeSunTitle.textContent = 'Dimanche';
        homeSunTitle.style.textAlign = 'center';
        homeSunTitle.style.marginBottom = '1rem';
        homeSunTitle.style.color = 'black';
        homeSunCol.appendChild(homeSunTitle);
        homeSunCol.appendChild(this.createMatchList(homeSunday));

        homeGrid.appendChild(homeSatCol);
        homeGrid.appendChild(homeSunCol);
        homeSection.appendChild(homeGrid);
        container.appendChild(homeSection);

        // Section 2: Away games
        const awaySection = document.createElement('div');
        awaySection.className = 'section-wrapper';
        awaySection.style.marginBottom = '2rem';

        const awayTitle = document.createElement('h2');
        awayTitle.className = 'match-glow match-title';
        awayTitle.textContent = 'Extérieur';
        // awayTitle.style.textAlign = 'center';
        awaySection.appendChild(awayTitle);


        const awayGrid = document.createElement('div');
        awayGrid.className = 'match-details-grid';
        awayGrid.style.display = 'grid';
        awayGrid.style.gridTemplateColumns = '1fr 1fr';
        awayGrid.style.gap = '20px';

        // Saturday column
        const awaySatCol = document.createElement('div');
        awaySatCol.className = 'match-col';
        const awaySatTitle = document.createElement('h4');
        awaySatTitle.className = 'match-glow';
        awaySatTitle.textContent = 'Samedi';
        awaySatTitle.style.textAlign = 'center';
        awaySatTitle.style.marginBottom = '1rem';
        awaySatTitle.style.color = 'black';
        awaySatCol.appendChild(awaySatTitle);
        awaySatCol.appendChild(this.createMatchList(awaySaturday));

        // Sunday column
        const awaySunCol = document.createElement('div');
        awaySunCol.className = 'match-col';
        const awaySunTitle = document.createElement('h4');
        awaySunTitle.className = 'match-glow';
        awaySunTitle.textContent = 'Dimanche';
        awaySunTitle.style.textAlign = 'center';
        awaySunTitle.style.marginBottom = '1rem';
        awaySunTitle.style.color = 'black';
        awaySunCol.appendChild(awaySunTitle);
        awaySunCol.appendChild(this.createMatchList(awaySunday));

        awayGrid.appendChild(awaySatCol);
        awayGrid.appendChild(awaySunCol);
        awaySection.appendChild(awayGrid);
        container.appendChild(awaySection);

        return container;
    }

    /**
     * Helper to create a list of matches as a div
     */
    private static createMatchList(matches: MatchData[]): HTMLDivElement {
        const listDiv = document.createElement('div');
        listDiv.className = 'match-list';

        if (matches.length === 0) {
            const emptyMsg = document.createElement('p');
            emptyMsg.textContent = 'Aucun match';
            // emptyMsg.style.color = '#888';
            emptyMsg.style.textAlign = 'center';
            emptyMsg.style.padding = '1rem';
            listDiv.appendChild(emptyMsg);
            return listDiv;
        }

        matches.forEach(match => {
            const item = document.createElement('div');
            item.className = 'detail-item';
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'flex-start';
            item.style.padding = '0.75rem';
            item.style.borderRadius = '6px';
            item.style.border = '1px solid #dee2e6';
            item.style.marginBottom = '0.75rem';
            item.style.backgroundColor = 'var(--background-color3)';

            item.style.color = 'var(--font-color1)';

            // Category and level
            const categoryLine = document.createElement('div');
            categoryLine.style.marginBottom = '0.5rem';
            categoryLine.style.width = '100%';

            const categoryLabel = document.createElement('strong');
            categoryLabel.className = 'detail-label';
            categoryLabel.textContent = match['Catég.'];
            categoryLabel.style.color = 'var(--font-color1)';
            categoryLabel.style.fontSize = '1.1rem';

            // const levelText = document.createElement('span');
            // levelText.className = 'detail-value';
            // levelText.textContent = ` - ${match['Niv.']}`;
            // levelText.style.color = 'var(--font-color1)';
            // levelText.style.fontSize = '0.9rem';

            categoryLine.appendChild(categoryLabel);
            // categoryLine.appendChild(levelText);
            item.appendChild(categoryLine);

            // Match details
            const matchLine = document.createElement('div');
            matchLine.className = 'detail-value';

            matchLine.textContent = match.Rencontre;
            matchLine.style.marginBottom = '0.5rem';
            matchLine.style.fontWeight = '600';
            matchLine.style.fontSize = '1rem';
            matchLine.style.color = 'var(--font-color1)';
            item.appendChild(matchLine);

            // Time and location
            const timeLine = document.createElement('div');
            timeLine.className = 'detail-value';
            timeLine.style.fontSize = '0.9rem';
            timeLine.style.color = 'var(--font-color1)';

            const timeSpan = document.createElement('span');
            timeSpan.textContent = match.Heure;
            timeSpan.style.fontWeight = '600';

            const locationSpan = document.createElement('span');
            locationSpan.textContent = ` - ${match.Gymnase}`;

            timeLine.appendChild(timeSpan);
            timeLine.appendChild(locationSpan);
            item.appendChild(timeLine);

            listDiv.appendChild(item);
        });

        return listDiv;
    }

    /**
     * Convert a div element to JPEG and download it
     */
    private static async convertDivToJpeg(div: HTMLDivElement, filename: string = 'matches.jpg'): Promise<void> {
        // The div already has proper styling from createMatchDiv, just append it
        // Append to body temporarily
        document.body.appendChild(div);

        try {
            // Use html2canvas to capture the div
            const canvas = await html2canvas(div, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                logging: false,
                width: 1024,
                windowWidth: 1024
            });

            // Convert canvas to JPEG blob
            canvas.toBlob((blob) => {
                if (blob) {
                    // Create download link
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = filename;
                    document.body.appendChild(link);
                    link.click();

                    // Cleanup
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                }
            }, 'image/jpeg', 0.95); // 95% quality JPEG

        } catch (error) {
            console.error('Error converting div to JPEG:', error);
            alert('Erreur lors de la création de l\'image');
        } finally {
            // Remove the temporary div
            document.body.removeChild(div);
        }
    }

    public static show(): void {
        this.createModal();
    }

    // 1. Convert Excel to JSON
    private static async excelToJson(file: File): Promise<MatchData[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const data = e.target?.result;
                    const workbook = XLSX.read(data, { type: 'binary' });
                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<MatchData>(sheet, { defval: '' });
                    resolve(json);
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = (error) => reject(error);
            reader.readAsBinaryString(file);
        });
    }


    private static async handleCreation(file: File): Promise<void> {
      // Placeholder for creation logic
      console.log('Creating from file:', file.name);

      try {
          // Convert Excel to JSON
          const json = await this.excelToJson(file);

          // Filter to keep only entries where Rencontre is not empty
          const filteredJson = json.filter(
              item => item.Rencontre && item.Rencontre.trim() !== ''
          );

          console.log('JSON data from Excel (filtered):');
          console.log(JSON.stringify(filteredJson, null, 2));

          // Create the match div
          const matchDiv = this.createMatchDiv(filteredJson);

          // Convert to JPEG and download
          await this.convertDivToJpeg(matchDiv, `matches_${new Date().toISOString().split('T')[0]}.jpg`);

          alert('L\'affiche a été téléchargée avec succès!');

      } catch (error) {
          console.error('Error converting Excel to JSON:', error);
          alert('Erreur lors de la lecture du fichier Excel');
      }
    }

    private static createModal(): void {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';

        const modalContent = document.createElement('div');
        modalContent.className = 'modal-content';
        modalContent.style.maxWidth = '500px';

        modalContent.innerHTML = `
            <div class="modal-header">
                <h2>Importer Fichier Excel</h2>
                <button class="modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <p>Sélectionnez un fichier Excel (.xls ou .xlsx) pour l'importer:</p>
                <div style="margin: 20px 0;">
                    <input type="file" id="excel-file-input" accept=".xls,.xlsx" style="display: none;" />
                    <button class="btn btn-primary" id="browse-file-btn">Parcourir les Fichiers</button>
                </div>
                <div id="file-info" style="margin-top: 15px; padding: 10px; background: #f5f5f5; border-radius: 4px; display: none;">
                    <p style="margin: 0;"><strong>Fichier sélectionné:</strong></p>
                    <p id="file-name" style="margin: 5px 0 0 0; color: black;"></p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" id="cancel-import-btn">Annuler</button>
                <button class="btn btn-primary" id="import-file-btn" disabled>Créer Affiche</button>
            </div>
        `;

        modalOverlay.appendChild(modalContent);
        document.body.appendChild(modalOverlay);

        this.setupEventListeners(modalOverlay, modalContent);
    }

    private static setupEventListeners(modalOverlay: HTMLElement, modalContent: HTMLElement): void {
        // Get elements
        const fileInput = document.getElementById('excel-file-input') as HTMLInputElement;
        const browseBtn = document.getElementById('browse-file-btn') as HTMLButtonElement;
        const fileInfo = document.getElementById('file-info') as HTMLElement;
        const fileName = document.getElementById('file-name') as HTMLElement;
        const importBtn = document.getElementById('import-file-btn') as HTMLButtonElement;
        const cancelBtn = document.getElementById('cancel-import-btn') as HTMLButtonElement;
        const closeBtn = modalContent.querySelector('.modal-close') as HTMLButtonElement;

        // Browse button triggers file input
        browseBtn.addEventListener('click', () => {
            fileInput.click();
        });

        // Handle file selection
        fileInput.addEventListener('change', () => {
            if (fileInput.files && fileInput.files.length > 0) {
                const file = fileInput.files[0];
                fileName.textContent = file.name;
                fileInfo.style.display = 'block';
                importBtn.disabled = false;
            }
        });

        // Handle import button
        importBtn.addEventListener('click', () => {
            if (fileInput.files && fileInput.files.length > 0 && this.handleCreation) {
                this.handleCreation(fileInput.files[0]);
                modalOverlay.remove();
            }
        });

        // Handle cancel/close
        const closeModal = () => modalOverlay.remove();
        cancelBtn.addEventListener('click', closeModal);
        closeBtn.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }
}
