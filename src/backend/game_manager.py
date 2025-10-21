import uuid
import glob
import os
import numpy as np
from typing import Dict, Optional, Tuple, Any
from pettingzoo.classic import connect_four_v3, chess_v6
from sb3_contrib import MaskablePPO


class GameSession:
    """Represents a single game session with its environment and model."""

    @staticmethod
    def _serialize_value(value):
        """Convert numpy types to Python native types for JSON serialization."""
        if isinstance(value, np.ndarray):
            return value.tolist()
        elif isinstance(value, (np.integer, np.floating)):
            return value.item()
        return value

    def __init__(self, game_type: str, model_path: Optional[str] = None):
        self.session_id = str(uuid.uuid4())
        self.game_type = game_type
        self.env = None
        self.model = None
        self.current_agent = None
        self.done = False

        # Initialize environment based on game type
        match self.game_type:
            case "connect_four":
                self.env = connect_four_v3.env()
            case "chess":
                self.env = chess_v6.env()

        # Load the model (use latest if not specified)
        if model_path is None:
            model_path = max(
                glob.glob(
                    f"checkpoints/{self.env.metadata['name']}/{self.env.metadata['name']}*.zip"
                ),
                key=os.path.getctime,
            )

        self.model = MaskablePPO.load(path=model_path)

        # Start the game
        self.env.reset()
        self._advance_to_next_observation()

    def _advance_to_next_observation(self):
        """Advance the environment to get the next valid observation."""
        self.done = len(self.env.agents) == 0
        self.current_agent = None if self.done else self.env.agent_selection

    def get_current_state(self) -> Dict[str, Any]:
        """Get the current game state."""
        if self.done:
            return {
                "observation": [],
                "action_mask": [],
                "valid_actions": [],
                "current_player": None,
                "done": True,
            }

        (obs, reward, termination, truncation, info) = self.env.last()

        # Convert numpy arrays to lists for JSON serialization
        observation = self._serialize_value(obs["observation"])
        action_mask = self._serialize_value(obs["action_mask"])

        return {
            "observation": observation,
            "action_mask": action_mask,
            "valid_actions": [i for i, valid in enumerate(action_mask) if valid],
            "current_player": self.env.agent_selection,
            "done": termination or truncation,
        }

    def make_move(self, action: int) -> Tuple[Dict[str, Any], float, bool]:
        """
        Make a move in the game.
        Returns: (new_state, reward, done)
        """
        if self.done:
            raise ValueError("Game is already finished")

        self.env.step(action)
        self._advance_to_next_observation()
        obs, reward, termination, truncation, _ = self.env.last()
        return self.get_current_state(), float(reward), termination or truncation

    def get_ai_move(self) -> tuple[int, float, bool]:
        """Get the AI's move for the current state. Returns (action, reward, done)."""
        obs, reward, termination, truncation, info = self.env.last()
        observation, action_mask = obs.values()
        ai_action = int(
            self.model.predict(
                observation, action_masks=action_mask, deterministic=True
            )[0]
        )
        self.env.step(ai_action)
        self._advance_to_next_observation()
        # Get the reward and done status after the AI's move
        _, new_reward, new_termination, new_truncation, _ = self.env.last()
        done = new_termination or new_truncation
        return ai_action, float(new_reward), done


class GameManager:
    """Manages multiple game sessions."""

    def __init__(self):
        self.sessions: Dict[str, GameSession] = {}

    def create_game(
        self, game_type: str, model_path: Optional[str] = None
    ) -> GameSession:
        """Create a new game session."""
        session = GameSession(game_type, model_path)
        self.sessions[session.session_id] = session
        return session

    def get_session(self, session_id: str) -> Optional[GameSession]:
        """Get a game session by ID."""
        return self.sessions.get(session_id)

    def delete_session(self, session_id: str):
        """Delete a game session."""
        if session_id in self.sessions:
            session = self.sessions[session_id]
            if session.env:
                session.env.close()
            del self.sessions[session_id]
