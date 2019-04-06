import {
	moveIsLegal,
	getLegalMoves,
	getBestMove,
	move,
	Board,
	startBoard,
	play,
	Coord,
	coordsAreEqual,
	coordToIndex,
} from "./othello";

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
		if (board[i] == 1) {
			pl1count++;
		} else if (board[i] == -1) {
			pl2count++;
		}

	const status = document.createElement("p");
	status.innerText =
		"black: " +
		pl1count +
		", white: " +
		pl2count +
		", player: " +
		(player == 1 ? "black" : "white");

	const tbody = document.createElement("table");
	for (let y = 0; y < 8; y++) {
		const tr = document.createElement("tr");
		for (let x = 0; x < 8; x++) {
			const move = { x, y };

			const button = document.createElement("button");
			legalMoves &&
				legalMoves.some(legalMove => coordsAreEqual(legalMove, move)) &&
				button.addEventListener("click", () => onClick(move));

			button.style.width = "2em";
			button.style.height = "2em";
			if (markedPosition && (y == markedPosition.y && x == markedPosition.x)) {
				button.innerText = "X";
			}

			if (board[coordToIndex(move)] == 1) {
				button.style.backgroundColor = "black";
			} else if (board[coordToIndex(move)] == -1) {
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

async function main(): Promise<void> {
	const result = await play(async (board, player, moveList) => {
		if (player === 1) {
			// User.
			return printBoard(board, undefined, player, moveList);
		} else {
			// AI
			const aiMove = getBestMove(board, player, moveList);
			printBoard(board, aiMove, player);
			await new Promise(res => setTimeout(res, 200));
			return aiMove;
		}
	});

	printBoard(result.board, undefined, result.winner || 0);
	await new Promise(res => setTimeout(res, 1000));

	alert("Game over.");
}

main();
