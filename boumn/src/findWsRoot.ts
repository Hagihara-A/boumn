import { ARR, FN, OP, TE } from "./fp.js";
import { readFilesInDir, tryReadManifest } from "./fs/fs.js";
import { AppTaskEither } from "./index.js";
import { RawManifest } from "./parser/main.js";
import {
  AbsPath,
  isPnpmWsYamlPath,
  isRootDir,
  parentDir,
} from "./path.js";

type PMType = "pnpm" | "yarn";
type NotRoot = "notRoot";
type WsJudgeStatus = PMType | NotRoot;
type WsRootData = {
  type: PMType;
  path: AbsPath;
};

export const findWsRoot = (cwd: AbsPath): AppTaskEither<WsRootData> =>
  FN.pipe(
    isWsRoot(cwd),
    TE.chain((pmType) =>
      pmType === "pnpm" || pmType === "yarn"
        ? TE.right({
            type: pmType,
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
