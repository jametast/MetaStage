import { Application } from 'express';
import ProposalRoutes from './Proposal.routes';

export default class Routes {
    constructor(app: Application) {
        app.use("/api/proposal", ProposalRoutes);
    }
}