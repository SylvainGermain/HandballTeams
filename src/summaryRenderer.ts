import { Post, TeamCompositionSummary } from './model';
import { PlayerHelper } from './player';
import landImage from '../resources/land.png';

export enum PlayerLayout {
    GRID = 'grid',
    STACK = 'compact',
    TACTICAL = 'tactical'
}

export interface PlayerSectionOptions {
    layout: PlayerLayout;
}

export class SummaryRenderer {
    static createSummaryTitle(summary: TeamCompositionSummary): string {
        return `
            <h1 class="match-day-title">Match Day</h1>
            <h2 class="match-title">Montigny vs ${summary.matchInfo.oppositeTeam || 'TBD'}</h2>
        `;
    }

    static createPlayersAndCoachSection(summary: TeamCompositionSummary, options: PlayerSectionOptions): string {
      switch(options.layout){
        case PlayerLayout.GRID:
          return this.createPlayersAndCoachSectionGrid(summary);
        case PlayerLayout.STACK:
          return this.createPlayersAndCoachSectionStack(summary);
        case PlayerLayout.TACTICAL:
          return this.createPlayersAndCoachSectionTactic(summary, options);
      }
      return '';
    }

    private static createPlayersAndCoachSectionGrid(summary: TeamCompositionSummary,): string {
        // Generate player cards using PlayerHelper
        const majorPlayersHTML = summary.majorPlayers.map(player => PlayerHelper.createPlayer(player.player, PlayerHelper.ShowAllWoStats, player.position)).join('');

        const substitutesHTML = summary.substitutes.map(player => PlayerHelper.createPlayer(player, PlayerHelper.ShowAllWoStats)).join('');
        const coachHTML = summary.coach ? PlayerHelper.createPlayer(summary.coach, PlayerHelper.ShowAllWoStats) : '';

        // Apply layout class based on options
        const layoutClass = `layout-grid`;

        return `
            <div class="players-summary ${layoutClass}">
                <div class="section-wrapper">
                    <h3 class="section-heading">Selection (${summary.majorPlayers.length + summary.substitutes.length})</h3>
                    <div class="players-section" style="background-image: url('${landImage}'); background-size: contain; background-position: center; background-repeat: no-repeat;">
                        ${majorPlayersHTML}
                        ${substitutesHTML}
                    </div>
                </div>

                ${summary.coach ? `
                    <div class="section-wrapper">
                        <h3 class="section-heading">Coach</h3>
                        <div class="coaching-staff-section">
                            ${coachHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }


    private static createPlayersAndCoachSectionTactic(summary: TeamCompositionSummary, _: PlayerSectionOptions): string {

        const coords: Map<Post, {x: number, y : number}>  = new Map([
            [Post.GK, {x: 600, y: 100}],
            [Post.ALG, {x: 1025, y: 100}],
            [Post.ALD, {x: 175, y: 100}],
            [Post.ARG, {x: 925, y: 300}],
            [Post.ARD, {x: 275, y: 300}],
            [Post.PIV, {x: 475, y: 425}],
            [Post.DC, {x: 725, y: 425}],
        ]);


        // Generate player cards with absolute positioning for tactical layout
        const majorPlayersHTML = summary.majorPlayers.map((player, index) => {
            // Calculate arc position for major players (7 positions in an arc)
            const totalMajorPlayers = summary.majorPlayers.length;
            const arcRadius = 120; // pixels from center
            const arcStartAngle = -Math.PI / 3; // Start angle (left side of arc)
            const arcEndAngle = Math.PI / 3; // End angle (right side of arc)
            const angleStep = (arcEndAngle - arcStartAngle) / Math.max(1, totalMajorPlayers - 1);
            const angle = arcStartAngle + (index * angleStep);

            // Calculate position relative to center of the field
            const centerX = 50; // 50% (center horizontally)
            const centerY = 30; // 30% from top (upper part of field)

            const { x, y } = coords.get(player.position as Post)!;

            console.log(centerX + (Math.cos(angle) * arcRadius / 10), 'vs', x/12, 'and', centerY + (Math.sin(angle) * arcRadius / 10), 'vs', y/12); // Convert to percentage

            // Create regular player card but with tactical positioning
            const playerCard = PlayerHelper.createPlayer(player.player, PlayerHelper.ShowMini, player.position);

            return `
                <div class="tactical-player major-player" style="position: absolute; left: ${x/12}%; top: ${y/12}%; transform: translate(-50%, -50%);">
                    ${playerCard}
                </div>
            `;
        }).join('');

        const substitutesHTML = summary.substitutes.length > 0 ? `
            <div class="tactical-substitutes-container"">
                ${summary.substitutes.map((player) => {
                    // Create regular player card for substitute
                    const playerCard = PlayerHelper.createPlayer(player, PlayerHelper.ShowMini);
                    return `
                        <div class="tactical-player substitute-player">
                            ${playerCard}
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        const coachHTML = summary.coach ? `
            <div class="tactical-player coach-player" style="position: absolute; left: 5%; top: 50%; transform: translate(-50%, -50%);">
                ${PlayerHelper.createPlayer(summary.coach, PlayerHelper.ShowMini)}
            </div>
        ` : '';

        return `
            <div class="players-summary layout-tactical">
                <div class="tactical-field-container" style="
                    background-image: url('${landImage}');
                    visibility: visible;
                ">
                    ${majorPlayersHTML}
                    ${substitutesHTML}
                    ${coachHTML}
                </div>
            </div>
        `;
    }

    private static createPlayersAndCoachSectionStack(summary: TeamCompositionSummary): string {
        // Generate player cards using PlayerHelper
        const majorPlayersHTML = summary.majorPlayers.map(player => PlayerHelper.createPlayer(player.player, PlayerHelper.ShowAllWoStats, player.position)).join('');

        const substitutesHTML = summary.substitutes.map(player => PlayerHelper.createPlayer(player, PlayerHelper.ShowAllWoStats)).join('');
        const coachHTML = summary.coach ? PlayerHelper.createPlayer(summary.coach, PlayerHelper.ShowAllWoStats) : '';

        // Apply layout class based on options
        const layoutClass = `layout-grid`;

        return `
            <div class="players-summary ${layoutClass}">
                ${summary.majorPlayers.length > 0 ? `
                    <div class="section-wrapper">
                        <h3 class="section-heading">Major Players (${summary.majorPlayers.length})</h3>
                        <div class="players-section">
                            ${majorPlayersHTML}
                        </div>
                    </div>
                ` : ''}

                ${summary.substitutes.length > 0 ? `
                    <div class="section-wrapper">
                        <h3 class="section-heading">Substitutes (${summary.substitutes.length})</h3>
                        <div class="players-section">
                            ${substitutesHTML}
                        </div>
                    </div>
                ` : ''}

                ${summary.coach ? `
                    <div class="section-wrapper">
                        <h3 class="section-heading">Coach</h3>
                        <div class="coaching-staff-section">
                            ${coachHTML}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    static createMatchDetailsSection(summary: TeamCompositionSummary): string {
        return `
            <div class="match-details">
                <h3>Match Details</h3>
                <div class="match-details-grid">
                    <div class="detail-item">
                        <span class="detail-label">Date:</span>
                        <span class="detail-value">${summary.matchInfo.date || 'TBD'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Time:</span>
                        <span class="detail-value">${summary.matchInfo.time || 'TBD'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Location:</span>
                        <span class="detail-value">${summary.matchInfo.location || 'TBD'}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Meeting Place:</span>
                        <span class="detail-value">${summary.matchInfo.meetingPlace || 'TBD'}</span>
                    </div>
                </div>
            </div>
        `;
    }
}
