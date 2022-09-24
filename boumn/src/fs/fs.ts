import { isNodeError, matchError } from "error";
import globM from "fast-glob";
import { Dirent } from "fs";
import * as fs from "fs/promises";

import { ARR, FN, OP, TE } from "../fp.js";
import { AppTaskEither } from "../index.js";
import {
  parseManifestString,
  parsePnpmWsYaml,
  PnpmWsYaml,
  RawManifest,
} from "../parser/main.js";
import { AbsPath, concatPath, deriveManifestPath } from "../path.js";

export const readDir = ({ path }: AbsPath): AppTaskEither<Dirent[]> =>
  TE.tryCatch(() => fs.readdir(path, { withFileTypes: true }), matchError);

export const readFilesInDir = (absPath: AbsPath) =>
  TE.map<Dirent[], Dirent[]>((ents) => ents.filter((ent) => ent.isFile()))(
    readDir(absPath)
  );

export const readFoldersinDir = (absPath: AbsPath) =>
  TE.map<Dirent[], Dirent[]>((ents) => ents.filter((ent) => ent.isDirectory()))(
    readDir(absPath)
  );

export const readFile = ({ path }: AbsPath): AppTaskEither<string> =>
  TE.tryCatch(() => fs.readFile(path, { encoding: "utf-8" }), matchError);

/**
 * dont throw an error if file doesnt exist
 */
export const tryReadFile = ({
  path,
}: AbsPath): AppTaskEither<OP.Option<string>> =>
  TE.tryCatch(
    () =>
      fs
        .readFile(path, { encoding: "utf-8" })
        .then((str) => OP.some(str))
        .catch((err) => {
          if (isNodeError(err) && err.code === "ENOENT") {
            return OP.none;
          }
          throw err;
        }),
    matchError
  );

export const readManifest = (manPath: AbsPath): AppTaskEither<RawManifest> =>
  FN.pipe(
    TE.Do,
    TE.bind("manifestStr", () => readFile(manPath)),
    TE.chain(({ manifestStr }) =>
      TE.fromEither(parseManifestString(manifestStr))
    )
  );

export const tryReadManifest = (
  dir: AbsPath
): AppTaskEither<OP.Option<RawManifest>> =>
  FN.pipe(
    TE.Do,
    TE.bind("maybeManifestStr", () => tryReadFile(deriveManifestPath(dir))),
    TE.chain(({ maybeManifestStr }) =>
      OP.isNone(maybeManifestStr)
        ? TE.of(OP.none)
        : TE.map<RawManifest, OP.Option<RawManifest>>(OP.some)(
            TE.fromEither(parseManifestString(maybeManifestStr.value))
          )
    )
  );

export const glob = (
  cwd: AbsPath,
  patterns: string[]
): AppTaskEither<AbsPath[]> =>
  TE.tryCatch(
    () =>
      globM(patterns, { cwd: cwd.path }).then((paths) =>
        ARR.map((path: string) => concatPath(cwd, path))(paths)
      ),
    matchError
  );

export const readPnpmWsYaml = (yamlPath: AbsPath): AppTaskEither<PnpmWsYaml> =>
  FN.pipe(
    TE.Do,
    TE.bind("yamlStr", () => readFile(yamlPath)),
    TE.chain(({ yamlStr }) => TE.fromEither(parsePnpmWsYaml(yamlStr)))
  );

export const copy = (
  { path: from }: AbsPath,
  { path: to }: AbsPath
): AppTaskEither<void> => TE.tryCatch(() => fs.copyFile(from, to), matchError);
