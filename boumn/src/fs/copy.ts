import {  E, FN, TE } from "../fp.js";
import { AppTaskEither } from "../index.js";
import { AbsPath, concatPath, isManifestPath, parentDir } from "../path.js";
import { ensureDir, Transform, transformFile } from "./fs.js";

/**
 * Copy files which are under `src` and match `rpaths` into `dest`.
 * package.json is modified using `transformManifest`.
 */
export const copyFilesRecursive =
  (src: AbsPath) =>
  (dest: AbsPath) =>
  (rpaths: string[]) =>
  (transformManifest: Transform): AppTaskEither<void> =>
    FN.pipe(
      rpaths,
      TE.traverseArray((rpath: string) => {
        const transformer = isManifestPath(rpath)
          ? transformManifest
          : (a: string) => E.right(a);
        const from = concatPath(src, rpath);
        const to = concatPath(dest, rpath);

        return FN.pipe(
          ensureDir(parentDir(to)),
          TE.chain(() => transformFile(from, to, transformer))
        );
      }),
      TE.map((): void => void 0)
    );
