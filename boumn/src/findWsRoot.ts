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
    tryReadManifest(absPath),
    TE.map((maybeManifest) =>
      OP.isNone(maybeManifest)
        ? false
        : isYarnWsRootManifest(maybeManifest.value)
    )
  );

const isPnpmWsRootDir = (absPath: AbsPath): AppTaskEither<boolean> =>
  FN.pipe(
    readFilesInDir(absPath),
    TE.map(ARR.some((ent) => isPnpmWsYamlPath(ent.name)))
  );

const isYarnWsRootManifest = (manifest: RawManifest) =>
  Array.isArray(manifest?.workspaces);
