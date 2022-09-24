import { ARR, FN, TE } from "../fp.js";
import { AppTaskEither } from "../index.js";
import { RawManifest } from "../parser/main.js";
import { AbsPath, concatPath } from "../path.js";
import { copy, glob } from "./fs.js";

/**
 * Copy all files which match `patterns` under `from` to `to`.
 * If file if package.json, content is modified by transformManifest
 */
export const copyFilesRecursive =
  (from: AbsPath) =>
  (to: AbsPath) =>
  (patterns: string[]) =>
  (transformManifest: (m: RawManifest) => string): AppTaskEither<void> =>
    FN.pipe(
      TE.Do,
      TE.bind("relativeFilePaths", () => glob(from, patterns)),
      TE.chain(({ relativeFilePaths }) =>
        TE.sequenceArray(
          ARR.map((rpath: string) =>
            copy(concatPath(from, rpath), concatPath(to, rpath))
          )(relativeFilePaths)
        )
      )
    );
