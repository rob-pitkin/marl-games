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
const ROWS = 3;
const COLS = 3;

// Cell state: 0 = empty, 1 = player 1, 2 = player 2
type CellState = 0 | 1 | 2;

interface TicTacToeBoardProps {
	onGameEnd?: (winner: string) => void;
}

export function TicTacToeBoard({ onGameEnd }: TicTacToeBoardProps) {
	// Game state
	const [sessionId, setSessionId] = useState<string | null>(null);
	const [board, setBoard] = useState<CellState[][]>(createEmptyBoard());
	const [currentPlayer, setCurrentPlayer] = useState<string>("player_1");
	const [validActions, setValidActions] = useState<number[]>([]);
	const [isGameOver, setIsGameOver] = useState(false);
	const [winner, setWinner] = useState<string | null>(null);
	const [isAIThinking, setIsAIThinking] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [playerOrder, setPlayerOrder] = useState<"first" | "second">("first");

	// Helper: Create empty 3x3 board
	function createEmptyBoard(): CellState[][] {
		return Array(COLS)
			.fill(null)
			.map(() => Array(ROWS).fill(0));
	}

	// Helper: Convert observation array to 2D board
	function observationToBoard(
		observation: any,
		forPlayer: string,
	): CellState[][] {
		// The observation is a 3D array: [rows][cols][channels] in COLUMN-MAJOR ORDER
		//
		// Each cell has 2 channels: [current_player_piece, opponent_piece]
		// The observation is agent-relative (channel 0 = current player)
		const board = createEmptyBoard();
		for (let i = 0; i < COLS; i++) {
			for (let j = 0; j < ROWS; j++) {
				const cell = observation[i][j];
				if (cell[0] === 1) {
					// Channel 0 = current player's piece
					board[i][j] = forPlayer === "player_1" ? 1 : 2;
				} else if (cell[1] === 1) {
					// Channel 1 = opponent's piece
					board[i][j] = forPlayer === "player_1" ? 2 : 1;
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
				await apiClient.startGame("tictactoe");

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
					// AI went first (playerOrder is "second"), so AI is player_1
					let gameWinner: string | null = null;
					if (aiResponse.reward !== 0) {
						gameWinner = "player_1"; // AI won
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

	// Handle player clicking a cell
	async function handleCellClick(cell: number) {
		if (!sessionId || isGameOver || isAIThinking) return;
		if (!validActions.includes(cell)) return;

		try {
			setError(null);

			// Make player move
			const moveResponse: MoveResponse = await apiClient.makeMove(
				sessionId,
				cell,
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
					gameWinner = playerOrder === "first" ? "player_1" : "player_2";
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
					gameWinner = playerOrder === "first" ? "player_2" : "player_1";
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
		setCurrentPlayer("player_1");
		setValidActions([]);
		setIsGameOver(false);
		setWinner(null);
		setError(null);
	}

	// Helper: Get friendly player name
	function getPlayerName(player: string): string {
		// Determine which player ID the human has based on player order selection
		const humanPlayerId = playerOrder === "first" ? "player_1" : "player_2";
		return player === humanPlayerId ? "You" : "AI";
	}

	// Helper: Get player color name
	function getPlayerColorName(player: string): string {
		return player === "player_1" ? "Xs" : "Os";
	}

	return (
		<Card className="p-8 max-w-3xl mx-auto shadow-lg">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-green-500 bg-clip-text text-transparent">
							Tic Tac Toe
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
								<SelectItem value="first">
									<span className="text-blue-600 font-bold">X</span> First
									Player
								</SelectItem>
								<SelectItem value="second">
									<span className="text-green-600 font-bold">O</span> Second
									Player
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
													winner === "player_1"
														? "text-blue-600"
														: "text-green-600"
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
											{currentPlayer === "player_1" ? (
												<span className="text-blue-600 font-bold">X</span>
											) : (
												<span className="text-green-600 font-bold">O</span>
											)}
											Your turn
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
					<div className="inline-block bg-gradient-to-br from-gray-600 to-gray-700 p-3 rounded-xl shadow-2xl border-4 border-pink-900">
						<div
							className="grid gap-3"
							style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
						>
							{board.map((col, colIndex) =>
								col.map((cell, rowIndex) => (
									<button
										type="button"
										key={`${colIndex}-${rowIndex}`}
										onClick={() => handleCellClick(colIndex * 3 + rowIndex)}
										disabled={
											!sessionId ||
											isGameOver ||
											isAIThinking ||
											!validActions.includes(colIndex * 3 + rowIndex)
										}
										className={`
                      w-16 h-16 border-4 border-pink-900 bg-gray-200 flex items-center justify-center
                      ${
												sessionId &&
												!isGameOver &&
												!isAIThinking &&
												validActions.includes(colIndex * 3 + rowIndex)
													? "hover:scale-110 hover:brightness-110 cursor-pointer active:scale-95"
													: "cursor-not-allowed"
											}
                      transition-all duration-200 shadow-inner
                    `}
										aria-label={`Row ${rowIndex}, Column ${colIndex}`}
									>
										<span
											className={`text-6xl ${cell === 1 ? "text-blue-600" : cell === 2 ? "text-green-600" : ""} font-bold`}
										>
											{cell === 1 ? "X" : cell === 2 ? "O" : ""}
										</span>
									</button>
								)),
							)}
						</div>
					</div>
				</div>

				{/* Game info */}
				{sessionId && !isGameOver && (
					<div className="flex justify-center gap-6 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-gray-300" />
							<span>Blue: {playerOrder === "first" ? "You" : "AI"}</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 rounded-full bg-green-500 border-2 border-gray-300" />
							<span>Green: {playerOrder === "second" ? "You" : "AI"}</span>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
