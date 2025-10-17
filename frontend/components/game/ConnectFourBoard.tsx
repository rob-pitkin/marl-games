"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type {
	AIResponse,
	MoveResponse,
	StartGameResponse,
} from "@/lib/api-client";
import { apiClient } from "@/lib/api-client";

// Connect Four constants
const ROWS = 6;
const COLS = 7;

// Cell state: 0 = empty, 1 = player 1, 2 = player 2
type CellState = 0 | 1 | 2;

interface ConnectFourBoardProps {
	onGameEnd?: (winner: string) => void;
}

export function ConnectFourBoard({ onGameEnd }: ConnectFourBoardProps) {
	// Game state
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [board, setBoard] = useState<CellState[][]>(createEmptyBoard());
	const [currentPlayer, setCurrentPlayer] = useState<string>("player_0");
	const [validActions, setValidActions] = useState<number[]>([]);
	const [isGameOver, setIsGameOver] = useState(false);
	const [winner, setWinner] = useState<string | null>(null);
	const [isAIThinking, setIsAIThinking] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Helper: Create empty 6x7 board
	function createEmptyBoard(): CellState[][] {
		return Array(ROWS)
			.fill(null)
			.map(() => Array(COLS).fill(0));
	}

	// Helper: Convert observation array to 2D board
	function observationToBoard(
		observation: any,
		forPlayer: string,
	): CellState[][] {
		// The observation is a 3D array: [rows][cols][channels]
		// Each cell has 2 channels: [current_player_piece, opponent_piece]
		// The observation is agent-relative (channel 0 = current player)
		const board = createEmptyBoard();
		for (let i = 0; i < ROWS; i++) {
			for (let j = 0; j < COLS; j++) {
				const cell = observation[i][j];
				if (cell[0] === 1) {
					// Channel 0 = current player's piece
					board[i][j] = forPlayer === "player_0" ? 1 : 2;
				} else if (cell[1] === 1) {
					// Channel 1 = opponent's piece
					board[i][j] = forPlayer === "player_0" ? 2 : 1;
				} else {
					board[i][j] = 0; // Empty
				}
			}
		}
		return board;
	}

	// Start a new game
	async function handleStartGame() {
		try {
			setError(null);
			const response: StartGameResponse =
				await apiClient.startGame("connect_four");

			setSessionId(response.session_id);
			setCurrentPlayer(response.current_player);
			setValidActions(response.valid_actions);
			setIsGameOver(false);
			setWinner(null);
			setBoard(observationToBoard(response.observation, response.current_player));
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to start game");
		}
	}

	// Handle player clicking a column
	async function handleColumnClick(col: number) {
		if (!sessionId || isGameOver || isAIThinking) return;
		if (!validActions.includes(col)) return;

		try {
			setError(null);

			// Make player move
			const moveResponse: MoveResponse = await apiClient.makeMove(
				sessionId,
				col,
			);
			setBoard(
				observationToBoard(moveResponse.observation, moveResponse.current_player),
			);
			setValidActions(moveResponse.valid_actions);
			setCurrentPlayer(moveResponse.current_player);

			if (moveResponse.done) {
				setIsGameOver(true);
				// TODO(human): Determine the winner from the game state
				// If the game is done, check who won based on the reward or current player
				// Set the winner using setWinner() and call onGameEnd if provided
				let gameWinner: string | null = null;
				if (moveResponse.reward === 1) {
					gameWinner = "player_0";
				} else if (moveResponse.reward === -1) {
					gameWinner = "player_1";
				}
				setWinner(gameWinner);
				if (onGameEnd && gameWinner) {
					onGameEnd(gameWinner);
				}
				return;
			}

			// Get AI response (with a small delay to make it feel more natural)
			setIsAIThinking(true);
			await new Promise((resolve) => setTimeout(resolve, 800)); // 800ms delay
			const aiResponse: AIResponse = await apiClient.getAIMove(sessionId);
			setBoard(
				observationToBoard(aiResponse.observation, aiResponse.current_player),
			);
			setValidActions(aiResponse.valid_actions);
			setCurrentPlayer(aiResponse.current_player);

			if (aiResponse.done) {
				setIsGameOver(true);
				// AI won (since the game ended after AI's move)
				setWinner("player_1");
				if (onGameEnd) {
					onGameEnd("player_1");
				}
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to make move");
		} finally {
			setIsAIThinking(false);
		}
	}

	// Reset game
	function handleReset() {
		setSessionId(null);
		setBoard(createEmptyBoard());
		setCurrentPlayer("player_0");
		setValidActions([]);
		setIsGameOver(false);
		setWinner(null);
		setError(null);
	}

	// Get cell color based on state
	function getCellColor(cell: CellState): string {
		// 0 = empty (white or light gray)
		// 1 = player 1 (red)
		// 2 = player 2 (yellow)
		switch (cell) {
			case 0:
				return "bg-gray-200";
			case 1:
				return "bg-red-500";
			case 2:
				return "bg-yellow-500";
			default:
				return "bg-gray-200";
		}
	}

	return (
		<Card className="p-6 max-w-2xl mx-auto">
			<div className="space-y-4">
				{/* Header */}
				<div className="flex items-center justify-between">
					<h2 className="text-2xl font-bold">Connect Four</h2>
					<div className="flex gap-2">
						{!sessionId ? (
							<Button onClick={handleStartGame}>Start Game</Button>
						) : (
							<Button onClick={handleReset} variant="outline">
								New Game
							</Button>
						)}
					</div>
				</div>

				{/* Game status */}
				<div className="text-center">
					{isGameOver ? (
						<p className="text-lg font-semibold">
							Game Over! {winner ? `Winner: ${winner}` : "Draw"}
						</p>
					) : sessionId ? (
						<p className="text-lg">
							{isAIThinking
								? "AI is thinking..."
								: `Current Player: ${currentPlayer}`}
						</p>
					) : (
						<p className="text-muted-foreground">Click Start Game to begin</p>
					)}
				</div>

				{/* Error message */}
				{error && (
					<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
						{error}
					</div>
				)}

				{/* Board */}
				<div className="inline-block bg-blue-600 p-4 rounded-lg">
					<div
						className="grid gap-2"
						style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
					>
						{board.map((row, rowIndex) =>
							row.map((cell, colIndex) => (
								<button
									type="button"
									key={`${rowIndex}-${colIndex}`}
									onClick={() => handleColumnClick(colIndex)}
									disabled={
										!sessionId ||
										isGameOver ||
										isAIThinking ||
										!validActions.includes(colIndex)
									}
									className={`
                    w-16 h-16 rounded-full border-2 border-blue-800
                    ${getCellColor(cell)}
                    ${
											sessionId &&
											!isGameOver &&
											!isAIThinking &&
											validActions.includes(colIndex)
												? "hover:opacity-80 cursor-pointer"
												: "cursor-not-allowed"
										}
                    transition-all
                  `}
									aria-label={`Row ${rowIndex}, Column ${colIndex}`}
								/>
							)),
						)}
					</div>
				</div>

				{/* Valid actions indicator (for debugging) */}
				{sessionId && !isGameOver && (
					<p className="text-sm text-muted-foreground">
						Valid columns: {validActions.join(", ")}
					</p>
				)}
			</div>
		</Card>
	);
}
