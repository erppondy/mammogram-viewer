declare module 'dicom-parser' {
  export interface DataSet {
    byteArray: Uint8Array;
    elements: {
      [tag: string]: {
        tag: string;
        vr?: string;
        length: number;
        dataOffset: number;
      };
    };
    uint16(tag: string): number | undefined;
    string(tag: string): string | undefined;
    int16(tag: string): number | undefined;
    uint32(tag: string): number | undefined;
  }

  export function parseDicom(byteArray: Uint8Array, options?: any): DataSet;
}
