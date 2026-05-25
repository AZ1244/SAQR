import * as fs from 'fs';
import * as path from 'path';

export class LocalStorageService {
  private static UPLOAD_DIR = path.join(__dirname, '../../../uploads');

  public static initialize(): void {
    if (!fs.existsSync(this.UPLOAD_DIR)) {
      fs.mkdirSync(this.UPLOAD_DIR, { recursive: true });
    }
  }

  public static getUploadPath(fileName: string): string {
    return path.join(this.UPLOAD_DIR, fileName);
  }

  public static deleteFile(fileName: string): void {
    const filePath = path.join(this.UPLOAD_DIR, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
