import { Board, Cell, coordToIndex, indexToCoord } from "./othello";

export function foldVertically(board: Board): Board {
	const folded: Cell[] = [
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
		...[0, 0, 0, 0, 0, 0, 0, 0],
	] as const;

	for (let index = 0; index < 64; ++index) {
		const coord = indexToCoord(index);
		folded[index] = board[coordToIndex(coord)]!;
	}

	return folded;
}
