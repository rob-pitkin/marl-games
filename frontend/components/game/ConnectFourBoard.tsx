"use client";

import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
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
	const [playerOrder, setPlayerOrder] = useState<"first" | "second">("first");

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
			setBoard(
				observationToBoard(response.observation, response.current_player),
			);

			// If player chose to go second, AI makes the first move
			if (playerOrder === "second") {
				setIsAIThinking(true);
				await new Promise((resolve) => setTimeout(resolve, 800));
				const aiResponse: AIResponse = await apiClient.getAIMove(
					response.session_id,
				);
				setBoard(
					observationToBoard(aiResponse.observation, aiResponse.current_player),
				);
				setValidActions(aiResponse.valid_actions);
				setCurrentPlayer(aiResponse.current_player);
				setIsAIThinking(false);

				if (aiResponse.done) {
					setIsGameOver(true);
					// AI went first (playerOrder is "second"), so AI is player_0
					let gameWinner: string | null = null;
					if (aiResponse.reward !== 0) {
						gameWinner = "player_0"; // AI won
					}
					// If reward is 0, it's a draw (gameWinner stays null)
					setWinner(gameWinner);
					if (onGameEnd && gameWinner) {
						onGameEnd(gameWinner);
					}
				}
			}
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
				observationToBoard(
					moveResponse.observation,
					moveResponse.current_player,
				),
			);
			setValidActions(moveResponse.valid_actions);
			setCurrentPlayer(moveResponse.current_player);

			if (moveResponse.done) {
				setIsGameOver(true);
				// Human made a move and game ended - human won (or draw if reward is 0)
				let gameWinner: string | null = null;
				if (moveResponse.reward !== 0) {
					// Human won - determine which player_id based on player order
					gameWinner = playerOrder === "first" ? "player_0" : "player_1";
				}
				// If reward is 0, it's a draw (gameWinner stays null)
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
				// AI made a move and game ended - determine winner from reward
				// Reward is from next player's perspective: -1 = they lost (AI won), 0 = draw
				let gameWinner: string | null = null;
				if (aiResponse.reward !== 0) {
					// AI won - determine AI's player_id based on player order
					gameWinner = playerOrder === "first" ? "player_1" : "player_0";
				}
				// If reward is 0, it's a draw (gameWinner stays null)
				setWinner(gameWinner);
				if (onGameEnd && gameWinner) {
					onGameEnd(gameWinner);
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

	// Helper: Get friendly player name
	function getPlayerName(player: string): string {
		// Determine which player ID the human has based on player order selection
		const humanPlayerId = playerOrder === "first" ? "player_0" : "player_1";
		return player === humanPlayerId ? "You" : "AI";
	}

	// Helper: Get player color name
	function getPlayerColorName(player: string): string {
		return player === "player_0" ? "Red" : "Yellow";
	}

	return (
		<Card className="p-8 max-w-3xl mx-auto shadow-lg">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold bg-gradient-to-r from-red-500 to-yellow-500 bg-clip-text text-transparent">
							Connect Four
						</h2>
						<p className="text-sm text-muted-foreground mt-1">
							Play against a trained AI agent
						</p>
					</div>
					<div className="flex gap-2">
						{!sessionId ? (
							<Button onClick={handleStartGame} size="lg">
								Start Game
							</Button>
						) : (
							<Button onClick={handleReset} variant="outline" size="lg">
								New Game
							</Button>
						)}
					</div>
				</div>

				{/* Player order selection (only show before game starts) */}
				{!sessionId && (
					<div className="flex items-center justify-center gap-4 p-4 bg-muted/50 rounded-lg">
						<label htmlFor="player-order" className="text-sm font-medium">
							Choose your side:
						</label>
						<Select
							value={playerOrder}
							onValueChange={(value) =>
								setPlayerOrder(value as "first" | "second")
							}
						>
							<SelectTrigger id="player-order" className="w-[200px]">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="first">🔴 First Player (Red)</SelectItem>
								<SelectItem value="second">
									🟡 Second Player (Yellow)
								</SelectItem>
							</SelectContent>
						</Select>
					</div>
				)}

				{/* Game status */}
				{sessionId && (
					<div className="flex items-center justify-center gap-4">
						{isGameOver ? (
							<Alert className="max-w-md border-2">
								<AlertDescription className="text-center text-lg font-semibold">
									{winner ? (
										<>
											🎉 Game Over!{" "}
											<span
												className={
													winner === "player_0"
														? "text-red-600"
														: "text-yellow-600"
												}
											>
												{getPlayerName(winner)}
											</span>{" "}
											{getPlayerName(winner) === "You" ? "win!" : "wins!"}
										</>
									) : (
										"Game Over! It's a draw!"
									)}
								</AlertDescription>
							</Alert>
						) : (
							<div className="flex items-center gap-3">
								<Badge variant="outline" className="text-base px-4 py-2">
									{isAIThinking ? (
										<>
											<span className="inline-block animate-pulse mr-2">
												🤖
											</span>
											AI is thinking...
										</>
									) : (
										<>
											<span className="mr-2">
												{currentPlayer === "player_0" ? "🔴" : "🟡"}
											</span>
											{getPlayerName(currentPlayer)}'s turn (
											{getPlayerColorName(currentPlayer)})
										</>
									)}
								</Badge>
							</div>
						)}
					</div>
				)}

				{!sessionId && (
					<div className="text-center">
						<p className="text-muted-foreground">
							Select your player and click Start Game to begin
						</p>
					</div>
				)}

				{/* Error message */}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Board */}
				<div className="flex justify-center">
					<div className="inline-block bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-xl shadow-2xl border-4 border-blue-800">
						<div
							className="grid gap-3"
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
                      w-16 h-16 rounded-full border-4 border-blue-900
                      ${getCellColor(cell)}
                      ${
												sessionId &&
												!isGameOver &&
												!isAIThinking &&
												validActions.includes(colIndex)
													? "hover:scale-110 hover:brightness-110 cursor-pointer active:scale-95"
													: "cursor-not-allowed"
											}
                      transition-all duration-200 shadow-inner
                    `}
										aria-label={`Row ${rowIndex}, Column ${colIndex}`}
									/>
								)),
							)}
						</div>
					</div>
				</div>

				{/* Game info */}
				{sessionId && !isGameOver && (
					<div className="flex justify-center gap-6 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full bg-red-500 border-2 border-gray-300" />
							<span>Red: {playerOrder === "first" ? "You" : "AI"}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full bg-yellow-500 border-2 border-gray-300" />
							<span>Yellow: {playerOrder === "second" ? "You" : "AI"}</span>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
