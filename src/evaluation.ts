import { randomArrayElement } from "./fp";
import { miniMax } from "./miniMax";
import {
	play,
	GetMoveFunction,
	GameState,
	heuristicScore,
	getBestMove,
} from "./othello";
import * as Stochastic from "./stochastic";

const times: Record<string, number> = {};
const started: Record<string, number | null> = {};

var now =
	typeof performance !== "undefined" && performance.now
		? function () {
				return performance.now();
			}
		: function () {
				var hr = process.hrtime();
				return hr[0] * 1e3 + hr[1] / 1e6;
			};

function start(id: string): void {
	if (started[id]) {
		throw new Error("Duplicate timer start: " + id);
	}
	started[id] = now();
	times[id] = times[id] || 0;
}

function stop(id: string): void {
	if (!started[id]) {
		throw new Error("Stopping timer that has not started: " + id);
	}
	times[id]! += now() - started[id];
	started[id] = null;
}

function log() {
	var total = times.total;
	for (var id in times) {
		var t = leftpad(Math.round(times[id]!).toString(), 6);
		var p = total
			? leftpad(((1e2 * times[id]!) / total).toFixed(2), 6) + "% "
			: "";
		console.log(t + "ms " + p + id);
	}
}

function leftpad(str: string, num: number) {
	str += "";
	while (str.length < num) str = " " + str;
	return str;
}

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
		if (!(i % 10)) {
			console.log(`matches played: ${i}/${numMatches}`);
			log();
		}

		const result = await play(async (gameState) => {
			const getMove = players[gameState.player];
			const playerName = gameState.player === 1 ? "a" : "b";
			start(playerName);
			const move = getMove(gameState);
			stop(playerName);
			return move;
		});

		if (result.winner === 1) {
			++wins;
		}
	}

	log();
	return wins / numMatches;
}

const getMoveRandom = async (gameState: GameState) => {
	if (gameState.type !== "playing") {
		throw new Error("Missing legalMoves.");
	}
	return randomArrayElement(gameState.legalMoves);
};

const getMoveMinimax2: GetMoveFunction = async (
	//
	gameState,
) => {
	return getBestMove(gameState, miniMax(2, heuristicScore));
};

async function main() {
	const winRate = await winRateOfA(async (gameState) => {
		return Stochastic.getBestMove(gameState, 30, 5);
	}, getMoveMinimax2);

	console.log("Winrate:", winRate);
}

main();
