
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Context {
  files: string[];
}

const CONTEXT_DIR = '.openrouter'; // In home directory
const CONTEXT_FILE = 'context.json';

export class ContextManager {
  private contextPath: string;

  constructor() {
    const homeDir = os.homedir();
    this.contextPath = path.join(homeDir, CONTEXT_DIR, CONTEXT_FILE);
  }

  private ensureContextDir(): void {
    const contextDir = path.dirname(this.contextPath);
    if (!fs.existsSync(contextDir)) {
      fs.mkdirSync(contextDir, { recursive: true });
    }
  }

  public getContext(): Context {
    try {
      if (!fs.existsSync(this.contextPath)) {
        return { files: [] };
      }

      const contextData = fs.readFileSync(this.contextPath, 'utf8');
      const context: Context = JSON.parse(contextData);
      return context;
    } catch (error) {
      console.warn('Failed to read context file:', error);
      return { files: [] };
    }
  }

  public addFile(filePath: string): void {
    try {
      this.ensureContextDir();

      let context = this.getContext();
      if (!context.files.includes(filePath)) {
        context.files.push(filePath);
      }

      fs.writeFileSync(this.contextPath, JSON.stringify(context, null, 2), {
        mode: 0o600 // Read/write for owner only
      });
    } catch (error) {
      throw new Error(`Failed to add file to context: ${error}`);
    }
  }

  public removeFile(filePath: string): void {
    try {
      let context = this.getContext();
      context.files = context.files.filter(f => f !== filePath);

      if (context.files.length === 0) {
        fs.unlinkSync(this.contextPath);
      } else {
        fs.writeFileSync(this.contextPath, JSON.stringify(context, null, 2), {
          mode: 0o600
        });
      }
    } catch (error) {
      console.warn('Failed to remove file from context:', error);
    }
  }

  public clear(): void {
    try {
      if (fs.existsSync(this.contextPath)) {
        fs.unlinkSync(this.contextPath);
      }
    } catch (error) {
      console.warn('Failed to clear context:', error);
    }
  }
}
