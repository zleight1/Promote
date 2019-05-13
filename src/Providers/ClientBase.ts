import {IHeaders, IRequestHandler, IRequestOptions} from "typed-rest-client/Interfaces";
import {HttpClientResponse, HttpCodes} from "typed-rest-client/HttpClient";
import {IRequestOptions as RestClientIRequestOptions, IRestResponse} from "typed-rest-client/RestClient";
import {AzureService} from "../Services/AzureService";
import {getEndpointAuthorization}  from "azure-pipelines-task-lib/task";
import {getHandlerFromToken} from "azure-devops-node-api";

export interface IClientBase
{
    processResponse<T>(
        res: HttpClientResponse,
        options: RestClientIRequestOptions): Promise<IRestResponse<T>>
}

export class ClientBase implements IClientBase
{
    public readonly OrganizationName:string;
    constructor() {
        this.OrganizationName = AzureService.getOrganizationName();
    }

    public async processResponse<T>(
        res: HttpClientResponse,
        options: RestClientIRequestOptions): Promise<IRestResponse<T>> {
        const statusCode: number = res.message.statusCode;

        const response: IRestResponse<T> = {
            statusCode: statusCode,
            result: null,
        };

        // not found leads to null obj returned
        if (statusCode == HttpCodes.NotFound) return response;

        let obj: any;

        // get the result from the body
        try {
            let contents: string = await res.readBody();
            if (contents && contents.length > 0) {
                if (options && options.deserializeDates) obj = JSON.parse(contents, ClientBase.dateTimeDeserializer);
                else obj = JSON.parse(contents);
                if (options && options.responseProcessor) response.result = options.responseProcessor(obj);
                else response.result = obj;
            }
        }
        catch (err) {
            // Invalid resource (contents not json);  leaving result obj null
        }

        // note that 3xx redirects are handled by the http layer.
        if (statusCode > 299) {
            let msg: string;

            // if exception/error in body, attempt to get better error
            if (obj && obj.message) msg = obj.message;
            else msg = "Failed request: (" + statusCode + ")";

            let err: Error = new Error(msg);

            // attach statusCode and body obj (if available) to the error object
            err['statusCode'] = statusCode;
            if (response.result) err['result'] = response.result;

            throw err;
        } else return response;
    }

    static createRequestHeaders(
        apiVersion?: string):IHeaders
    {
        return {
            accept: ClientBase.createAcceptHeader('application/json', apiVersion),
            ["Content-Type"] : "application/json"
        };
    }

    static createRequestOptions(
        apiVersion?: string):IRequestOptions {
        let options: IRequestOptions = {} as IRequestOptions;
        options.allowRedirects = true;
        options.headers = ClientBase.createRequestHeaders(apiVersion);
        return options;
    }

    static createAcceptHeader = (
        type: string,
        apiVersion?: string): string => type + (apiVersion ? (';api-version=' + apiVersion) : '');

    static createHandlers = () => [getHandlerFromToken(ClientBase.getAuthToken())];

    static getAuthToken():string{
        let auth = getEndpointAuthorization('SYSTEMVSSCONNECTION', false);
        if (auth && auth.scheme === 'OAuth') {
            return auth.parameters['AccessToken'];
        }
        throw new Error("SYSTEMVSSCONNECTION is not valid");
    }

    static dateTimeDeserializer(
        key: any,
        value: any): any {
        if (typeof value === 'string'){
            let a = new Date(value);
            if (!isNaN(a.valueOf())) return a;
        }

        return value;
    }
}