import child_process from "child_process";
import path from "path";

const GitOP = {
  cwd: path.join(__dirname, "../../"),
};

/**
 * 获取文件/文件夹CommitID
 * @param Path 文件/文件夹路径
 * @returns CommitID
 */
export const GetFileCommitID = (Path: string): string => {
  const CMDData = child_process.spawnSync("git", ["log", "-1", "--", Path], GitOP);
  const CMDMsg = CMDData.stdout.toString();
  const CommitMatch = CMDMsg.match(/commit [\d\w]+\n/);
  if (CommitMatch === null) return "";
  const CommitID = CommitMatch[0].replace("commit ", "").replace("\n", "");
  return CommitID;
};
