 // Interface for player data
export interface Player {
    nom?: string;
    prenom?: string;
    surnom?: string
    physique: string;
    technique: string;
    defense: string;
    intelligence: string;
    attaque: string;
    vitesse: string;
    poste: string;
    posteb?: string;
    postec?: string;
    groupe: string;
};

export interface Adversaire {
    nom: string;
    shortname: string;
};

// Interface for team data (importing from main)
export interface Team {
    id: string;
    name: string;
    description: string;
}

export enum Post {
  COACH = "COACH",
  GK = "GK",
  PIV = 'PVT',
  ARG = "ARG",
  ARD = "ARD",
  DC = "DC",
  ALG = "ALG",
  ALD = "ALD",
}
// type PostString = "COACH" | "DC" | "ALG" | "ARG" | "GK" | "ALD" | "ARD";

export const stats: Array<keyof Player> = ["physique", "technique", "defense", "intelligence", "attaque", "vitesse"];


// Interface for match information
export interface MatchInfo {
    oppositeTeam: string;
    location: string;
    date: string;
    time: string;
    meetingPlace: string;
}

// Interface for match results
export interface MatchResults {
    homeScore: number;
    awayScore: number;
    matchStatus: 'victory' | 'defeat' | 'draw' | 'pending';
    highlights: string[];
    postMatchNotes: string;
}

// Interface for team composition
export interface TeamComposition {
    matchInfo: MatchInfo;
    majorPlayers: { [position: string]: Player | null };
    substitutes: Player[];
}

// Interface for major player with position
export interface MajorPlayerSummary {
    position: string;
    player: Player;
}

// Interface for summary statistics
export interface SummaryStats {
    totalPlayers: number;
    majorPlayersCount: number;
    substitutesCount: number;
    hasCoach: boolean;
}

// Interface for the complete JSON summary
export interface TeamCompositionSummary {
    matchInfo: MatchInfo;
    majorPlayers: MajorPlayerSummary[];
    coach: Player | null;
    substitutes: Player[];
    summary: SummaryStats;
    matchResults: MatchResults | null;
    createdAt: string;
}