import { Player, Post, stats } from "./model";
import backgroundImage from '../resources/background.png';

export namespace PlayerHelper{
const maxStat = 100;


export const ShowStats =     0x00000001;
export const ShowAvatar =    0x00000010;
export const ShowGroup =     0x00000100;
export const ShowPosition =  0x00001000;
export const ShowName =  0x00010000;

export const ShowAll = ShowAvatar | ShowStats | ShowGroup | ShowPosition | ShowName;
export const ShowAllWoStats = ShowAll & ~ShowStats;
export const ShowSummary = ShowPosition | ShowName;
export const ShowMini = ShowName;

export function createPlayer(player: Player, levelOfDetails: number, customPosition?: string): string {
  const outlineClass = getOutlineClass(player);
  const playerName = `${player.prenom} ${player.nom}`;
  const playerId = `player-${player.nom}-${player.prenom}`.replace(/\s+/g, '-').toLowerCase();


  if (levelOfDetails === ShowMini) {
    return `
      <div class="player-card ${outlineClass}"
           id="${playerId}"
           style="background-image: url('${backgroundImage}');"
           data-player-name="${playerName}"
           ondblclick="handlePlayerCardDoubleClick(this)"
           ontouchstart="handlePlayerCardTouchStart(this, event)"
           ontouchend="handlePlayerCardTouchEnd(this, event)">

          <!-- Player Avatar - Center of hexagon -->
          <div class="player-name player-mini">
            ${getDisplayedName(player)}
          </div>
      </div>`;
  }
  if (levelOfDetails === ShowSummary) {
    return `
      <div class="player-card ${outlineClass}"
           id="${playerId}"
           style="background-image: url('${backgroundImage}');"
           data-player-name="${playerName}"
           ondblclick="handlePlayerCardDoubleClick(this)"
           ontouchstart="handlePlayerCardTouchStart(this, event)"
           ontouchend="handlePlayerCardTouchEnd(this, event)">

          <!-- Player Avatar - Center of hexagon -->
          <div class="player-info">
            ${customPosition ? getSinglePosteLabel(customPosition) : getPosteLabel(player)}
          </div>
          <div class="player-name player-mini">
            ${getDisplayedName(player)}
          </div>
      </div>`;
  }
  return `
      <div class="player-card ${outlineClass}"
           id="${playerId}"
           style="background-image: url('${backgroundImage}');"
           data-player-name="${playerName}"
           ondblclick="handlePlayerCardDoubleClick(this)"
           ontouchstart="handlePlayerCardTouchStart(this, event)"
           ontouchend="handlePlayerCardTouchEnd(this, event)">

          <!-- Player Info - Top of hexagon -->
          <div class="player-info">
              ${levelOfDetails&ShowPosition ?
                customPosition ? getSinglePosteLabel(customPosition) : getPosteLabel(player) : ''}
              ${levelOfDetails&ShowName ?
                `<h4 class="player-name">
                  ${getDisplayedName(player)}
                 </h4>` : ''}
          </div>

          <!-- Player group - Right of hexagon -->
          ${levelOfDetails&ShowGroup ? getGroupDiv(player): ''}

          <!-- Player Avatar - Center of hexagon -->
           ${levelOfDetails&ShowAvatar ? `<div class="player-avatar">
              ${getAvatarInitial(player)}
          </div>` : ''}

          <!-- Stats - Bottom region of hexagon -->
          ${levelOfDetails&ShowStats ? `
          <div class="player-stats">
              <div class="stats-grid">
                  ${createHexagonStat('PHY', player.physique)}
                  ${createHexagonStat('TEC', player.technique)}
                  ${createHexagonStat('DEF', player.defense)}
                  ${createHexagonStat('INT', player.intelligence)}
                  ${createHexagonStat('ATT', player.attaque)}
                  ${createHexagonStat('VIT', player.vitesse)}
              </div>
          </div>
          ` : ''}
      </div>
  `;
}

  function createHexagonStat(statName: string, value: string): string {
      const starRating = createStarRating(parseFloat(value));

      return `
          <div class="stat-item">
              <span class="stat-name">${statName}</span>
              <div class="stat-stars">
                  ${starRating}
              </div>
          </div>
      `;
  }

  function createStarRating(value: number): string {
      const maxStars = 3;
      const percentage = value / maxStat; // Normalize to 0-1
      const filledStars = percentage * maxStars; // Get filled stars as decimal

      let starsHtml = '';

      for (let i = 0; i < maxStars; i++) {
          const starFill = Math.max(0, Math.min(1, filledStars - i)); // Calculate fill for this star (0-1)

          if (starFill === 0) {
              // Empty star
              starsHtml += `<span class="star-empty">★</span>`;
          } else if (starFill === 1) {
              // Full star
              starsHtml += `<span class="star-full">★</span>`;
          } else {
              // Partially filled star using a more export-friendly approach
              const fillPercentage = Math.round(starFill * 100);
              starsHtml += `
                  <span class="star-partial" style="
                      position: relative;
                      color: rgba(255,255,255,0.3);
                      text-shadow: 0 0 2px rgba(0,0,0,0.5);
                  ">★<span style="
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: ${fillPercentage}%;
                      overflow: hidden;
                      color: #FFD700;
                      text-shadow: 0 0 3px rgba(255,215,0,0.6);
                  ">★</span></span>
              `;
          }
      }

      return starsHtml;
  }

  function getOutlineClass(player: Player): string {
      const level = stats.reduce((acc, stat) => acc + (parseFloat((player as any)[stat as any]) || 0), 0);
      const maxLevel = stats.length * maxStat;
      return level < maxLevel/3 ? 'outline_bronze'
      : level > 2*maxLevel/3 ? 'outline_gold' : 'outline_silver';
  }

  function getSinglePosteLabel(poste1: string) {
    return `<div class="player-position">
              ${poste1}
            </div>`;
  }
  function getDualPosteLabel(poste1: string, poste2: string) {
    return `<div class="player-position">
              ${poste1}
            </div>
            <div class="player-position">
              ${poste2}
            </div>`;
  }
  function getTriplePosteLabel(poste1: string, poste2: string, poste3: string) {
    return `<div class="post-grid3">
              <div class="player-position">
                ${poste1}
              </div>
              <div class="player-position">
                ${poste2}
              </div>
              <div class="player-position">
                ${poste3}
              </div>
            </div>`;
  }
  function getPosteLabel(player: Player): string {
    const postes = [player.poste];
    player.posteb ? postes.push(player.posteb) : null;
    player.postec ? postes.push(player.postec) : null;

    if (postes.length === 1) {
      return getSinglePosteLabel(postes[0]);
    } else if (postes.length === 2) {
      return getDualPosteLabel(postes[0], postes[1]);
    } else if (postes.length === 3) {
      return getTriplePosteLabel(postes[0], postes[1], postes[2]);
    }
    return '';
  }
  function getAvatarInitial(player: Player) {
    const s = player.nom?.charAt(0);
    if (s !== undefined) {
      return s;
    }
    const name = `${getI(player.prenom)}${getI(player.nom)}`
      return (name.length > 0) ? name : 'U';
  }

  function getGroupDiv(player: Player): string {
    return player.poste === Post.COACH || player.groupe === '2' ? ''
            : ` <div class="flaming player-group">
                  <span>★</span>
                </div>`;
  }

  function getDisplayedName(player: Player): string {
    return player.surnom ?? player.prenom ?? player.nom ?? 'Unknown';
  }

  function getI(input: string | undefined): string {
    return  input ? input.charAt(0) : '';
  }
}