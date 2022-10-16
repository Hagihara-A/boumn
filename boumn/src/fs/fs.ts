import { isNodeError, matchError } from "error";
import globM from "fast-glob";
import { Dirent } from "fs";
import * as fs from "fs/promises";

import { ARR, FN, OP, TE } from "../fp.js";
import { AppEither, AppTaskEither } from "../index.js";
import {
  parseManifestString,
  parsePnpmWsYaml,
  PnpmWsYaml,
  RawManifest,
} from "../parser/main.js";
import { AbsPath, manifestPath } from "../path.js";

export const readDir = ({ path }: AbsPath): AppTaskEither<Dirent[]> =>
  TE.tryCatch(() => fs.readdir(path, { withFileTypes: true }), matchError);

export const readFilesInDir = (absPath: AbsPath) =>
  TE.map<Dirent[], Dirent[]>((ents) => ents.filter((ent) => ent.isFile()))(
    readDir(absPath)
  );

export const readFoldersInDir = (absPath: AbsPath): AppTaskEither<Dirent[]> =>
  FN.pipe(absPath, readDir, TE.map(ARR.filter((ent) => ent.isDirectory())));

export const readFile = ({ path }: AbsPath): AppTaskEither<string> =>
  TE.tryCatch(() => fs.readFile(path, { encoding: "utf-8" }), matchError);

const encoding = "utf-8";
/**
 * dont throw an error if file doesnt exist
 */
export const tryReadFile = ({
  path,
}: AbsPath): AppTaskEither<OP.Option<string>> =>
  TE.tryCatch(
    () =>
      fs
        .readFile(path, { encoding })
        .then((str) => OP.some(str))
        .catch((err) => {
          if (isNodeError(err) && err.code === "ENOENT") {
            return OP.none;
          }
          throw err;
        }),
    matchError
  );

export const readManifest = (
  manifestPath: AbsPath
): AppTaskEither<RawManifest> =>
  FN.pipe(
    readFile(manifestPath),
    TE.chain((manifestStr) => TE.fromEither(parseManifestString(manifestStr)))
  );

export const tryReadManifest = (
  dir: AbsPath
): AppTaskEither<OP.Option<RawManifest>> =>
  FN.pipe(
    tryReadFile(manifestPath(dir)),
    TE.chain((maybeManifestStr) =>
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
): AppTaskEither<string[]> =>
  TE.tryCatch(() => globM(patterns, { cwd: cwd.path }), matchError);

export const readPnpmWsYaml = (yamlPath: AbsPath): AppTaskEither<PnpmWsYaml> =>
  FN.pipe(
    readFile(yamlPath),
    TE.chain((yamlStr) => TE.fromEither(parsePnpmWsYaml(yamlStr)))
  );

export type Transform = (content: string) => AppEither<string>;

export const transformFile = (
  from: AbsPath,
  to: AbsPath,
  transform: Transform
) =>
  FN.pipe(
    TE.Do,
    TE.bind("content", () => readFile(from)),
    TE.bind("contentT", ({ content }) => TE.fromEither(transform(content))),
    TE.chain(({ contentT }) => writeFile(to)(contentT))
  );

export const copyFile = (
  { path: from }: AbsPath,
  { path: to }: AbsPath
): AppTaskEither<void> => TE.tryCatch(() => fs.copyFile(from, to), matchError);

export const ensureDir = (dir: AbsPath): AppTaskEither<void> =>
  TE.tryCatch(
    () => fs.mkdir(dir.path, { recursive: true }).then(() => undefined),
    matchError
  );

export const writeFile =
  ({ path }: AbsPath) =>
  (str: string): AppTaskEither<void> =>
    TE.tryCatch(() => fs.writeFile(path, str, { encoding }), matchError);
