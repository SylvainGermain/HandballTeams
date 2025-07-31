import html2canvas from 'html2canvas';
import { Resources } from './resources';
import { PlayerHelper } from './player';
import JSZip from 'jszip';
import { Post } from './model';
import GIF from 'gif.js';

export namespace ExportHelper {

// Helper function to create and configure temporary container
function createTempContainer(playersPerPage: number, color: string, columns: number): HTMLElement {
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    tempContainer.style.top = '-9999px';

    // Optimize container width for better aspect ratio
    const containerWidth = playersPerPage === 1 ? '400px' : '800px';
    tempContainer.style.width = containerWidth;

    // Minimize padding, especially for single player exports
    const containerPadding = playersPerPage === 1 ? '5px' : '10px';
    tempContainer.style.padding = containerPadding;
    tempContainer.style.backgroundColor = color;
    tempContainer.style.display = 'grid';

    // Dynamic grid layout based on players per page
    const rows = Math.ceil(playersPerPage / columns);
    tempContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
    tempContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

    // Minimize gap for better aspect ratio
    const gridGap = playersPerPage === 1 ? '5px' : '15px';
    tempContainer.style.gap = gridGap;
    tempContainer.style.justifyItems = 'center';
    tempContainer.style.alignItems = 'center';

    document.body.appendChild(tempContainer);
    return tempContainer;
}

// Helper function to populate container with player cards
function populateContainer(tempContainer: HTMLElement, players: any[]): void {
    tempContainer.innerHTML = '';
    players.forEach(player => {
        const playerCard = document.createElement('div');
        playerCard.innerHTML = PlayerHelper.createPlayer(player, true); // Show stats
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
            alert('No players found for this team (coaches are excluded from bundle export)');
            return;
        }

        // Show a loading indicator
        exportBtn.textContent = 'Exporting...';
        exportBtn.disabled = true;

        const backgroundColor = 'rgba(0,0,0,0)';
        // Create temporary container

        const columns = Math.min(Math.ceil(Math.sqrt(playersPerPage)), 4); // Max 4 columns
        const tempContainer = createTempContainer(playersPerPage, backgroundColor, columns);

        // Populate container with player cards
        populateContainer(tempContainer, players);
        //   playersSection.style.gridTemplateColumns = 'repeat(4, 1fr)'; // Fixed 4 columns for export
        // Capture this frame
        const canvas = await captureFrame(tempContainer, backgroundColor);

        // Convert to blob and download
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

          // Reset button
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
      }, 'image/png');

  } catch (error) {
      console.error('Error exporting players:', error);
      alert('Failed to export players image. Please try again.');

      // Reset button on error
      exportBtn.textContent = originalText;
      exportBtn.disabled = false;
  }
}

export async function exportPlayersAsBundle(teamId: string, playersPerPage: number = 4): Promise<void> {

  try {
      // Show a loading indicator
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      const originalText = exportBtn?.textContent || 'Export as Bundle';
      if (exportBtn) {
          exportBtn.textContent = 'Exporting...';
          exportBtn.disabled = true;
      }

      // Get filtered players (excludes coaches)
      const players = getFilteredPlayers(teamId);

      if (players.length === 0) {
          alert('No players found for this team (coaches are excluded from bundle export)');
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
      console.error('Error exporting players as ZIP Bundle:', error);
      alert('Failed to export players as ZIP Bundle. Please try again.');

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
          exportBtn.textContent = 'Creating Movie...';
          exportBtn.disabled = true;
      }

      // Get filtered players (excludes coaches)
      const players = getFilteredPlayers(teamId);

      if (players.length === 0) {
          alert('No players found for this team (coaches are excluded from movie export)');
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
              exportBtn.textContent = `Creating Movie... ${frameIndex + 1}/${totalFrames}`;
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
          exportBtn.textContent = 'Creating GIF Animation...';
          exportBtn.style.background = 'linear-gradient(90deg, #fd7e14 95%, #e55a00 95%)';
      }

      // Configure GIF settings
      const gif = new GIF({
          workers: 2, // Use 2 web workers for faster processing
          quality: 10, // Lower is better quality (1-30)
          width: frames[0].width,
          height: frames[0].height,
          workerScript: './gif.worker.js', // Use local gif.worker.js from root level
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
              link.download = `${teamId}_players_animated_${playersPerPage}per_${new Date().toISOString().split('T')[0]}.gif`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);

              console.log(`Successfully created animated GIF with ${frames.length} frames`);
          } catch (error) {
              console.error('Error downloading GIF:', error);
              alert('GIF created successfully but download failed. Please try again.');
          }

          // Reset button
          if (exportBtn) {
              exportBtn.textContent = originalText;
              exportBtn.disabled = false;
              exportBtn.style.background = '';
          }
      });

      // Handle GIF progress updates
      gif.on('progress', function(progress: number) {
          if (exportBtn) {
              const gifProgress = Math.round(95 + (progress * 5)); // 95-100%
              exportBtn.style.background = `linear-gradient(90deg, #fd7e14 ${gifProgress}%, #e55a00 ${gifProgress}%)`;
              exportBtn.textContent = `Creating GIF... ${Math.round(progress * 100)}%`;
          }
      });

      // Handle GIF creation errors
      gif.on('abort', function() {
          console.error('GIF creation was aborted');
          alert('GIF creation was interrupted. Please try again.');

          if (exportBtn) {
              exportBtn.textContent = originalText;
              exportBtn.disabled = false;
              exportBtn.style.background = '';
          }
      });

      // Start GIF rendering
      gif.render();

  } catch (error) {
      console.error('Error creating movie export:', error);
      alert('Failed to create movie export. Please try again.');

      // Reset button on error
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '🚀 Export Bundle';
          exportBtn.disabled = false;
      }
  }
}

export async function exportSinglePlayerCard(playerCard: HTMLElement, playerName: string): Promise<void> {
  if (!playerCard) {
      alert('No player card found to export');
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
      alert('Failed to export player card. Please try again.');
  }
}

export async function exportSummaryAsImage(summarySection: HTMLElement, fileName: string): Promise<void> {
  if (!summarySection) {
      alert('No summary section found to export');
      return;
  }

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
      offscreenDiv.style.position = 'absolute';
      offscreenDiv.style.left = '-9999px';
      offscreenDiv.style.top = '-9999px';
      offscreenDiv.style.width = '1600px'; // Increased width to accommodate 4 players
      offscreenDiv.style.padding = '40px';
      offscreenDiv.style.backgroundColor = '#ffffff';
      offscreenDiv.style.fontFamily = 'Arial, sans-serif';
      document.body.appendChild(offscreenDiv);

      // Extract match info from the original summary
      const matchTitle = summarySection.querySelector('.match-title')?.textContent || 'Match Day';
      const matchDayTitle = summarySection.querySelector('.match-day-title')?.textContent || 'Match Day';

      // Get player cards from each section more reliably
      const sectionWrappers = Array.from(summarySection.querySelectorAll('.section-wrapper'));

      let majorPlayersCards: Element[] = [];
      let substitutesCards: Element[] = [];
      let coachCard: Element | null = null;

      sectionWrappers.forEach(wrapper => {
          const headingText = wrapper.querySelector('.section-heading')?.textContent || '';
          const playerCards = Array.from(wrapper.querySelectorAll('.player-card'));

          if (headingText.includes('Major Players')) {
              majorPlayersCards = playerCards;
          } else if (headingText.includes('Substitutes')) {
              substitutesCards = playerCards;
          } else if (headingText.includes('Coach')) {
              coachCard = playerCards[0] || null;
          }
      });

      // Build the offscreen content with better organization
      offscreenDiv.innerHTML = `
          <style>
              .player-card {
                  width: 280px !important;
                  height: 280px !important;
                  margin: 0 !important;
                  max-width: none !important;
                  max-height: none !important;
              }
          </style>
          <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="font-size: 2.5rem; color: #2c3e50; margin-bottom: 10px; font-weight: bold; text-transform: uppercase;">${matchDayTitle}</h1>
              <h2 style="font-size: 1.8rem; color: #34495e; margin-bottom: 20px; font-weight: 600;">${matchTitle}</h2>
              <h3 style="color: #2c3e50; font-size: 1.6rem; margin-bottom: 20px; text-align: center; border-bottom: 3px solid #3498db; padding-bottom: 10px;"> Players (${majorPlayersCards.length + substitutesCards.length})</h3>

          </div>

          ${majorPlayersCards.length > 0 ? `
              <div style="margin-bottom: 40px;">
                  <div style="display: grid; grid-template-columns: repeat(${Math.min(4, majorPlayersCards.length)}, 1fr); gap: 30px; justify-items: center; max-width: 1520px; margin: 0 auto;">
                      ${majorPlayersCards.map(card => (card as HTMLElement).outerHTML).join('')}
                  </div>
              </div>
          ` : ''}

          ${substitutesCards.length > 0 ? `
              <div style="margin-bottom: 40px;">
                  <div style="display: grid; grid-template-columns: repeat(${Math.min(4, substitutesCards.length)}, 1fr); gap: 30px; justify-items: center; max-width: 1520px; margin: 0 auto;">
                      ${substitutesCards.map(card => (card as HTMLElement).outerHTML).join('')}
              </div>
          ` : ''}

          ${coachCard ? `
              <div style="margin-bottom: 30px;">
                  <h3 style="color: #2c3e50; font-size: 1.6rem; margin-bottom: 20px; text-align: center; border-bottom: 3px solid #f39c12; padding-bottom: 10px;">Coach</h3>
                  <div style="display: flex; justify-content: center;">
                      ${(coachCard as HTMLElement).outerHTML}
                  </div>
              </div>
          ` : ''}
      `;

      // Wait for layout to settle
      await new Promise(resolve => setTimeout(resolve, 200));

      // Create canvas from the offscreen div
      const canvas = await html2canvas(offscreenDiv, {
          backgroundColor: '#ffffff',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          width: 1600, // Updated to match container width
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
      console.error('Error exporting summary:', error);
      alert('Failed to export summary image. Please try again.');

      // Reset button on error
      const exportBtn = document.querySelector('#export-summary-btn') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '📸 Export as JPEG';
          exportBtn.disabled = false;
      }
  }
}

}
