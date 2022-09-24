import { Errors } from "error";

import { findWsRoot } from "./findWsRoot.js";
import { E, FN, TE } from "./fp.js";
import {
  getAllWsPkgPaths,
  getPackageData,
  getPnpmWsGlob,
  getYarnWsGlob,
  PackageData,
} from "./getWsInfo.js";
import { AbsPath, getCwd } from "./path.js";

type Config = {
  targetName: string;
  destDir: AbsPath;
  cwd: AbsPath;
};

export type AppEither<T> = E.Either<Errors, T>;
export type AppTaskEither<T> = TE.TaskEither<Errors, T>;

export const main = FN.pipe(
  TE.Do,
  TE.bind("cwd", () => TE.fromIO(getCwd)),
  TE.bind("wsRoot", ({ cwd }) => findWsRoot(cwd)),
  TE.bind("wsGlob", ({ wsRoot: { type, path } }) =>
    type === "pnpm" ? getPnpmWsGlob(path) : getYarnWsGlob(path)
  ),
  TE.bind("wsManifestPaths", ({ wsGlob, cwd }) =>
    getAllWsPkgPaths(cwd, wsGlob)
  ),

  TE.bind("packageDataList", ({ wsManifestPaths }) =>
    TE.traverseArray((manPath: AbsPath) => getPackageData(manPath))(
      wsManifestPaths
    )
  ),
  TE.chain((a) => {
    console.log(a.cwd);
    console.log(a.packageDataList);
    console.log(a.wsGlob);
    console.log(a.wsManifestPaths);
    console.log(a.wsRoot);

    return TE.right(1);
  })
);
