import {
  AppEither,
  AppTaskEither,
  ARR,
  E,
  EQ,
  FN,
  REC,
  SET,
  STR,
  TE,
} from "fp";
import { glob, readManifest, readPnpmWsYaml } from "fp-fs";
import { RawManifest } from "fp-parse";
import {
  AbsPath,
  concatPath,
  manifestFileName,
  manifestPath,
  parentDir,
  pnpmWsYamlPath,
} from "fp-path";

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
  (eq: EQ.Eq<PackageData>) =>
  (candidates: PackageData[]) =>
  (root: PackageData): PackageData[] => {
    const { left: leftCandidates, right: directDeps } = ARR.partition(
      (pkg: PackageData) => root.localDepName.has(pkg.name)
    )(candidates);

    if (ARR.isEmpty(directDeps)) {
      return [];
    }

    const indirectDeps = ARR.reduce([], (acc: PackageData[], a: PackageData) =>
      ARR.union(eq)(enumDependentPkgs(eq)(leftCandidates)(a))(acc)
    )(directDeps);

    return ARR.union(eq)(indirectDeps)(directDeps);
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

type PackageDataGroup = {
  target: PackageData;
  others: PackageData[];
};

export const groupPackageData =
  (eq: EQ.Eq<PackageData["name"]>) =>
  (targetName: PackageData["name"]) =>
  (packageDataList: PackageData[]): AppEither<PackageDataGroup> => {
    return FN.pipe(
      E.Do,
      E.bind("target", () =>
        E.fromOption(
          () => new Error(`No package named "${targetName}" found from list`)
        )(
          ARR.findFirst((pkg: PackageData) => eq.equals(targetName, pkg.name))(
            packageDataList
          )
        )
      ),
      E.bind("others", ({ target }) =>
        E.of(
          ARR.filter((pkg: PackageData) => !eq.equals(pkg.name, target.name))(
            packageDataList
          )
        )
      )
    );
  };

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

export const isWsProtocol = (str: string) => /^workspace:.+$/.test(str);

export const eqPkg: EQ.Eq<PackageData> = EQ.contramap(
  (pkg: PackageData) => pkg.name
)(STR.Eq);
