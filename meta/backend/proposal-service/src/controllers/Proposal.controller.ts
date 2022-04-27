import {Request, Response, NextFunction } from 'express';
import ProposalService from '../services/Proposal.service';

export default class ProposalCtrl {
    constructor() {
    }

    async getAllProjects(req: Request, res: Response, next: NextFunction): Promise<any> {
        const { publicAddress } = req.body;

        try {
            const result = await ProposalService.getAllProjects(publicAddress);
            res.json(result);
        } catch (error) {
            res.json(error);
        }
    }

    async addNewProject(req: Request, res: Response, next: NextFunction): Promise<any> {

        try {
            const result = await ProposalService.addNewProject(req);
            res.json(result);
        } catch (error) {
            res.json(error);
        }
    }
}