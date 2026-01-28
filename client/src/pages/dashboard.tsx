import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Calendar,
  ChevronRight,
  Plus,
  Search,
  Settings,
  Shield,
  Swords,
  Table2,
  Trophy,
  Users,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type StageType = "GROUP" | "LEAGUE" | "KNOCKOUT";

type SportProfile = {
  id: string;
  name: string;
  playersPerTeam: number;
  scoringType: "points" | "goals" | "sets" | "custom";
  winCondition: "higherScore" | "bestOfSets" | "aggregate";
  stagesConfig: StageType[];
  defaultGroupSize: number;
  defaultKnockoutSize: number;
};

type Team = {
  id: string;
  sportId: string;
  name: string;
  players: string[];
};

type Tournament = {
  id: string;
  sportId: string;
  name: string;
  teamCount: number;
  currentStageIndex: number;
  status: "NOT_STARTED" | "RUNNING" | "FINISHED";
};

type Match = {
  id: string;
  tournamentId: string;
  stageIndex: number;
  roundLabel: string;
  team1Id: string;
  team2Id: string;
  score1: number | null;
  score2: number | null;
};

const seedSports: SportProfile[] = [
  {
    id: "sport-football",
    name: "Football (Goals)",
    playersPerTeam: 11,
    scoringType: "goals",
    winCondition: "higherScore",
    stagesConfig: ["GROUP", "KNOCKOUT"],
    defaultGroupSize: 4,
    defaultKnockoutSize: 16,
  },
  {
    id: "sport-basketball",
    name: "Basketball (Points)",
    playersPerTeam: 5,
    scoringType: "points",
    winCondition: "higherScore",
    stagesConfig: ["LEAGUE"],
    defaultGroupSize: 0,
    defaultKnockoutSize: 0,
  },
  {
    id: "sport-volleyball",
    name: "Volleyball (Sets)",
    playersPerTeam: 6,
    scoringType: "sets",
    winCondition: "bestOfSets",
    stagesConfig: ["GROUP", "KNOCKOUT"],
    defaultGroupSize: 4,
    defaultKnockoutSize: 8,
  },
  {
    id: "sport-badminton",
    name: "Badminton",
    playersPerTeam: 1,
    scoringType: "points",
    winCondition: "bestOfSets",
    stagesConfig: ["KNOCKOUT"],
    defaultGroupSize: 0,
    defaultKnockoutSize: 64,
  },
];

const seedTeams: Team[] = [
  ...Array.from({ length: 64 }).map((_, i) => ({
    id: `team-badminton-${i + 1}`,
    sportId: "sport-badminton",
    name: `Player ${i + 1}`,
    players: [`P. Name ${i + 1}`],
  })),
  {
    id: "team-fc-north",
    sportId: "sport-football",
    name: "FC North",
    players: ["A. Khan", "S. Rivera", "L. Chen"],
  },
  {
    id: "team-city-11",
    sportId: "sport-football",
    name: "City XI",
    players: ["M. Silva", "J. Novak", "K. Patel"],
  },
  {
    id: "team-hoops-lab",
    sportId: "sport-basketball",
    name: "Hoops Lab",
    players: ["E. Brooks", "T. James", "A. Lee"],
  },
  {
    id: "team-fastbreak",
    sportId: "sport-basketball",
    name: "Fastbreak",
    players: ["S. Price", "N. Green", "I. Park"],
  },
  {
    id: "team-ace-high",
    sportId: "sport-volleyball",
    name: "Ace High",
    players: ["D. Ruiz", "H. Tan", "P. Young"],
  },
  {
    id: "team-block-party",
    sportId: "sport-volleyball",
    name: "Block Party",
    players: ["R. Kim", "C. Stone", "V. Ahmed"],
  },
];

const seedTournaments: Tournament[] = [
  {
    id: "tour-badminton-open",
    sportId: "sport-badminton",
    name: "Badminton 64-Draw",
    teamCount: 64,
    currentStageIndex: 0,
    status: "RUNNING",
  },
  {
    id: "tour-autumn-cup",
    sportId: "sport-football",
    name: "Autumn Cup",
    teamCount: 8,
    currentStageIndex: 0,
    status: "RUNNING",
  },
  {
    id: "tour-city-league",
    sportId: "sport-basketball",
    name: "City League",
    teamCount: 10,
    currentStageIndex: 0,
    status: "NOT_STARTED",
  },
];

const seedMatches: Match[] = [
  {
    id: "m1",
    tournamentId: "tour-autumn-cup",
    stageIndex: 0,
    roundLabel: "Group A",
    team1Id: "team-fc-north",
    team2Id: "team-city-11",
    score1: 2,
    score2: 1,
  },
  {
    id: "m2",
    tournamentId: "tour-autumn-cup",
    stageIndex: 0,
    roundLabel: "Group A",
    team1Id: "team-city-11",
    team2Id: "team-fc-north",
    score1: null,
    score2: null,
  },
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`;
}

function Pill({ label }: { label: string }) {
  return (
    <span
      data-testid={`badge-${label.toLowerCase().replace(/\s+/g, "-")}`}
      className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-xs"
    >
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      {label}
    </span>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-background">
      <div className="pointer-events-none fixed inset-0 grain opacity-70" />
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function TopBar({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div
          data-testid="text-app-title"
          className="text-display text-2xl font-semibold tracking-tight md:text-3xl"
        >
          {title}
        </div>
        <div data-testid="text-app-subtitle" className="mt-1 text-sm text-muted-foreground">
          {subtitle}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill label="Sport profiles" />
          <Pill label="Stages" />
          <Pill label="Standings" />
          <Pill label="Knockout" />
        </div>
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </div>
  );
}

function SidebarNav({
  active,
  onSelect,
}: {
  active: string;
  onSelect: (key: string) => void;
}) {
  const items = [
    { key: "sports", label: "Sports", icon: Trophy },
    { key: "tournaments", label: "Tournaments", icon: Calendar },
    { key: "teams", label: "Teams", icon: Users },
    { key: "stages", label: "Stages", icon: Table2 },
    { key: "matches", label: "Matches", icon: Swords },
    { key: "standings", label: "Standings", icon: Shield },
    { key: "knockout", label: "Knockout", icon: ChevronRight },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="paper rounded-2xl border shadow-sm">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl border bg-background shadow-xs">
            <Trophy className="h-5 w-5 text-primary" strokeWidth={2.25} />
          </div>
          <div>
            <div data-testid="text-brand" className="text-sm font-semibold">
              Tournament Ops
            </div>
            <div className="text-xs text-muted-foreground">Multi-sport manager</div>
          </div>
        </div>
      </div>
      <Separator />
      <div className="px-2 py-2">
        {items.map((it) => {
          const Icon = it.icon;
          const isActive = active === it.key;
          return (
            <button
              key={it.key}
              type="button"
              data-testid={`link-nav-${it.key}`}
              onClick={() => onSelect(it.key)}
              className={cn(
                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                "hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground",
              )}
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-lg border bg-background shadow-xs transition",
                  isActive ? "border-transparent" : "group-hover:border-transparent",
                )}
              >
                <Icon className="h-4.5 w-4.5 text-foreground" strokeWidth={2.2} />
              </span>
              <span className="flex-1">{it.label}</span>
              <span className={cn("text-xs text-muted-foreground", isActive && "text-foreground/70")}>
                ▸
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="paper hover-elevate rounded-2xl border shadow-sm">
      <div className="p-5">
        <div data-testid={`text-kpi-${label.toLowerCase().replace(/\s+/g, "-")}`} className="text-xs text-muted-foreground">
          {label}
        </div>
        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="text-display text-3xl font-semibold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border bg-card p-10 shadow-sm">
      <div className="max-w-md text-center">
        <div className="text-display text-xl font-semibold">{title}</div>
        <div className="mt-2 text-sm text-muted-foreground">{description}</div>
        {action ? <div className="mt-5 flex justify-center">{action}</div> : null}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [active, setActive] = useState("knockout");
  const [sports, setSports] = useState<SportProfile[]>(seedSports);
  const [teams, setTeams] = useState<Team[]>(seedTeams);
  const [tournaments, setTournaments] = useState<Tournament[]>(seedTournaments);
  const [matches, setMatches] = useState<Match[]>(seedMatches);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="pointer-events-none fixed inset-0 grain opacity-70" />
      
      {/* Full Screen Bracket View */}
      <div className="relative h-screen flex flex-col">
        <div className="p-6 border-b bg-background/80 backdrop-blur-md flex items-center justify-between z-10">
          <div>
            <h1 className="text-display text-2xl font-bold tracking-tight">Badminton 64-Draw</h1>
            <p className="text-sm text-muted-foreground">Tournament Knockout Bracket • 64 Teams</p>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="rounded-full px-4 py-1">Live Bracket</Badge>
            <Badge variant="outline" className="rounded-full px-4 py-1">Badminton Open 2026</Badge>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-background/40">
          <div className="p-8">
            <SectionKnockout />
          </div>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="paper rounded-2xl border p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-display text-xl font-semibold">{title}</div>
          <div className="mt-1 text-sm text-muted-foreground">{description}</div>
        </div>
        {action ? <div className="flex items-center gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

function SectionSports({
  sports,
  onCreate,
}: {
  sports: SportProfile[];
  onCreate: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Sport profiles"
        description="Define scoring rules and stage templates. Each tournament inherits a sport profile."
        action={
          <Button data-testid="button-create-sport" className="h-10 rounded-xl" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New sport
          </Button>
        }
      />

      {sports.length === 0 ? (
        <EmptyState
          title="No sports yet"
          description="Create your first sport profile to start generating tournaments."
          action={
            <Button data-testid="button-create-sport-empty" className="h-10 rounded-xl" onClick={onCreate}>
              Create sport
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {sports.map((s) => (
            <Card key={s.id} className="paper hover-elevate rounded-2xl border shadow-sm">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div data-testid={`text-sport-name-${s.id}`} className="text-base font-semibold">
                      {s.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {s.playersPerTeam} players · {s.scoringType} · {s.winCondition}
                    </div>
                  </div>
                  <Badge data-testid={`badge-sport-stages-${s.id}`} variant="secondary" className="rounded-full">
                    {s.stagesConfig.join(" → ")}
                  </Badge>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border bg-background/60 p-3">
                    <div className="text-xs text-muted-foreground">Default group size</div>
                    <div className="mt-1 text-sm font-medium">{s.defaultGroupSize || "—"}</div>
                  </div>
                  <div className="rounded-xl border bg-background/60 p-3">
                    <div className="text-xs text-muted-foreground">Default knockout size</div>
                    <div className="mt-1 text-sm font-medium">{s.defaultKnockoutSize || "—"}</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">Template ready</div>
                  <Button
                    data-testid={`button-sport-open-${s.id}`}
                    variant="secondary"
                    className="h-9 rounded-xl"
                  >
                    Open
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSportDialog({
  open,
  onOpenChange,
  sport,
  setSport,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sport: {
    name: string;
    playersPerTeam: number;
    scoringType: SportProfile["scoringType"];
    winCondition: SportProfile["winCondition"];
    stagesConfig: StageType[];
    defaultGroupSize: number;
    defaultKnockoutSize: number;
  };
  setSport: React.Dispatch<
    React.SetStateAction<{
      name: string;
      playersPerTeam: number;
      scoringType: SportProfile["scoringType"];
      winCondition: SportProfile["winCondition"];
      stagesConfig: StageType[];
      defaultGroupSize: number;
      defaultKnockoutSize: number;
    }>
  >;
  onCreate: () => void;
}) {
  const toggleStage = (t: StageType) => {
    setSport((s) => {
      const has = s.stagesConfig.includes(t);
      const next = has ? s.stagesConfig.filter((x) => x !== t) : [...s.stagesConfig, t];
      return { ...s, stagesConfig: next };
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl" data-testid="dialog-create-sport">
        <DialogHeader>
          <DialogTitle className="text-display">Create sport profile</DialogTitle>
          <DialogDescription>
            Define the rules once. Every tournament can inherit and override the stage flow.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sport-name">Name</Label>
            <Input
              id="sport-name"
              data-testid="input-sport-name"
              value={sport.name}
              onChange={(e) => setSport((s) => ({ ...s, name: e.target.value }))}
              placeholder="e.g., Handball (Goals)"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="players-per-team">Players / team</Label>
              <Input
                id="players-per-team"
                data-testid="input-sport-players"
                type="number"
                min={1}
                value={sport.playersPerTeam}
                onChange={(e) => setSport((s) => ({ ...s, playersPerTeam: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label>Scoring type</Label>
              <Select
                value={sport.scoringType}
                onValueChange={(v) => setSport((s) => ({ ...s, scoringType: v as any }))}
              >
                <SelectTrigger data-testid="select-sport-scoring" className="h-10 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem data-testid="option-scoring-points" value="points">
                    Points
                  </SelectItem>
                  <SelectItem data-testid="option-scoring-goals" value="goals">
                    Goals
                  </SelectItem>
                  <SelectItem data-testid="option-scoring-sets" value="sets">
                    Sets
                  </SelectItem>
                  <SelectItem data-testid="option-scoring-custom" value="custom">
                    Custom
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Win condition</Label>
              <Select
                value={sport.winCondition}
                onValueChange={(v) => setSport((s) => ({ ...s, winCondition: v as any }))}
              >
                <SelectTrigger data-testid="select-sport-win" className="h-10 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem data-testid="option-win-higher" value="higherScore">
                    Higher score
                  </SelectItem>
                  <SelectItem data-testid="option-win-sets" value="bestOfSets">
                    Best of sets
                  </SelectItem>
                  <SelectItem data-testid="option-win-aggregate" value="aggregate">
                    Aggregate
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Stage flow</Label>
              <div className="flex flex-wrap gap-2">
                {([
                  { t: "GROUP" as const, label: "Group" },
                  { t: "LEAGUE" as const, label: "League" },
                  { t: "KNOCKOUT" as const, label: "Knockout" },
                ] as const).map(({ t, label }) => {
                  const on = sport.stagesConfig.includes(t);
                  return (
                    <button
                      key={t}
                      type="button"
                      data-testid={`toggle-stage-${t.toLowerCase()}`}
                      onClick={() => toggleStage(t)}
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs transition",
                        on
                          ? "bg-accent text-accent-foreground"
                          : "bg-background text-muted-foreground hover:bg-accent/60",
                      )}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="group-size">Default group size</Label>
              <Input
                id="group-size"
                data-testid="input-sport-group-size"
                type="number"
                min={0}
                value={sport.defaultGroupSize}
                onChange={(e) => setSport((s) => ({ ...s, defaultGroupSize: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="knockout-size">Default knockout size</Label>
              <Input
                id="knockout-size"
                data-testid="input-sport-knockout-size"
                type="number"
                min={0}
                value={sport.defaultKnockoutSize}
                onChange={(e) => setSport((s) => ({ ...s, defaultKnockoutSize: Number(e.target.value || 0) }))}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            data-testid="button-create-sport-confirm"
            className="h-10 rounded-xl"
            onClick={onCreate}
          >
            Create sport
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTournamentDialog({
  open,
  onOpenChange,
  sports,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sports: SportProfile[];
  onCreate: (payload: { name: string; sportId: string; teamCount: number }) => void;
}) {
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [teamCount, setTeamCount] = useState(8);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl" data-testid="dialog-create-tournament">
        <DialogHeader>
          <DialogTitle className="text-display">Create tournament</DialogTitle>
          <DialogDescription>
            Choose a sport profile. Stage flow will follow the sport template (in this mockup).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tournament-name">Name</Label>
            <Input
              id="tournament-name"
              data-testid="input-tournament-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Winter Invitational"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Sport</Label>
              <Select value={sportId} onValueChange={(v) => setSportId(v)}>
                <SelectTrigger data-testid="select-tournament-sport" className="h-10 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((s) => (
                    <SelectItem key={s.id} data-testid={`option-tournament-sport-${s.id}`} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="team-count">Teams</Label>
              <Input
                id="team-count"
                data-testid="input-tournament-team-count"
                type="number"
                min={2}
                value={teamCount}
                onChange={(e) => setTeamCount(Number(e.target.value || 0))}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            data-testid="button-create-tournament-confirm"
            className="h-10 rounded-xl"
            onClick={() => onCreate({ name, sportId, teamCount })}
          >
            Create tournament
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTeamDialog({
  open,
  onOpenChange,
  sports,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sports: SportProfile[];
  onCreate: (payload: { name: string; sportId: string; players: string[] }) => void;
}) {
  const [name, setName] = useState("");
  const [sportId, setSportId] = useState(sports[0]?.id ?? "");
  const [players, setPlayers] = useState("A. Player, B. Player, C. Player");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl" data-testid="dialog-create-team">
        <DialogHeader>
          <DialogTitle className="text-display">Create team</DialogTitle>
          <DialogDescription>
            Players are dynamic per sport (mocked as a comma-separated list here).
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="team-name">Team name</Label>
            <Input
              id="team-name"
              data-testid="input-team-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Riverside"
              className="h-10 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Sport</Label>
              <Select value={sportId} onValueChange={(v) => setSportId(v)}>
                <SelectTrigger data-testid="select-team-sport" className="h-10 rounded-xl">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {sports.map((s) => (
                    <SelectItem key={s.id} data-testid={`option-team-sport-${s.id}`} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Roster (comma-separated)</Label>
              <Input
                data-testid="input-team-players"
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            data-testid="button-create-team-confirm"
            className="h-10 rounded-xl"
            onClick={() =>
              onCreate({
                name,
                sportId,
                players: players
                  .split(",")
                  .map((p) => p.trim())
                  .filter(Boolean),
              })
            }
          >
            Create team
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionTournaments({
  sports,
  tournaments,
  onCreate,
}: {
  sports: SportProfile[];
  tournaments: Tournament[];
  onCreate: () => void;
}) {
  const sportNameById = useMemo(() => {
    return Object.fromEntries(sports.map((s) => [s.id, s.name] as const));
  }, [sports]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Tournaments"
        description="Create tournaments under a sport profile. (Stage generation is mocked in this UI.)"
        action={
          <Button data-testid="button-create-tournament" className="h-10 rounded-xl" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New tournament
          </Button>
        }
      />

      {tournaments.length === 0 ? (
        <EmptyState
          title="No tournaments yet"
          description="Create a tournament to generate groups, leagues, or brackets." 
          action={
            <Button data-testid="button-create-tournament-empty" className="h-10 rounded-xl" onClick={onCreate}>
              Create tournament
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <Card key={t.id} className="paper hover-elevate rounded-2xl border shadow-sm">
              <div className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div data-testid={`text-tournament-name-${t.id}`} className="text-base font-semibold">
                      {t.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {sportNameById[t.sportId] ?? "Unknown sport"} · {t.teamCount} teams
                    </div>
                  </div>

                  <Badge
                    data-testid={`status-tournament-${t.id}`}
                    className={cn(
                      "rounded-full",
                      t.status === "RUNNING" && "bg-primary text-primary-foreground",
                      t.status === "NOT_STARTED" && "bg-secondary text-secondary-foreground",
                      t.status === "FINISHED" && "bg-accent text-accent-foreground",
                    )}
                    variant="secondary"
                  >
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button data-testid={`button-tournament-generate-${t.id}`} variant="secondary" className="h-9 rounded-xl">
                    Generate stages
                  </Button>
                  <Button data-testid={`button-tournament-reset-${t.id}`} variant="secondary" className="h-9 rounded-xl">
                    Reset
                  </Button>
                  <Button data-testid={`button-tournament-open-${t.id}`} className="h-9 rounded-xl">
                    Open
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionTeams({
  sports,
  teams,
  onCreate,
}: {
  sports: SportProfile[];
  teams: Team[];
  onCreate: () => void;
}) {
  const sportNameById = useMemo(() => {
    return Object.fromEntries(sports.map((s) => [s.id, s.name] as const));
  }, [sports]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Teams"
        description="Manage rosters. In a real build, the number of players per team can be enforced per sport." 
        action={
          <Button data-testid="button-create-team" className="h-10 rounded-xl" onClick={onCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New team
          </Button>
        }
      />

      {teams.length === 0 ? (
        <EmptyState
          title="No teams yet"
          description="Add teams to start filling tournaments." 
          action={
            <Button data-testid="button-create-team-empty" className="h-10 rounded-xl" onClick={onCreate}>
              Create team
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {teams.map((t) => (
            <Card key={t.id} className="paper hover-elevate rounded-2xl border shadow-sm">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div data-testid={`text-team-name-${t.id}`} className="text-base font-semibold">
                      {t.name}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {sportNameById[t.sportId] ?? "Unknown sport"}
                    </div>
                  </div>
                  <Badge data-testid={`badge-team-size-${t.id}`} variant="secondary" className="rounded-full">
                    {t.players.length} players
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {t.players.slice(0, 6).map((p, idx) => (
                    <span
                      key={p}
                      data-testid={`text-team-player-${t.id}-${idx}`}
                      className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground"
                    >
                      {p}
                    </span>
                  ))}
                  {t.players.length > 6 ? (
                    <span className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground">
                      +{t.players.length - 6}
                    </span>
                  ) : null}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SectionMatches({
  sports,
  teams,
  tournaments,
  matches,
  setMatches,
}: {
  sports: SportProfile[];
  teams: Team[];
  tournaments: Tournament[];
  matches: Match[];
  setMatches: React.Dispatch<React.SetStateAction<Match[]>>;
}) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? "");
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const tournamentById = useMemo(() => Object.fromEntries(tournaments.map((t) => [t.id, t] as const)), [tournaments]);
  const sportById = useMemo(() => Object.fromEntries(sports.map((s) => [s.id, s] as const)), [sports]);
  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t] as const)), [teams]);

  const list = useMemo(() => {
    const q = selectedTournamentId;
    return matches.filter((m) => m.tournamentId === q);
  }, [matches, selectedTournamentId]);

  const selectedTournament = tournamentById[selectedTournamentId];
  const selectedSport = selectedTournament ? sportById[selectedTournament.sportId] : undefined;

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Matches"
        description="Click a match to enter results. Standings update instantly in this prototype." 
        action={
          <div className="flex items-center gap-2">
            <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
              <SelectTrigger data-testid="select-matches-tournament" className="h-10 w-[260px] rounded-xl">
                <SelectValue placeholder="Select tournament" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} data-testid={`option-matches-tournament-${t.id}`} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button data-testid="button-generate-matches" variant="secondary" className="h-10 rounded-xl">
              Generate
            </Button>
          </div>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No matches for this tournament"
          description="Generate a schedule or create matches manually (mocked)." 
        />
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {list.map((m) => {
            const t1 = teamById[m.team1Id]?.name ?? "TBD";
            const t2 = teamById[m.team2Id]?.name ?? "TBD";
            const hasScore = m.score1 !== null && m.score2 !== null;
            const winner = hasScore ? (m.score1! > m.score2! ? "team1" : m.score2! > m.score1! ? "team2" : "draw") : "tbd";

            return (
              <button
                key={m.id}
                type="button"
                data-testid={`card-match-${m.id}`}
                onClick={() => setSelectedMatch(m)}
                className={cn(
                  "paper hover-elevate w-full rounded-2xl border text-left shadow-sm transition",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <div className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Badge data-testid={`badge-match-round-${m.id}`} variant="secondary" className="rounded-full">
                        {m.roundLabel}
                      </Badge>
                      <span className="text-xs text-muted-foreground">Stage {m.stageIndex + 1}</span>
                    </div>
                    <span
                      data-testid={`status-match-${m.id}`}
                      className={cn(
                        "text-xs",
                        hasScore ? "text-foreground" : "text-muted-foreground",
                      )}
                    >
                      {hasScore ? "Played" : "Not played"}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-12 items-center gap-3">
                    <div className={cn("col-span-5 truncate text-sm font-medium", winner === "team1" && "text-primary")}>
                      {t1}
                    </div>
                    <div className="col-span-2 text-center text-sm text-muted-foreground">vs</div>
                    <div className={cn("col-span-5 truncate text-right text-sm font-medium", winner === "team2" && "text-primary")}>
                      {t2}
                    </div>

                    <div className="col-span-12 mt-2 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Tap to enter {selectedSport?.scoringType ?? "score"}</div>
                      <div className="flex items-center gap-2">
                        <span data-testid={`text-score-${m.id}`} className="text-sm font-semibold tabular-nums">
                          {m.score1 ?? "–"} : {m.score2 ?? "–"}
                        </span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <MatchResultDialog
        open={!!selectedMatch}
        onOpenChange={(v) => !v && setSelectedMatch(null)}
        match={selectedMatch}
        teamById={useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t] as const)), [teams])}
        sport={selectedSport}
        onSave={(next) => {
          setMatches((prev) => prev.map((m) => (m.id === next.id ? next : m)));
          setSelectedMatch(null);
        }}
      />
    </div>
  );
}

function MatchResultDialog({
  open,
  onOpenChange,
  match,
  teamById,
  sport,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  match: Match | null;
  teamById: Record<string, Team>;
  sport?: SportProfile;
  onSave: (m: Match) => void;
}) {
  const [s1, setS1] = useState<string>("");
  const [s2, setS2] = useState<string>("");

  const title = sport?.scoringType === "sets" ? "Enter sets" : "Enter score";

  const team1 = match ? teamById[match.team1Id]?.name ?? "TBD" : "";
  const team2 = match ? teamById[match.team2Id]?.name ?? "TBD" : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl" data-testid="dialog-match-result">
        <DialogHeader>
          <DialogTitle className="text-display">{title}</DialogTitle>
          <DialogDescription>
            {match ? `${team1} vs ${team2} · ${match.roundLabel}` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Team 1</div>
              <div className="mt-1 text-sm font-semibold" data-testid="text-match-team1">
                {team1}
              </div>
            </div>
            <div className="rounded-xl border bg-background/60 p-3">
              <div className="text-xs text-muted-foreground">Team 2</div>
              <div className="mt-1 text-sm font-semibold" data-testid="text-match-team2">
                {team2}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="score1">{sport?.scoringType ?? "score"} 1</Label>
              <Input
                id="score1"
                data-testid="input-match-score1"
                inputMode="numeric"
                value={s1}
                onChange={(e) => setS1(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="score2">{sport?.scoringType ?? "score"} 2</Label>
              <Input
                id="score2"
                data-testid="input-match-score2"
                inputMode="numeric"
                value={s2}
                onChange={(e) => setS2(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            data-testid="button-save-match-result"
            className="h-10 rounded-xl"
            onClick={() => {
              if (!match) return;
              const n1 = s1.trim() === "" ? null : Number(s1);
              const n2 = s2.trim() === "" ? null : Number(s2);
              onSave({ ...match, score1: Number.isFinite(n1 as any) ? (n1 as any) : null, score2: Number.isFinite(n2 as any) ? (n2 as any) : null });
              setS1("");
              setS2("");
            }}
          >
            Save result
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SectionStandings({
  sports,
  tournaments,
  teams,
  matches,
}: {
  sports: SportProfile[];
  tournaments: Tournament[];
  teams: Team[];
  matches: Match[];
}) {
  const [selectedTournamentId, setSelectedTournamentId] = useState(tournaments[0]?.id ?? "");

  const tournament = tournaments.find((t) => t.id === selectedTournamentId);
  const sport = tournament ? sports.find((s) => s.id === tournament.sportId) : undefined;

  const teamById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t] as const)), [teams]);

  const stats = useMemo(() => {
    const rows: Record<
      string,
      { id: string; name: string; played: number; wins: number; draws: number; losses: number; scored: number; conceded: number }
    > = {};

    const rel = matches.filter((m) => m.tournamentId === selectedTournamentId);

    for (const m of rel) {
      if (m.score1 === null || m.score2 === null) continue;
      const a = m.team1Id;
      const b = m.team2Id;

      rows[a] ??= {
        id: a,
        name: teamById[a]?.name ?? "TBD",
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scored: 0,
        conceded: 0,
      };
      rows[b] ??= {
        id: b,
        name: teamById[b]?.name ?? "TBD",
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        scored: 0,
        conceded: 0,
      };

      rows[a].played += 1;
      rows[b].played += 1;
      rows[a].scored += m.score1;
      rows[a].conceded += m.score2;
      rows[b].scored += m.score2;
      rows[b].conceded += m.score1;

      if (m.score1 > m.score2) {
        rows[a].wins += 1;
        rows[b].losses += 1;
      } else if (m.score2 > m.score1) {
        rows[b].wins += 1;
        rows[a].losses += 1;
      } else {
        rows[a].draws += 1;
        rows[b].draws += 1;
      }
    }

    const arr = Object.values(rows).map((r) => ({
      ...r,
      diff: r.scored - r.conceded,
      points: r.wins * 3 + r.draws,
    }));

    arr.sort((x, y) => {
      if (y.points !== x.points) return y.points - x.points;
      if (y.diff !== x.diff) return y.diff - x.diff;
      if (y.scored !== x.scored) return y.scored - x.scored;
      return x.name.localeCompare(y.name);
    });

    return arr;
  }, [matches, selectedTournamentId, teamById]);

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Standings"
        description="Simple ranking: wins → score diff → scored. (Per-sport ranking rules can be added later.)"
        action={
          <Select value={selectedTournamentId} onValueChange={setSelectedTournamentId}>
            <SelectTrigger data-testid="select-standings-tournament" className="h-10 w-[260px] rounded-xl">
              <SelectValue placeholder="Select tournament" />
            </SelectTrigger>
            <SelectContent>
              {tournaments.map((t) => (
                <SelectItem key={t.id} data-testid={`option-standings-tournament-${t.id}`} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card className="paper rounded-2xl border shadow-sm">
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold" data-testid="text-standings-title">
                {tournament?.name ?? "Standings"}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {sport?.name ?? ""}
              </div>
            </div>
            <Badge variant="secondary" className="rounded-full" data-testid="badge-standings-rule">
              W-D-L · diff · points
            </Badge>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[44px]">#</TableHead>
                  <TableHead>Team</TableHead>
                  <TableHead className="text-right">P</TableHead>
                  <TableHead className="text-right">W</TableHead>
                  <TableHead className="text-right">D</TableHead>
                  <TableHead className="text-right">L</TableHead>
                  <TableHead className="text-right">+/-</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No results yet—enter match scores to populate standings.
                    </TableCell>
                  </TableRow>
                ) : (
                  stats.map((r, idx) => (
                    <TableRow key={r.id} data-testid={`row-standings-${r.id}`}>
                      <TableCell className="font-medium tabular-nums">{idx + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-primary" />
                          <span className="font-medium">{r.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.played}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.wins}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.draws}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.losses}</TableCell>
                      <TableCell className={cn("text-right tabular-nums", r.diff > 0 ? "text-emerald-600" : r.diff < 0 ? "text-rose-600" : "text-muted-foreground")}>
                        {r.diff > 0 ? `+${r.diff}` : `${r.diff}`}
                      </TableCell>
                      <TableCell className="text-right font-semibold tabular-nums">{r.points}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionKnockout() {
  const rounds = [
    {
      name: "Round of 64",
      matches: Array.from({ length: 32 }).map((_, i) => ({
        id: `r64-${i}`,
        a: `Seed ${i * 2 + 1}`,
        b: `Seed ${i * 2 + 2}`,
        score: "—",
      })),
    },
    {
      name: "Round of 32",
      matches: Array.from({ length: 16 }).map((_, i) => ({
        id: `r32-${i}`,
        a: `Winner M${i * 2 + 1}`,
        b: `Winner M${i * 2 + 2}`,
        score: "—",
      })),
    },
    {
      name: "Round of 16",
      matches: Array.from({ length: 8 }).map((_, i) => ({
        id: `r16-${i}`,
        a: `Winner R32-${i * 2 + 1}`,
        b: `Winner R32-${i * 2 + 2}`,
        score: "—",
      })),
    },
    {
      name: "Quarterfinals",
      matches: [
        { id: "q1", a: "Winner R16-1", b: "Winner R16-2", score: "—" },
        { id: "q2", a: "Winner R16-3", b: "Winner R16-4", score: "—" },
        { id: "q3", a: "Winner R16-5", b: "Winner R16-6", score: "—" },
        { id: "q4", a: "Winner R16-7", b: "Winner R16-8", score: "—" },
      ],
    },
    {
      name: "Semifinals",
      matches: [
        { id: "s1", a: "Winner Q1", b: "Winner Q2", score: "—" },
        { id: "s2", a: "Winner Q3", b: "Winner Q4", score: "—" },
      ],
    },
    {
      name: "Final",
      matches: [{ id: "f", a: "Winner S1", b: "Winner S2", score: "—" }],
    },
  ];

  return (
    <div className="min-w-[1600px] h-full flex flex-col">
      <div className="flex gap-8 h-full">
        {rounds.map((r) => (
          <div key={r.name} className="flex-1 flex flex-col">
            <div className="mb-6 text-center">
              <span className="px-4 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-bold uppercase tracking-widest border border-accent-border">
                {r.name}
              </span>
            </div>
            <div
              className={cn(
                "flex flex-col flex-1 justify-around gap-4 pb-8",
                r.name === "Round of 64" ? "space-y-1" : ""
              )}
            >
              {r.matches.map((m) => (
                <div
                  key={m.id}
                  data-testid={`card-bracket-${m.id}`}
                  className="group relative rounded-xl border bg-card/80 p-3 shadow-sm transition hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 duration-200"
                >
                  <div className="flex items-center justify-between text-[11px] mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1 h-3 rounded-full bg-muted group-hover:bg-primary transition-colors" />
                      <span className="font-semibold truncate">{m.a}</span>
                    </div>
                    <span className="text-muted-foreground font-mono bg-muted/30 px-1.5 rounded">{m.score}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-border/50">
                    <div className="flex items-center gap-2 truncate">
                      <div className="w-1 h-3 rounded-full bg-muted group-hover:bg-primary/60 transition-colors" />
                      <span className="font-semibold truncate">{m.b}</span>
                    </div>
                    <span className="text-muted-foreground font-mono bg-muted/30 px-1.5 rounded">{m.score}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionStages({ sport }: { sport?: SportProfile }) {
  const stageLabels = sport?.stagesConfig ?? ["GROUP", "KNOCKOUT"];
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Stages"
        description="Stage generator preview based on the selected sport profile (mock)."
        action={
          <Button data-testid="button-stage-generate" className="h-10 rounded-xl">
            Generate stages
          </Button>
        }
      />

      <Card className="paper rounded-2xl border shadow-sm">
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold" data-testid="text-stage-template-title">
                Template
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {sport?.name ?? "No sport selected"}
              </div>
            </div>
            <Badge data-testid="badge-stage-flow" variant="secondary" className="rounded-full">
              {stageLabels.join(" → ")}
            </Badge>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {stageLabels.map((s, idx) => (
              <div
                key={`${s}-${idx}`}
                data-testid={`card-stage-${idx}`}
                className="rounded-2xl border bg-background/60 p-4 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Stage {idx + 1}</div>
                  <Badge variant="secondary" className="rounded-full">
                    {s}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {s === "GROUP" ? "Generate groups + fixtures" : s === "LEAGUE" ? "Generate round-robin schedule" : "Generate bracket rounds"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}

function SectionSettings() {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Settings"
        description="Prototype preferences. In a real build, you could manage ranking rules per sport and permissions." 
      />

      <Card className="paper rounded-2xl border shadow-sm">
        <div className="p-5">
          <Tabs defaultValue="ui">
            <TabsList className="rounded-xl" data-testid="tabs-settings">
              <TabsTrigger value="ui" data-testid="tab-settings-ui">
                UI
              </TabsTrigger>
              <TabsTrigger value="rules" data-testid="tab-settings-rules">
                Rules
              </TabsTrigger>
              <TabsTrigger value="about" data-testid="tab-settings-about">
                About
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ui" className="mt-4">
              <div className="grid gap-3">
                <div className="rounded-2xl border bg-background/60 p-4">
                  <div className="text-sm font-semibold">Theme</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Light-first with a calm paper texture. (Dark mode tokens included.)
                  </div>
                </div>
                <div className="rounded-2xl border bg-background/60 p-4">
                  <div className="text-sm font-semibold">Motion</div>
                  <div className="mt-1 text-sm text-muted-foreground">Subtle transitions and gentle page fades.</div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="rules" className="mt-4">
              <div className="rounded-2xl border bg-background/60 p-4">
                <div className="text-sm font-semibold">Ranking order</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Wins → score difference → points scored (mock). Customize per sport in the next iteration.
                </div>
              </div>
            </TabsContent>
            <TabsContent value="about" className="mt-4">
              <div className="rounded-2xl border bg-background/60 p-4">
                <div className="text-sm font-semibold">About this mockup</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Frontend-only prototype for a configurable multi-sport tournament platform.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}
