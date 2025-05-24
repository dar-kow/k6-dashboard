export interface ProcessOptions {
  cwd?: string;
  env?: Record<string, string>;
  stdio?: ("pipe" | "inherit" | "ignore")[];
}

export interface IChildProcess {
  pid: number;
  stdout: any;
  stderr: any;
  stdin: any;
  killed: boolean;
  on(event: string, listener: (...args: any[]) => void): void;
  kill(signal?: string): boolean;
}

export interface IProcessExecutor {
  spawn(
    command: string,
    args: string[],
    options: ProcessOptions
  ): IChildProcess;
  kill(process: IChildProcess, signal?: string): boolean;
}
