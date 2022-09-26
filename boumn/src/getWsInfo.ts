import { ARR, FN, ORD, REC, SET, STR, TE } from "./fp.js";
import { glob, readManifest, readPnpmWsYaml } from "./fs/fs.js";
import { AppTaskEither } from "./index.js";
import { RawManifest } from "./parser/main.js";
import {
  AbsPath,
  concatPath,
  manifestFileName,
  manifestPath,
  parentDir,
  pnpmWsYamlPath,
} from "./path.js";

export const getYarnWsGlob = (wsRootDir: AbsPath): AppTaskEither<WsGlob> =>
  FN.pipe(
    readManifest(manifestPath(wsRootDir)),
    TE.map(({ workspaces = [] }) => workspaces)
  );

export const getPnpmWsGlob = (wsRootDir: AbsPath): AppTaskEither<WsGlob> =>
  FN.pipe(
    readPnpmWsYaml(pnpmWsYamlPath(wsRootDir)),
    TE.map(({ packages = [] }) => packages)
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
  files: string[];
};

export type WsGlob = string[];

export const getAllWsPkgPaths = (
  cwd: AbsPath,
  patterns: WsGlob
): AppTaskEither<AbsPath[]> =>
  FN.pipe(
    glob(cwd, patterns),
    TE.map(ARR.map((rpath: string) => concatPath(cwd, rpath)))
  );

export const getPackageData = (
  manifestPath: AbsPath
): AppTaskEither<PackageData> =>
  FN.pipe(
    readManifest(manifestPath),
    TE.map((rawManifest) =>
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
    SET.fromArray(STR.Eq)
  ),
  files: FN.pipe(rawManifest.files ?? [], ARR.concat(defaultIncludeFiles)),
  path: pkgDir,
});

const isWsProtocol = (str: string) => /^workspace:.+$/.test(str);

export const ordPkg: ORD.Ord<PackageData> = ORD.contramap(
  (pkg: PackageData) => pkg.name
)(STR.Ord);
