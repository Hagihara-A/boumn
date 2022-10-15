import mm from "micromatch";
import { describe, expect, test } from "vitest";

import {
  defaultIncludeFiles,
  enumDependentPkgs,
  eqPkg,
  PackageData,
} from "./getWsInfo";
import { AbsPath } from "./path";

describe(`${enumDependentPkgs.name}`, () => {
  test("Can enum when cyclic dependency", () => {
    const path = AbsPath("dummy");
    const files = [];
    const makePkg = (name: string, localDepName: string[]): PackageData => ({
      path,
      name,
      localDepName: new Set(localDepName),
      files,
    });
    const names = {
      A: "A",
      B: "B",
      C: "C",
      D: "D",
      E: "E",
      F: "F",
    } as const;
    const A = makePkg(names.A, [names.B, names.C]);
    const B = makePkg(names.B, [names.D, names.E]);
    const C = makePkg(names.C, [names.F]);
    const D = makePkg(names.D, [names.F]);
    const E = makePkg(names.E, [names.D]);
    const F = makePkg(names.F, [names.E]);

    const X = makePkg("X", ["Y"]);
    const Y = makePkg("Y", ["Z"]);
    const Z = makePkg("Z", ["X"]);

    const actual = enumDependentPkgs(eqPkg)([B, C, D, E, F, X, Y, Z])(A);
    const expected = [B, C, D, E, F];

    expect(actual).toEqual(expected);
  });
});

describe("defaultIncludeFiles", () => {
  test("README matches", () => {
    const fname = "README";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("ReadMe matches", () => {
    const fname = "ReadMe";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("ReadMe.md matches", () => {
    const fname = "ReadMe.md";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("READM doesnt match", () => {
    const fname = "READM";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeFalsy();
  });

  test("LICENSE matches", () => {
    const fname = "LICENSE";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("LICENSE.txt matches", () => {
    const fname = "LICENSE.txt";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("LICENCE matches", () => {
    const fname = "LICENCE";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("LISENCE doesnt match", () => {
    const fname = "LISENCE";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeFalsy();
  });

  test("package.json matches", () => {
    const fname = "package.json";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeTruthy();
  });

  test("package.yaml doesnt match", () => {
    const fname = "package.yaml";
    const isMatch = mm.isMatch(fname, defaultIncludeFiles);
    expect(isMatch).toBeFalsy();
  });
});
