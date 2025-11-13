# MARL Games Web App - Project Status

**Last Updated:** 2025-11-13

## 🎯 Learning Approach

**IMPORTANT:** This project is focused on hands-on learning. The preferred workflow is:
- Claude provides structure, scaffolding, and guidance (test skeletons, function signatures, TODOs)
- User implements the actual logic and fills in test bodies
- Claude reviews code, provides feedback, and helps debug issues
- Balance between doing and learning - aim for user to write most code with Claude as a guide

This approach was successfully used for the backend tests where Claude provided test function names and TODO comments, and the user implemented the bodies.

## 🎯 Project Goal
Create a web application to play Connect Four and Tic-Tac-Toe against trained multi-agent reinforcement learning models. Backend serves trained PPO models via REST API, frontend (Next.js + shadcn + Tailwind) provides interactive UI.

---

## ✅ Completed

### Backend API (FastAPI)
**Status:** ✅ Fully functional and tested

**Structure:**
```
src/backend/
├── __init__.py
├── main.py              # FastAPI app with 5 endpoints
├── game_manager.py      # Session management & game logic
├── models.py            # Pydantic request/response models
└── tests/
    └── __init__.py
```

**Key Features:**
- ✅ Stateful game session management
- ✅ Automatic model loading from checkpoints/
- ✅ Separate endpoints for human and AI moves
- ✅ CORS configured for frontend (localhost:3000)
- ✅ Numpy array serialization for JSON

**API Endpoints:**
1. `GET /` - Health check
2. `POST /game/start` - Start new game (returns session_id)
3. `POST /game/move` - Make player move (returns reward for winner detection)
4. `POST /game/ai-move?session_id={id}` - Get AI response (returns reward + done flag)
5. `GET /game/state/{session_id}` - Get current state
6. `DELETE /game/{session_id}` - Clean up session

**Testing:**
- ✅ **Comprehensive test suite complete** (20 tests, all passing)
- ✅ Unit tests for GameSession and GameManager
- ✅ Tests cover initialization, serialization, state management, moves, AI, and session lifecycle
- Manual testing complete (test_api.py)
- All endpoints working correctly
- Server starts with: `uv run python -m src.backend.main`
- Run tests with: `uv run pytest src/backend/tests/test_game_manager.py -v`

**Key Implementation Details:**
- Removed wrappers for inference (only needed during training)
- Used `.unwrapped` pattern for PettingZoo attributes
- Created `_serialize_value()` helper for numpy→JSON conversion
- Models accept `Any` type for observations (multi-dimensional arrays)

### Frontend (Next.js + TypeScript + shadcn/ui)
**Status:** ✅ Both games fully functional!

**Structure:**
```
frontend/
├── app/
│   ├── page.tsx           # Home page with tab navigation
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind styles
├── components/
│   ├── game/
│   │   ├── ConnectFourBoard.tsx  # Connect Four component ✅
│   │   └── TicTacToeBoard.tsx    # Tic-Tac-Toe component ✅
│   └── ui/                # shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── select.tsx     # Player order selection
│       ├── badge.tsx      # Game status badges
│       ├── alert.tsx      # Game over alerts
│       └── tabs.tsx       # Tab navigation
├── lib/
│   ├── api-client.ts      # API service layer (includes reward field)
│   └── utils.ts           # shadcn utilities
└── package.json
```

**Connect Four Features (✅ Complete):**
- ✅ Full game loop: start → player move → AI response → win/draw detection
- ✅ **Player order selection** - Choose to play first (Red) or second (Yellow)
- ✅ TypeScript interfaces matching backend Pydantic models
- ✅ Agent-relative observation decoding (3D array → 2D board)
- ✅ **Proper winner detection** for all scenarios (human wins, AI wins, draws)
- ✅ Natural AI response delay (800ms)
- ✅ **Polished UI** with gradient title, badges, alerts, and improved layout

**Tic-Tac-Toe Features (✅ Complete):**
- ✅ Full game loop with trained AI opponent
- ✅ **Player order selection** - Choose to play first (X) or second (O)
- ✅ **Column-major action encoding** - Correctly handles PettingZoo's action space (0-8)
- ✅ **3×3 grid rendering** - Large, bold, colored symbols (blue X, green O)
- ✅ Agent-relative observation decoding (3×3×2 array → 2D board)
- ✅ **Styled UI** - Consistent visual design with inline styled symbols
- ✅ Tab navigation to switch between games
- ✅ Visual feedback (disabled states, AI thinking indicator, hover effects)
- ✅ Error handling and display

**Tech Stack:**
- Next.js 15 with App Router and Turbopack
- TypeScript for type safety
- Tailwind CSS v4 for styling
- shadcn/ui component library (Button, Card, Select, Badge, Alert, Tabs)

**User Implementations (Connect Four):**
- All 5 API client methods (fetch with error handling)
- Observation-to-board conversion with agent-relative decoding
- Winner determination logic with player order support
- AI first-move trigger when playing second
- Cell color mapping function

**User Implementations (Tic-Tac-Toe):**
- `observationToBoard()` - Handles column-major observation decoding (3×3×2 → 2D board)
- Action encoding with column-major formula: `action = col * 3 + row`
- Cell click handler with proper action validation
- Symbol rendering with conditional styling (blue X, green O)
- Board iteration matching column-major observation structure
- Player order handling (player_1 vs player_2 instead of player_0/player_1)

**Frontend Key Learnings:**
1. **Agent-relative observations:** Observations encode board from current player's perspective
2. **3D observation format:** `[rows][cols][channels]` where channel 0 = current player, channel 1 = opponent
3. **React state async:** Can't use state value immediately after `setState()`, need local variable
4. **API contract alignment:** TypeScript interfaces must exactly match backend Pydantic models
5. **CORS setup:** Backend must allow frontend origin (localhost:3000)
6. **Column-major vs row-major:** Different PettingZoo games use different indexing - must match observation, action, and rendering order
7. **Agent naming:** Connect Four uses player_0/player_1, Tic-Tac-Toe uses player_1/player_2 - check docs for each game

---

## 🚧 In Progress / Next Steps

### **Optional Enhancements:**

**Polish:**
- [ ] Piece drop animations for Connect Four
- [ ] Mobile responsiveness improvements
- [ ] Game statistics tracking (wins/losses)
- [ ] Sound effects for moves and wins
- [ ] Difficulty level selection (different trained models)

**New Games:**
- [ ] Add more PettingZoo classic games (Checkers, Go, etc.)
- [ ] Train models with different hyperparameters for varying difficulty

**Deployment:**
- [ ] Deploy to Vercel
- [ ] Production environment configuration
- [ ] CI/CD pipeline setup

---

## 📁 Project Structure

```
marl-games/
├── src/
│   ├── backend/           # ✅ Complete (FastAPI + Tests)
│   │   ├── main.py
│   │   ├── game_manager.py
│   │   ├── models.py
│   │   └── tests/
│   │       ├── __init__.py
│   │       └── test_game_manager.py  # 20 tests, all passing
│   ├── tictactoe/         # ✅ Training code (working)
│   │   └── main.py
│   ├── connect_four/      # ✅ Training code (working)
│   │   └── main.py
│   └── lib/               # Shared RL utilities
│       ├── ppo.py
│       └── utils.py
├── frontend/              # ✅ Both games working!
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── game/
│   │   │   ├── ConnectFourBoard.tsx
│   │   │   └── TicTacToeBoard.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── select.tsx
│   │       ├── badge.tsx
│   │       ├── alert.tsx
│   │       └── tabs.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── utils.ts
│   └── package.json
├── checkpoints/           # Trained models
│   ├── connect_four_v3/
│   │   └── *.zip
│   └── tictactoe_v3/
│       └── *.zip
├── pyproject.toml
├── test_api.py           # Manual API testing script
├── PROJECT_STATUS.md     # This file
└── README.md
```

---

## 🔧 Technical Decisions Made

### Backend Architecture
- **State Management:** Server-side (for future Minari integration)
- **API Style:** REST (sufficient for turn-based games)
- **Model Loading:** On-demand per game (scalable for multiple users)
- **Session Storage:** In-memory dict (future: Redis/database)

### Testing Strategy
- **Unit Tests:** Comprehensive mocking of external dependencies (PettingZoo, ML models, filesystem)
- **Test Coverage:** 20 tests covering initialization, serialization, state management, moves, AI, sessions
- **Mock Patterns:** Used `@patch` decorators, `.return_value`, `.side_effect`, and `.call_args` for verification
- **Key Learning:** Mocking `os.path.getctime` was needed because `max(..., key=os.path.getctime)` checks file timestamps

### Frontend Architecture
- **Component Structure:** React hooks for state management
- **API Layer:** Centralized client with TypeScript interfaces
- **Observation Decoding:** Handle agent-relative 3D arrays `[rows][cols][channels]`
- **Color Consistency:** Track current player to map channels to consistent colors
- **UX Enhancements:** 800ms delay before AI moves for natural feel

### Key Technical Learnings

**Backend:**
1. **Wrapper Transparency:** PettingZoo wrappers hide attributes, use `.unwrapped`
2. **Training vs Inference:** ActionMasker wrapper only needed for training
3. **Serialization:** Numpy types must be converted to Python natives for JSON
4. **Type Validation:** Pydantic `Any` type for flexible observation shapes
5. **API Consistency:** Fixed observation to always be a list (was dict when game finished)

**Frontend:**
1. **Agent-relative observations:** Observations encode board from current player's perspective
2. **3D observation format:** `[rows][cols][channels]` where channel 0 = current player, channel 1 = opponent
3. **React state async:** Can't use state value immediately after `setState()`, need local variable
4. **API contract alignment:** TypeScript interfaces must exactly match backend Pydantic models
5. **Multi-channel encoding:** Each cell has 2 binary channels (one per player) instead of single value

---

## 🐛 Common Issues & Solutions

### Issue: AttributeError on wrapped environments
**Solution:** Access PettingZoo attributes via `self.env.unwrapped`

### Issue: Pydantic validation errors with numpy arrays
**Solution:** Convert with `.tolist()` and `isinstance()` checks

### Issue: Model can't be found
**Solution:** Ensure checkpoints exist: `ls checkpoints/connect_four_v3/` and run backend from project root

### Issue: CORS errors when frontend connects to backend
**Solution:** Backend CORS is configured for localhost:3000, ensure backend is running on port 8000

### Issue: Board colors switching between turns
**Solution:** Observations are agent-relative - pass current player to `observationToBoard()` to map channels correctly

### Issue: Board not updating after moves
**Solution:** Observation format is 3D `[rows][cols][channels]`, not flat array - decode each cell's channels

---

## 🚀 How to Run

### Start Backend Server
```bash
cd /Users/robpitkin/Desktop/marl-games  # Important: run from project root!
uv run python -m src.backend.main
# Server runs on http://localhost:8000
```

### Start Frontend Dev Server
```bash
cd /Users/robpitkin/Desktop/marl-games/frontend
npm run dev
# Frontend runs on http://localhost:3000
```

### Test API (Optional)
```bash
cd /Users/robpitkin/Desktop/marl-games
uv run python test_api.py
```

### View API Docs
Navigate to: `http://localhost:8000/docs`

### Play Connect Four
1. Start backend server (see above)
2. Start frontend dev server (see above)
3. Open browser to `http://localhost:3000`
4. Click "Start Game" and play!

---

## 📦 Dependencies

### Backend (Python)
```toml
dependencies = [
    "fastapi>=0.119.0",
    "httpx>=0.28.1",
    "pettingzoo[classic]>=1.25.0",
    "pygame>=2.6.1",
    "pytest>=8.4.2",
    "python-multipart>=0.0.20",
    "sb3-contrib>=2.7.0",
    "stable-baselines3>=2.7.0",
    "uvicorn[standard]>=0.37.0",
]
```

### Frontend (Node.js)
```json
{
  "dependencies": {
    "next": "15.5.6",
    "react": "^19",
    "react-dom": "^19",
    "@radix-ui/react-slot": "^1.1.1",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.7.0"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "15.5.6"
  }
}
```

---

## 💡 Future Enhancements

### Near-term (Connect Four Polish)
- [x] Player order selection (choose to go first or second)
- [x] Better UI with more shadcn components (Select, Badge, Alert)
- [ ] Piece drop animations
- [ ] Mobile responsive design
- [ ] Game statistics (wins/losses tracking)

### Mid-term (Chess)
- [ ] Chess board component (8x8 grid)
- [ ] Chess piece rendering
- [ ] Legal move visualization
- [ ] Chess model training (currently only Connect Four trained)

### Long-term
- [ ] Minari integration for offline training data collection
- [ ] Multiple model selection per game (different difficulty levels)
- [ ] Game history/replay functionality
- [ ] WebSocket support for real-time updates
- [ ] Persistent session storage (Redis/PostgreSQL)
- [ ] User authentication
- [ ] ELO rating system
- [ ] Deployment to Vercel

---

## 📝 Notes for Next Session

### Current State
- ✅ **Backend complete and tested** - 20/20 tests passing (generic, supports both games)
- ✅ **Connect Four complete** - Fully functional with trained model and polished UI
- 🚧 **Chess UI complete** - Frontend built but untested (no trained model yet)
- ⚠️ **Next priority:** Train chess model and debug any training/inference issues

### To Resume Work
```bash
# Terminal 1 - Backend
cd /Users/robpitkin/Desktop/marl-games
uv run python -m src.backend.main

# Terminal 2 - Frontend
cd /Users/robpitkin/Desktop/marl-games/frontend
npm run dev

# Open browser to http://localhost:3000
```

### Next Session Goals
1. **Train Chess Model** - Debug and fix chess training issues (observation space or action masking)
2. **Test Chess UI** - Play against trained model, verify action encoding works
3. **Debug Issues** - Fix any bugs in frontend action space encoding or backend integration
4. **Optional:** Add move highlighting by decoding action planes to destination squares

---

## 🎓 What You Learned

### Session 1: Backend Testing (Oct 10-13)
**Testing with pytest and unittest.mock:**
- Writing comprehensive unit tests with mocking
- Using `@patch` decorators to mock imports
- Understanding `.return_value`, `.side_effect`, and `.call_args`
- Testing error conditions with `pytest.raises`
- Debugging test failures and reading stack traces
- Mocking complex dependencies (environments, ML models, filesystem)

**Test-Driven Development:**
- The value of tests catching bugs early
- How good tests document actual behavior
- Iterative development: write → run → fail → debug → fix → pass

**Python Development Patterns:**
- Mock object structure mirrors real object structure
- Function parameter order matters with multiple `@patch` decorators (bottom-up)
- Static methods vs instance methods in testing
- Using helper functions for DRY code in tests

### Session 2: Frontend Development (Oct 17)
**Next.js + TypeScript + React:**
- Setting up Next.js 15 with App Router and Turbopack
- Using shadcn/ui component library
- TypeScript interfaces for API contracts
- React hooks for state management (`useState`)
- Async/await patterns with fetch API

**RL Observation Handling:**
- Agent-relative observations (perspective from current player)
- 3D observation format: `[rows][cols][channels]`
- Multi-channel encoding (binary channels per player)
- Mapping agent-relative to absolute board representation

**Full-Stack Integration:**
- CORS configuration for cross-origin requests
- API contract alignment (TypeScript ↔ Pydantic)
- Error handling and user feedback
- UX enhancements (delays, loading states)

**React Patterns:**
- State updates are asynchronous - use local variables when needed
- Disabled button logic with multiple conditions
- Error boundaries and try/catch for API calls

### Session 3: Player Order Selection & Winner Detection (Oct 21)
**UI Polish with shadcn/ui:**
- Installing and using shadcn components (Select, Badge, Alert)
- Component composition patterns with shadcn
- Gradient text effects and improved visual hierarchy
- Hover effects and transitions for better UX

**Complex Game State Management:**
- Player order affects player_id assignment (first=player_0, second=player_1)
- Handling AI first-move when user chooses to play second
- Winner determination based on who made the last move
- Understanding reward perspective in multi-agent RL

**Backend API Evolution:**
- Adding reward field to AIResponse for draw detection
- Returning done status directly from get_ai_move() for reliability
- Updating test suite when method signatures change
- Importance of complete state information in API responses

**Key Bug Fixes:**
- Reward interpretation: In PettingZoo, reward is from next player's perspective
- Done flag: Explicitly returning from environment instead of relying on instance variable
- Grammar: Conditional text ("You win!" vs "AI wins!") based on player name
- Player ID mapping: Correctly determining human/AI player_id based on turn order

**What Worked Well:**
- Iterative debugging with console.log to trace issues
- User implementing logic with guidance and review
- Backend tests catching regressions immediately
- Learning by doing approach for complex state logic

### Session 4: Chess UI Implementation (Oct 30)
**Complex Action Space Encoding:**
- Understanding PettingZoo's 8×8×73 flattened action space (4672 total actions)
- Breaking down action encoding into source coordinates + movement plane
- Implementing 8-direction compass mapping (N/NE/E/SE/S/SW/W/NW)
- Queen move encoding: `plane = direction * 7 + (distance - 1)`
- Knight move pattern matching: checking for (±2,±1) or (±1,±2) deltas
- Action formula: `action = sourceCol * (8 * 73) + sourceRow * 73 + plane`

**Chess Observation Decoding:**
- Reading PettingZoo documentation to understand 111-channel observation format
- Identifying channels 7-18 as piece positions (12 piece types: wP/wN/wB/wR/wQ/wK and bP/bN/bB/bR/bQ/bK)
- Channels 0-6 encode game metadata (castling rights, turn color, move clock, board edges)
- Channels 19-111 encode board history for repetition detection
- Creating lookup table to map channel numbers to piece codes

**Design Decisions:**
- **Keeping backend generic** - Rejected chess-specific backend changes to maintain extensibility
- All game-specific logic stays in frontend components
- Frontend decodes observations and encodes actions specific to each game
- Backend remains a thin generic layer over PettingZoo environments

**React + TypeScript Patterns:**
- Using shadcn Tabs component for game navigation
- Two-click state management with `selectedSquare` state
- Piece color validation based on player order
- Validation before making moves (checking if action is in `validActions`)

**Mathematical Problem Solving:**
- Recognizing that hypotenuse doesn't uniquely identify move types
- Using pattern matching (discrete checks) over geometric formulas for game moves
- Knight detection: exact delta matching `(abs(dr)===2 && abs(dc)===1) || (abs(dr)===1 && abs(dc)===2)`
- Direction detection: checking signs of deltaRow and deltaCol combinations

**Key Learnings:**
- Complex action spaces can be broken down systematically (coordinates + planes)
- Pattern matching beats mathematical formulas for discrete game move encoding
- Documentation reading is critical for understanding RL environment specifics
- Always validate game-specific changes don't break backend genericity
- User successfully implemented all chess-specific encoding/decoding logic!
