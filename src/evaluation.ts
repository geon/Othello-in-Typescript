import { play, GetMoveFunction } from "./othello";
import { models } from "./models";
import { getTfModel } from "./models-node";
import {
	getMoveMinimax1,
	getMoveMinimax2,
	getMoveMinimax3,
	getMoveRandom,
	makeGetMoveNeuralNet,
} from "./make-players";

async function winRateOfA(
	a: GetMoveFunction,
	b: GetMoveFunction,
): Promise<number> {
	const players = {
		"1": a,
		"-1": b,
	};
	const numMatches = 1000;
	let wins = 0;
	for (let i = 0; i < numMatches; ++i) {
		const result = await play(async (gameState) => {
			const getMove = players[gameState.player];
			return getMove(gameState);
		});

		if (result.winner === 1) {
			++wins;
		}
	}

	return wins / numMatches;
}

async function main() {
	const players = {
		getMoveMinimax1,
		getMoveMinimax2,
		getMoveMinimax3,
		getMoveRandom,
		getMoveNeuralNet1Hidden: makeGetMoveNeuralNet(
			await getTfModel(models._1_hidden),
		),
		getMoveNeuralNet8Hidden: makeGetMoveNeuralNet(
			await getTfModel(models._8_hidden),
		),
		getMoveNeuralNet64Hidden: makeGetMoveNeuralNet(
			await getTfModel(models._64_hidden),
		),
	};

	const winRate = await winRateOfA(
		players.getMoveNeuralNet64Hidden,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
