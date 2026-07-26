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

	const scoredMoves = miniMax(gameState, smartness);

	let bestScore = -Infinity;
	let bestMove = firstLegalMove;

	// Keep track of all moves sharing the highest score.
	for (const scoredMove of scoredMoves.map(({ move, score }) => ({
		move,
		// Randomly pick one of the highest scoring moves.
		score: score + Math.random() * 0.01,
	}))) {
		if (scoredMove.score > bestScore) {
			bestScore = scoredMove.score;
			bestMove = scoredMove.move;
		}
	}

	return bestMove;
}

export function miniMax(
	gameState: GameStatePlaying,
	searchDepth: number,
): ReadonlyArray<{ readonly move: Coord; readonly score: number }> {
	// Try the moves and score them.
	return gameState.legalMoves.map((move) => {
		const newGameState = doMove(gameState, move);
		const score =
			// Inverse the scoring if the move caused the player to switch.
			(newGameState.player === gameState.player ? 1 : -1) *
			evaluateBoard(newGameState, searchDepth);
		return {
			move,
			score,
		};
	});
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

	const scoredMoves = miniMax(gameState, searchDepth - 1);

	return Math.max(...scoredMoves.map((scoredMove) => scoredMove.score));
}
