import { minBy } from "./fp";
import {
	GameStatePlaying,
	doMove,
	getPieceBalance,
	heuristicScore,
} from "./othello";
import { Coord } from "./coord";

export function getBestMove(
	gameState: GameStatePlaying,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	smartness: number = 4,
): Coord {
	const firstLegalMove = gameState.legalMoves[0];
	if (!firstLegalMove) {
		throw new Error("Missing firstLegalMove.");
	}

	// Randomly pick one of the highest scoring moves.
	return minBy(
		gameState.legalMoves,
		(move) =>
			-(
				evaluateMove(gameState, move, (gameState) =>
					evaluateBoard(gameState, smartness),
				) +
				Math.random() * 0.01
			),
	)!;
}

export function miniMax(
	gameState: GameStatePlaying,
	searchDepth: number,
): number {
	// Try the moves and score them.
	return Math.max(
		...gameState.legalMoves.map((move) =>
			evaluateMove(gameState, move, (gameState) =>
				evaluateBoard(gameState, searchDepth),
			),
		),
	);
}

type EvaluateBoard = (gameState: GameStatePlaying) => number;

function evaluateMove(
	gameState: GameStatePlaying,
	move: Coord,
	evaluateBoard: EvaluateBoard,
): number {
	const newGameState = doMove(gameState, move);
	const score =
		newGameState.type === "game-over"
			? // TODO: Make the AI prioritize the greatest win, not just any win.
				Math.sign(getPieceBalance(gameState)) * Infinity
			: evaluateBoard(newGameState);

	// Inverse the scoring if the move caused the player to switch.
	return (newGameState.player === gameState.player ? 1 : -1) * score;
}

export function evaluateBoard(
	gameState: GameStatePlaying,
	searchDepth: number,
): number {
	if (searchDepth <= 1) {
		// The max depth is reached. Use simple heuristics.
		return heuristicScore(gameState);
	}

	return miniMax(gameState, searchDepth - 1);
}
