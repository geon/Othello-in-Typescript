import * as tf from "@tensorflow/tfjs";
import { checkedAccess } from "./checked-access";
import { GetMoveFunction } from "./othello";
import { coordToIndex } from "./coord";

export function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
	return async ({ board, player, legalMoves }) => {
		const scores = await (
			model.predict(
				tf.tensor([board.map((cell) => cell * player)], [1, 64]),
			) as tf.Tensor
		).dataSync();

		let move = checkedAccess(legalMoves, 0);
		let score = -Infinity;
		for (const currentMove of legalMoves) {
			const index = coordToIndex(currentMove);
			const currentScore = checkedAccess(scores, index);
			if (currentScore > score) {
				score = currentScore;
				move = currentMove;
			}
		}

		return move;
	};
}
