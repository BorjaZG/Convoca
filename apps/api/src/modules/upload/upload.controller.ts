import type { Request, Response } from 'express';
import { signUpload } from '../../config/cloudinary';

export function sign(req: Request, res: Response) {
  const folder = (req.body?.folder as string | undefined) || 'convoca/events';
  const params = signUpload(folder);
  res.json(params);
}
