# MARL Games Web App - Project Status

**Last Updated:** 2025-10-21

## 🎯 Learning Approach

**IMPORTANT:** This project is focused on hands-on learning. The preferred workflow is:
- Claude provides structure, scaffolding, and guidance (test skeletons, function signatures, TODOs)
- User implements the actual logic and fills in test bodies
- Claude reviews code, provides feedback, and helps debug issues
- Balance between doing and learning - aim for user to write most code with Claude as a guide

This approach was successfully used for the backend tests where Claude provided test function names and TODO comments, and the user implemented the bodies.

## 🎯 Project Goal
Create a web application to play Connect Four and Chess against trained multi-agent reinforcement learning models. Backend serves trained PPO models via REST API, frontend (Next.js + shadcn + Tailwind) provides interactive UI.

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
**Status:** ✅ Connect Four fully functional with polished UI!

**Structure:**
```
frontend/
├── app/
│   ├── page.tsx           # Home page with Connect Four game
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Tailwind styles
├── components/
│   ├── game/
│   │   └── ConnectFourBoard.tsx  # Main game component
│   └── ui/                # shadcn components
│       ├── button.tsx
│       ├── card.tsx
│       ├── select.tsx     # Player order selection
│       ├── badge.tsx      # Game status badges
│       └── alert.tsx      # Game over alerts
├── lib/
│   ├── api-client.ts      # API service layer (includes reward field)
│   └── utils.ts           # shadcn utilities
└── package.json
```

**Key Features:**
- ✅ Full game loop: start → player move → AI response → win/draw detection
- ✅ **Player order selection** - Choose to play first (Red) or second (Yellow)
- ✅ TypeScript interfaces matching backend Pydantic models
- ✅ Agent-relative observation decoding (3D array → 2D board)
- ✅ **Proper winner detection** for all scenarios (human wins, AI wins, draws)
- ✅ Natural AI response delay (800ms)
- ✅ **Polished UI** with gradient title, badges, alerts, and improved layout
- ✅ Visual feedback (disabled states, AI thinking indicator, hover effects)
- ✅ Error handling and display

**Tech Stack:**
- Next.js 15 with App Router and Turbopack
- TypeScript for type safety
- Tailwind CSS v4 for styling
- shadcn/ui component library

**User Implementations:**
- All 5 API client methods (fetch with error handling)
- Observation-to-board conversion with agent-relative decoding
- Winner determination logic with player order support
- AI first-move trigger when playing second
- Cell color mapping function

**Frontend Key Learnings:**
1. **Agent-relative observations:** Observations encode board from current player's perspective
2. **3D observation format:** `[rows][cols][channels]` where channel 0 = current player, channel 1 = opponent
3. **React state async:** Can't use state value immediately after `setState()`, need local variable
4. **API contract alignment:** TypeScript interfaces must exactly match backend Pydantic models
5. **CORS setup:** Backend must allow frontend origin (localhost:3000)

---

## 🚧 In Progress / Next Steps

### **Next Up: Final Polish & Chess**

**Connect Four - Remaining Polish:**
- [ ] Piece drop animations (optional)
- [ ] Mobile responsiveness improvements
- [ ] Additional UI refinements

**Chess Implementation:**
- [ ] Chess board component (8x8 grid)
- [ ] Chess piece rendering (Unicode or SVG)
- [ ] Move input system (click piece → click destination)
- [ ] Legal move visualization
- [ ] Chess notation display
- [ ] Integrate with existing backend (already supports chess)

**Deployment:**
- [ ] Deploy to Vercel
- [ ] Production environment configuration

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
│   ├── chess/             # Existing training code
│   │   └── main.py
│   ├── connect_four/      # Existing training code
│   │   └── main.py
│   └── lib/               # Shared RL utilities
│       ├── ppo.py
│       └── utils.py
├── frontend/              # ✅ Connect Four working!
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── game/
│   │   │   └── ConnectFourBoard.tsx
│   │   └── ui/
│   │       ├── button.tsx
│   │       └── card.tsx
│   ├── lib/
│   │   ├── api-client.ts
│   │   └── utils.ts
│   └── package.json
├── checkpoints/           # Trained models
│   └── connect_four_v3/
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
- ✅ **Backend complete and tested** - 20/20 tests passing (updated for reward in AI response)
- ✅ **Connect Four complete** - Fully functional with player order selection and polished UI
- 🚧 **Next priority:** Chess implementation (backend already supports it!)

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
1. **Chess Board Component** - Create 8x8 grid with piece rendering
2. **Move Input System** - Click-based move selection
3. **Chess Game Integration** - Connect to backend chess endpoints
4. **Optional:** Final Connect Four polish (animations, mobile)

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
