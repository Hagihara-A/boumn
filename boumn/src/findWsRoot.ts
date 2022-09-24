import { FN, OP, TE } from "./fp.js";
import { readFilesInDir, tryReadManifest } from "./fs/fs.js";
import { AppTaskEither } from "./index.js";
import { RawManifest } from "./parser/main.js";
import { AbsPath, isRootDir, parentDir } from "./path.js";

type WsJudgeStatus = "pnpm" | "yarn" | "notRoot";
type WsRootData = {
  type: Extract<WsJudgeStatus, "pnpm" | "yarn">;
  path: AbsPath;
};

export const findWsRoot = (cwd: AbsPath): AppTaskEither<WsRootData> =>
  FN.pipe(
    TE.Do,
    TE.bind("isRoot", () => isWsRoot(cwd)),
    TE.chain(({ isRoot }) =>
      isRoot === "pnpm" || isRoot === "yarn"
        ? TE.right({
            type: isRoot,
            path: cwd,
          })
        : isRootDir(cwd)
        ? TE.left(new Error("No workspace root found"))
        : findWsRoot(parentDir(cwd))
    )
  );

const isWsRoot = (dir: AbsPath): AppTaskEither<WsJudgeStatus> =>
  FN.pipe(
    TE.Do,
    TE.bind("isYarnWsRoot", () => isYarnWsRootDir(dir)),
    TE.bind("isPnpmWsRoot", () => isPnpmWsRootDir(dir)),
    TE.map(({ isPnpmWsRoot, isYarnWsRoot }) =>
      isPnpmWsRoot ? "pnpm" : isYarnWsRoot ? "yarn" : "notRoot"
    )
  );

const isYarnWsRootDir = (absPath: AbsPath): AppTaskEither<boolean> =>
  FN.pipe(
    TE.Do,
    TE.bind("manifest", () => tryReadManifest(absPath)),
    TE.map(({ manifest }) =>
      OP.isNone(manifest) ? false : isYarnWsRootManifest(manifest.value)
    )
  );

const pnpmWsRegep = /^pnpm-workspace.ya?ml$/;

const isPnpmWsRootDir = (absPath: AbsPath): AppTaskEither<boolean> =>
  FN.pipe(
    TE.Do,
    TE.bind("fileEntries", () => readFilesInDir(absPath)),
    TE.map(
      ({ fileEntries }) =>
        fileEntries.find((ent) => pnpmWsRegep.test(ent.name)) !== undefined
    )
  );

const isYarnWsRootManifest = (manifest: RawManifest) =>
  Array.isArray(manifest?.workspaces);
