import { minBy } from "./fp";
import {
	GameState,
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
	return minBy(gameState.legalMoves, (move) => {
		const score = evaluateMove(gameState, move, smartness);
		return -(score + Math.random() * 0.01);
	})!;
}

export function miniMax(
	gameState: GameStatePlaying,
	searchDepth: number,
): number {
	// Try the moves and score them.
	return Math.max(
		...gameState.legalMoves.map((move) => {
			const score = evaluateMove(gameState, move, searchDepth);
			return score;
		}),
	);
}

function evaluateMove(
	gameState: GameStatePlaying,
	move: Coord,
	searchDepth: number,
): number {
	const newGameState = doMove(gameState, move);
	// Inverse the scoring if the move caused the player to switch.
	return (
		(newGameState.player === gameState.player ? 1 : -1) *
		evaluateBoard(newGameState, searchDepth)
	);
}

export function evaluateBoard(
	gameState: GameState,
	searchDepth: number,
): number {
	if (gameState.type === "game-over") {
		// Noone can move. Game over.

		// TODO: Make the AI prioritize the greatest win, not just any win.
		// Reward the winner.
		return Math.sign(getPieceBalance(gameState)) * Infinity;
	}

	if (searchDepth <= 1) {
		// The max depth is reached. Use simple heuristics.
		return heuristicScore(gameState);
	}

	return miniMax(gameState, searchDepth - 1);
}
