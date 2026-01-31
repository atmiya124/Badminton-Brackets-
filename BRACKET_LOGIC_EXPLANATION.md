# Tournament Bracket Logic Explanation

## Overview
This bracket system implements a single-elimination tournament where teams compete in rounds, with winners advancing to the next round until a champion is determined.

## How It Works

### 1. **Initial Setup**
```javascript
// 32 teams total: 16 on left side, 16 on right side
const leftTeams = Array.from({ length: 16 })  // Teams 1-16
const rightTeams = Array.from({ length: 16 }) // Teams 17-32
```

### 2. **State Management**
```javascript
// Tracks all match results across all rounds
const [matchResults, setMatchResults] = useState<Record<string, { winner: string; score?: string }>>({});

// Structure: { "match-id": { winner: "team-id", score: "2-1" } }
```

### 3. **Round 1 - Initial Matches**
- **Left Side**: Pairs teams 1-16 into 8 matches
  - Match 1: Team 1 vs Team 2
  - Match 2: Team 3 vs Team 4
  - ... and so on
  
- **Right Side**: Pairs teams 17-32 into 8 matches
  - Match 1: Team 17 vs Team 18
  - Match 2: Team 19 vs Team 20
  - ... and so on

### 4. **Winner Tracking**
When you click a match box:
```javascript
handleMatchResult(matchId, winnerTeamId, score)
```
- Stores the winner's team ID in `matchResults`
- Updates the UI to highlight the winner
- Shows checkmark (✓) next to winning team
- Displays score if provided

### 5. **Round Progression**

#### Round 1 → Round 2 (Quarterfinals)
```javascript
getRound1Winners() // Extracts winners from Round 1 matches
```
- Takes winners from pairs of Round 1 matches
- Creates new matches: Winner of Match 1 & 2 → Quarterfinal 1
- Only shows Round 2 when Round 1 has winners

#### Round 2 → Semifinals
- Takes winners from Round 2 matches
- Creates semifinal matches
- Left semifinal: Winners from left side Round 2
- Right semifinal: Winners from right side Round 2

#### Semifinals → Final
- Left semifinal winner vs Right semifinal winner
- Winner becomes the Champion

### 6. **Visual Feedback**

**Winning Teams:**
- Orange/primary color highlight
- Checkmark (✓) indicator
- Arrow (→ or ←) showing advancement direction

**Match Boxes:**
- Border changes color when match has result
- Score displayed below teams
- Hover effect for interactivity

**Progressive Display:**
- Rounds only appear when previous round has results
- Champion box shows winner when final is complete

## Flow Diagram

```
Round 1 (16 matches)
    ↓ (8 winners from left, 8 from right)
Round 2 - Quarterfinals (8 matches)
    ↓ (4 winners from left, 4 from right)
Semifinals (2 matches)
    ↓ (1 winner from left, 1 from right)
Final (1 match)
    ↓
CHAMPION
```

## Key Functions

1. **`handleMatchResult(matchId, winner, score)`**
   - Updates state with match result
   - Triggers re-render showing winner

2. **`getRound1Winners(matches)`**
   - Processes match results
   - Returns array of winner names and IDs
   - Used to populate next round

3. **Conditional Rendering**
   - Rounds only show when previous round has winners
   - Uses `leftRound1Winners.length >= 4` to check if ready

## User Interaction

1. **Click any match box** → Toggles winner between the two teams
2. **Winners advance automatically** → Next round appears when ready
3. **Visual progression** → Teams highlighted as they advance
4. **Champion determined** → Final winner shown in center box

## Data Flow

```
User clicks match
    ↓
handleMatchResult() updates state
    ↓
matchResults state changes
    ↓
Component re-renders
    ↓
getRound1Winners() calculates winners
    ↓
Next round matches created from winners
    ↓
New round displayed (if conditions met)
```

This creates a dynamic, interactive bracket that updates in real-time as you set match results!
