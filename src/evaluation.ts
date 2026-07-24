import { play, GetMoveFunction, heuristicScore, getBestMove } from "./othello";
import { miniMax } from "./miniMax";
import { randomArrayElement } from "./fp";
import { models } from "./models";
import { getTfModel } from "./models-node";
import { makeGetMoveNeuralNet } from "./make-players";

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

const getMoveRandom: GetMoveFunction = async ({ legalMoves }) => {
	return randomArrayElement(legalMoves);
};

const getMoveMinimax2: GetMoveFunction = async (gameState) => {
	return getBestMove(gameState, miniMax(2, heuristicScore));
};

const getMoveMinimax3: GetMoveFunction = async (gameState) => {
	return getBestMove(gameState, miniMax(3, heuristicScore));
};

async function main() {
	const players = {
		getMoveMinimax2,
		getMoveMinimax3,
		getMoveRandom,
		getMoveNeuralNet1Hidden: makeGetMoveNeuralNet(
			await getTfModel(models._1_hidden),
		),
		getMoveNeuralNet8Hidden: makeGetMoveNeuralNet(
			await getTfModel(models._8_hidden),
		),
	};

	const winRate = await winRateOfA(
		players.getMoveNeuralNet8Hidden,
		players.getMoveRandom,
	);

	console.log("Winrate:", winRate);
}

main();
