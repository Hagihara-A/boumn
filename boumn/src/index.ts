import { Errors } from "error";
import * as pathM from "path";

import { findWsRoot } from "./findWsRoot.js";
import { ARR, E, FN, TE } from "./fp.js";
import { glob } from "./fs/fs.js";
import {
  enumDependentPkgs,
  getAllWsPkgPaths,
  getPackageData,
  getPnpmWsGlob,
  getYarnWsGlob,
  ordPkg,
  PackageData,
} from "./getWsInfo.js";
import { AbsPath, getCwd, manifestFileName } from "./path.js";

type Config = {
  targetName: string;
  destDir: AbsPath;
  cwd: AbsPath;
};

export type AppEither<T> = E.Either<Errors, T>;
export type AppTaskEither<T> = TE.TaskEither<Errors, T>;

const config: Config = {
  destDir: { __tag: "absPath", path: "/home/arark/boumn/bundle" },
  targetName: "boumn",
};

export const main = FN.pipe(
  TE.Do,
  TE.bind("cwd", () => (console.log("cwd"), TE.fromIO(getCwd))),
  TE.bind("wsRoot", ({ cwd }) => (console.log("wsRoot"), findWsRoot(cwd))),
  TE.bind(
    "wsGlob",
    ({ wsRoot: { type, path } }) => (
      console.log("wsGlob"),
      type === "pnpm" ? getPnpmWsGlob(path) : getYarnWsGlob(path)
    )
  ),
  TE.bind(
    "wsManifestPaths",
    ({ wsGlob, wsRoot }) => (
      console.log("wsManifestPaths"),
      getAllWsPkgPaths(
        wsRoot.path,
        ARR.map((pat: string) => pathM.join(pat, manifestFileName))(wsGlob)
      )
    )
  ),

  TE.bind("packageDataList", ({ wsManifestPaths }) =>
    TE.traverseArray((manPath: AbsPath) => getPackageData(manPath))(
      wsManifestPaths
    )
  ),
  TE.bind("dependentPackageDataList", () => enumDependentPkgs(ordPkg)()),
  TE.bind("packageDataWithAllFiles", ({ packageDataList }) =>
    TE.traverseArray((packageData: PackageData) =>
      FN.pipe(
        glob(packageData.path, packageData.files),
        TE.map((files) => ({ ...packageData, files }))
      )
    )(packageDataList)
  ),
  (res) => {
    res()
      .then((b) => {
        if (b._tag === "Right") {
          const a = b.right;
          const log = (a: unknown, b: unknown) => console.log(a, b, "\n");

          log("cwd", a.cwd);
          log("wsRoot", a.wsRoot);
          log("wsGlob", a.wsGlob);
          log("wsManifestPaths", a.wsManifestPaths);
          log("packageDataList", a.packageDataList);
          log("packageDataWithAllFiles", a.packageDataWithAllFiles);
        }
        console.log(b);
      })
      .catch(console.log);

    return TE.right(1);
  }
);
