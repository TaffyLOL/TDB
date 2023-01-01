import fs from "node:fs";
import stream from "node:stream";
import NodeUtil from "node:util";
import zlib from "node:zlib";

/**
 * 解码
 * @param FilePath 文件路径
 * @returns 解码后的数据
 */
export const decode = (FilePath: string) => {
  const FileData = fs.readFileSync(FilePath);
  if (FilePath.search(/.*\.br$/) !== -1) {
    return JSON.parse(zlib.brotliDecompressSync(FileData).toString());
  } else if (FilePath.search(/.*\.gz$/) !== -1) {
    return JSON.parse(zlib.gunzipSync(FileData).toString());
  };
};
