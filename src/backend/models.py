from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class GameStartRequest(BaseModel):
    """Request to start a new game."""

    game_type: str  # "connect_four" or "tictactoe"
    model_path: Optional[str] = None  # If None, use latest model


class GameStartResponse(BaseModel):
    """Response after starting a game."""

    session_id: str
    game_type: str
    observation: Any
    action_mask: List[bool]
    valid_actions: List[int]
    current_player: str


class MoveRequest(BaseModel):
    """Request to make a move."""

    session_id: str
    action: int


class MoveResponse(BaseModel):
    """Response after making a move."""

    observation: Any
    action_mask: List[bool]
    valid_actions: List[int]
    reward: float
    done: bool
    current_player: str
    ai_action: Optional[int] = None  # The AI's response move


class GameStateResponse(BaseModel):
    """Response for getting current game state."""

    session_id: str
    game_type: str
    observation: Any
    action_mask: List[bool]
    valid_actions: List[int]
    current_player: str
    done: bool
