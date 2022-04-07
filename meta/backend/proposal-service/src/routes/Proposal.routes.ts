import {Router} from 'express';
import ProposalCtrl from '../controllers/Proposal.controller';

class Proposal {

    router: Router = Router();
    proposalCtrl: ProposalCtrl = new ProposalCtrl();

    constructor() {
        this.initializeRoutes()
    }

    initializeRoutes(): void {

        /**
         * GET /api/proposal/get-projects
         * GET All Proposals
         */

        this.router.route("/get-projects").get(this.proposalCtrl.getAllProjects);

        /**
         * POST /api/proposal/add-project
         * POST Save New Project
         */

        this.router.route("/save-project").post(this.proposalCtrl.addNewProject)
    }
}

export default new Proposal().router;