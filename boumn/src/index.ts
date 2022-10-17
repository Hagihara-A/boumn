import { ARR, E, FN, mapRecordWithKey, STR, TE } from "fp";
import { copyFilesRecursive, glob } from "fp-fs";
import { parseManifestString } from "fp-parse";
import { AbsPath, concatPath, getCwd, manifestFileName } from "fp-path";
import * as pathM from "path";

import { getCliOption } from "./cli/main.js";
import { findWsRoot } from "./findWsRoot.js";
import {
  enumDependentPkgs,
  eqPkg,
  getAllWsPkgPaths,
  getPackageData,
  getPnpmWsGlob,
  getYarnWsGlob,
  groupPackageData,
  isWsProtocol,
  PackageData,
} from "./getWsInfo.js";

const bundleDirName = "_internal";

const main = FN.pipe(
  TE.Do,
  TE.bind("config", () => TE.fromIOEither(getCliOption())),
  TE.bind("cwd", () => TE.fromIO(getCwd)),
  TE.bind("wsRoot", ({ cwd }) => findWsRoot(cwd)),
  TE.bind("wsGlob", ({ wsRoot: { type, path } }) =>
    type === "pnpm" ? getPnpmWsGlob(path) : getYarnWsGlob(path)
  ),
  TE.bind("wsManifestPaths", ({ wsGlob, wsRoot }) =>
    getAllWsPkgPaths(
      wsRoot.path,
      ARR.map((pat: string) => pathM.join(pat, manifestFileName))(wsGlob)
    )
  ),
  TE.bind("packageDataList", ({ wsManifestPaths }) =>
    TE.traverseArray((manPath: AbsPath) =>
      FN.pipe(
        TE.Do,
        TE.bind("packageData", () => getPackageData(manPath)),
        TE.bind("allPackageFiles", ({ packageData: { files, path } }) =>
          glob(path, files)
        ),
        TE.map(({ packageData, allPackageFiles }) => ({
          ...packageData,
          files: allPackageFiles,
        }))
      )
    )(wsManifestPaths)
  ),
  TE.bind("packageGroup", ({ config: { targetName }, packageDataList }) =>
    TE.fromEither(
      groupPackageData(STR.Eq)(targetName)(packageDataList as PackageData[])
    )
  ),
  TE.bind("dependentPackageData", ({ packageGroup: { others, target } }) =>
    TE.right(enumDependentPkgs(eqPkg)(others)(target))
  ),
  TE.bind("_", ({ dependentPackageData, config: { destDir } }) =>
    TE.traverseArray((pkgData: PackageData) =>
      copyFilesRecursive(pkgData.path)(
        concatPath(concatPath(destDir, bundleDirName), pkgData.name)
      )(pkgData.files)(
        FN.flow(
          parseManifestString,
          E.map((rawMan) => ({
            ...rawMan,
            dependencies: FN.pipe(rawMan.dependencies ?? {}, (deps) =>
              mapRecordWithKey(deps)((name, ref) => [
                name,
                isWsProtocol(ref) ? `file:../${name}` : ref,
              ])
            ),
          })),
          E.map((man) => JSON.stringify(man, null, 2))
        )
      )
    )(dependentPackageData)
  ),
  TE.bind("__", ({ config: { destDir }, packageGroup: { target } }) =>
    copyFilesRecursive(target.path)(destDir)(target.files)(
      FN.flow(
        parseManifestString,
        E.map((man) => ({
          ...man,
          files: [...(man.files ?? []), `./${bundleDirName}/**/*`],
        })),
        E.map((rawMan) => ({
          ...rawMan,
          dependencies: FN.pipe(rawMan.dependencies ?? {}, (deps) =>
            mapRecordWithKey(deps)((name, ref) => [
              name,
              isWsProtocol(ref) ? `file:./${bundleDirName}/${name}` : ref,
            ])
          ),
        })),
        E.map((man) => JSON.stringify(man, null, 2))
      )
    )
  )
);

await main().then((res) => {
  if (res._tag === "Right") {
    console.log("Bundle success!");
    return;
  }
  throw res.left;
});
