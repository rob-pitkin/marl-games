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

// Chess constants
const BOARD_SIZE = 8;

// Piece types (using Unicode chess symbols)
const PIECE_SYMBOLS: { [key: string]: string } = {
	// White pieces
	wP: "♙",
	wN: "♘",
	wB: "♗",
	wR: "♖",
	wQ: "♕",
	wK: "♔",
	// Black pieces
	bP: "♟",
	bN: "♞",
	bB: "♝",
	bR: "♜",
	bQ: "♛",
	bK: "♚",
};

const CHANNEL_TO_PIECE: Record<number, string> = {
	7: "wP",
	8: "wN",
	9: "wB",
	10: "wR",
	11: "wQ",
	12: "wK",
	13: "bP",
	14: "bN",
	15: "bB",
	16: "bR",
	17: "bQ",
	18: "bK",
};

// Cell state: null = empty, or piece code like "wP", "bK", etc.
type CellState = string | null;

interface ChessBoardProps {
	onGameEnd?: (winner: string) => void;
}

function isPlayerWhite(player: string): boolean {
	return player === "player_0";
}

export function ChessBoard({ onGameEnd }: ChessBoardProps) {
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

	// Move input state
	const [selectedSquare, setSelectedSquare] = useState<{
		row: number;
		col: number;
	} | null>(null);
	const [highlightedSquares, setHighlightedSquares] = useState<
		{ row: number; col: number }[]
	>([]);

	// Helper: Create empty 8x8 board
	function createEmptyBoard(): CellState[][] {
		return Array(BOARD_SIZE)
			.fill(null)
			.map(() => Array(BOARD_SIZE).fill(null));
	}

	// TODO(human): Convert chess board coordinates to UCI notation
	// This function takes a source and destination coordinate (row, col)
	// and converts them to UCI notation like "e2e4"
	// Chess board is 8x8 with rows 0-7 (rank 8 to rank 1) and cols 0-7 (files a-h)
	// Remember: row 0 = rank 8, row 7 = rank 1, col 0 = file 'a', col 7 = file 'h'
	function coordinatesToUCI(
		fromRow: number,
		fromCol: number,
		toRow: number,
		toCol: number,
	): string {
		const fromColumnLetter = String.fromCharCode(97 + fromCol);
		const fromRank = String(8 - fromRow);
		const toColumnLetter = String.fromCharCode(97 + toCol);
		const toRank = String(8 - toRow);
		return fromColumnLetter + fromRank + toColumnLetter + toRank;
	}

	function coordinatesToAction(fromRow, fromCol, toRow, toCol): number {
		const deltaRow = toRow - fromRow;
		const deltaCol = toCol - fromCol;
		const isKnightMove =
			(Math.abs(deltaRow) === 2 && Math.abs(deltaCol) === 1) ||
			(Math.abs(deltaRow) === 1 && Math.abs(deltaCol) === 2);
		const isHorizontal = deltaRow === 0;
		const isVertical = deltaCol === 0;
		const isDiagonal = Math.abs(deltaRow) === Math.abs(deltaCol);
		let plane = 0;
		if (isKnightMove) {
			// Calculate knight plane
			const knightMoves = [
				[2, 1], // plane 56
				[1, 2], // plane 57
				[-1, 2], // plane 58
				[-2, 1], // plane 59
				[-2, -1], // plane 60
				[-1, -2], // plane 61
				[1, -2], // plane 62
				[2, -1], // plane 63
			];

			const knightIndex = knightMoves.findIndex(
				([dr, dc]) => dr === deltaRow && dc === deltaCol,
			);

			plane = 56 + knightIndex;
		} else if (isHorizontal || isVertical || isDiagonal) {
			// we know it's a sliding move
			const distance = Math.max(Math.abs(deltaRow), Math.abs(deltaCol));
			let direction = -1;
			if (deltaRow < 0 && deltaCol === 0) {
				direction = 0; // up
			} else if (deltaRow < 0 && deltaCol > 0) {
				direction = 1; // up and right
			} else if (deltaRow === 0 && deltaCol > 0) {
				direction = 2; // right
			} else if (deltaRow > 0 && deltaCol > 0) {
				direction = 3; // right and down
			} else if (deltaRow > 0 && deltaCol === 0) {
				direction = 4; // down
			} else if (deltaRow > 0 && deltaCol < 0) {
				direction = 5; // down and left
			} else if (deltaRow === 0 && deltaCol < 0) {
				direction = 6; // left
			} else if (deltaRow < 0 && deltaCol < 0) {
				direction = 7; // left and up
			}

			plane = direction * 7 + (distance - 1);
		}
		const action = fromCol * (8 * 73) + fromRow * 73 + plane;
		// verify it's a valid action
		if (validActions.includes(action)) {
			return action;
		}
		return -1;
	}

	// Helper: Decode action number to source coordinates only
	// Based on PettingZoo chess action space: 8x8x73 flattened to 4672 actions
	// Formula from docs: (x, y, plane) = (a // (8*73), (a // 73) % 8, a % (8*73) % 73)
	// Where x = source file, y = source rank, plane = move encoding (destination)
	// TODO: Full plane decoding for destination would enable move highlighting
	function actionToSourceCoordinates(action: number): {
		row: number;
		col: number;
	} {
		const x = Math.floor(action / (8 * 73)); // source file (0-7)
		const y = Math.floor(action / 73) % 8; // source rank (0-7)
		return { row: y, col: x };
	}

	// TODO(human): Convert observation array to 2D chess board
	// The observation from the backend is a 3D array: [rows][cols][channels]
	// For chess, there are multiple channels representing different piece types
	// You'll need to decode which piece is at each square based on the channels
	// The observation is agent-relative (from current player's perspective)
	function observationToBoard(
		observation: any,
		forPlayer: string,
	): CellState[][] {
		// TODO: Implement observation decoding for chess
		// The chess observation has multiple channels (one per piece type)
		// You need to figure out which channels map to which pieces
		// Hint: The board might be flipped depending on whose turn it is
		// For now, return empty board as placeholder

		// Create an empty board to start
		const board = createEmptyBoard();

		// The channels for pieces start at 7 and end at 18
		const pieceChannelsStart = 7;
		const pieceChannelsEnd = 18;

		// Loop over the observation
		for (let i = 0; i < BOARD_SIZE; i++) {
			for (let j = 0; j < BOARD_SIZE; j++) {
				for (let k = pieceChannelsStart; k < pieceChannelsEnd + 1; k++) {
					if (observation[i][j][k] === 1) {
						board[i][j] = CHANNEL_TO_PIECE[k];
					}
				}
			}
		}
		return board;
	}

	// Start a new game
	async function handleStartGame() {
		try {
			setError(null);

			const response: StartGameResponse = await apiClient.startGame("chess");

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
					let gameWinner: string | null = null;
					if (aiResponse.reward !== 0) {
						gameWinner = "player_0"; // AI won
					}
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

	// TODO(human): Handle square click for move input
	// This function should handle the two-click move system:
	// 1. First click: Select a piece (if it's your piece)
	// 2. Second click: Move to destination (if valid)
	// You'll need to:
	// - Track which square is selected
	// - Highlight valid destination squares
	// - Convert the move to a UCI string and action number
	// - Call handleMakeMove() with the action
	async function handleSquareClick(row: number, col: number) {
		if (!sessionId || isGameOver || isAIThinking) return;

		// First click: selecting a piece
		if (!selectedSquare) {
			// Only allow selecting squares with pieces
			if (board[row][col] === null) return;

			// Only allow selecting your own pieces
			const pieceColor = board[row][col][0]; // 'w' or 'b'
			const humanPlayerId = playerOrder === "first" ? "player_0" : "player_1";
			const humanColor = humanPlayerId === "player_0" ? "w" : "b";

			if (pieceColor !== humanColor) return;

			// Select the piece
			setSelectedSquare({ row, col });

			// TODO: Highlight valid destinations for this piece
			// This requires decoding the movement plane from validActions
			// For now, we skip highlighting
		} else {
			// Second click: moving to destination

			// Check if clicking the same square (deselect)
			if (row === selectedSquare.row && col === selectedSquare.col) {
				setSelectedSquare(null);
				setHighlightedSquares([]);
				return;
			}

			const action = coordinatesToAction(
				selectedSquare.row,
				selectedSquare.col,
				row,
				col,
			);

			if (action === -1) {
				// invalid move
				setSelectedSquare(null);
				setHighlightedSquares([]);
				return;
			}

			await handleMakeMove(action);
		}
	}

	// Make a move (called by handleSquareClick after converting to action number)
	async function handleMakeMove(action: number) {
		if (!sessionId || isGameOver || isAIThinking) return;
		if (!validActions.includes(action)) return;

		try {
			setError(null);
			setSelectedSquare(null);
			setHighlightedSquares([]);

			// Make player move
			const moveResponse: MoveResponse = await apiClient.makeMove(
				sessionId,
				action,
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
				let gameWinner: string | null = null;
				if (moveResponse.reward !== 0) {
					gameWinner = playerOrder === "first" ? "player_0" : "player_1";
				}
				setWinner(gameWinner);
				if (onGameEnd && gameWinner) {
					onGameEnd(gameWinner);
				}
				return;
			}

			// Get AI response
			setIsAIThinking(true);
			await new Promise((resolve) => setTimeout(resolve, 800));
			const aiResponse: AIResponse = await apiClient.getAIMove(sessionId);
			setBoard(
				observationToBoard(aiResponse.observation, aiResponse.current_player),
			);
			setValidActions(aiResponse.valid_actions);
			setCurrentPlayer(aiResponse.current_player);

			if (aiResponse.done) {
				setIsGameOver(true);
				let gameWinner: string | null = null;
				if (aiResponse.reward !== 0) {
					gameWinner = playerOrder === "first" ? "player_1" : "player_0";
				}
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
		setSelectedSquare(null);
		setHighlightedSquares([]);
	}

	// Helper: Get square color (alternating light/dark)
	function getSquareColor(row: number, col: number): string {
		const isLight = (row + col) % 2 === 0;
		return isLight ? "bg-amber-200" : "bg-amber-700";
	}

	// Helper: Check if square is highlighted
	function isSquareHighlighted(row: number, col: number): boolean {
		return highlightedSquares.some((sq) => sq.row === row && sq.col === col);
	}

	// Helper: Check if square is selected
	function isSquareSelected(row: number, col: number): boolean {
		return selectedSquare?.row === row && selectedSquare?.col === col;
	}

	// Helper: Get friendly player name
	function getPlayerName(player: string): string {
		const humanPlayerId = playerOrder === "first" ? "player_0" : "player_1";
		return player === humanPlayerId ? "You" : "AI";
	}

	// Helper: Get player color name
	function getPlayerColorName(player: string): string {
		return player === "player_0" ? "White" : "Black";
	}

	return (
		<Card className="p-8 max-w-3xl mx-auto shadow-lg">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div>
						<h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
							Chess
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
								<SelectItem value="first">⚪ White (First)</SelectItem>
								<SelectItem value="second">⚫ Black (Second)</SelectItem>
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
														? "text-gray-800"
														: "text-gray-600"
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
												{currentPlayer === "player_0" ? "⚪" : "⚫"}
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
							Select your color and click Start Game to begin
						</p>
					</div>
				)}

				{/* Error message */}
				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				{/* Chess Board */}
				<div className="flex justify-center">
					<div className="inline-block border-4 border-gray-800 rounded-lg shadow-2xl">
						<div
							className="grid"
							style={{ gridTemplateColumns: `repeat(${BOARD_SIZE}, 1fr)` }}
						>
							{board.map((row, rowIndex) =>
								row.map((cell, colIndex) => {
									const isSelected = isSquareSelected(rowIndex, colIndex);
									const isHighlighted = isSquareHighlighted(rowIndex, colIndex);
									return (
										<button
											type="button"
											key={`${rowIndex}-${colIndex}`}
											onClick={() => handleSquareClick(rowIndex, colIndex)}
											disabled={!sessionId || isGameOver || isAIThinking}
											className={`
                        w-20 h-20 flex items-center justify-center text-5xl
                        ${getSquareColor(rowIndex, colIndex)}
                        ${isSelected ? "ring-4 ring-blue-500 ring-inset" : ""}
                        ${isHighlighted ? "ring-4 ring-green-500 ring-inset" : ""}
                        ${
													sessionId && !isGameOver && !isAIThinking
														? "hover:brightness-110 cursor-pointer active:scale-95"
														: "cursor-not-allowed"
												}
                        transition-all duration-150
                      `}
											aria-label={`Row ${rowIndex}, Column ${colIndex}`}
										>
											{cell && PIECE_SYMBOLS[cell]}
										</button>
									);
								}),
							)}
						</div>
					</div>
				</div>

				{/* Game info */}
				{sessionId && !isGameOver && (
					<div className="flex justify-center gap-6 text-sm text-muted-foreground">
						<div className="flex items-center gap-2">
							<span className="text-xl">⚪</span>
							<span>White: {playerOrder === "first" ? "You" : "AI"}</span>
						</div>
						<div className="flex items-center gap-2">
							<span className="text-xl">⚫</span>
							<span>Black: {playerOrder === "second" ? "You" : "AI"}</span>
						</div>
					</div>
				)}
			</div>
		</Card>
	);
}
