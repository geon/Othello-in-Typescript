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
		(move) => ({ move, score: Infinity }) satisfies ScoredMove,
	);

	// Update the esimates pessimistically. Pick the best estimate and see if it can be lowered. The final highest score at least might be winnable.
	for (let i = 0; i < breadth; ++i) {
		const bestScoredMove = minBy(
			scoredMoves,
			(scoredMove) => -scoredMove.score,
		)!;

		bestScoredMove.score = Math.min(
			bestScoredMove.score,
			evaluateMove(gameState, bestScoredMove.move, sampleStochastic(depth)),
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
