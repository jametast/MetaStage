import {Router} from 'express';
import multer from "multer";
import ProposalCtrl from '../controllers/Proposal.controller';

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, './public/uploads/');
    },
    filename: function (req, file,cb) {
        cb(null, file.fieldname + '_'+Date.now()+'.'+file.mimetype.split('/').reverse()[0]);
    }
})

class Proposal {

    router: Router = Router();
    proposalCtrl: ProposalCtrl = new ProposalCtrl();
    upload: any = multer({storage});

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

        this.router.route("/save-project").post(this.upload.single("files"), this.proposalCtrl.addNewProject)
    }
}

export default new Proposal().router;