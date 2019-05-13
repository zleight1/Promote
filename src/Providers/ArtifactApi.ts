import * as tl from 'azure-pipelines-task-lib/task';
import {ClientBase} from "./ClientBase";
import {IHeaders, IRequestHandler, IRequestOptions} from "typed-rest-client/Interfaces";
import {RestClient} from "typed-rest-client/RestClient";
import {ArtifactResponse, Operation, RequestBody} from "../Interfaces/ArtifactInterfaces";
import {PackageDetails} from "../Interfaces/PackageDetails";
import {HttpClient} from "typed-rest-client/HttpClient";

export interface IArtifactApi
{
    getPackages(
        feedId:string
    ) : Promise<ArtifactResponse>

    updatePackageVersion(
        feedId:string,
        viewId:string,
        packageDetails:PackageDetails,
        protocolType:string):Promise<void>;
}

export class ArtifactApi extends ClientBase implements IArtifactApi
{
    constructor()
    {
        super();
    }

    public async getPackages(feedId: string): Promise<ArtifactResponse>
    {
        const apiVersion = "5.0-preview.1";

        const options:IRequestOptions = ClientBase.createRequestOptions(apiVersion);
        tl.debug("ArtifactApi.getPackages - options:" + JSON.stringify(options));

        const handlers:IRequestHandler[] = ClientBase.createHandlers();

        const restClient = new RestClient(
            "haplo-promote",
            "https://feeds.dev.azure.com",
            handlers,
            options);

        const pathAndQuery = `/${this.OrganizationName}/_apis/packaging/Feeds/${feedId}/packages?api-version=${apiVersion}`;
        tl.debug("ArtifactApi.getPackages - url:https://feeds.dev.azure.com" + pathAndQuery);

        const response = await restClient.get<ArtifactResponse>(pathAndQuery);
        tl.debug("ArtifactApi.getPackages - Artifact Response:" + JSON.stringify(response));

        return response.result;
    }

    public async updatePackageVersion(
        feedId:string,
        viewId:string,
        packageDetails:PackageDetails,
        protocolType:string): Promise<void> 
    {   
        const apiVersion = "5.0-preview.1";

        const options: IHeaders = ClientBase.createRequestOptions(apiVersion);
        tl.debug("ArtifactApi.updatePackageVersion - options:" + JSON.stringify(options));

        const handlers: IRequestHandler[] = ClientBase.createHandlers();

        const httpClient = new HttpClient(
            "haplo-promote",
            handlers,
            options);

        const requestData = ArtifactApi.createAddRequestBody(viewId);
        tl.debug("ArtifactApi.updatePackageVersion - requestData:" + JSON.stringify(requestData));

        const headers = ClientBase.createRequestHeaders(apiVersion);
        tl.debug("ArtifactApi.updatePackageVersion - headers:" + JSON.stringify(headers));

        const response = await httpClient.patch(
            `https://pkgs.dev.azure.com/${this.OrganizationName}/_apis/packaging/feeds/${feedId}/${protocolType}/packages/${packageDetails.name}/versions/${packageDetails.version}?api-version=${apiVersion}`,
            JSON.stringify(requestData),
            headers);

        const packageResponse = await this.processResponse<void>(response, null);
        tl.debug("ArtifactApi.updatePackageVersion - packageResponse:" + JSON.stringify(packageResponse));

        if(packageResponse.statusCode > 299)
            throw new Error(`Unsuccessful request, status code:${packageResponse.statusCode}`);

        return packageResponse.result;
    }

    static createAddRequestBody (viewId: string): RequestBody
    {
        return {
            views:{
                op: Operation.add,
                path: "/views/-",
                value: viewId,
                from: null
            },
            listed: null
        };
    }
}