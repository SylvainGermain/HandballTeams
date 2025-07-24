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

// Interface for team data (importing from main)
export interface Team {
    id: string;
    name: string;
    description: string;
}

export enum Post {
  COACH = "COACH",
  DC = "DC",
  ALG = "ALG",
  ARG = "ARG",
  GK = "GK",
  ALD = "ALD",
  ARD = "ARD",
  PIV = 'PIV',
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

// Interface for team composition
export interface TeamComposition {
    matchInfo: MatchInfo;
    majorPlayers: { [position: string]: Player | null };
    substitutes: Player[];
}