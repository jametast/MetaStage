import { docClient } from "../db/dbConfig";
import {customMessageSuccessResponse, noContent, badRequest} from "../utilities/response.utils";
import uploadToS3 from "./UploadToS3.service";

class Proposal {
    constructor() {
    }

    async getAllProjects(publicAddress: string): Promise<any> {

        // Create query to fetch 
        const query = {
            TableName: "projects",
            KeyConditionExpression: "publicAddress = :publicAddress",
            ExpressionAttributeValues: {
                ':publicAddress': publicAddress
            }
        };

        try {
            const projects = await docClient.query(query).promise();
            if (projects) {
                return customMessageSuccessResponse("Projects retrieved successfully", projects);
            }
            return noContent("No Projects found")
        } catch (error: any) {
            throw badRequest(error.message);
        }
    }

    async addNewProject(projectDetails: any): Promise<any> {

        const { projectName, projectDescription, startTime, deadline } = projectDetails;
        const imageUploadS3 = await uploadToS3(projectDetails.files)
        let query = {
            Item: {
                projectName: projectName,
                projectDescription: projectDescription,
                startTime: startTime,
                deadline: deadline,
                projectNftUrl: imageUploadS3,
            },
            TableName: "projects",
        }

        try {
            const result = await docClient.put(query).promise();
            return customMessageSuccessResponse("Project successfully added.", result);
        } catch (error: any) {
            throw badRequest(error.message);
        }
    }
}

export default new Proposal();