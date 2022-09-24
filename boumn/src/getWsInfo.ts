import * as pathM from "path";

import { ARR, FN, ORD, REC, SET, STR, TE } from "./fp.js";
import { glob, readManifest, readPnpmWsYaml } from "./fs/fs.js";
import { AppTaskEither } from "./index.js";
import { RawManifest } from "./parser/main.js";
import { AbsPath, concatPath, manifestFileName, parentDir } from "./path.js";

export const getYarnWsGlob = (wsRootDir: AbsPath): AppTaskEither<WsGlob> =>
  FN.pipe(
    TE.Do,
    TE.bind("yarnWsRootManifest", () => readManifest(wsRootDir)),
    TE.map(
      ({ yarnWsRootManifest }) => new Set(yarnWsRootManifest.workspaces ?? [])
    )
  );

export const getPnpmWsGlob = (wsRootDir: AbsPath): AppTaskEither<WsGlob> =>
  FN.pipe(
    TE.Do,
    TE.bind("pnpmWsYaml", () =>
      readPnpmWsYaml(concatPath(wsRootDir, "pnpm-workspace.yaml"))
    ),
    TE.map(({ pnpmWsYaml }) => new Set(pnpmWsYaml.packages ?? []))
  );

export const enumDependentPkgs =
  (ord: ORD.Ord<PackageData>) =>
  (candidates: Set<PackageData>) =>
  (root: PackageData): Set<PackageData> => {
    const directDeps = SET.filter((pkg: PackageData) =>
      root.localDepName.has(pkg.name)
    )(candidates);

    if (SET.isEmpty(directDeps)) {
      return SET.empty;
    }
    const leftCandidates = SET.difference(ord)(directDeps)(candidates);

    const indirectDeps = SET.reduce(ord)(
      SET.empty,
      (acc: Set<PackageData>, a) =>
        SET.union(ord)(enumDependentPkgs(ord)(leftCandidates)(a))(acc)
    )(directDeps);

    return SET.union(ord)(indirectDeps)(directDeps);
  };

type DepName = Set<string>;

export type PackageData = {
  name: string;
  path: AbsPath;
  localDepName: DepName;
  files: Set<string>;
};

export type WsGlob = Set<string>;

export const getAllWsPkgPaths = (
  cwd: AbsPath,
  patterns: WsGlob
): AppTaskEither<AbsPath[]> =>
  FN.pipe(
    TE.Do,
    TE.bind("relativePkgPath", () =>
      glob(
        cwd,
        FN.pipe(
          patterns,
          SET.map(STR.Eq)((pattern: string) =>
            pathM.join(pattern, manifestFileName)
          ),
          SET.toArray(STR.Ord)
        )
      )
    ),
    TE.map(({ relativePkgPath }) =>
      ARR.map((rpath: string) => concatPath(cwd, rpath))(relativePkgPath)
    )
  );

export const getPackageData = (
  manifestPath: AbsPath
): AppTaskEither<PackageData> =>
  FN.pipe(
    TE.Do,
    TE.bind("rawManifest", () => readManifest(manifestPath)),
    TE.map(({ rawManifest }) =>
      derivePackageData(parentDir(manifestPath), rawManifest)
    )
  );

export const defaultIncludeFiles = [
  manifestFileName,
  "[rR][eE][aA][dD][mM][eE]*", // readme
  "[lL][iI][cC][eE][nN][sScC][eE]*", // license | licence
];

const derivePackageData = (
  pkgDir: AbsPath,
  rawManifest: RawManifest
): PackageData => ({
  name: rawManifest.name,
  localDepName: FN.pipe(
    rawManifest.dependencies ?? {},
    REC.filter(isWsProtocol),
    Object.keys,
    (pkgNames) => new Set(pkgNames)
  ),
  files: FN.pipe(
    rawManifest.files ?? [],
    SET.fromArray(STR.Eq),
    SET.union(STR.Eq)(SET.fromArray(STR.Eq)(defaultIncludeFiles))
  ),
  path: pkgDir,
});

const isWsProtocol = (str: string) => /^workspace:.+$/.test(str);

export const ordPkg: ORD.Ord<PackageData> = ORD.contramap(
  (pkg: PackageData) => pkg.name
)(STR.Ord);
