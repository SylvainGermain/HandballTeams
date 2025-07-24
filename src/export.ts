import html2canvas from 'html2canvas';

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
}