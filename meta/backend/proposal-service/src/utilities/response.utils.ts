import { ReasonPhrases, StatusCodes, getReasonPhrase, getStatusCode } from 'http-status-codes';

export const getResponseObject = () => {
    let response = new Object();
    return response;
}

function getErrorResponseObject() {
    let response = exports.getResponseObject();
    response.status = StatusCodes.INTERNAL_SERVER_ERROR;
    return response;
}

function getSuccessResponseObject() {
    let response = exports.getResponseObject();
    response.status = StatusCodes.OK;
    return response;
}

export const invalidAccess = (message: string) => {
    let response = getSuccessResponseObject();
    response.response_code = StatusCodes.UNAUTHORIZED;
    response.message = message;
    return response;
}

export const customMessageSuccessResponse = (message: string,data?: any) => {
    const response = getSuccessResponseObject();
    response.response_code = StatusCodes.OK;
    response.message = message;
    if(data){
        response.data=data
    }
    return response;
};

export const badRequest = (errorMessage: string) => {
    let response = getErrorResponseObject();
    response.response_code = StatusCodes.BAD_REQUEST;
    response.message = errorMessage;
    return response;
}

export const noContent = (errorMessage: string, data?: any) => {
    let response = getSuccessResponseObject();
    response.response_code = StatusCodes.NO_CONTENT;
    response.message=errorMessage;
    if (data) {
        response.data = data;
    }
    return response;
}

export const pageNotFound = () => {
    let response = getErrorResponseObject();
    response.response_code = StatusCodes.NOT_FOUND;
    response.message = "Page Not Found";
    return response;
}

export const conflict = (message: string) => {
    let response = getSuccessResponseObject();
    response.response_code = StatusCodes.CONFLICT;
    response.message = message;
    return response;
}