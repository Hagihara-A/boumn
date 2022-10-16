export {
  array as ARR,
  either as E,
  eq as EQ,
  function as FN,
  io as IO,
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

import { array as ARR, function as FN, record as REC } from "fp-ts";

export const mapRecordWithKey =
  <K1 extends string, V1>(obj: Record<K1, V1>) =>
  <K2 extends string, V2>(f: (k: K1, v: V1) => [K2, V2]): Record<K2, V2> =>
    FN.pipe(
      obj,
      REC.toEntries,
      ARR.map(([k, v]) => f(k, v)),
      REC.fromEntries
    );
