import { FN, TE } from "../fp.js";
import { AppTaskEither } from "../index.js";
import { RawManifest } from "../parser/main.js";
import { AbsPath, concatPath, isManifestPath } from "../path.js";
import { copy, glob, readManifest, writeFile } from "./fs.js";

type TransformManifest = (m: RawManifest) => Record<string, unknown>;

/**
 * Copy all files which match `patterns` under `from` to `to`.
 * If file if package.json, content is modified by transformManifest
 */
export const copyFilesRecursive =
  (from: AbsPath) =>
  (to: AbsPath) =>
  (patterns: string[]) =>
  (transformManifest: TransformManifest): AppTaskEither<void> =>
    FN.pipe(
      glob(from, patterns),
      TE.chain(
        TE.traverseArray((rpath: string) =>
          isManifestPath(rpath)
            ? copyManifestWithTransform(from)(to)(transformManifest)
            : copy(concatPath(from, rpath), concatPath(to, rpath))
        )
      ),
      TE.map((): void => void 0)
    );

const copyManifestWithTransform =
  (manifestFrom: AbsPath) =>
  (manifestTo: AbsPath) =>
  (transform: TransformManifest): AppTaskEither<void> =>
    FN.pipe(
      readManifest(manifestFrom),
      TE.map(transform),
      TE.map((obj) => JSON.stringify(obj, null, 2)),
      TE.chain(writeFile(manifestTo))
    );
