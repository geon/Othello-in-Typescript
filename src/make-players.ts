import * as tf from "@tensorflow/tfjs";
import { checkedAccess } from "./checked-access";
import { GetMoveFunction } from "./othello";
import { coordToIndex } from "./coord";

function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
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

export async function makeGetMoveNeuralNet1Hidden() {
	const getMoveNeuralNet1Hidden = makeGetMoveNeuralNet(
		await tf.loadLayersModel("file://./models/1-hidden/model.json"),
	);

	return getMoveNeuralNet1Hidden;
}

export async function makeGetMoveNeuralNet8Hidden() {
	const getMoveNeuralNet8Hidden = makeGetMoveNeuralNet(
		await tf.loadLayersModel("file://./models/8-hidden/model.json"),
	);

	return getMoveNeuralNet8Hidden;
}
