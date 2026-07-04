import { expect, suite, test } from "vitest";
import {
	allCellPairs,
	foldAll,
	foldCellPair,
	foldVertically,
	unfoldAll,
	unfoldCellPair,
	unfoldVertically,
} from "./folding";
import { Board } from "./othello";

suite("folding", () => {
	suite("cell pair", () => {
		for (const cellPair of allCellPairs) {
			test(JSON.stringify(cellPair), () => {
				expect(unfoldCellPair(foldCellPair(cellPair))).toStrictEqual(cellPair);
			});
		}
	});
});

const board: Board = [
	...[0, 0, 0, 0, 0, 0, 0, 0],
	...[1, 1, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, 1, 1],
	...[-1, -1, 0, 0, 0, 0, 0, 0],
	...[0, 0, 0, 0, 0, 0, -1, -1],
	...[1, 1, 0, 0, 0, 0, 1, 1],
	...[-1, -1, 0, 0, 0, 0, -1, -1],
	...[1, 1, 0, 0, 0, 0, -1, -1],
] as const;

suite("foldVertically", () => {
	test("identity", () => {
		expect(unfoldVertically(foldVertically(board))).toStrictEqual(board);
	});
});

suite("foldAll", () => {
	test("identity", () => {
		expect(unfoldAll(foldAll(board))).toStrictEqual(board);
	});
});
