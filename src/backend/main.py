from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from src.backend.game_manager import GameManager
from src.backend.models import (
    GameStartRequest,
    GameStartResponse,
    MoveRequest,
    MoveResponse,
    GameStateResponse,
)

app = FastAPI(title="MARL Games API", version="0.1.0")

# Add CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the game manager
game_manager = GameManager()


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "message": "MARL Games API is running"}


@app.post("/game/start", response_model=GameStartResponse)
async def start_game(request: GameStartRequest):
    """
    Start a new game session.
    Returns the initial game state and session ID.
    """
    game_type = request.game_type
    if game_type not in ["connect_four", "chess"]:
        raise HTTPException(status_code=400, detail="Invalid game type")

    model_path = request.model_path
    game_session = game_manager.create_game(game_type, model_path)
    init_state = game_session.get_current_state()
    return GameStartResponse(
        session_id=game_session.session_id,
        game_type=game_type,
        observation=init_state["observation"],
        action_mask=init_state["action_mask"],
        valid_actions=init_state["valid_actions"],
        current_player=init_state["current_player"],
    )


@app.post("/game/move", response_model=MoveResponse)
async def make_move(request: MoveRequest):
    """
    Make a move in the game.
    Returns the new game state after the player's move.
    """
    curr_session_id = request.session_id
    curr_session = game_manager.get_session(curr_session_id)
    if curr_session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    requested_action = request.action
    new_state, reward, done = curr_session.make_move(requested_action)
    return MoveResponse(
        observation=new_state["observation"],
        action_mask=new_state["action_mask"],
        valid_actions=new_state["valid_actions"],
        reward=reward,
        done=done,
        current_player=new_state["current_player"],
        ai_action=None,
    )


@app.post("/game/ai-move")
async def get_ai_move(session_id: str):
    """
    Get the AI's move for the current game state.
    Executes the move and returns the new state.
    """
    curr_session = game_manager.get_session(session_id)
    if curr_session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    ai_action, reward, done = curr_session.get_ai_move()
    new_state = curr_session.get_current_state()
    return {
        "ai_action": ai_action,
        "observation": new_state["observation"],
        "action_mask": new_state["action_mask"],
        "valid_actions": new_state["valid_actions"],
        "current_player": new_state["current_player"],
        "done": done,
        "reward": reward,
    }


@app.get("/game/state/{session_id}", response_model=GameStateResponse)
async def get_game_state(session_id: str):
    """Get the current state of a game session."""
    curr_session = game_manager.get_session(session_id)
    if curr_session is None:
        raise HTTPException(status_code=404, detail="Session not found.")

    current_state = curr_session.get_current_state()
    return GameStateResponse(
        session_id=curr_session.session_id,
        game_type=curr_session.game_type,
        observation=current_state["observation"],
        action_mask=current_state["action_mask"],
        valid_actions=current_state["valid_actions"],
        current_player=current_state["current_player"],
        done=current_state["done"],
    )


@app.delete("/game/{session_id}")
async def delete_game(session_id: str):
    """Delete a game session and clean up resources."""
    session = game_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    game_manager.delete_session(session_id)
    return {"status": "deleted", "session_id": session_id}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
