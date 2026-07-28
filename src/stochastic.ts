import { Coord } from "./coord";
import { minBy, randomArrayElement } from "./fp";
import {
	heuristicScore,
	GameStatePlaying,
	evaluateMove,
	GameState,
	EvaluateBoard,
} from "./othello";

export function getBestMove(
	gameState: GameStatePlaying,
	// 10 = easy, 100000 = hard.
	breadth: number,
	depth: number,
): Coord {
	// Start with all moves estimated as equal.
	const scoredMoves = gameState.legalMoves.map(
		(move) => ({ move, score: 1000000, numSamples: 0 }) satisfies ScoredMove,
	);

	// Update the esimates pessimistically. Pick the best estimate and see if it can be lowered. The final highest score at least might be winnable.
	let bestScoredMove = scoredMoves[0]!;
	for (let i = 0; i < breadth; ++i) {
		const lastBestScore = bestScoredMove.score;

		bestScoredMove.score =
			(bestScoredMove.score * bestScoredMove.numSamples++ +
				evaluateMove(gameState, bestScoredMove.move, sampleStochastic(depth))) /
			bestScoredMove.numSamples;

		if (bestScoredMove.score < lastBestScore) {
			bestScoredMove = minBy(scoredMoves, (scoredMove) => -scoredMove.score)!;
		}
	}

	// Randomly pick one of the highest scoring moves.
	return minBy(scoredMoves, ({ score }) => -(score + Math.random() * 0.01))!
		.move;
}

type ScoredMove = {
	readonly move: Coord;
	readonly score: number;
	readonly numSamples: number;
};

function sampleStochastic(searchDepth: number): EvaluateBoard {
	return (gameState: GameState): number => {
		return searchDepth <= 0 || gameState.type === "game-over"
			? heuristicScore(gameState)
			: evaluateMove(
					gameState,
					randomArrayElement(gameState.legalMoves),
					sampleStochastic(searchDepth - 1),
				);
	};
}
