import html2canvas from 'html2canvas';
import { Resources } from './resources';
import { PlayerHelper } from './player';
import JSZip from 'jszip';
import { Post } from './model';

export namespace ExportHelper {

export async function exportPlayersAsImage(playersSection: HTMLElement, teamId: string): Promise<void> {
  if (!playersSection) {
      alert('No players section found to export');
      return;
  }

  try {
      // Show a loading indicator
      const exportBtn = document.querySelector('.export-btn') as HTMLButtonElement;
      const originalText = exportBtn.textContent;
      exportBtn.textContent = 'Exporting...';
      exportBtn.disabled = true;

      // Store original styles to restore later
      const originalMaxHeight = playersSection.style.maxHeight;
      const originalOverflowY = playersSection.style.overflowY;
      const originalHeight = playersSection.style.height;
      const originalGridTemplateColumns = playersSection.style.gridTemplateColumns;

      // Temporarily remove scrolling constraints and set fixed grid for capture
      playersSection.style.maxHeight = 'none';
      playersSection.style.overflowY = 'visible';
      playersSection.style.height = 'auto';
      playersSection.style.gridTemplateColumns = 'repeat(4, 1fr)'; // Fixed 4 columns for export

      // Wait a moment for the layout to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Create canvas from the players section
      const canvas = await html2canvas(playersSection, {
          backgroundColor: '#f8f9fa',
          scale: 2, // Higher quality
          useCORS: true,
          allowTaint: true,
          width: playersSection.scrollWidth,
          height: playersSection.scrollHeight,
          scrollX: 0,
          scrollY: 0
      });

      // Restore original styles
      playersSection.style.maxHeight = originalMaxHeight;
      playersSection.style.overflowY = originalOverflowY;
      playersSection.style.height = originalHeight;
      playersSection.style.gridTemplateColumns = originalGridTemplateColumns;

      // Convert to blob and download
      canvas.toBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `${teamId}_players_${new Date().toISOString().split('T')[0]}.jpeg`;
              link.href = url;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }

          // Reset button
          exportBtn.textContent = originalText;
          exportBtn.disabled = false;
      }, 'image/jpeg', 0.9);

  } catch (error) {
      console.error('Error exporting players:', error);
      alert('Failed to export players image. Please try again.');

      // Reset button on error
      const exportBtn = document.querySelector('.export-btn') as HTMLButtonElement;
      if (exportBtn) {
          exportBtn.textContent = '📸 Export Players as JPEG';
          exportBtn.disabled = false;
      }
  }
}

export async function exportPlayersAsBundle(playersSection: HTMLElement, teamId: string, playersPerPage: number = 4): Promise<void> {
  if (!playersSection) {
      alert('No players section found to export');
      return;
  }

  try {
      // Show a loading indicator
      const exportBtn = document.querySelector('.btn-export-bundle') as HTMLButtonElement;
      const originalText = exportBtn?.textContent || 'Export as Bundle';
      if (exportBtn) {
          exportBtn.textContent = 'Exporting...';
          exportBtn.disabled = true;
      }

      // Import Resources to get player data

      // Get all players for the team
      const allPlayers = Resources.getPlayersData(teamId);
      // Filter out coaches - only include regular players in the bundle
      const players = allPlayers.filter(player => player.poste !== Post.COACH);

      if (players.length === 0) {
          alert('No players found for this team (coaches are excluded from bundle export)');
          return;
      }

      // Create frames (configurable players per frame)
      const zip = new JSZip();
      const totalFrames = Math.ceil(players.length / playersPerPage);

      // Create a temporary container for rendering individual players
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
      tempContainer.style.backgroundColor = '#f8f9fa';
      tempContainer.style.display = 'grid';

      // Dynamic grid layout based on players per page
      const columns = Math.min(Math.ceil(Math.sqrt(playersPerPage)), 4); // Max 4 columns
      const rows = Math.ceil(playersPerPage / columns);
      tempContainer.style.gridTemplateColumns = `repeat(${columns}, 1fr)`;
      tempContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;

      // Minimize gap for better aspect ratio
      const gridGap = playersPerPage === 1 ? '5px' : '15px';
      tempContainer.style.gap = gridGap;
      tempContainer.style.justifyItems = 'center';
      tempContainer.style.alignItems = 'center';
      document.body.appendChild(tempContainer);

      for (let frameIndex = 0; frameIndex < totalFrames; frameIndex++) {
          // Update visual progress (80% for capture, 20% for ZIP generation)
          const captureProgress = Math.round((frameIndex / totalFrames) * 80);
          if (exportBtn) {
              exportBtn.style.background = `linear-gradient(90deg, #fd7e14 ${captureProgress}%, #e55a00 ${captureProgress}%)`;
          }

          // Clear the container
          tempContainer.innerHTML = '';

          // Get players for this frame
          const startIndex = frameIndex * playersPerPage;
          const endIndex = Math.min(startIndex + playersPerPage, players.length);
          const framePlayers = players.slice(startIndex, endIndex);

          // Create player cards for this frame
          framePlayers.forEach(player => {
              const playerCard = document.createElement('div');
              playerCard.innerHTML = PlayerHelper.createPlayer(player, true); // Show stats
              tempContainer.appendChild(playerCard.firstElementChild as HTMLElement);
          });

          // Wait for layout to update
          await new Promise(resolve => setTimeout(resolve, 200));

          // Capture this frame
          const canvas = await html2canvas(tempContainer, {
              backgroundColor: '#f8f9fa',
              scale: 2,
              useCORS: true,
              allowTaint: true,
              width: tempContainer.scrollWidth,
              height: tempContainer.scrollHeight,
              scrollX: 0,
              scrollY: 0
          });

          // Convert canvas to JPEG blob and add to ZIP
          const blob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob(resolve, 'image/jpeg', 0.9);
          });

          if (blob) {
              let fileName: string;
              if (playersPerPage === 1 && framePlayers.length === 1) {
                  // For single player per page, prefix with player name
                  const player = framePlayers[0];
                  const playerName = `${player.prenom}_${player.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
                  fileName = `${playerName}_${teamId}_page_${frameIndex + 1}_of_${totalFrames}.jpg`;
              } else {
                  // For multiple players per page, use original naming
                  fileName = `${teamId}_page_${frameIndex + 1}_of_${totalFrames}.jpg`;
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

This bundle contains JPEG images of player cards organized in pages.
Each page shows up to ${playersPerPage} players in a ${columns}x${rows} grid layout.

Files included:
${Array.from({ length: totalFrames }, (_, i) => {
    const startIndex = i * playersPerPage;
    const endIndex = Math.min(startIndex + playersPerPage, players.length);
    const framePlayers = players.slice(startIndex, endIndex);

    if (playersPerPage === 1 && framePlayers.length === 1) {
        const player = framePlayers[0];
        const playerName = `${player.prenom}_${player.nom}`.replace(/[^a-zA-Z0-9_-]/g, '_');
        return `- ${playerName}_${teamId}_page_${i + 1}_of_${totalFrames}.jpg`;
    } else {
        return `- ${teamId}_page_${i + 1}_of_${totalFrames}.jpg`;
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
      tempContainer.style.backgroundColor = '#f8f9fa';
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
          backgroundColor: '#f8f9fa',
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

      // Convert canvas to blob
      canvas.toBlob((blob) => {
          if (blob) {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${playerName.replace(/\s+/g, '_')}_card.jpg`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
          }
      }, 'image/jpeg', 0.9);

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
