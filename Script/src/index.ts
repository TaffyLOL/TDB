import fs from "node:fs";
import path from "node:path";
import { decode as DecodeFile } from "./decode";
import { GetFileCommitID } from "./GetFileCommitID";

type LiveDataType = {
  Up: number; // 开播时间
  Down: number; // 下播时间
  DM_Total: number; // 弹幕总数
  Watch_Total: number; // 观看总数
  Like_Total: number; // 点赞总数
  DataLoss?: boolean; // 数据丢失
  Tag: []; // TAG
  LiveReplay: []; // 录播
  TimeLine: []; // 时间线
};

const LiveFilesData: {
  [key: number]: {
    data: [string, string];
    dm?: [string, string]; // [文件名,CommitID]
    watch?: [string, string];
    d_dm?: [string, string];
    d_watch?: [string, string];
  }
} = {};
const TagData: { [key: string]: number[] } = {};

/**
 * 创建目录
 * @param p 需要生成的路径
 * @returns true 已存在无需创建 | false 不存在已创建
 */
const MkdirPath = (p: string) => {
  try {
    fs.statSync(path.resolve(__dirname, p));
    return true; // 已存在
  } catch (e) {
    // 需创建
    fs.mkdirSync(path.resolve(__dirname, p), {
      recursive: true,
    });
    return false;
  };
};

const GenPageData = (ConfigPath: string) => {
  /* 分页 */
  const LiveTimePagesList: number[][] = ((): number[][] => {
    const p = 5;
    let tmp: number[] = [];
    for (const i in LiveFilesData) tmp.push(Number(i));
    tmp = tmp.sort((a, b) => b - a); // 排序

    let PagesList: number[][] = [];
    for (let i = 0; i <= tmp.length; i += p) {
      PagesList.push(tmp.slice(i, i + p));
    };

    return PagesList;
  })();

  type PagesDataType = {
    time: number;
    data: [string, string];
    dm?: [string, string]; // [文件名,CommitID]
    watch?: [string, string];
    d_dm?: [string, string];
    d_watch?: [string, string];
  };
  const PagesData: PagesDataType[][] = [];
  for (const i in LiveTimePagesList) {
    const PageData: PagesDataType[] = [];
    for (const Time of LiveTimePagesList[i]) {
      const d: PagesDataType = { time: Time, data: LiveFilesData[Time].data };
      if (LiveFilesData[Time].dm !== undefined) d.dm = LiveFilesData[Time].dm;
      if (LiveFilesData[Time].watch !== undefined) d.watch = LiveFilesData[Time].watch;
      if (LiveFilesData[Time].d_dm !== undefined) d.d_dm = LiveFilesData[Time].d_dm;
      if (LiveFilesData[Time].d_watch !== undefined) d.d_watch = LiveFilesData[Time].d_watch;
      PageData.push(d);
    };

    PagesData.push(PageData);
  };

  fs.writeFileSync(
    path.join(ConfigPath, `./pages.json`),
    JSON.stringify({ data: PagesData }),
    "utf-8"
  );
};

const main = () => {
  const LiveDataFilesPath = path.join(__dirname, "../../DB/LiveData/");
  for (const YearFilesName of fs.readdirSync(LiveDataFilesPath)) {
    const YearFilesPath = path.join(LiveDataFilesPath, YearFilesName); // 年
    for (const MouthFilesName of fs.readdirSync(YearFilesPath)) {
      const MouthFilesPath = path.join(YearFilesPath, MouthFilesName); // 月
      for (const TimeFilesName of fs.readdirSync(MouthFilesPath)) {
        const FilesPath = path.join(MouthFilesPath, TimeFilesName); // Time
        const FilesData = fs.readdirSync(FilesPath);
        const TimeFilesName_Number = Number(TimeFilesName);

        /* Check Data */
        type HasDataType = false | string;
        let has_data: HasDataType = false; // data.json
        let has_dm: HasDataType = false; // dm.json
        let has_watch: HasDataType = false; // watch.json
        let has_d_dm: HasDataType = false; // d_dm.json
        let has_d_watch: HasDataType = false; // d_watch.json
        for (const FileName of FilesData) {
          if (FileName.search(/^data\.json/) !== -1) has_data = FileName;
          else if (FileName.search(/^dm\.json/) !== -1) has_dm = FileName;
          else if (FileName.search(/^watch\.json/) !== -1) has_watch = FileName;
          else if (FileName.search(/^d_dm\.json/) !== -1) has_d_dm = FileName;
          else if (FileName.search(/^d_watch\.json/) !== -1) has_d_watch = FileName;
        };
        if (has_data === false) continue;

        /* FileData */
        LiveFilesData[TimeFilesName_Number] = {
          data: [has_data, GetFileCommitID(path.join(FilesPath, has_data))],
        };
        if (has_dm !== false) LiveFilesData[TimeFilesName_Number].dm = [has_dm, GetFileCommitID(path.join(FilesPath, has_dm))];
        if (has_watch !== false) LiveFilesData[TimeFilesName_Number].watch = [has_watch, GetFileCommitID(path.join(FilesPath, has_watch))];
        if (has_d_dm !== false) LiveFilesData[TimeFilesName_Number].d_dm = [has_d_dm, GetFileCommitID(path.join(FilesPath, has_d_dm))];
        if (has_d_watch !== false) LiveFilesData[TimeFilesName_Number].d_watch = [has_d_watch, GetFileCommitID(path.join(FilesPath, has_d_watch))];

        /* TagData */
        const LiveData: {
          version: "1.0.0",
          data: LiveDataType,
        } = DecodeFile(path.join(FilesPath, has_data));
        for (const Tag of LiveData.data.Tag) {
          if (TagData[Tag] === undefined) TagData[Tag] = [];
          TagData[Tag].push(TimeFilesName_Number);
        };
      };
    };
  };

  const ConfigPath = path.join(__dirname, "../../Config/");
  MkdirPath(ConfigPath);
  /* FileData */
  GenPageData(ConfigPath);
  /* TagData */
  fs.writeFileSync(path.join(ConfigPath, "./tag.json"), JSON.stringify(TagData), "utf-8");
};
main();
