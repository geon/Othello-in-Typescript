import {
	moveIsLegal,
	getLegalMoves,
	getBestMove,
	move,
	Board,
	startBoard,
} from "./othello";

function printBoard(
	board: Board,
	markedPosition: number,
	player: number,
	legalMoves?: ReadonlyArray<number>,
): Promise<number> {
	let onClick!: (pos: number) => void;
	const click = new Promise<number>(resolve => (onClick = resolve));

	const xpos = markedPosition % 8;
	const ypos = Math.floor(markedPosition / 8);

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
			const move = x + y * 8;

			const button = document.createElement("button");
			legalMoves &&
				legalMoves.includes(move) &&
				button.addEventListener("click", () => onClick(move));

			button.style.width = "2em";
			button.style.height = "2em";
			if (y == ypos && x == xpos) {
				button.innerText = "X";
			}

			if (board[move] == 1) {
				button.style.backgroundColor = "black";
			} else if (board[move] == -1) {
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
	let player = 1;
	let board = startBoard;

	for (;;) {
		let moveList = getLegalMoves(board, player);

		// If no legal moves, switch player.
		if (!moveList) {
			player = -player;
			moveList = getLegalMoves(board, player);

			// If none of the players have lagal moves, game over.
			if (!moveList) {
				break;
			}
		}

		// Pick a move.
		let movePosition =
			player == 1
				? // User.
				  await printBoard(board, -1, player, moveList)
				: // AI
				  getBestMove(board, player, moveList);

		// Make the move.
		board = move(movePosition!, board, player);
		printBoard(board, movePosition, player);
		// Let the printed board render.
		await new Promise(res => setTimeout(res, 200));

		// Switch player.
		player = -player;
		moveList = getLegalMoves(board, player);
	}

	alert("Game over.");
}

main();
