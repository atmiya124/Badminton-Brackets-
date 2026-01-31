import React, { useMemo, useReducer, useState } from "react";
import { motion } from "framer-motion";
import {
  Crown,
  Pencil,
  RotateCcw,
  Settings,
  Undo2,
} from "lucide-react";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ROUND1_TEAM_NUMBERS,
  getRound1Validation,
  LEFT_ROUND1_PAIRINGS,
  onlyDigits,
  RIGHT_ROUND1_PAIRINGS,
} from "@/lib/bracketAdmin";
import { useBracketAdmin } from "@/context/BracketAdminContext";
import { Link } from "wouter";

type KnockoutMatchResults = Record<string, { winner: string; score?: string }>;

type KnockoutHistoryEntry = {
  matchId: string;
  prev?: { winner: string; score?: string };
};

type KnockoutState = {
  results: KnockoutMatchResults;
  history: KnockoutHistoryEntry[];
};

type KnockoutAction =
  | { type: "pick"; matchId: string; winner: string; score?: string }
  | { type: "undo" }
  | { type: "reset" };

function knockoutReducer(state: KnockoutState, action: KnockoutAction): KnockoutState {
  switch (action.type) {
    case "pick": {
      const prev = state.results[action.matchId];
      return {
        results: { ...state.results, [action.matchId]: { winner: action.winner, score: action.score } },
        history: [...state.history, { matchId: action.matchId, prev }],
      };
    }
    case "undo": {
      if (state.history.length === 0) return state;
      const last = state.history[state.history.length - 1];
      const nextResults: KnockoutMatchResults = { ...state.results };
      if (last.prev) nextResults[last.matchId] = last.prev;
      else delete nextResults[last.matchId];
      return { results: nextResults, history: state.history.slice(0, -1) };
    }
    case "reset":
      return { results: {}, history: [] };
    default:
      return state;
  }
}

export default function Dashboard() {
  const { round1TeamNumbers, setRound1TeamNumbers, championPlayerNames, setChampionPlayerNames } =
    useBracketAdmin();

  const [editRound1Open, setEditRound1Open] = useState(false);

  const [knockoutState, knockoutDispatch] = useReducer(knockoutReducer, {
    results: {},
    history: [],
  });

  const handleKnockoutPick = (matchId: string, winner: string, score?: string) => {
    knockoutDispatch({ type: "pick", matchId, winner, score });
  };

  const handleKnockoutUndo = () => {
    knockoutDispatch({ type: "undo" });
  };

  const handleKnockoutReset = () => {
    knockoutDispatch({ type: "reset" });
  };

  return (
    <div className="min-h-screen bg-background relative overflow-y-auto">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-20">
        <ShaderGradientCanvas fov={45} pixelDensity={1}>
          <ShaderGradient
            animate="on"
            brightness={1}
            cAzimuthAngle={180}
            cDistance={2.8}
            cPolarAngle={80}
            cameraZoom={9.1}
            color1="#0f4539"
            color2="#8d7dca"
            color3="#212121"
            envPreset="city"
            grain="on"
            lightType="3d"
            positionX={0}
            positionY={0}
            positionZ={0}
            reflection={0.1}
            rotationX={50}
            rotationY={0}
            rotationZ={-60}
            shader="defaults"
            type="waterPlane"
            uAmplitude={0}
            uDensity={1.5}
            uFrequency={0}
            uSpeed={0.3}
            uStrength={1.5}
            uTime={8}
            wireframe={false}
          />
        </ShaderGradientCanvas>
      </div>
      <div
        className="pointer-events-none fixed inset-0 z-[1] bg-cover bg-center bg-no-repeat opacity-12"
        style={{ backgroundImage: "url('/bg.png')" }}
        aria-hidden
      />
      <div className="relative min-h-screen flex flex-col z-10">
        <div className="p-6 border-b bg-background/80 backdrop-blur-md flex items-center justify-between z-10">
          <div>
            <h1 className="text-display text-2xl font-bold tracking-tight">Atmiya Badminton 2026</h1>
            <p className="text-sm text-muted-foreground">Tournament Knockout Bracket • 64 Teams</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/admin">
              <Button variant="outline" className="rounded-full">
                <Settings className="h-4 w-4 mr-2" />
                Admin
              </Button>
            </Link>
            <Button variant="outline" className="rounded-full" onClick={() => setEditRound1Open(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Round 1 Teams
            </Button>
            <Button variant="outline" className="rounded-full" onClick={handleKnockoutUndo}>
              <Undo2 className="h-4 w-4 mr-2" />
              Undo
            </Button>
            <Button variant="outline" className="rounded-full" onClick={handleKnockoutReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        <Dialog open={editRound1Open} onOpenChange={setEditRound1Open}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>Edit Round 1 Team Numbers</DialogTitle>
              <DialogDescription>
                Enter a number from 1 to 64 for each slot. Only numbers allowed; no duplicates; max 64. Left bracket: Team 1–32, Right bracket: Team 33–64.
              </DialogDescription>
            </DialogHeader>
            {(() => {
              const { valid, duplicateSlots, nonNumericSlots, overMaxSlots } = getRound1Validation(round1TeamNumbers);
              const duplicateSet = new Set(duplicateSlots);
              const nonNumericSet = new Set(nonNumericSlots);
              const overMaxSet = new Set(overMaxSlots);
              return (
                <>
                  {!valid && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {nonNumericSet.size > 0 && (
                        <span>Only numbers allowed in Team(s): {Array.from(nonNumericSet).sort((a, b) => a - b).join(", ")}. </span>
                      )}
                      {overMaxSet.size > 0 && (
                        <span>Max 64 allowed. Invalid in Team(s): {Array.from(overMaxSet).sort((a, b) => a - b).join(", ")}. </span>
                      )}
                      {duplicateSet.size > 0 && (
                        <span>No duplicate numbers. Duplicates in Team(s): {Array.from(duplicateSet).sort((a, b) => a - b).join(", ")}.</span>
                      )}
                    </div>
                  )}
                  <div className="flex-1 overflow-y-auto space-y-4 py-4">
                    <div className="text-xs font-medium text-muted-foreground px-1">Left bracket (Team 1–32)</div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {round1TeamNumbers.slice(0, 32).map((num, i) => {
                        const slot = i + 1;
                        const isDuplicate = duplicateSet.has(slot);
                        const isNonNumeric = nonNumericSet.has(slot);
                        const isOverMax = overMaxSet.has(slot);
                        const hasError = isDuplicate || isNonNumeric || isOverMax;
                        return (
                          <div key={i} className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">Team {slot}</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={num}
                              onChange={(e) => {
                                const next = [...round1TeamNumbers];
                                next[i] = onlyDigits(e.target.value);
                                setRound1TeamNumbers(next);
                              }}
                              className={cn("h-9 text-sm", hasError && "border-destructive focus-visible:ring-destructive")}
                              placeholder={String(slot)}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <Separator className="my-2" />
                    <div className="text-xs font-medium text-muted-foreground px-1">Right bracket (Team 33–64)</div>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {round1TeamNumbers.slice(32, 64).map((num, i) => {
                        const slot = i + 33;
                        const isDuplicate = duplicateSet.has(slot);
                        const isNonNumeric = nonNumericSet.has(slot);
                        const isOverMax = overMaxSet.has(slot);
                        const hasError = isDuplicate || isNonNumeric || isOverMax;
                        return (
                          <div key={i + 32} className="flex flex-col gap-1">
                            <Label className="text-xs text-muted-foreground">Team {slot}</Label>
                            <Input
                              type="text"
                              inputMode="numeric"
                              value={num}
                              onChange={(e) => {
                                const next = [...round1TeamNumbers];
                                next[i + 32] = onlyDigits(e.target.value);
                                setRound1TeamNumbers(next);
                              }}
                              className={cn("h-9 text-sm", hasError && "border-destructive focus-visible:ring-destructive")}
                              placeholder={String(slot)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setRound1TeamNumbers(DEFAULT_ROUND1_TEAM_NUMBERS)}>
                      Reset to default
                    </Button>
                    <Button onClick={() => setEditRound1Open(false)} disabled={!valid}>
                      Done
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>

        <div className="flex-1 overflow-y-auto bg-background/40">
          <SectionKnockout
            matchResults={knockoutState.results}
            onPick={handleKnockoutPick}
            round1TeamNumbers={round1TeamNumbers}
            championPlayerNames={championPlayerNames}
            setChampionPlayerNames={setChampionPlayerNames}
          />
        </div>
      </div>
    </div>
  );
}

// Celebration component with looping animation
function CelebrationAnimation() {
  const particles = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 2 + Math.random() * 2,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: ['#FFD700', '#FFA500', '#FF6B6B', '#4ECDC4', '#45B7D1'][Math.floor(Math.random() * 5)],
            boxShadow: '0 0 10px currentColor',
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, (Math.random() - 0.5) * 50, 0],
            opacity: [0, 1, 0.8, 0],
            scale: [0, 1.2, 0.8, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeOut",
          }}
        />
      ))}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={`sparkle-${i}`}
          className="absolute w-1 h-1 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: '#FFD700',
            boxShadow: '0 0 8px #FFD700',
          }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: Math.random() * 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function SectionKnockout({
  matchResults,
  onPick,
  round1TeamNumbers,
  championPlayerNames,
  setChampionPlayerNames,
}: {
  matchResults: KnockoutMatchResults;
  onPick: (matchId: string, winner: string, score?: string) => void;
  round1TeamNumbers: string[];
  championPlayerNames: { player1: string; player2: string };
  setChampionPlayerNames: React.Dispatch<React.SetStateAction<{ player1: string; player2: string }>>;
}) {
  // Create 64 teams - 32 on left, 32 on right (display "Team {number}" in bracket; edit dialog uses numbers only)
  const leftNums = round1TeamNumbers.slice(0, 32);
  const rightNums = round1TeamNumbers.slice(32, 64);
  const leftTeams = leftNums.map((num, i) => ({
    id: `left-${i + 1}`,
    name: `Team ${num.trim() ? num : String(i + 1)}`,
    seed: i + 1,
  }));
  const rightTeams = rightNums.map((num, i) => ({
    id: `right-${i + 1}`,
    name: `Team ${num.trim() ? num : String(i + 33)}`,
    seed: i + 33,
  }));

  // Keep existing local name used throughout render helpers
  const handleMatchResult = onPick;

  // Left/right Round 1 pairings (team numbers 1–64, court) – same order as bracket; defined in @/lib/bracketAdmin
  // Validate: every team 1–64 appears exactly once across left + right Round 1 (no repeats, no missing)
  const leftTeamNums = LEFT_ROUND1_PAIRINGS.flatMap(([a, b]) => [a, b]);
  const rightTeamNums = RIGHT_ROUND1_PAIRINGS.flatMap(([a, b]) => [a, b]);
  const allTeamNums = [...leftTeamNums, ...rightTeamNums];
  const expected = new Set(Array.from({ length: 64 }, (_, i) => i + 1));
  const seen = new Set(allTeamNums);
  const duplicates = allTeamNums.filter((n) => {
    const first = allTeamNums.indexOf(n);
    return allTeamNums.indexOf(n, first + 1) !== -1;
  });
  const missing = Array.from(expected).filter((n: number) => !seen.has(n));
  if (duplicates.length > 0 || missing.length > 0) {
    console.error(
      "[Round 1 pairings] Each team 1–64 must appear exactly once. Duplicates:",
      Array.from(new Set(duplicates)),
      "Missing:",
      missing,
    );
  }

  const getTeamByNumber = (num: number): { id: string; name: string; seed: number } => {
    if (num >= 1 && num <= 32) return leftTeams[num - 1];
    if (num >= 33 && num <= 64) return rightTeams[num - 33];
    return leftTeams[0]; // fallback
  };

  // Build match pairs for Round 1 (left side) from pairings data with court numbers
  const leftRound1Matches = LEFT_ROUND1_PAIRINGS.map(([a, b, court], i) => ({
    id: `left-r1-${i}`,
    team1: getTeamByNumber(a),
    team2: getTeamByNumber(b),
    side: 'left' as const,
    courtNumber: court,
  }));

  // Build match pairs for Round 1 (right side) from pairings data with court numbers
  const rightRound1Matches = RIGHT_ROUND1_PAIRINGS.map(([a, b, court], i) => ({
    id: `right-r1-${i}`,
    team1: getTeamByNumber(a),
    team2: getTeamByNumber(b),
    side: 'right' as const,
    courtNumber: court,
  }));

  // Get winners for Round 1
  const getRound1Winners = (matches: Array<{ id: string; team1: { id: string; name: string }; team2: { id: string; name: string }; side: string }>) => {
    return matches.map(match => {
      const result = matchResults[match.id];
      if (!result) return null;
      // Get the actual team name from the winner ID
      const winnerTeam = match.team1.id === result.winner ? match.team1 : match.team2;
      return { matchId: match.id, winner: winnerTeam.name, winnerId: result.winner };
    }).filter(Boolean) as Array<{ matchId: string; winner: string; winnerId: string }>;
  };

  const leftRound1Winners = getRound1Winners(leftRound1Matches);
  const rightRound1Winners = getRound1Winners(rightRound1Matches);

  // Round 2 pairings: [r1GameA, r1GameB, court] – e.g. winner of game 2 & 3 play on court 1, game 5 & 6 on court 2
  const LEFT_ROUND2_PAIRINGS: [number, number, number][] = [
    [0, 1, 3],   // R2 match 0: winner game 0 vs game 1, court 3
    [2, 3, 1],   // R2 match 1: winner game 2 vs game 3 → court 1
    [5, 6, 2],   // R2 match 2: winner game 5 vs game 6 → court 2
    [4, 7, 4],   // R2 match 3: winner game 4 vs game 7, court 4
    [8, 9, 5],
    [10, 11, 6],
    [12, 13, 7],
    [14, 15, 8],
  ];
  const RIGHT_ROUND2_PAIRINGS: [number, number, number][] = [
    [0, 1, 3],
    [2, 3, 1],   // winner game 2 vs game 3 → court 1
    [5, 6, 2],   // winner game 5 vs game 6 → court 2
    [4, 7, 4],
    [8, 9, 5],
    [10, 11, 6],
    [12, 13, 7],
    [14, 15, 8],
  ];

  // Round 2 matches (from Round 1 winners) – built from pairings above
  const leftRound2Matches = LEFT_ROUND2_PAIRINGS.map(([match1Index, match2Index, court], i) => {
    const match1 = leftRound1Matches[match1Index];
    const match2 = leftRound1Matches[match2Index];
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    const team1Name = match1Result ? (match1Result.winner === match1.team1.id ? match1.team1.name : match1.team2.name) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1.id ? match2.team1.name : match2.team2.name) : 'TBD';
    return {
      id: `left-r2-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `r2-left-${i}-t1`,
      team2Id: match2Result?.winner || `r2-left-${i}-t2`,
      side: 'left' as const,
      match1Id: match1?.id,
      match2Id: match2?.id,
      courtNumber: court,
    };
  });

  const rightRound2Matches = RIGHT_ROUND2_PAIRINGS.map(([match1Index, match2Index, court], i) => {
    const match1 = rightRound1Matches[match1Index];
    const match2 = rightRound1Matches[match2Index];
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    const team1Name = match1Result ? (match1Result.winner === match1.team1.id ? match1.team1.name : match1.team2.name) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1.id ? match2.team1.name : match2.team2.name) : 'TBD';
    return {
      id: `right-r2-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `r2-right-${i}-t1`,
      team2Id: match2Result?.winner || `r2-right-${i}-t2`,
      side: 'right' as const,
      match1Id: match1?.id,
      match2Id: match2?.id,
      courtNumber: court,
    };
  });

  // Check if team is a winner
  const isWinner = (matchId: string, teamId: string) => {
    return matchResults[matchId]?.winner === teamId;
  };

  // Calculate Round 2 winners
  const leftRound2Winners = leftRound2Matches.map(match => {
    const result = matchResults[match.id];
    return result ? result.winner : null;
  }).filter(Boolean);

  const rightRound2Winners = rightRound2Matches.map(match => {
    const result = matchResults[match.id];
    return result ? result.winner : null;
  }).filter(Boolean);

  // Get Round 2 winners with names
  const getRound2Winners = (matches: Array<{ id: string; team1: string; team2: string; team1Id: string; team2Id: string; side: string }>) => {
    return matches.map(match => {
      const result = matchResults[match.id];
      if (!result) return null;
      // Find which team won by comparing IDs
      const winnerName = result.winner === match.team1Id ? match.team1 : match.team2;
      return { matchId: match.id, winner: winnerName, winnerId: result.winner };
    }).filter(Boolean) as Array<{ matchId: string; winner: string; winnerId: string }>;
  };

  const leftRound2WinnersWithNames = getRound2Winners(leftRound2Matches);
  const rightRound2WinnersWithNames = getRound2Winners(rightRound2Matches);

  // Round 3 matches (from Round 2 winners) - Show teams as they advance
  const leftRound3Matches = Array.from({ length: 4 }).map((_, i) => {
    const match1Index = i * 2;
    const match2Index = i * 2 + 1;
    const match1 = leftRound2Matches[match1Index];
    const match2 = leftRound2Matches[match2Index];
    
    // Check Round 2 results directly
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    
    // Get team names from Round 2 winners
    const team1Name = match1Result ? (match1Result.winner === match1.team1Id ? match1.team1 : match1.team2) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1Id ? match2.team1 : match2.team2) : 'TBD';
    
    return {
      id: `left-r3-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `r3-left-${i}-t1`,
      team2Id: match2Result?.winner || `r3-left-${i}-t2`,
      side: 'left' as const,
      match1Id: match1?.id,
      match2Id: match2?.id,
    };
  });

  const rightRound3Matches = Array.from({ length: 4 }).map((_, i) => {
    const match1Index = i * 2;
    const match2Index = i * 2 + 1;
    const match1 = rightRound2Matches[match1Index];
    const match2 = rightRound2Matches[match2Index];
    
    // Check Round 2 results directly
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    
    // Get team names from Round 2 winners
    const team1Name = match1Result ? (match1Result.winner === match1.team1Id ? match1.team1 : match1.team2) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1Id ? match2.team1 : match2.team2) : 'TBD';
    
    return {
      id: `right-r3-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `r3-right-${i}-t1`,
      team2Id: match2Result?.winner || `r3-right-${i}-t2`,
      side: 'right' as const,
      match1Id: match1?.id,
      match2Id: match2?.id,
    };
  });

  // Get Round 3 winners with names
  const getRound3Winners = (matches: Array<{ id: string; team1: string; team2: string; team1Id: string; team2Id: string; side: string }>) => {
    return matches.map(match => {
      const result = matchResults[match.id];
      if (!result) return null;
      const winnerName = result.winner === match.team1Id ? match.team1 : match.team2;
      return { matchId: match.id, winner: winnerName, winnerId: result.winner };
    }).filter(Boolean) as Array<{ matchId: string; winner: string; winnerId: string }>;
  };

  const leftRound3WinnersWithNames = getRound3Winners(leftRound3Matches);
  const rightRound3WinnersWithNames = getRound3Winners(rightRound3Matches);

  // Quarterfinals (from Round 3 winners) - Show teams as they advance
  const leftQuarterfinalMatches = Array.from({ length: 2 }).map((_, i) => {
    const match1Index = i * 2;
    const match2Index = i * 2 + 1;
    const match1 = leftRound3Matches[match1Index];
    const match2 = leftRound3Matches[match2Index];
    
    // Check Round 3 results directly
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    
    // Get team names from Round 3 winners
    const team1Name = match1Result ? (match1Result.winner === match1.team1Id ? match1.team1 : match1.team2) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1Id ? match2.team1 : match2.team2) : 'TBD';
    
    return {
      id: `left-qf-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `qf-left-${i}-t1`,
      team2Id: match2Result?.winner || `qf-left-${i}-t2`,
      match1Id: match1?.id,
      match2Id: match2?.id,
    };
  });

  const rightQuarterfinalMatches = Array.from({ length: 2 }).map((_, i) => {
    const match1Index = i * 2;
    const match2Index = i * 2 + 1;
    const match1 = rightRound3Matches[match1Index];
    const match2 = rightRound3Matches[match2Index];
    
    // Check Round 3 results directly
    const match1Result = match1 ? matchResults[match1.id] : null;
    const match2Result = match2 ? matchResults[match2.id] : null;
    
    // Get team names from Round 3 winners
    const team1Name = match1Result ? (match1Result.winner === match1.team1Id ? match1.team1 : match1.team2) : 'TBD';
    const team2Name = match2Result ? (match2Result.winner === match2.team1Id ? match2.team1 : match2.team2) : 'TBD';
    
    return {
      id: `right-qf-${i}`,
      team1: team1Name,
      team2: team2Name,
      team1Id: match1Result?.winner || `qf-right-${i}-t1`,
      team2Id: match2Result?.winner || `qf-right-${i}-t2`,
      match1Id: match1?.id,
      match2Id: match2?.id,
    };
  });

  // Get Quarterfinal winners
  const leftQFWinners = leftQuarterfinalMatches.map(match => {
    const result = matchResults[match.id];
    if (!result) return null;
    const winnerName = result.winner === match.team1Id ? match.team1 : match.team2;
    return { winner: winnerName, winnerId: result.winner };
  }).filter(Boolean) as Array<{ winner: string; winnerId: string }>;

  const rightQFWinners = rightQuarterfinalMatches.map(match => {
    const result = matchResults[match.id];
    if (!result) return null;
    const winnerName = result.winner === match.team1Id ? match.team1 : match.team2;
    return { winner: winnerName, winnerId: result.winner };
  }).filter(Boolean) as Array<{ winner: string; winnerId: string }>;

  // Semifinals (from Quarterfinals) - Show teams as they advance
  const qfMatch1 = leftQuarterfinalMatches[0];
  const qfMatch2 = leftQuarterfinalMatches[1];
  const qfMatch1Result = qfMatch1 ? matchResults[qfMatch1.id] : null;
  const qfMatch2Result = qfMatch2 ? matchResults[qfMatch2.id] : null;
  const leftSemifinalTeam1 = qfMatch1Result ? (qfMatch1Result.winner === qfMatch1.team1Id ? qfMatch1.team1 : qfMatch1.team2) : 'TBD';
  const leftSemifinalTeam2 = qfMatch2Result ? (qfMatch2Result.winner === qfMatch2.team1Id ? qfMatch2.team1 : qfMatch2.team2) : 'TBD';
  const leftSemifinal = (leftSemifinalTeam1 !== 'TBD' || leftSemifinalTeam2 !== 'TBD') ? {
    id: 'left-sf',
    team1: leftSemifinalTeam1,
    team2: leftSemifinalTeam2,
    team1Id: qfMatch1Result?.winner || 'left-sf-t1',
    team2Id: qfMatch2Result?.winner || 'left-sf-t2',
  } : null;

  const rightQfMatch1 = rightQuarterfinalMatches[0];
  const rightQfMatch2 = rightQuarterfinalMatches[1];
  const rightQfMatch1Result = rightQfMatch1 ? matchResults[rightQfMatch1.id] : null;
  const rightQfMatch2Result = rightQfMatch2 ? matchResults[rightQfMatch2.id] : null;
  const rightSemifinalTeam1 = rightQfMatch1Result ? (rightQfMatch1Result.winner === rightQfMatch1.team1Id ? rightQfMatch1.team1 : rightQfMatch1.team2) : 'TBD';
  const rightSemifinalTeam2 = rightQfMatch2Result ? (rightQfMatch2Result.winner === rightQfMatch2.team1Id ? rightQfMatch2.team1 : rightQfMatch2.team2) : 'TBD';
  const rightSemifinal = (rightSemifinalTeam1 !== 'TBD' || rightSemifinalTeam2 !== 'TBD') ? {
    id: 'right-sf',
    team1: rightSemifinalTeam1,
    team2: rightSemifinalTeam2,
    team1Id: rightQfMatch1Result?.winner || 'right-sf-t1',
    team2Id: rightQfMatch2Result?.winner || 'right-sf-t2',
  } : null;

  // Get Semifinal winners
  const leftSFWinner = leftSemifinal && matchResults[leftSemifinal.id] ? {
    winner: matchResults[leftSemifinal.id].winner === leftSemifinal.team1Id ? leftSemifinal.team1 : leftSemifinal.team2,
    winnerId: matchResults[leftSemifinal.id].winner,
  } : null;

  const rightSFWinner = rightSemifinal && matchResults[rightSemifinal.id] ? {
    winner: matchResults[rightSemifinal.id].winner === rightSemifinal.team1Id ? rightSemifinal.team1 : rightSemifinal.team2,
    winnerId: matchResults[rightSemifinal.id].winner,
  } : null;

  // Final - Show teams as they advance
  const leftSFResult = leftSemifinal ? matchResults[leftSemifinal.id] : null;
  const rightSFResult = rightSemifinal ? matchResults[rightSemifinal.id] : null;
  const finalTeam1 = (leftSemifinal && leftSFResult)
    ? (leftSFResult.winner === leftSemifinal.team1Id ? leftSemifinal.team1 : leftSemifinal.team2)
    : 'TBD';
  const finalTeam2 = (rightSemifinal && rightSFResult)
    ? (rightSFResult.winner === rightSemifinal.team1Id ? rightSemifinal.team1 : rightSemifinal.team2)
    : 'TBD';
  const finalMatch = (finalTeam1 !== 'TBD' || finalTeam2 !== 'TBD') ? {
    id: 'final',
    team1: finalTeam1,
    team2: finalTeam2,
    team1Id: leftSFResult?.winner || 'final-t1',
    team2Id: rightSFResult?.winner || 'final-t2',
  } : null;

  type BracketSide = "left" | "right";
  type BracketTheme = "primary" | "accent";

  type TeamSlot = {
    name: string;
    id: string;
    advanced: boolean;
  };

  type DisplayMatch = {
    id: string;
    team1: TeamSlot;
    team2: TeamSlot;
  };

  const ROUND_HEADER_CLASS = "text-[10px] font-bold text-[#a489fa] mb-2 text-center uppercase";

  // Check if champion is selected
  const champion = matchResults.final && finalMatch 
    ? (matchResults.final.winner === finalMatch.team1Id ? finalMatch.team1 : finalMatch.team2)
    : null;
  
  // Display: use number from name if present (e.g. "Team 1" or "5"), else show full name
  const championDisplayNumber = champion ? (champion.match(/\d+/)?.[0] ?? champion) : null;

  // The two players on the winning team (each team has two players)
  const hasWinningPlayers =
    (championPlayerNames.player1.trim() || championPlayerNames.player2.trim()) !== "";
  const winningPlayersLabel =
    hasWinningPlayers &&
    [championPlayerNames.player1.trim(), championPlayerNames.player2.trim()].filter(Boolean).join(" & ");

  const getArrowChar = (side: BracketSide) => (side === "left" ? "→" : "←");

  const getThemeToken = (theme: BracketTheme) => (theme === "primary" ? "--primary" : "--accent");

  const getThemeRowClasses = (
    theme: BracketTheme,
    highlightHex?: string,
    unselectedTextWhite?: boolean,
  ) => {
    // IMPORTANT: Tailwind can't reliably generate CSS for classes built dynamically like
    // `bg-[${highlightHex}]/10`. So when highlightHex is provided, we use a CSS variable
    // (`--round`) and keep the class strings static.
    if (highlightHex) {
      return {
        arrow: "text-[color:var(--round)]",
        score: "text-[color:var(--round)]",
        // 10% fill + subtle ring, plus hover brighten
        winnerRow:
          "text-[color:var(--round)] bg-[color:var(--round)]/10 ring-1 ring-[color:var(--round)]/30 hover:bg-[color:var(--round)]/12 hover:ring-[color:var(--round)]/45",
        // Hover any team name: show same-color highlight at 10% opacity and shift text to round color
        advancedRow:
          unselectedTextWhite
            ? "text-foreground hover:text-[color:var(--round)] hover:bg-[color:var(--round)]/10"
            : "text-[color:var(--round)]/90 hover:text-[color:var(--round)] hover:bg-[color:var(--round)]/10",
        neutralRow:
          "text-foreground hover:text-[color:var(--round)] hover:bg-[color:var(--round)]/10",
      };
    }

    if (theme === "primary") {
      return {
        arrow: "text-primary",
        score: "text-primary",
        winnerRow: "text-primary bg-primary/10",
        advancedRow: "text-primary/80 hover:bg-primary/5",
        // used in round 1 where non-winners should stay neutral/foreground
        neutralRow: "text-foreground hover:bg-primary/5",
      };
    }

    return {
      arrow: "text-accent",
      score: "text-accent",
      winnerRow: "text-accent bg-accent/10",
      advancedRow: "text-accent/90 hover:bg-accent/8",
      neutralRow: "text-foreground hover:bg-accent/8",
    };
  };

  const toRound1DisplayMatches = (matches: Array<{ id: string; team1: { id: string; name: string }; team2: { id: string; name: string } }>): DisplayMatch[] =>
    matches.map((m) => ({
      id: m.id,
      team1: { name: m.team1.name, id: m.team1.id, advanced: true },
      team2: { name: m.team2.name, id: m.team2.id, advanced: true },
    }));

  const toNextRoundDisplayMatches = (matches: Array<{ id: string; team1: string; team2: string; team1Id: string; team2Id: string }>): DisplayMatch[] =>
    matches.map((m) => ({
      id: m.id,
      team1: { name: m.team1, id: m.team1Id, advanced: m.team1 !== "TBD" },
      team2: { name: m.team2, id: m.team2Id, advanced: m.team2 !== "TBD" },
    }));

  const TOTAL_COURTS = 8;

  // Unique colors per court (1–8), visible on dark background
  const COURT_COLORS: string[] = [
    "#22d3ee", // Court 1 – cyan
    "#4ade80", // Court 2 – lime
    "#fb923c", // Court 3 – orange
    "#f472b6", // Court 4 – pink
    "#facc15", // Court 5 – yellow/amber
    "#38bdf8", // Court 6 – sky blue
    "#a78bfa", // Court 7 – violet
    "#34d399", // Court 8 – emerald
  ];

  // Court assignment state for matches (by match index)
  const [courtAssignments, setCourtAssignments] = useState<{ [key: string]: number }>({});

  const renderMatchBox = (opts: {
    match: DisplayMatch;
    side: BracketSide;
    theme: BracketTheme;
    highlightHex?: string;
    unselectedTextWhite?: boolean;
    cardClassName: string;
    teamTextClassName: string;
    showArrow: boolean;
    scoreOnPick: string;
    inactiveStyle: "neutral" | "advanced";
    borderWhenResult?: number;
    borderWhenAnyTeam?: number;
    courtNumber: number;
  }) => {
    const {
      match,
      side,
      theme,
      highlightHex,
      unselectedTextWhite,
      cardClassName,
      teamTextClassName,
      showArrow,
      scoreOnPick,
      inactiveStyle,
      borderWhenResult,
      borderWhenAnyTeam,
      courtNumber,
    } = opts;

    // Use assigned court if set, else default
    const assignedCourt = courtAssignments[match.id] || courtNumber;

    const result = matchResults[match.id];
    const team1Winner = result?.winner === match.team1.id;
    const team2Winner = result?.winner === match.team2.id;
    const anyTeam = match.team1.advanced || match.team2.advanced;

    const themeToken = getThemeToken(theme);
    const themeClasses = getThemeRowClasses(theme, highlightHex, unselectedTextWhite);
    const arrowChar = getArrowChar(side);

    const roundStyle = highlightHex ? ({ ["--round" as any]: highlightHex } as React.CSSProperties) : undefined;

    const computedBorderColor = result
      ? borderWhenResult !== undefined
        ? `hsl(var(${themeToken}) / ${borderWhenResult})`
        : undefined
      : borderWhenAnyTeam !== undefined && anyTeam
        ? `hsl(var(${themeToken}) / ${borderWhenAnyTeam})`
        : undefined;

    const getRowClass = (winner: boolean, advanced: boolean) => {
      const base = `${teamTextClassName} font-semibold truncate flex items-center gap-1 cursor-pointer py-0.5 px-1 -mx-1 rounded transition-colors`;
      if (winner) return `${base} ${themeClasses.winnerRow}`;
      if (!advanced) return `${base} text-muted-foreground`;
      return `${base} ${inactiveStyle === "neutral" ? themeClasses.neutralRow : themeClasses.advancedRow}`;
    };

    return (
      <div
        key={match.id}
        className={cardClassName}
        style={{
          background: "hsl(var(--card) / 0.6)",
          borderColor: computedBorderColor,
        }}
      >
        <div
          className="inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[9px] font-medium mb-0.5 mx-auto gap-1"
          style={{
            color: COURT_COLORS[(assignedCourt - 1) % COURT_COLORS.length],
            backgroundColor: `${COURT_COLORS[(assignedCourt - 1) % COURT_COLORS.length]}20`,
          }}
        >
          <select
            value={assignedCourt}
            onChange={e => setCourtAssignments(prev => ({ ...prev, [match.id]: Number(e.target.value) }))}
            className="h-6 w-20 text-xs px-1 py-0.5 rounded border appearance-none focus:outline-none"
            style={{
              background: 'transparent',
              color: COURT_COLORS[(assignedCourt - 1) % COURT_COLORS.length],
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              appearance: 'none',
              paddingRight: '0.5rem',
            }}
          >
            {[...Array(8)].map((_, i) => (
              <option
                key={i + 1}
                value={i + 1}
                style={{
                  color: COURT_COLORS[i % COURT_COLORS.length],
                  background: '#fff',
                }}
              >
                {`Court ${i + 1}`}
              </option>
            ))}
          </select>
        </div>
        <div
          className={getRowClass(team1Winner, match.team1.advanced)}
          style={roundStyle}
          onClick={() => {
            if (!match.team1.advanced) return;
            handleMatchResult(match.id, match.team1.id, scoreOnPick);
          }}
        >
          {showArrow && match.team1.advanced && <span className={themeClasses.arrow}>{arrowChar}</span>}
          {match.team1.name}
          {team1Winner && " ✓"}
        </div>
        <div className="text-[9px] text-muted-foreground mb-0.5 text-center">vs</div>
        <div
          className={getRowClass(team2Winner, match.team2.advanced)}
          style={roundStyle}
          onClick={() => {
            if (!match.team2.advanced) return;
            handleMatchResult(match.id, match.team2.id, scoreOnPick);
          }}
        >
          {showArrow && match.team2.advanced && <span className={themeClasses.arrow}>{arrowChar}</span>}
          {match.team2.name}
          {team2Winner && " ✓"}
        </div>
        {result?.score && (
          <div className={`text-[9px] ${themeClasses.score} font-mono mt-1 text-center`} style={roundStyle}>
            {result.score}
          </div>
        )}
      </div>
    );
  };

  const renderRoundColumn = (opts: {
    title: string;
    side: BracketSide;
    theme: BracketTheme;
    matches: DisplayMatch[];
    highlightHex?: string;
    unselectedTextWhite?: boolean;
    cardClassName: string;
    teamTextClassName: string;
    showArrow: boolean;
    scoreOnPick: string;
    inactiveStyle: "neutral" | "advanced";
    borderWhenResult?: number;
    borderWhenAnyTeam?: number;
    columnClassName?: string;
    headerClassName?: string;
    courtNumbers?: number[];
    /** Insert a small vertical gap after this match index (e.g. 7 = gap between 8th and 9th match on left Round 1). */
    insertGapAfterIndex?: number;
  }) => {
    const {
      title,
      side,
      theme,
      matches,
      highlightHex,
      unselectedTextWhite,
      cardClassName,
      teamTextClassName,
      showArrow,
      scoreOnPick,
      inactiveStyle,
      borderWhenResult,
      borderWhenAnyTeam,
      columnClassName,
      headerClassName,
      courtNumbers,
      insertGapAfterIndex,
    } = opts;

    return (
      <div className={columnClassName ?? "flex flex-col justify-around gap-1 h-full min-w-[100px]"}>
        <div 
          className={headerClassName ?? ROUND_HEADER_CLASS}
          style={{ fontFamily: 'Montserrat, sans-serif' }}
        >
          {title}
        </div>
        {matches.map((m, i) => {
          // Keep existing behavior: don't render future matches until someone advances,
          // except Round 1 where everyone is always "advanced".
          const hasAnyTeam = m.team1.advanced || m.team2.advanced;
          const result = matchResults[m.id];
          if (inactiveStyle === "advanced" && !hasAnyTeam && !result) return null;

          const courtNumber = courtNumbers?.[i] ?? (i % TOTAL_COURTS) + 1;
          const box = renderMatchBox({
            match: m,
            side,
            theme,
            highlightHex,
            unselectedTextWhite,
            cardClassName,
            teamTextClassName,
            showArrow,
            scoreOnPick,
            inactiveStyle,
            borderWhenResult,
            borderWhenAnyTeam,
            courtNumber,
          });
          const showGap = insertGapAfterIndex !== undefined && i === insertGapAfterIndex;
          return (
            <React.Fragment key={m.id}>
              {box}
              {showGap && <div className="h-3 flex-shrink-0" aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col relative" style={{ minHeight: '100%' }}>
      {champion && <CelebrationAnimation />}
      {champion && (
        <div className="absolute top-80 left-1/2 transform -translate-x-1/2 z-50 text-center">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="flex flex-col items-center gap-2"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Crown 
                className="h-12 w-12"
                style={{
                  color: '#FFD700',
                  fill: '#FFD700',
                }}
              />
            </motion.div>
            <motion.div
              className="text-[32px] md:text-[48px] font-bold uppercase "
              style={{
                fontFamily: 'Montserrat, sans-serif',
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 30px rgba(255, 215, 0, 0.5)',
              }}
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              CHAMPION: {champion}
              {hasWinningPlayers && (
                <div className="text-lg md:text-xl mt-1 font-normal" style={{ fontFamily: "Montserrat, sans-serif" }}>
                  {winningPlayersLabel}
                </div>
              )}
              
            </motion.div>
          </motion.div>
        </div>
      )}

      <div className="flex-1 flex items-center justify-around gap-4 px-4 relative" style={{ paddingTop: champion ? '100px' : '40px', paddingBottom: '40px' }}>
        
        {renderRoundColumn({
          title: "ROUND 1",
          side: "left",
          theme: "primary",
          matches: toRound1DisplayMatches(leftRound1Matches),
          highlightHex: "#a489fa",
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-border min-w-[90px] transition-all hover:border-primary/60 hover:shadow-md",
          teamTextClassName: "text-[12px]",
          showArrow: false,
          scoreOnPick: "2-1",
          inactiveStyle: "neutral",
          borderWhenResult: 0.5,
          courtNumbers: leftRound1Matches.map((m) => m.courtNumber),
          insertGapAfterIndex: 7, // small separation between 29–36 and 3–62
        })}

        {leftRound1Winners.length > 0 && renderRoundColumn({
          title: "ROUND 2",
          side: "left",
          theme: "primary",
          matches: toNextRoundDisplayMatches(leftRound2Matches),
          highlightHex: "#e3766f",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-primary/30 min-w-[90px] transition-all hover:border-primary/60",
          teamTextClassName: "text-[12px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.5,
          borderWhenAnyTeam: 0.3,
          headerClassName: "text-[10px] font-bold text-[#e3766f] mb-2 text-center uppercase",
          courtNumbers: leftRound2Matches.map((m) => m.courtNumber),
        })}

        {leftRound2Winners.length > 0 && renderRoundColumn({
          title: "ROUND 3",
          side: "left",
          theme: "primary",
          matches: toNextRoundDisplayMatches(leftRound3Matches),
          highlightHex: "#b59ffe",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-primary/30 min-w-[90px] transition-all hover:border-primary/60",
          teamTextClassName: "text-[12px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.5,
          borderWhenAnyTeam: 0.3,
          columnClassName: "flex flex-col justify-around gap-1.5 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#b59ffe] mb-2 text-center uppercase",
        })}

        {leftRound3WinnersWithNames.length > 0 && renderRoundColumn({
          title: "QUARTERFINALS",
          side: "left",
          theme: "accent",
          matches: toNextRoundDisplayMatches(leftQuarterfinalMatches),
          highlightHex: "#f5ffb1",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-2 shadow-sm bg-card border-accent/50 min-w-[100px] transition-all hover:border-accent/70",
          teamTextClassName: "text-[13px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.7,
          borderWhenAnyTeam: 0.5,
          columnClassName: "flex flex-col justify-around gap-2 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#f5ffb1] mb-2 text-center uppercase",
        })}

        {leftSemifinal && renderRoundColumn({
          title: "SEMIFINALS",
          side: "left",
          theme: "accent",
          matches: toNextRoundDisplayMatches([leftSemifinal]),
          highlightHex: "#f57f0b",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-2 shadow-sm bg-card border-accent/50 min-w-[100px] transition-all hover:border-accent/70",
          teamTextClassName: "text-[13px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.7,
          borderWhenAnyTeam: 0.5,
          columnClassName: "flex flex-col justify-around gap-3 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#f57f0b] mb-2 text-center uppercase",
        })}

        <div className={cn("w-px self-stretch min-h-[240px] bg-primary/40 shrink-0 rounded-full transition-opacity", champion && "opacity-0")} aria-hidden />

        {finalMatch && (
          <div className="flex flex-col items-center justify-center min-w-[140px]" style={{ zIndex: 20 } as React.CSSProperties}>
            <div className="text-center">
              <div className="flex flex-col items-center mb-2">
                <Crown 
                  className="h-6 w-6 mb-1"
                  style={{
                    color: '#FFD700',
                    fill: '#FFD700',
                  }}
                />
                <div 
                  className="text-[12px] font-bold uppercase"
                  style={{
                    fontFamily: 'Montserrat, sans-serif',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  CHAMPION
                </div>
              </div>
              <div
                className="p-[2px] shadow-lg min-w-[120px] overflow-hidden"
                style={{
                  borderRadius: '0.5rem',
                  background: matchResults.final 
                    ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)'
                    : (finalMatch.team1 !== 'TBD' || finalMatch.team2 !== 'TBD')
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.7) 0%, rgba(255, 165, 0, 0.7) 50%, rgba(255, 215, 0, 0.7) 100%)'
                    : 'transparent',
                }}
              >
                <div 
                  className="p-3 min-w-[116px]"
                  style={{ borderRadius: 'calc(0.5rem - 2px)', background: 'hsl(var(--card) / 0.6)' }}
                >
                {matchResults.final ? (
                  <div className="text-[13px] font-bold space-y-1">
                    <div
                      className={matchResults.final.winner === finalMatch.team1Id
                        ? "flex items-center justify-center gap-1 rounded px-2 py-1 bg-amber-500/20 ring-1 ring-amber-500/50 text-foreground"
                        : "flex items-center justify-center text-muted-foreground"}
                    >
                      {matchResults.final.winner === finalMatch.team1Id && <span className="text-amber-600">→</span>}
                      {finalMatch.team1}
                      {matchResults.final.winner === finalMatch.team1Id && <span className="text-amber-600 text-[10px]">★</span>}
                    </div>
                    <div className="text-[9px] text-muted-foreground text-center">vs</div>
                    <div
                      className={matchResults.final.winner === finalMatch.team2Id
                        ? "flex items-center justify-center gap-1 rounded px-2 py-1 bg-amber-500/20 ring-1 ring-amber-500/50 text-foreground"
                        : "flex items-center justify-center text-muted-foreground"}
                    >
                      {matchResults.final.winner === finalMatch.team2Id && <span className="text-amber-600">←</span>}
                      {finalMatch.team2}
                      {matchResults.final.winner === finalMatch.team2Id && <span className="text-amber-600 text-[10px]">★</span>}
                    </div>
                  </div>
                ) : (
                  <div className="text-[13px] font-bold">
                    <div 
                      className={`flex items-center justify-center gap-1 cursor-pointer py-1 px-2 -mx-2 rounded transition-colors ${finalMatch.team1 !== 'TBD' ? 'hover:bg-gradient-to-r hover:from-[#FFD700]/10 hover:to-[#FFA500]/10' : 'text-muted-foreground'}`}
                      style={finalMatch.team1 !== 'TBD' ? {
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.9) 50%, rgba(255, 215, 0, 0.9) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      } : undefined}
                      onClick={() => {
                        if (finalMatch.team1 === 'TBD') return;
                        handleMatchResult('final', finalMatch.team1Id, '2-1');
                      }}
                    >
                      {finalMatch.team1 !== 'TBD' && (
                        <span style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>→</span>
                      )}
                      {finalMatch.team1}
                    </div>
                    <div className="text-[9px] text-muted-foreground my-1">vs</div>
                    <div 
                      className={`flex items-center justify-center gap-1 cursor-pointer py-1 px-2 -mx-2 rounded transition-colors ${finalMatch.team2 !== 'TBD' ? 'hover:bg-gradient-to-r hover:from-[#FFD700]/10 hover:to-[#FFA500]/10' : 'text-muted-foreground'}`}
                      style={finalMatch.team2 !== 'TBD' ? {
                        background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.9) 0%, rgba(255, 165, 0, 0.9) 50%, rgba(255, 215, 0, 0.9) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      } : undefined}
                      onClick={() => {
                        if (finalMatch.team2 === 'TBD') return;
                        handleMatchResult('final', finalMatch.team2Id, '2-1');
                      }}
                    >
                      {finalMatch.team2}
                      {finalMatch.team2 !== 'TBD' && (
                        <span style={{
                          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>←</span>
                      )}
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className={cn("w-px self-stretch min-h-[240px] bg-primary/40 shrink-0 rounded-full transition-opacity", champion && "opacity-0")} aria-hidden />

        {rightSemifinal && renderRoundColumn({
          title: "SEMIFINALS",
          side: "right",
          theme: "accent",
          matches: toNextRoundDisplayMatches([rightSemifinal]),
          highlightHex: "#f57f0b",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-2 shadow-sm bg-card border-accent/50 min-w-[100px] transition-all hover:border-accent/70 ",
          teamTextClassName: "text-[13px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.7,
          borderWhenAnyTeam: 0.5,
          columnClassName: "flex flex-col justify-around gap-3 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#f57f0b] mb-2 text-center uppercase",
        })}

        {rightRound3WinnersWithNames.length > 0 && renderRoundColumn({
          title: "QUARTERFINALS",
          side: "right",
          theme: "accent",
          matches: toNextRoundDisplayMatches(rightQuarterfinalMatches),
          highlightHex: "#f5ffb1",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-2 shadow-sm bg-card border-accent/50 min-w-[100px] transition-all hover:border-accent/70",
          teamTextClassName: "text-[13px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.7,
          borderWhenAnyTeam: 0.5,
          columnClassName: "flex flex-col justify-around gap-2 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#f5ffb1] mb-2 text-center uppercase",
        })}

        {rightRound2Winners.length > 0 && renderRoundColumn({
          title: "ROUND 3",
          side: "right",
          theme: "primary",
          matches: toNextRoundDisplayMatches(rightRound3Matches),
          highlightHex: "#b59ffe",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-primary/30 min-w-[90px] transition-all hover:border-primary/60",
          teamTextClassName: "text-[12px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.5,
          borderWhenAnyTeam: 0.3,
          columnClassName: "flex flex-col justify-around gap-1.5 h-full min-w-[100px]",
          headerClassName: "text-[10px] font-bold text-[#b59ffe] mb-2 text-center uppercase",
        })}

        {rightRound1Winners.length > 0 && renderRoundColumn({
          title: "ROUND 2",
          side: "right",
          theme: "primary",
          matches: toNextRoundDisplayMatches(rightRound2Matches),
          highlightHex: "#e3766f",
          unselectedTextWhite: true,
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-primary/30 min-w-[90px] transition-all hover:border-primary/60",
          teamTextClassName: "text-[12px]",
          showArrow: true,
          scoreOnPick: "2-0",
          inactiveStyle: "advanced",
          borderWhenResult: 0.5,
          borderWhenAnyTeam: 0.3,
          headerClassName: "text-[10px] font-bold text-[#e3766f] mb-2 text-center uppercase",
        })}

        {renderRoundColumn({
          title: "ROUND 1",
          side: "right",
          theme: "primary",
          matches: toRound1DisplayMatches(rightRound1Matches),
          highlightHex: "#a489fa",
          cardClassName: "rounded border p-1.5 shadow-sm bg-card border-border min-w-[90px] transition-all hover:border-primary/60 hover:shadow-md",
          teamTextClassName: "text-[12px]",
          showArrow: false,
          scoreOnPick: "2-1",
          inactiveStyle: "neutral",
          borderWhenResult: 0.5,
          courtNumbers: rightRound1Matches.map((m) => m.courtNumber),
          insertGapAfterIndex: 7, // small separation between 30–35 and 2–63 (same as left)
        })}
      </div>
    </div>
  );
}
