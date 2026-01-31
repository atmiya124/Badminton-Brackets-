import { useState } from "react";
import { Link } from "wouter";
import { ArrowLeft, Save, Settings, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useBracketAdmin } from "@/context/BracketAdminContext";
import { cn } from "@/lib/utils";
import {
  DEFAULT_ROUND1_TEAM_NUMBERS,
  getRound1Validation,
  LEFT_ROUND1_PAIRINGS,
  onlyDigits,
  RIGHT_ROUND1_PAIRINGS,
} from "@/lib/bracketAdmin";

export default function AdminDashboard() {
  const {
    round1TeamNumbers,
    setRound1TeamNumbers,
    championPlayerNames,
    setChampionPlayerNames,
  } = useBracketAdmin();

  // Local (draft) state – only pushed to dashboard when user clicks Save
  const [localTeamNumbers, setLocalTeamNumbers] = useState<string[]>(() => [...round1TeamNumbers]);
  const [localChampionNames, setLocalChampionNames] = useState(() => ({
    player1: championPlayerNames.player1,
    player2: championPlayerNames.player2,
  }));

  const { valid, duplicateSlots, nonNumericSlots, overMaxSlots } = getRound1Validation(localTeamNumbers);
  const duplicateSet = new Set(duplicateSlots);
  const nonNumericSet = new Set(nonNumericSlots);
  const overMaxSet = new Set(overMaxSlots);

  const handleSaveTeams = () => {
    if (!valid) return;
    setRound1TeamNumbers([...localTeamNumbers]);
  };

  const handleSaveWinningPlayers = () => {
    setChampionPlayerNames({ ...localChampionNames });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/">
              <Button variant="ghost" size="icon" aria-label="Back to bracket">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <Settings className="h-6 w-6 text-muted-foreground" />
              <h1 className="text-xl font-semibold">Admin Dashboard</h1>
            </div>
          </div>
          <Link href="/">
            <Button variant="outline" size="sm">
              Back to Bracket
            </Button>
          </Link>
        </div>
      </div>

      <div className="container max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Round 1 team names */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Round 1 team names
            </CardTitle>
            <CardDescription>
              Set the team number (1–64) for each match. Order matches the bracket (left column then right column). No duplicates; numbers only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Left bracket (same order as bracket)</div>
              <div className="space-y-3">
                {LEFT_ROUND1_PAIRINGS.map(([a, b, court], i) => {
                  const idxA = a - 1;
                  const idxB = b - 1;
                  const slotA = idxA + 1;
                  const slotB = idxB + 1;
                  const hasErrorA = duplicateSet.has(slotA) || nonNumericSet.has(slotA) || overMaxSet.has(slotA);
                  const hasErrorB = duplicateSet.has(slotB) || nonNumericSet.has(slotB) || overMaxSet.has(slotB);
                  return (
                    <div key={`left-${i}`} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
                        Match {i + 1} · Court {court}
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localTeamNumbers[idxA]}
                        onChange={(e) => {
                          const next = [...localTeamNumbers];
                          next[idxA] = onlyDigits(e.target.value);
                          setLocalTeamNumbers(next);
                        }}
                        className={cn("h-9 w-16 text-center", hasErrorA && "border-destructive focus-visible:ring-destructive")}
                        placeholder={String(a)}
                      />
                      <span className="text-muted-foreground text-sm">vs</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localTeamNumbers[idxB]}
                        onChange={(e) => {
                          const next = [...localTeamNumbers];
                          next[idxB] = onlyDigits(e.target.value);
                          setLocalTeamNumbers(next);
                        }}
                        className={cn("h-9 w-16 text-center", hasErrorB && "border-destructive focus-visible:ring-destructive")}
                        placeholder={String(b)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <Separator />
            <div>
              <div className="text-xs font-medium text-muted-foreground mb-2">Right bracket (same order as bracket)</div>
              <div className="space-y-3">
                {RIGHT_ROUND1_PAIRINGS.map(([a, b, court], i) => {
                  const idxA = a - 1;
                  const idxB = b - 1;
                  const slotA = idxA + 1;
                  const slotB = idxB + 1;
                  const hasErrorA = duplicateSet.has(slotA) || nonNumericSet.has(slotA) || overMaxSet.has(slotA);
                  const hasErrorB = duplicateSet.has(slotB) || nonNumericSet.has(slotB) || overMaxSet.has(slotB);
                  return (
                    <div key={`right-${i}`} className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-muted-foreground w-20 shrink-0">
                        Match {i + 1} · Court {court}
                      </span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localTeamNumbers[idxA]}
                        onChange={(e) => {
                          const next = [...localTeamNumbers];
                          next[idxA] = onlyDigits(e.target.value);
                          setLocalTeamNumbers(next);
                        }}
                        className={cn("h-9 w-16 text-center", hasErrorA && "border-destructive focus-visible:ring-destructive")}
                        placeholder={String(a)}
                      />
                      <span className="text-muted-foreground text-sm">vs</span>
                      <Input
                        type="text"
                        inputMode="numeric"
                        value={localTeamNumbers[idxB]}
                        onChange={(e) => {
                          const next = [...localTeamNumbers];
                          next[idxB] = onlyDigits(e.target.value);
                          setLocalTeamNumbers(next);
                        }}
                        className={cn("h-9 w-16 text-center", hasErrorB && "border-destructive focus-visible:ring-destructive")}
                        placeholder={String(b)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setLocalTeamNumbers([...DEFAULT_ROUND1_TEAM_NUMBERS])}
              >
                Reset to default
              </Button>
              <Button onClick={handleSaveTeams} disabled={!valid}>
                <Save className="h-4 w-4 mr-2" />
                Save teams
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Winning players */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Winning players
            </CardTitle>
            <CardDescription>
              Each team has two players. Enter the names of the two players on the winning team (champion). These appear on the bracket when a champion is selected.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2 max-w-sm">
              <Label>Player 1 (on winning team)</Label>
              <Input
                value={localChampionNames.player1}
                onChange={(e) =>
                  setLocalChampionNames((prev) => ({ ...prev, player1: e.target.value }))
                }
                placeholder="e.g. Alex"
              />
            </div>
            <div className="grid gap-2 max-w-sm">
              <Label>Player 2 (on winning team)</Label>
              <Input
                value={localChampionNames.player2}
                onChange={(e) =>
                  setLocalChampionNames((prev) => ({ ...prev, player2: e.target.value }))
                }
                placeholder="e.g. Jordan"
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={handleSaveWinningPlayers}>
                <Save className="h-4 w-4 mr-2" />
                Save winning players
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
