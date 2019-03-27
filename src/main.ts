import {
	moveIsLegal,
	getLegalMoves,
	getBestMove,
	move,
	Board,
} from "./othello";

function printBoard(
	board: Board,
	markedPosition: number,
	player: number,
	userClickResolver?: (move: number) => void,
): void {
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
			const button = document.createElement("button");
			userClickResolver &&
				button.addEventListener("click", () => userClickResolver(x + y * 8));

			button.style.width = "2em";
			button.style.height = "2em";
			if (y == ypos && x == xpos) {
				button.innerText = "X";
			}

			if (board[x + y * 8] == 1) {
				button.style.backgroundColor = "black";
			} else if (board[x + y * 8] == -1) {
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
}

async function main(): Promise<void> {
	let player = 1;
	let board: Board = [
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, -1, 1, 0, 0, 0],
		...[0, 0, 0, 1, -1, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
	];

	let userClickResolver!: (move: number) => void;
	let userClick = new Promise<number>(resolve => (userClickResolver = resolve));
	printBoard(board, -1, player, userClickResolver);

	for (;;) {
		const moveList = getLegalMoves(board, player);
		if (moveList.length) {
			if (player == 1) {
				const userMove = await userClick;

				if (moveIsLegal(userMove, board, player)) {
					board = move(userMove, board, player);
					player = -player;
					printBoard(board, userMove, player);
					// Let the printed board render.
					await new Promise(resolve => setTimeout(resolve, 200));
				} else {
					userClick = new Promise(resolve => (userClickResolver = resolve));
					printBoard(board, -1, player, userClickResolver);
				}
			} else {
				// AI
				const aiMove = getBestMove(board, player);
				board = move(aiMove, board, player);
				userClick = new Promise(resolve => (userClickResolver = resolve));
				player = -player;
				printBoard(board, aiMove, player, userClickResolver);
			}
		} else {
			player = -player;
			const moveList = getLegalMoves(board, player);
			if (!moveList.length) {
				printBoard(board, -1, player);
				alert("game over");
				break;
			}
		}
	}
}

main();
