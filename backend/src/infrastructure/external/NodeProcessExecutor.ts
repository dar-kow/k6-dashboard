import { spawn } from 'child_process';
import {
  IProcessExecutor,
  IChildProcess,
  ProcessOptions,
} from '../../core/interfaces/external/IProcessExecutor';

export class NodeProcessExecutor implements IProcessExecutor {
  spawn(command: string, args: string[], options: ProcessOptions): IChildProcess {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: options.stdio || ['pipe', 'pipe', 'pipe'],
    });

    return {
      pid: child.pid || 0,
      stdout: child.stdout,
      stderr: child.stderr,
      stdin: child.stdin,
      on: (event: string, listener: (...args: any[]) => void) => child.on(event, listener),
      kill: (signal?: string) => child.kill(signal as NodeJS.Signals),
      killed: child.killed,
    };
  }

  kill(process: IChildProcess, signal = 'SIGTERM'): boolean {
    return process.kill(signal);
  }
}
