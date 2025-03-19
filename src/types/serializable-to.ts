import {Jsonify} from 'type-fest'

export type SerializableTo<To> =
    | {
          toJSON(): Jsonify<To>
      }
    | {[key in keyof To]: SerializableTo<To[key]>}
