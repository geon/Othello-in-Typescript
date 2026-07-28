import { Coord } from "./coord";
import { minBy, randomArrayElement } from "./fp";
import {
	heuristicScore,
	GameStatePlaying,
	evaluateMove,
	GameState,
} from "./othello";

export function getBestMove(
	gameState: GameStatePlaying,
	// 10 = easy, 100000 = hard.
	smartness: number,
): Coord {
	// Start with all moves estimated as equal.
	const scoredMoves = gameState.legalMoves.map(
		(move) => ({ move, score: Infinity }) satisfies ScoredMove,
	);

	// Update the esimates pessimistically. Pick the best estimate and see if it can be lowered. The final highest score at least might be winnable.
	for (let i = 0; i < smartness; ++i) {
		const bestScoredMove = minBy(
			scoredMoves,
			(scoredMove) => -scoredMove.score,
		)!;

		bestScoredMove.score = Math.min(
			bestScoredMove.score,
			evaluateMove(gameState, bestScoredMove.move, sampleStochastic),
		);
	}

	// Randomly pick one of the highest scoring moves.
	return minBy(scoredMoves, ({ score }) => -(score + Math.random() * 0.01))!
		.move;
}

type ScoredMove = {
	readonly move: Coord;
	readonly score: number;
};

function sampleStochastic(gameState: GameState): number {
	return gameState.type === "game-over"
		? heuristicScore(gameState)
		: evaluateMove(
				gameState,
				randomArrayElement(gameState.legalMoves),
				sampleStochastic,
			);
}
