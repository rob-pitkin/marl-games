import pytest
import numpy as np
from unittest.mock import Mock, patch
from src.backend.game_manager import GameSession, GameManager


def create_mock_env(env_name: str) -> Mock:
    env = Mock()
    env.metadata = {"name": env_name}
    env.agents = {"player0", "player1"}
    env.agent_selection = "player0"

    observation = np.array([[0, 1, 2], [3, 4, 5]])
    action_mask = np.array([True, False, True, False, True, False, True])
    env.last.return_value = (
        {"observation": observation, "action_mask": action_mask},
        0.0,  # reward
        False,  # termination
        False,  # truncation
        {},  # info
    )
    return env


def create_mock_model() -> Mock:
    model = Mock()
    model.predict.return_value = (np.array([2]), None)
    return model


class TestGameSession:
    """Test suite for GameSession class."""

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_game_session_initialization_connect_four(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test GameSession initializes correctly for Connect Four."""
        # Verify session_id is a valid UUID string, game_type is set,
        # environment is created and reset, and model is loaded

        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")
        assert session.session_id is not None
        assert session.game_type == "connect_four"
        assert session.env == test_env
        assert session.model == test_model

        # verify mocks were used
        mock_cf.env.assert_called_once()
        test_env.reset.assert_called_once()
        mock_ppo_class.load.assert_called_once()

    @patch("src.backend.game_manager.chess_v6")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_game_session_initialization_chess(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_chess
    ):
        """Test GameSession initializes correctly for Chess."""
        # Similar to connect_four test but for chess_v6
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/chess_v6/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (chess)
        test_env = create_mock_env("chess_v6")
        mock_chess.env.return_value = test_env

        session = GameSession("chess")
        assert session.session_id is not None
        assert session.game_type == "chess"
        assert session.env == test_env
        assert session.model == test_model

        # verify mocks were used
        mock_chess.env.assert_called_once()
        test_env.reset.assert_called_once()
        mock_ppo_class.load.assert_called_once()

    def test_serialize_value_numpy_array(self):
        """Test _serialize_value converts numpy arrays to lists."""
        # Create a numpy array and verify it returns a Python list
        test_array = np.array([[1, 2, 3], [4, 5, 6]])
        result = GameSession._serialize_value(test_array)
        assert isinstance(result, list)
        assert result == [[1, 2, 3], [4, 5, 6]]

    def test_serialize_value_numpy_integer(self):
        """Test _serialize_value converts numpy integers to Python int."""
        # Test with np.int32, np.int64, etc.
        test_int = np.int32(1)
        test_long = np.int64(2)
        result_1 = GameSession._serialize_value(test_int)
        result_2 = GameSession._serialize_value(test_long)
        assert isinstance(result_1, int)
        assert isinstance(result_2, int)
        assert result_1 == test_int
        assert result_2 == test_long

    def test_serialize_value_numpy_float(self):
        """Test _serialize_value converts numpy floats to Python float."""
        # Test with np.float32, np.float64, etc.
        test_float = np.float32(1)
        test_double = np.float64(2)
        result_1 = GameSession._serialize_value(test_float)
        result_2 = GameSession._serialize_value(test_double)
        assert isinstance(result_1, float)
        assert isinstance(result_2, float)
        assert result_1 == test_float
        assert result_2 == test_double

    def test_serialize_value_python_native_types(self):
        """Test _serialize_value passes through Python native types unchanged."""
        # Test with int, float, str, list, dict
        test_int = 1
        test_float = 2.0
        test_str = "test"
        test_list = [1, 2]
        test_dict = {"name": "rob", "test": True}
        result_int = GameSession._serialize_value(test_int)
        result_float = GameSession._serialize_value(test_float)
        result_str = GameSession._serialize_value(test_str)
        result_list = GameSession._serialize_value(test_list)
        result_dict = GameSession._serialize_value(test_dict)
        assert isinstance(result_int, int)
        assert isinstance(result_float, float)
        assert isinstance(result_str, str)
        assert isinstance(result_list, list)
        assert isinstance(result_dict, dict)
        assert result_int == 1
        assert result_float == 2.0
        assert result_str == "test"
        assert result_list == [1, 2]
        assert result_dict == {"name": "rob", "test": True}

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_get_current_state_active_game(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test get_current_state returns correct structure for active game."""
        # Verify the returned dict has all required keys and correct types
        # Check that numpy arrays are serialized to lists
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")
        current_state = session.get_current_state()
        assert "observation" in current_state
        assert "action_mask" in current_state
        assert "valid_actions" in current_state
        assert "current_player" in current_state
        assert "done" in current_state

        assert isinstance(current_state["observation"], list)
        assert isinstance(current_state["action_mask"], list)
        assert isinstance(current_state["valid_actions"], list)

        assert current_state["observation"] == [[0, 1, 2], [3, 4, 5]]
        assert current_state["action_mask"] == [
            True,
            False,
            True,
            False,
            True,
            False,
            True,
        ]
        assert current_state["valid_actions"] == [
            0,
            2,
            4,
            6,
        ]  # indices where mask is True
        assert current_state["current_player"] == "player0"
        assert current_state["done"] is False

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_get_current_state_finished_game(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test get_current_state returns correct structure when game is done."""
        # Set mock_env.agents = [] to simulate finished game
        # Verify done=True and empty observation/action_mask
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")
        test_env.agents = []

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")
        current_state = session.get_current_state()
        assert "observation" in current_state
        assert "action_mask" in current_state
        assert "valid_actions" in current_state
        assert "current_player" in current_state
        assert "done" in current_state

        assert isinstance(current_state["observation"], list)
        assert isinstance(current_state["action_mask"], list)
        assert isinstance(current_state["valid_actions"], list)

        assert current_state["observation"] == []
        assert current_state["action_mask"] == []
        assert current_state["valid_actions"] == []
        assert current_state["current_player"] == None
        assert current_state["done"] is True

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_make_move_valid_action(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test make_move executes valid action and returns correct response."""
        # Call make_move with valid action, verify env.step was called
        # Check returned tuple (state, reward, done) has correct types
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")
        current_state, reward, done = session.make_move(0)
        assert "observation" in current_state
        assert "action_mask" in current_state
        assert "valid_actions" in current_state
        assert "current_player" in current_state
        assert "done" in current_state

        assert isinstance(current_state["observation"], list)
        assert isinstance(current_state["action_mask"], list)
        assert isinstance(current_state["valid_actions"], list)

        assert current_state["observation"] == [[0, 1, 2], [3, 4, 5]]
        assert current_state["action_mask"] == [
            True,
            False,
            True,
            False,
            True,
            False,
            True,
        ]
        assert current_state["valid_actions"] == [
            0,
            2,
            4,
            6,
        ]  # indices where mask is True
        assert current_state["current_player"] == "player0"
        assert current_state["done"] is False

        assert done == False
        assert isinstance(reward, float)
        assert reward == 0.0

        test_env.step.assert_called_once_with(0)

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_make_move_when_game_finished_raises_error(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test make_move raises ValueError when game is already finished."""
        # Set game to finished state, use pytest.raises to catch ValueError
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")
        test_env.agents = []

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")
        with pytest.raises(ValueError, match="Game is already finished"):
            session.make_move(0)

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_get_ai_move_calls_model_predict(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test get_ai_move calls model.predict with correct parameters."""
        # Verify model.predict is called with observation, action_mask, deterministic=True
        # Check that env.step is called with the predicted action
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")

        current_state = session.get_current_state()
        ai_action, reward, done = session.get_ai_move()

        assert isinstance(ai_action, int)
        assert isinstance(reward, float)
        assert isinstance(done, bool)
        test_model.predict.assert_called_once()

        # Inspect what was actually passed
        call_args = test_model.predict.call_args

        # Verify the call structure
        # call_args[0] = positional args, call_args[1] = keyword args
        observation_arg = call_args[0][0]
        action_masks_kwarg = call_args[1]["action_masks"]
        deterministic_kwarg = call_args[1]["deterministic"]

        # Verify types and values
        assert isinstance(observation_arg, np.ndarray)
        assert isinstance(action_masks_kwarg, np.ndarray)
        assert deterministic_kwarg is True

        # Verify env.step was called with the predicted action (which is 2 from mock)
        test_env.step.assert_called_once_with(ai_action)
        assert isinstance(ai_action, int)

    @patch("src.backend.game_manager.connect_four_v3")
    @patch("src.backend.game_manager.MaskablePPO")
    @patch("os.path.getctime")
    @patch("glob.glob")
    def test_get_ai_move_returns_integer(
        self, mock_glob, mock_getctime, mock_ppo_class, mock_cf
    ):
        """Test get_ai_move returns action as Python int, not numpy type."""
        # Verify return type is int (not np.int64 or other numpy type)
        # mock the call to glob.glob for finding the filepath to the latest model
        mock_glob.return_value = ["checkpoints/connect_four_v3/test.zip"]
        mock_getctime.return_value = 123456789

        # mock the call to MaskablePPO for loading the model
        test_model = create_mock_model()
        mock_ppo_class.load.return_value = test_model

        # mock the environment (connect four)
        test_env = create_mock_env("connect_four_v3")

        mock_cf.env.return_value = test_env

        session = GameSession("connect_four")

        ai_action, reward, done = session.get_ai_move()
        assert isinstance(ai_action, int)
        assert isinstance(reward, float)
        assert isinstance(done, bool)


class TestGameManager:
    """Test suite for GameManager class."""

    # Implement the test bodies below

    def test_game_manager_initialization(self):
        """Test GameManager initializes with empty sessions dictionary."""
        # Create GameManager and verify sessions is an empty dict
        game_manager = GameManager()

        assert isinstance(game_manager.sessions, dict)
        assert game_manager.sessions == {}

    @patch("src.backend.game_manager.GameSession")
    def test_create_game_default_model(self, mock_session_class):
        """Test create_game creates session and stores it correctly."""
        # Mock GameSession to return a session with a test ID
        # Verify the session is stored in manager.sessions dict
        mock_game_session = Mock()
        mock_game_session.session_id = "test-session"
        mock_session_class.return_value = mock_game_session

        game_manager = GameManager()
        created_session = game_manager.create_game("connect_four")

        assert "test-session" in game_manager.sessions
        assert game_manager.sessions["test-session"] == mock_game_session
        assert created_session == mock_game_session

    @patch("src.backend.game_manager.GameSession")
    def test_create_game_with_custom_model_path(self, mock_session_class):
        """Test create_game passes custom model_path to GameSession."""
        # Verify GameSession is called with the custom model path
        mock_game_session = Mock()
        mock_game_session.session_id = "test-session"
        mock_session_class.return_value = mock_game_session

        game_manager = GameManager()
        created_session = game_manager.create_game(
            "connect_four", model_path="custom_model"
        )

        mock_session_class.assert_called_once_with("connect_four", "custom_model")

    @patch("src.backend.game_manager.GameSession")
    def test_get_session_exists(self, mock_session_class):
        """Test get_session retrieves existing session."""
        # Create a session, then retrieve it by ID
        mock_game_session = Mock()
        mock_game_session.session_id = "test-session"
        mock_session_class.return_value = mock_game_session

        game_manager = GameManager()
        created_session = game_manager.create_game(
            "connect_four", model_path="custom_model"
        )

        retrieved_session = game_manager.get_session(created_session.session_id)
        assert retrieved_session == mock_game_session

    def test_get_session_not_exists(self):
        """Test get_session returns None for non-existent session."""
        # Call get_session with fake ID, verify None returned
        game_manager = GameManager()
        retrieved_session = game_manager.get_session("fake-session")
        assert retrieved_session is None

    @patch("src.backend.game_manager.GameSession")
    def test_delete_session_closes_environment(self, mock_session_class):
        """Test delete_session closes the environment and removes session."""
        # Create session with mock env, delete it, verify env.close() called
        mock_game_session = Mock()
        mock_game_session.session_id = "test-session"
        mock_env = Mock()
        mock_game_session.env = mock_env
        mock_session_class.return_value = mock_game_session

        game_manager = GameManager()
        created_session = game_manager.create_game(
            "connect_four", model_path="custom_model"
        )
        assert created_session == mock_game_session

        game_manager.delete_session(created_session.session_id)

        mock_env.close.assert_called_once()
        deleted_session = game_manager.get_session("test-session")
        assert deleted_session is None

    def test_delete_session_nonexistent_does_not_error(self):
        """Test deleting non-existent session doesn't raise exception."""
        # Call delete with fake ID, verify no exception raised
        game_manager = GameManager()
        game_manager.delete_session("fake-session-id")

    @patch("src.backend.game_manager.GameSession")
    def test_multiple_concurrent_sessions(self, mock_session_class):
        """Test managing multiple game sessions simultaneously."""
        # Create 3+ sessions, verify all are tracked independently
        # Delete one, verify others remain intact
        mock_session1 = Mock()
        mock_session1.session_id = "session1"
        mock_session2 = Mock()
        mock_session2.session_id = "session2"
        mock_session3 = Mock()
        mock_session3.session_id = "session3"

        mock_session_class.side_effect = [mock_session1, mock_session2, mock_session3]

        game_manager = GameManager()
        session1 = game_manager.create_game("connect_four")
        session2 = game_manager.create_game("connect_four")
        session3 = game_manager.create_game("chess")

        # Verify all three are stored
        assert len(game_manager.sessions) == 3
        assert game_manager.get_session("session1") == mock_session1
        assert game_manager.get_session("session2") == mock_session2
        assert game_manager.get_session("session3") == mock_session3

        # Delete one
        game_manager.delete_session("session2")

        # Verify others remain
        assert len(game_manager.sessions) == 2
        assert game_manager.get_session("session1") is not None
        assert game_manager.get_session("session2") is None
        assert game_manager.get_session("session3") is not None
