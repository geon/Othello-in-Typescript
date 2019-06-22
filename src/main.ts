import {
	getBestMove,
	Board,
	play,
	Coord,
	coordsAreEqual,
	coordToIndex,
	GetMoveFunction,
} from "./othello";
import * as tf from "@tensorflow/tfjs";

function printBoard(
	board: Board,
	markedPosition: Coord | undefined,
	player: number,
	legalMoves?: ReadonlyArray<Coord>,
): Promise<Coord> {
	let onClick!: (pos: Coord) => void;
	const click = new Promise<Coord>(resolve => (onClick = resolve));

	let pl1count = 0;
	let pl2count = 0;
	for (let i = 0; i < 64; i++)
		if (board[i] === 1) {
			pl1count++;
		} else if (board[i] === -1) {
			pl2count++;
		}

	const status = document.createElement("p");
	status.innerText = `black: ${pl1count}, white: ${pl2count}, player: ${
		player === 1 ? "black" : "white"
	}`;

	const tbody = document.createElement("table");
	for (let y = 0; y < 8; y++) {
		const tr = document.createElement("tr");
		for (let x = 0; x < 8; x++) {
			const moveCoord = { x, y };

			const button = document.createElement("button");
			legalMoves &&
				legalMoves.some(legalMove => coordsAreEqual(legalMove, moveCoord)) &&
				button.addEventListener("click", () => onClick(moveCoord));

			button.style.width = "2em";
			button.style.height = "2em";
			if (
				markedPosition &&
				(y === markedPosition.y && x === markedPosition.x)
			) {
				button.innerText = "X";
			}

			if (board[coordToIndex(moveCoord)] === 1) {
				button.style.backgroundColor = "black";
			} else if (board[coordToIndex(moveCoord)] === -1) {
				button.style.backgroundColor = "white";
			} else {
				button.style.backgroundColor = "#292";
			}

			const td = document.createElement("td");
			td.appendChild(button);
			tr.appendChild(td);
		}
		tbody.appendChild(tr);
	}

	const root = document.getElementById("root")!;
	for (const child of Array.from(root.childNodes)) {
		root.removeChild(child);
	}
	const table = document.createElement("table");
	table.appendChild(tbody);
	root.appendChild(status);
	root.appendChild(table);

	return click;
}

// User.
const getMoveUser: GetMoveFunction = async (board, player, legalMoves) => {
	return printBoard(board, undefined, player, legalMoves);
};

// AI
const getMoveMinimax: GetMoveFunction = async (board, player, legalMoves) => {
	const aiMove = getBestMove(board, player, legalMoves);
	printBoard(board, aiMove, player);
	await new Promise(res => setTimeout(res, 200));
	return aiMove;
};

function makeGetMoveNeuralNet(model: tf.LayersModel): GetMoveFunction {
	return async (board, player, legalMoves) => {
		if (player === 1) {
			// User.
			return printBoard(board, undefined, player, legalMoves);
		} else {
			// AI
			const scores = await (model.predict(
				tf.tensor([board.map(cell => cell * player)], [1, 64]),
			) as tf.Tensor).dataSync();

			let move = legalMoves[0];
			let score = -Infinity;
			for (const currentMove of legalMoves) {
				const index = coordToIndex(currentMove);
				const currentScore = scores[index];
				if (currentScore > score) {
					score = currentScore;
					move = currentMove;
				}
			}

			printBoard(board, move, player);
			await new Promise(res => setTimeout(res, 200));
			return move;
		}
	};
}

async function main(): Promise<void> {
	const getMoveNeuralNet1Hidden = makeGetMoveNeuralNet(
		await tf.loadLayersModel("http://localhost:8080/1-hidden/model.json"),
	);

	const players = {
		getMoveUser,
		getMoveMinimax,
		getMoveNeuralNet1Hidden,
	};

	const competitors = {
		"1": players.getMoveUser,
		"-1": players.getMoveNeuralNet1Hidden,
	};

	const result = await play(async (board, player, legalMoves) => {
		return competitors[player](board, player, legalMoves);
	});

	printBoard(result.board, undefined, result.winner || 0);
	await new Promise(res => setTimeout(res, 1000));

	alert("Game over.");
}

main();
