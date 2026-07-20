import { randomArrayElement } from "./fp";
import {
	GameState,
	doMove,
	getBestScore,
	getPieceBalance,
	heuristicScore,
} from "./othello";
import { Coord } from "./coord";

export function getBestMove(
	gameState: GameState,
	// 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
	smartness: number = 4,
): Coord {
	const scoredMoves = miniMax(gameState, smartness);

	if (!gameState.legalMoves) {
		throw new Error("Missing legalMoves.");
	}

	const firstLegalMove = gameState.legalMoves[0];
	if (!firstLegalMove) {
		throw new Error("Missing firstLegalMove.");
	}

	let bestScore = -Infinity;
	let bestMoves = [firstLegalMove];

	// Keep track of all moves sharing the highest score.
	for (const scoredMove of scoredMoves) {
		if (scoredMove.score > bestScore) {
			bestScore = scoredMove.score;
			bestMoves = [scoredMove.move];
		} else if (scoredMove.score === bestScore) {
			bestMoves.push(scoredMove.move);
		}
	}

	// Randomly pick one of the highest scoring moves.
	return randomArrayElement(bestMoves);
}

export function miniMax(
	gameState: GameState,
	searchDepth: number,
): ReadonlyArray<{ readonly move: Coord; readonly score: number }> {
	if (!gameState.legalMoves) {
		throw new Error("Missing legalMoves.");
	}

	// Try the moves and score them.
	return gameState.legalMoves.map((movePosition) => {
		const newGameState = doMove(gameState, movePosition);
		const score =
			// Inverse the scoring if the move caused the player to switch.
			(newGameState.player === gameState.player ? 1 : -1) *
			evaluateBoard(newGameState, searchDepth);
		return {
			move: movePosition,
			score,
		};
	});
}

export function evaluateBoard(
	gameState: GameState,
	searchDepth: number,
): number {
	if (searchDepth <= 1) {
		// The max depth is reached. Use simple heuristics.
		return heuristicScore(gameState);
	}

	if (!gameState.legalMoves) {
		// Noone can move. Game over.

		// TODO: Make the AI prioritize the greatest win, not just any win.
		// Reward the winner.
		return Math.sign(getPieceBalance(gameState)) * Infinity;
	}

	return getBestScore(miniMax(gameState, searchDepth - 1));
}
