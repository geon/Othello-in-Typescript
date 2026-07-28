import { avg } from "./fp";
import {
	//
	EvaluateBoard,
	evaluateMove,
} from "./othello";

export function miniMax(
	searchDepth: number,
	evaluateBoard: EvaluateBoard,
): EvaluateBoard {
	return (gameState) => {
		if (searchDepth <= 1 || gameState.type === "game-over") {
			// The max depth is reached. Use simple heuristics.
			return evaluateBoard(gameState);
		}

		return avg(
			gameState.legalMoves.map((move) =>
				evaluateMove(gameState, move, miniMax(searchDepth - 1, evaluateBoard)),
			),
		);
	};
}
