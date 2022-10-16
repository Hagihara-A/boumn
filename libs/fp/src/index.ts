import { Errors } from "error";
import {
  array as ARR,
  either as E,
  function as FN,
  ioEither as IOE,
  record as REC,
  taskEither as TE,
} from "fp-ts";

export const mapRecordWithKey =
  <K1 extends string, V1>(obj: Record<K1, V1>) =>
  <K2 extends string, V2>(f: (k: K1, v: V1) => [K2, V2]): Record<K2, V2> =>
    FN.pipe(
      obj,
      REC.toEntries,
      ARR.map(([k, v]) => f(k, v)),
      REC.fromEntries
    );

export type AppEither<T> = E.Either<Errors, T>;
export type AppTaskEither<T> = TE.TaskEither<Errors, T>;
export type AppIOEither<T> = IOE.IOEither<Errors, T>;

export {
  array as ARR,
  either as E,
  eq as EQ,
  function as FN,
  io as IO,
  ioEither as IOE,
  map as MAP,
  option as OP,
  optionT as OPT,
  ord as ORD,
  record as REC,
  set as SET,
  string as STR,
  taskEither as TE,
  taskOption as TO,
} from "fp-ts";
