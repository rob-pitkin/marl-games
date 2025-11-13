# 🎮 MARL Games

A web application for playing classic board games against AI agents trained using Multi-Agent Reinforcement Learning (MARL). Built as a hands-on learning project exploring RL, full-stack development, and game AI.

## 🎯 What's This?

Play **Connect Four** and **Tic-Tac-Toe** against trained AI opponents in your browser! The AI agents are trained using [Stable-Baselines3](https://stable-baselines3.readthedocs.io/) and the [PettingZoo](https://pettingzoo.farama.org/) multi-agent library. The backend serves the trained models via a REST API, and the frontend provides an interactive game interface.

## 🛠️ Tech Stack

**Backend:**
- FastAPI (REST API)
- PettingZoo (Multi-agent RL environments)
- Stable-Baselines3 (RL algorithms)
- Maskable PPO (Action masking for invalid moves)

**Frontend:**
- Next.js 15 (App Router + Turbopack)
- TypeScript
- Tailwind CSS v4
- shadcn/ui component library

**Training:**
- PPO with invalid action masking
- Self-play training (agent plays against itself)
- Trained models stored in `checkpoints/`

## 🚀 Getting Started

### Prerequisites
- Python 3.13+ (with `uv` for dependency management)
- Node.js 18+ and npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd marl-games
   ```

2. **Install Python dependencies:**
   ```bash
   uv sync
   ```

3. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

### Running the Application

You'll need two terminal windows:

**Terminal 1 - Backend API:**
```bash
cd marl-games
uv run python -m src.backend.main
```
Backend runs on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
cd marl-games/frontend
npm run dev
```
Frontend runs on `http://localhost:3000`


## 🎓 Training Your Own Models

### Connect Four
```bash
uv run python -m src.connect_four.main
```

### Tic-Tac-Toe
```bash
uv run python -m src.tictactoe.main
```

Trained models are saved to `checkpoints/{game_name}/` with timestamps.

## 📚 Project Structure

```
marl-games/
├── src/
│   ├── backend/              # FastAPI REST API
│   │   ├── main.py           # API endpoints
│   │   ├── game_manager.py   # Game session management
│   │   ├── models.py         # Pydantic schemas
│   │   └── tests/            # Backend tests
│   ├── connect_four/         # Connect Four training
│   ├── tictactoe/            # Tic-Tac-Toe training
│   └── lib/                  # Shared RL utilities
├── frontend/
│   ├── app/                  # Next.js pages
│   ├── components/           # React components
│   │   ├── game/             # Game board components
│   │   └── ui/               # shadcn/ui components
│   └── lib/                  # API client & utilities
├── checkpoints/              # Trained model weights
└── PROJECT_STATUS.md         # Detailed project documentation
```

## 🧠 How It Works

### Training Process
1. **Environment Setup:** Games are loaded from PettingZoo (turn-based 2-player games)
2. **Self-Play:** Agent plays against itself to learn strategies
3. **Action Masking:** Invalid moves are masked during training (e.g., full columns in Connect Four)
4. **Reward Shaping:** Win = +1, Loss = -1, Draw = 0, Invalid move = -1
5. **Model Saving:** Best models saved with timestamps

### Game Flow
1. **Start Game:** Frontend requests new session from backend
2. **Human Move:** Click to make a move → sent to backend → observation returned
3. **AI Move:** Backend uses trained model to predict best action → observation returned
4. **Repeat:** Continue until win/loss/draw
5. **Game End:** Winner shown to the user

### Key Technical Details
- **Observation Space:** 3D arrays `[rows][cols][channels]` encoding board state
- **Action Space:** Discrete actions (7 for Connect Four, 9 for Tic-Tac-Toe)
- **Agent-Relative Observations:** Board is always shown from current player's perspective
- **Column-Major Encoding:** Tic-Tac-Toe uses column-major indexing for actions

## 📖 Learning Resources

This project demonstrates:
- Multi-agent reinforcement learning with PettingZoo
- REST API design with FastAPI
- Full-stack TypeScript with Next.js
- React state management for turn-based games
- Action space encoding for different game types
- Test-driven development with pytest

For more details, see [PROJECT_STATUS.md](./PROJECT_STATUS.md).
