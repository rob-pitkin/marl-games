// API Client for MARL Games Backend
// Backend runs on http://localhost:8000

// ============================================================================
// TypeScript Interfaces (matching backend Pydantic models)
// ============================================================================

export interface StartGameRequest {
	game_type: "connect_four" | "chess";
}

export interface StartGameResponse {
	session_id: string;
	game_type: string;
	current_player: string;
	observation: number[];
	action_mask: boolean[];
	valid_actions: number[];
}

export interface MoveRequest {
	session_id: string;
	action: number;
}

export interface MoveResponse {
	observation: number[];
	action_mask: boolean[];
	valid_actions: number[];
	reward: number;
	done: boolean;
	current_player: string;
	ai_action?: number;
}

export interface AIResponse {
	ai_action: number;
	observation: number[];
	action_mask: boolean[];
	valid_actions: number[];
	current_player: string;
	done: boolean;
	reward: number;
}

export interface GameState {
	session_id: string;
	game_type: string;
	current_player: string;
	observation: number[];
	action_mask: boolean[];
	valid_actions: number[];
	done: boolean;
}

// ============================================================================
// API Client Class
// ============================================================================

class GameAPIClient {
	private baseURL: string;

	constructor(baseURL: string = "http://localhost:8000") {
		this.baseURL = baseURL;
	}

	/**
	 * Start a new game session
	 * POST /game/start
	 */
	async startGame(
		gameType: "connect_four" | "chess",
	): Promise<StartGameResponse> {
		// - Create the request body with game_type
		// - Send POST request to `${this.baseURL}/game/start`
		// - Handle response and errors
		// - Return the parsed JSON response
		const req_body: StartGameRequest = {
			game_type: gameType,
		};
		const response = await fetch(`${this.baseURL}/game/start`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req_body),
		});
		if (!response.ok) {
			throw new Error(`Failed to start game. Status: ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Make a player move
	 * POST /game/move
	 */
	async makeMove(sessionId: string, action: number): Promise<MoveResponse> {
		// - Create the request body with session_id and action
		// - Send POST request to `${this.baseURL}/game/move`
		// - Handle response and errors
		// - Return the parsed JSON response
		const req_body: MoveRequest = {
			session_id: sessionId,
			action,
		};
		const response = await fetch(`${this.baseURL}/game/move`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(req_body),
		});
		if (!response.ok) {
			throw new Error(`Failed to make move. Status: ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Get AI move
	 * POST /game/ai-move?session_id={sessionId}
	 */
	async getAIMove(sessionId: string): Promise<AIResponse> {
		// - Send POST request to `${this.baseURL}/game/ai-move?session_id=${sessionId}`
		// - Handle response and errors
		// - Return the parsed JSON response
		const response = await fetch(
			`${this.baseURL}/game/ai-move?session_id=${sessionId}`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (!response.ok) {
			throw new Error(`Failed to get AI move. Status: ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Get current game state
	 * GET /game/state/{sessionId}
	 */
	async getGameState(sessionId: string): Promise<GameState> {
		// - Send GET request to `${this.baseURL}/game/state/${sessionId}`
		// - Handle response and errors
		// - Return the parsed JSON response
		const response = await fetch(`${this.baseURL}/game/state/${sessionId}`, {
			method: "GET",
		});

		if (!response.ok) {
			throw new Error(`Failed to get game state. Status: ${response.status}`);
		}
		return response.json();
	}

	/**
	 * Delete game session
	 * DELETE /game/{sessionId}
	 */
	async deleteGame(sessionId: string): Promise<void> {
		// - Send DELETE request to `${this.baseURL}/game/${sessionId}`
		// - Handle response and errors
		// - No return value needed
		const response = await fetch(`${this.baseURL}/game/${sessionId}`, {
			method: "DELETE",
		});

		if (!response.ok) {
			throw new Error(`Failed to delete game. Status: ${response.status}`);
		}
	}
}

// Export singleton instance
export const apiClient = new GameAPIClient();
