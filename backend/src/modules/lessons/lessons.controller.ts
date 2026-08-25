import { Request, Response, NextFunction } from 'express';
import * as lessonsService from './lessons.service';
import { Errors } from '../../common/utils/errors';
import { getPaginationParams, buildPaginationMeta } from '../../common/utils/pagination';

export const getLessons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lessons = await lessonsService.getLessons(req.student!.userId, req.query.level as string);
    res.json({ success: true, data: lessons });
  } catch (err) { next(err); }
};

export const getLessonById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lesson = await lessonsService.getLessonById(parseInt(req.params.id as string), req.student!.userId);
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

export const markProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const watchedSecs = req.body.watchedSecs ?? 0;
    await lessonsService.markLessonProgress(req.student!.userId, parseInt(req.params.id as string), watchedSecs);
    res.json({ success: true, data: { message: 'Progress recorded' } });
  } catch (err) { next(err); }
};

export const adminGetLessons = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { page, limit, skip } = getPaginationParams(req.query as any);
    const { lessons, total } = await lessonsService.adminGetLessons(skip, limit);
    res.json({ success: true, data: lessons, meta: buildPaginationMeta(total, page, limit) });
  } catch (err) { next(err); }
};

export const adminCreateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lesson = await lessonsService.adminCreateLesson(req.body);
    res.status(201).json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

export const adminUpdateLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const lesson = await lessonsService.adminUpdateLesson(parseInt(req.params.id as string), req.body);
    res.json({ success: true, data: lesson });
  } catch (err) { next(err); }
};

export const adminDeleteLesson = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    await lessonsService.adminDeleteLesson(parseInt(req.params.id as string));
    res.json({ success: true, data: { message: 'Lesson unpublished' } });
  } catch (err) { next(err); }
};
