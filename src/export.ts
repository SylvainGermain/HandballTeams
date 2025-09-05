import html2canvas from 'html2canvas';
import { Resources } from './resources';
import { PlayerHelper } from './player';
import JSZip from 'jszip';
import { Post, TeamCompositionSummary } from './model';
import GIF from 'gif.js';
import { SummaryRenderer, PlayerLayout, PlayerSectionOptions } from './summaryRenderer';

export enum SummaryExportMode {
    CONVOC = 'CONVOC',
    PREMATCH = 'PREMATCH',
    POSTMATCH = 'POSTMATCH'
}


export namespace ExportHelper {

// Fonction d'aide pour créer et configurer un conteneur temporaire
function createTempContainer(playersPerPage: number, color: string, columns: number): HTMLElement {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';

    // Optimiser la largeur du conteneur pour un meilleur ratio d'aspect
    const containerWidth = playersPerPage === 1 ? '400px' : '800px';
    tempContainer.style.width = containerWidth;

    // Minimise le padding, surtout pour les exports de joueurs individuels
    const containerPadding = playersPerPage === 1 ? '5px' : '10px';
    tempContainer.style.padding = containerPadding;
    tempContainer.style.backgroundColor = color;
    tempContainer.style.display = 'grid';

    // Mise en page de grille dynamique basée sur le nombre de joueurs par page
    const rows = Math.ceil(playersPerPage / columns);
    tempContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    tempContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Minimiser l'espacement pour un meilleur ratio d'aspect
    const gridGap = playersPerPage === 1 ? '5px' : '15px';
    tempContainer.style.gap = gridGap;
    tempContainer.style.justifyItems = 'center';
    tempContainer.style.alignItems = 'center';

    document.body.appendChild(tempContainer);
    return tempContainer;
}

// Fonction d'aide pour remplir le conteneur avec les cartes de joueurs
function populateContainer(tempContainer: HTMLElement, players: any[]): void {
    tempContainer.innerHTML = '';
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.innerHTML = PlayerHelper.createPlayer(player, PlayerHelper.ShowAll); // Show stats
        tempContainer.appendChild(playerCard.firstElementChild as HTMLElement);
    });
}

// Helper function to capture frame as canvas
async function captureFrame(tempContainer: HTMLElement, color: string): Promise<HTMLCanvasElement> {
    await new Promise(resolve => setTimeout(resolve, 200));

    return await html2canvas(tempContainer, {
        backgroundColor: color,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        width: tempContainer.scrollWidth,
        height: tempContainer.scrollHeight,
        scrollX: 0,
        scrollY: 0
    });
}

// Helper function to get filtered players
function getFilteredPlayers(teamId: string): any[] {
    const allPlayers = Resources.getPlayersData(teamId);
    return allPlayers.filter(player => player.poste !== Post.COACH);
}

export async function exportPlayersAsImage(teamId: string): Promise<void> {

  const exportBtn = document.querySelector('.export-btn') as HTMLButtonElement;
  const originalText = exportBtn.textContent;
  try {
        // Get filtered players (excludes coaches)
        const players = getFilteredPlayers(teamId);
        const playersPerPage = players.length
        if (playersPerPage === 0) {
            alert('Aucun joueur trouvé pour cette équipe (les entraîneurs sont exclus de l\'export en bundle)');
            return;
        }

        // Afficher un indicateur de chargement
        exportBtn.textContent = 'Export en cours...';
        exportBtn.disabled = true;

        const backgroundColor = 'rgba(0,0,0,0)';
        // Créer un conteneur temporaire

        const columns = Math.min(Math.ceil(Math.sqrt(playersPerPage)), 4); // Max 4 columns
        const tempContainer = createTempContainer(playersPerPage, backgroundColor, columns);

        // Remplir le conteneur avec les cartes de joueurs
        populateContainer(tempContainer, players);
        //   playersSection.style.gridTemplateColumns = 'repeat(4, 1fr)'; // Fixed 4 columns for export
        // Capturer cette image
        const canvas = await captureFrame(tempContainer, backgroundColor);

        // Convertir en blob et télécharger
        canvas.toBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${teamId}_players_${new Date().toISOString().split('T')[0]}.png`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }

          // Réinitialiser le bouton
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
      }, 'image/png');

  } catch (error) {
      console.error('Erreur lors de l\'export des joueurs:', error);
      alert('Échec de l\'export de l\'image des joueurs. Veuillez réessayer.');

      // Réinitialiser le bouton en cas d'erreur
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
  }
}

export async function exportPlayersAsBundle(teamId: string, playersPerPage: number = 4): Promise<void> {

  try {
      // Afficher un indicateur de chargement
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      const originalText = exportBtn?.textContent || 'Exporter en Bundle';
      if (exportBtn) {
          exportBtn.textContent = 'Export en cours...';
          exportBtn.disabled = true;
      }

      // Get filtered players (excludes coaches)
      const players = getFilteredPlayers(teamId);

      if (players.length === 0) {
          alert('Aucun joueur trouvé pour cette équipe (les entraîneurs sont exclus de l\'export en bundle)');
          return;
      }

      // Create frames (configurable players per frame)
      const zip = new JSZip();
      const totalFrames = Math.ceil(players.length / playersPerPage);
      const backgroundColor = 'rgba(0,0,0,0)';
      // Create temporary container
      const columns = Math.min(Math.ceil(Math.sqrt(playersPerPage)), 4); // Max 4 columns
      const tempContainer = createTempContainer(playersPerPage, backgroundColor, columns);

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          // Update visual progress (80% for capture, 20% for ZIP generation)
          const captureProgress = Math.round((frameIndex / totalFrames) * 80);
          if (exportBtn) {
              exportBtn.style.background = `linear-gradient(90deg, #fd7e14 ${captureProgress}%, #e55a00 ${captureProgress}%)`;
          }

          // Get players for this frame
          const startIndex = frameIndex * playersPerPage;
          const endIndex = Math.min(startIndex + playersPerPage, players.length);
          const framePlayers = players.slice(startIndex, endIndex);

          // Populate container with player cards
          populateContainer(tempContainer, framePlayers);

          // Capture this frame
          const canvas = await captureFrame(tempContainer, backgroundColor);

          // Convert canvas to PNG blob and add to ZIP
          const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, 'image/png');
          });

          if (blob) {
              let fileName: string;
              if (playersPerPage === 1 && framePlayers.length === 1) {
                  // For single player per page, prefix with player name
                  const player = framePlayers[0];
                  const playerName = `${player.prenom}_${player.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
                  fileName = `${playerName}_${teamId}_page_${frameIndex + 1}_of_${totalFrames}.png`;
              } else {
                  // For multiple players per page, use original naming
                  fileName = `${teamId}_page_${frameIndex + 1}_of_${totalFrames}.png`;
              }
              zip.file(fileName, blob);
          }
      }

      // Remove the temporary container
      document.body.removeChild(tempContainer);

      // Update visual progress to show ZIP creation phase
      if (exportBtn) {
          exportBtn.style.background = 'linear-gradient(90deg, #fd7e14 85%, #e55a00 85%)';
      }

      // Add a README file to the ZIP
      const readmeContent = `Team: ${teamId}
Export Date: ${new Date().toISOString().split('T')[0]}
Total Players: ${players.length}
Players per Page: ${playersPerPage}
Total Pages: ${totalFrames}

This bundle contains Png images of player cards organized in pages.
Each page shows up to ${playersPerPage} players in a ${columns}x${Math.ceil(playersPerPage / columns)} grid layout.

Files included:
${Array.from({ length: totalFrames }, (_, i) => {
    const startIndex = i * playersPerPage;
    const endIndex = Math.min(startIndex + playersPerPage, players.length);
    const framePlayers = players.slice(startIndex, endIndex);

    if (playersPerPage === 1 && framePlayers.length === 1) {
        const player = framePlayers[0];
        const playerName = `${player.prenom}_${player.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `- ${playerName}_${teamId}_page_${i + 1}_of_${totalFrames}.png`;
    } else {
        return `- ${teamId}_page_${i + 1}_of_${totalFrames}.png`;
    }
}).join('\n')}
`;

      zip.file('README.txt', readmeContent);

      // Update visual progress for ZIP generation
      if (exportBtn) {
          exportBtn.style.background = 'linear-gradient(90deg, #fd7e14 95%, #e55a00 95%)';
      }

      // Generate ZIP file and download
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      // Update visual progress for download
      if (exportBtn) {
          exportBtn.style.background = 'linear-gradient(90deg, #fd7e14 100%, #e55a00 100%)';
      }

      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.download = `${teamId}_players_bundle_${new Date().toISOString().split('T')[0]}.zip`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Reset button
      if (exportBtn) {
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
          exportBtn.style.background = ''; // Reset to CSS default
      }

  } catch (error) {
      console.error('Erreur lors de l\'export des joueurs en bundle ZIP:', error);
      alert('Échec de l\'export des joueurs en bundle ZIP. Veuillez réessayer.');

      // Reset button on error
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '📦 Export as Bundle';
          exportBtn.disabled = false;
          exportBtn.style.background = ''; // Reset to CSS default
      }
  }
}

export async function exportPlayersAsMovie(teamId: string, playersPerPage: number = 4): Promise<void> {
  try {
      // Show a loading indicator
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      const originalText = exportBtn?.textContent || 'Export Bundle';
      if (exportBtn) {
          exportBtn.textContent = 'Création Vidéo...';
          exportBtn.disabled = true;
      }

      // Get filtered players (excludes coaches)
      const players = getFilteredPlayers(teamId);

      if (players.length === 0) {
          alert('Aucun joueur trouvé pour cette équipe (les entraîneurs sont exclus de l\'export vidéo)');
          return;
      }

      // Step 1: Create frames for each page of players
      const totalFrames = Math.ceil(players.length / playersPerPage);
      const frames: HTMLCanvasElement[] = [];

      // Create temporary container
      const backgroundColor = '#f8f9fa';
      const columns = Math.min(Math.ceil(Math.sqrt(playersPerPage)), 4); // Max 4 columns
      const tempContainer = createTempContainer(playersPerPage, backgroundColor, columns);

      // Step 2: Convert frames to images using html2canvas
      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          // Update visual progress (90% for capture, 10% for movie generation)
          const captureProgress = Math.round((frameIndex / totalFrames) * 90);
          if (exportBtn) {
              exportBtn.textContent = `Création Vidéo... ${frameIndex + 1}/${totalFrames}`;
              exportBtn.style.background = `linear-gradient(90deg, #fd7e14 ${captureProgress}%, #e55a00 ${captureProgress}%)`;
          }

          // Get players for this frame
          const startIndex = frameIndex * playersPerPage;
          const endIndex = Math.min(startIndex + playersPerPage, players.length);
          const framePlayers = players.slice(startIndex, endIndex);

          // Populate container with player cards
          populateContainer(tempContainer, framePlayers);

          // Capture this frame as canvas
          const canvas = await captureFrame(tempContainer, backgroundColor);
          frames.push(canvas);
      }

      // Remove the temporary container
      document.body.removeChild(tempContainer);

      console.log(`Movie export requested for team ${teamId} with ${players.length} players, ${playersPerPage} players per page`);
      console.log(`Generated ${frames.length} frames for the movie`);

      // Step 3: Create animated GIF from frames
      if (exportBtn) {
          exportBtn.textContent = 'Création Animation GIF...';
          exportBtn.style.background = 'linear-gradient(90deg, #fd7e14 95%, #e55a00 95%)';
      }

      const progressCallback = (progress: number) => {
        if (exportBtn) {
            const gifProgress = Math.round(95 + (progress * 5)); // 95-100%
            exportBtn.style.background = `linear-gradient(90deg, #fd7e14 ${gifProgress}%, #e55a00 ${gifProgress}%)`;
            exportBtn.textContent = `Création GIF... ${Math.round(progress * 100)}%`;
        }
        };

      const endCallback = () => {
        if (exportBtn) {
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
            exportBtn.style.background = ''; // Reset to CSS default
        }
        };

        await exportGIFFrames(frames, `${teamId}_players_animated_${playersPerPage}per_${new Date().toISOString().split('T')[0]}`,
            progressCallback, endCallback);
  } catch (error) {
      console.error('Erreur lors de la création de l\'export vidéo:', error);
      alert('Échec de la création de l\'export vidéo. Veuillez réessayer.');

      // Reset button on error
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '🚀 Export Bundle';
          exportBtn.disabled = false;
      }
  }
}

export async function exportGIFFrames(
    frames: HTMLCanvasElement[], fileNamePrefix: string,
    progressCallback: (progress: number) => void,
    callback: () => void ){
    return new Promise<void>((resolve, reject) => {
    // Configure GIF settings
        const gif = new GIF({
            workers: 2, // Use 2 web workers for faster processing
            quality: 10, // Lower is better quality (1-30)
            width: frames[0].width,
            height: frames[0].height,
            workerScript: process.env.NODE_ENV === 'production' ? './build/gif.worker.js' : './gif.worker.js',
            repeat: 0, // 0 = loop forever, -1 = no loop, n = loop n times
            transparent: null // No transparency
        });

        // Add each frame to the GIF with timing
        frames.forEach((canvas, index) => {
            // Longer delay for first and last frames for better viewing
            let delay: number;
            if (index === 0) {
                delay = 2000; // First frame: 2.5 seconds
            } else if (index === frames.length - 1) {
                delay = 2000; // Last frame: 3 seconds
            } else {
                delay = 1000; // Middle frames: 1.8 seconds
            }

            gif.addFrame(canvas, {
                delay: delay,
                copy: true // Copy frame data to prevent memory issues
            });
        });
        // Handle GIF completion
        gif.on('finished', function(blob: Blob) {
            try {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.download = `${fileNamePrefix}.gif`;
                link.href = url;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log(`Successfully created animated GIF with ${frames.length} frames`);
            } catch (error) {
                console.error('Error downloading GIF:', error);
                alert('GIF créé avec succès mais le téléchargement a échoué. Veuillez réessayer.');
                reject(error)
            }

            callback();
            resolve()
        });

        // Handle GIF progress updates
        gif.on('progress', progressCallback);


        // Handle GIF creation errors
        gif.on('abort', function() {
            console.error('GIF creation was aborted');
            alert('GIF creation was interrupted. Please try again.');
            callback();
            resolve;
        });

        // Start GIF rendering
        gif.render();
    });
}

export async function exportSinglePlayerCard(playerCard: HTMLElement, playerName: string): Promise<void> {
  if (!playerCard) {
      alert('Aucune carte de joueur trouvée à exporter');
      return;
  }

  try {
      // Create a temporary container for the single player card
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.padding = '20px';
      tempContainer.style.backgroundColor = 'rgba(0,0,0,0)';
      tempContainer.style.width = 'auto';
      tempContainer.style.height = 'auto';

      // Clone the player card
      const clonedCard = playerCard.cloneNode(true) as HTMLElement;
      tempContainer.appendChild(clonedCard);
      document.body.appendChild(tempContainer);

      // Wait a moment for the layout to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas from the single player card
      const canvas = await html2canvas(tempContainer, {
          backgroundColor: 'rgba(0,0,0,0)',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          width: tempContainer.scrollWidth,
          height: tempContainer.scrollHeight,
          scrollX: 0,
          scrollY: 0
      });

      // Remove temporary container
      document.body.removeChild(tempContainer);

      // Convert canvas to blob as PNG with transparency
      canvas.toBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${playerName.replace(/\s+/g, '_')}_card.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }
      }, 'image/png');

  } catch (error) {
      console.error('Error exporting single player card:', error);
      alert('Échec de l\'export de la carte du joueur. Veuillez réessayer.');
  }
}


export async function exportSummary(summary: TeamCompositionSummary, fileName: string, mode: SummaryExportMode): Promise<void> {

  try {
      // Show a loading indicator
      const exportBtn = document.querySelector('#export-summary-btn') as HTMLButtonElement;
      const originalText = exportBtn?.textContent || 'Export';
      if (exportBtn) {
          exportBtn.textContent = 'Exporting...';
          exportBtn.disabled = true;
      }

      // Create an offscreen div for better layout control
      const offscreenDiv = document.createElement('div');
      offscreenDiv.className = 'export-summary-container';
      offscreenDiv.style.position = 'absolute';
      offscreenDiv.style.left = '-9999px';
      offscreenDiv.style.top = '-9999px';
      offscreenDiv.style.width = '1200px';
      offscreenDiv.style.padding = '10px';
      offscreenDiv.style.background = 'var(--background-color1)';
      offscreenDiv.style.fontFamily = 'Arial, sans-serif';

      // Use SummaryRenderer methods to generate the content
      const options: PlayerSectionOptions = {
          layout: PlayerLayout.GRID
      };

    //   const style = '';

      switch(mode){
        case SummaryExportMode.PREMATCH:
        case SummaryExportMode.POSTMATCH:
            options.layout = PlayerLayout.TACTICAL;
            break;
        case SummaryExportMode.CONVOC:
            options.layout = PlayerLayout.GRID;
      }

      document.body.appendChild(offscreenDiv);

      // Build the content using the modular methods
      const titleHTML = SummaryRenderer.createSummaryTitle(summary);
      const playersHTML = SummaryRenderer.createPlayersAndCoachSection(summary, options);
      const detailsHTML = SummaryRenderer.createMatchDetailsSection(summary, mode);

      // Combine all sections with export-optimized styling
      offscreenDiv.innerHTML = `
          <div>
              ${titleHTML}
              ${playersHTML}
              ${detailsHTML}
          </div>
      `;

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 300));

      // Create canvas from the offscreen div
      const canvas = await html2canvas(offscreenDiv, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          width: 1200,
          height: offscreenDiv.scrollHeight,
          scrollX: 0,
          scrollY: 0
      });

      // Remove the offscreen div
      document.body.removeChild(offscreenDiv);

      // Convert to blob and download
      canvas.toBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${fileName}_${new Date().toISOString().split('T')[0]}.jpeg`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }

          // Reset button
          if (exportBtn) {
              exportBtn.textContent = originalText;
              exportBtn.disabled = false;
          }
      }, 'image/jpeg', 0.9);

  } catch (error) {
      console.error('Erreur lors de l\'export du résumé:', error);
      alert('Échec de l\'export de l\'image du résumé. Veuillez réessayer.');

      // Reset button on error
      const exportBtn = document.querySelector('#export-summary-btn') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '📸 Export as JPEG';
          exportBtn.disabled = false;
      }
  }
}

}
