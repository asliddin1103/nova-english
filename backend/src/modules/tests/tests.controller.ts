import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import * as testsService from './tests.service';
import { Errors } from '../../common/utils/errors';
import { env } from '../../config/env';

export const getTests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tests = await testsService.getTests(req.query.level as string, req.query.type as string);
    res.json({ success: true, data: tests });
  } catch (err) { next(err); }
};

export const getTestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const test = await testsService.getTestById(parseInt(String(req.params.id)), req.student!.userId);
    res.json({ success: true, data: test });
  } catch (err) { next(err); }
};

export const submitAutoTest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { answers, timeTaken } = req.body;
    if (!Array.isArray(answers)) return next(Errors.badRequest('answers must be an array'));
    const result = await testsService.submitAutoTest(
      req.student!.userId, parseInt(String(req.params.id)), answers, timeTaken
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const getMySubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const submissions = await testsService.getUserSubmissions(req.student!.userId);
    res.json({ success: true, data: submissions });
  } catch (err) { next(err); }
};

export const adminGetPendingSubmissions = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const submissions = await testsService.getPendingSubmissions();
    res.json({ success: true, data: submissions });
  } catch (err) { next(err); }
};

export const adminReviewSubmission = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { feedback, score, reject } = req.body;
    if (!feedback) return next(Errors.badRequest('Feedback is required'));
    const result = await testsService.reviewSubmission(
      parseInt(String(req.params.id)), req.admin!.staffId, feedback, score, reject
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};
