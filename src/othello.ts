type Board = ReadonlyArray<number>;

// list-format:
//  every list is a number[64] where the first element tells how long the list is.
//  for example, the first list generated will be: {4, 19, 29, 34, 44, ... }, where the rest of the list is irrelevant.

// player-format & the heuristicScores-values:
//  the number's named player can only be 1 or -1. to switch player I use a unary minus.
//  the heuristicScores-values describes how valuable the pieces on theese positions are.
//  you might want to change theese to tweak the aI.

// definies the "smartness" of the aI. 0 = easy, 1 = normal, 3 = hard, 4 = very hard.
const smartness = 4;

// defining the heuristic score for each square.
const heuristicScores = [
	...[8, -4, 6, 4, 4, 6, -4, 8],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[4, 0, 2, 1, 1, 2, 0, 4],
	...[6, 0, 2, 2, 2, 2, 0, 6],
	...[-4, -4, 0, 0, 0, 0, -4, -4],
	...[8, -4, 6, 4, 4, 6, -4, 8],
];

// defining offsets for the 8 directions. upp-left, upp, upp-right, ..., down-right. the order doesn't really matter.
const offSets = [-9, -8, -7, -1, 1, 7, 8, 9];

function getLegalMoves(board: Board, player: number): number[] {
	// loop through all squares to find legal moves and add them to the list.
	const legalMoves = [];
	for (let i = 0; i <= 63; i++) {
		if (moveIsLegal(i, board, player)) {
			legalMoves.push(i);
		}
	}

	return legalMoves;
}

function moveIsLegal(position: number, board: Board, player: number): boolean {
	if (board[position]) return false; // we may only put pieces in empty squares.

	for (let direction = 0; direction < 8; direction++) {
		// test every direction.
		if (!stepIsLegal(position, offSets[direction])) continue; // skip this direction if one may not step there.
		let currentPosition = position + offSets[direction]; // start steping one square from position.
		let stepsMoved = 0;

		while (
			board[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSets[direction])
		) {
			// take a step in direction as long as it is legal (we may not step out of the board) and the pices belongs to opponent (-player).
			currentPosition += offSets[direction]; // step to the next square in direction.
			stepsMoved++;
		}
		if (stepsMoved > 0 && board[currentPosition] == player) return true; // if this is true, we have found a comlete row.
	}

	return false; // if no legal move is found in either direction, this move is illegal.
}

function stepIsLegal(position: number, offSet: number): boolean {
	// take care of left, ...
	if (position % 8 == 0 && (offSet == -9 || offSet == -1 || offSet == 7))
		return false;
	// ... right, ...
	if (position % 8 == 7 && (offSet == -7 || offSet == 1 || offSet == 9))
		return false;
	// ... upper, ...
	if (Math.floor(position / 8) == 0 && offSet < 0 && offSet != -1) return false;
	// ... and lower edge.
	if (Math.floor(position / 8) == 7 && offSet > 0 && offSet != 1) return false;

	// the step is not illegal, return true.
	return true;
}

function getBestMove(board: Board, player: number): number {
	const legalMoves = getLegalMoves(board, player);

	let score = -Infinity;
	let bestScore = -Infinity;
	let bestMove = legalMoves[0];

	for (const legalMove of legalMoves) {
		const newBoard = move(legalMove, board, player);

		score = -miniMax(newBoard, -player, smartness);

		if (score > bestScore) {
			bestScore = score;
			bestMove = legalMove;
		}
	}

	return bestMove;
}

function miniMax(board: Board, player: number, searchDepth: number): number {
	// check for game over.
	const moveListPlayer = getLegalMoves(board, player);
	const moveListOpponent = getLegalMoves(board, -player);
	if (!moveListPlayer.length && !moveListOpponent.length) {
		// count the pieces.
		let playerCount = 0;
		let opponentCount = 0;
		for (const piece of board) {
			if (piece == player) {
				playerCount++;
			} else if (piece == -player) {
				opponentCount++;
			}
		}
		// reward the winner.
		if (playerCount > opponentCount) {
			return Infinity;
		} else if (playerCount < opponentCount) {
			return -Infinity;
		} else {
			return 0;
		}
	}

	// switch player if player has no moves.
	if (!moveListPlayer.length) {
		return miniMax(board, -player, searchDepth);
	}

	// try the moves and return the best score.
	let bestScore = -Infinity;
	for (const movePosition of moveListPlayer) {
		const newBoard = move(movePosition, board, player);

		const score =
			searchDepth > 0
				? -miniMax(newBoard, -player, searchDepth - 1)
				: heuristicScore(newBoard, player) +
				  moveListPlayer.length -
				  moveListOpponent.length;

		if (score > bestScore) {
			bestScore = score;
		}
	}

	return bestScore;
}

function heuristicScore(board: Board, player: number): number {
	let score = 0;

	// reward the player if he has more (weighted) pieces than the opponent.
	for (let i = 0; i < 64; ++i) {
		score += heuristicScores[i] * player * board[i];
	}

	return score;
}

// make shure you mAY move before you call this function.
function move(position: number, board: Board, player: number): Board {
	const newBoard = [...board];
	newBoard[position] = player;

	for (const offSet of offSets) {
		if (!stepIsLegal(position, offSet)) {
			// skip this direction if one may not step there.
			continue;
		}
		let currentPosition = position + offSet; // start steping one square from position.
		let stepsMoved = 0;

		while (
			newBoard[currentPosition] == -player &&
			stepIsLegal(currentPosition, offSet)
		) {
			currentPosition += offSet;
			stepsMoved++;
		}
		// if we found a row:
		if (stepsMoved > 0 && newBoard[currentPosition] == player) {
			// flip
			for (; stepsMoved > 0; stepsMoved--) {
				currentPosition -= offSet;
				newBoard[currentPosition] = player;
			}
		}
	}

	return newBoard;
}

// text-mode interface. sucks but works.

// function  printMoves( moves: number[]): void{
//   console.log("%i legal moves: ", moves[0]);
//   for(let i=1; i<=moves[0]; i++){
//     console.log(i+", ", moves[i]);}
//   console.log("\n");
// }

function printBoard(
	board: Board,
	markedPosition: number,
	player: number,
): void {
	const xpos = markedPosition % 8;
	const ypos = Math.floor(markedPosition / 8);

	console.log("xpos", xpos);
	console.log("ypos", ypos);

	let pl1count = 0;
	let pl2count = 0;

	for (let i = 0; i < 64; i++)
		if (board[i] == 1) {
			pl1count++;
		} else if (board[i] == -1) {
			pl2count++;
		}

	console.log("\n  player: " + (player == 1 ? "X" : "O"));
	console.log("   X:" + pl1count + " O:" + pl2count);
	console.log("  +-+-+-+-+-+-+-+-+");
	for (let y = 0; y < 8; y++) {
		let row = "  |";
		for (let x = 0; x < 8; x++) {
			if (board[x + y * 8] == 1) row += "X|";
			else if (board[x + y * 8] == -1) row += "O|";
			else row += " |";
		}
		if (y == ypos) row += " <-";
		console.log(row);
		console.log("  +-+-+-+-+-+-+-+-+");
	}

	let row = "";
	for (let x = 0; x <= xpos; x++) {
		row += "  ";
	}
	row += " ^";
	console.log(row);
	row = "";
	for (let x = 0; x <= xpos; x++) {
		row += "  ";
	}
	row += " |";
	console.log(row);
}

// let the user pick a move. returns -1 if he/she wants to quit.
async function getUserMove(
	board: Board,
	player: number,
	markedPosition: number,
): Promise<number> {
	printBoard(board, markedPosition, player);

	var stdin = process.stdin;
	if (!stdin.setRawMode) {
		throw new Error("Needs tty/raw mode.");
	}
	stdin.setRawMode(true);
	stdin.resume();
	stdin.setEncoding("utf8");

	return new Promise(resolve => {
		stdin.on("data", function(buffer) {
			const key = buffer.toString();

			// ctrl-c ( end of text )
			if (key === "\u0003") {
				process.exit();
			}

			if (key == "a" && stepIsLegal(markedPosition, -1)) {
				markedPosition -= 1;
			} else if (key == "d" && stepIsLegal(markedPosition, +1)) {
				markedPosition += 1;
			} else if (key == "w" && stepIsLegal(markedPosition, -8)) {
				markedPosition -= 8;
			} else if (key == "s" && stepIsLegal(markedPosition, +8)) {
				markedPosition += 8;
			}

			printBoard(board, markedPosition, player);

			if (key === " ") {
				resolve(markedPosition);
			}
		});
	});
}

async function main(): Promise<void> {
	let player = 1;
	let markedPosition = 0;
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

	const moveList = getLegalMoves(board, player);
	markedPosition = moveList[0];

	for (;;) {
		const moveList = getLegalMoves(board, player);
		if (moveList.length) {
			if (player == 1) {
				// user input.
				//        markedPosition = getBestMove(board, player);
				//        markedPosition = moveList[1];
				const userMove = await getUserMove(board, player, markedPosition);

				console.log("moveIsLegal", moveIsLegal(userMove, board, player));

				if (moveIsLegal(userMove, board, player)) {
					board = move(userMove, board, player);
					printBoard(board, userMove, player);
					player = -player;
				}
			} else {
				// AI
				markedPosition = getBestMove(board, player);
				board = move(markedPosition, board, player);
				player = -player;
			}
		} else {
			player = -player;
			const moveList = getLegalMoves(board, player);
			if (!moveList.length) {
				printBoard(board, markedPosition, player);
				console.log("  game over\n\n");
				break;
			}
		}
	}
}

main();
