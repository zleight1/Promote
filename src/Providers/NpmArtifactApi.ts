import {ClientBase} from "./ClientBase";
import * as tl from 'azure-pipelines-task-lib/task';
import {IHeaders, IRequestHandler} from "typed-rest-client/Interfaces";
import {PackageDetails} from "../Interfaces/PackageDetails";
import {HttpClient} from "typed-rest-client/HttpClient";
import {ArtifactApi} from "./ArtifactApi";

export interface INpmArtifactApi
{
    updatePackageVersion(
        feedId:string,
        viewId:string,
        packageDetails:PackageDetails,
        protocolType:string):Promise<void>;
}

export class NpmArtifactApi extends ClientBase implements INpmArtifactApi
{
    public async updatePackageVersion(
        feedId:string,
        viewId:string,
        packageDetails:PackageDetails,
        protocolType:string): Promise<void> 
    {
        const apiVersion = "5.0-preview.1";

        const options: IHeaders = ClientBase.createRequestOptions(apiVersion);
        tl.debug("NpmArtifactApi.updatePackageVersion - options:" + JSON.stringify(options));

        const handlers: IRequestHandler[] = ClientBase.createHandlers();

        const httpClient = new HttpClient(
            "haplo-promote",
            handlers,
            options);

        const requestData = ArtifactApi.createAddRequestBody(viewId);
        tl.debug("NpmArtifactApi.updatePackageVersion - requestData:" + JSON.stringify(requestData));

        const headers = ClientBase.createRequestHeaders(apiVersion);
        tl.debug("NpmArtifactApi.updatePackageVersion - headers:" + JSON.stringify(headers));

        const response = await httpClient.patch(
            `https://pkgs.dev.azure.com/${this.OrganizationName}/_apis/packaging/feeds/${feedId}/${protocolType}/${packageDetails.name}/versions/${packageDetails.version}?api-version=${apiVersion}`,
            JSON.stringify(requestData),
            headers);

        const packageResponse = await this.processResponse<void>(
            response,
            null);
        tl.debug("NpmArtifactApi.updatePackageVersion - packageResponse:" + JSON.stringify(packageResponse));

        if(packageResponse.statusCode > 299)
            throw new Error(`Unsuccessful request, status code:${packageResponse.statusCode}`);

        return packageResponse.result;
    }
}