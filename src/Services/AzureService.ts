import * as tl from 'azure-pipelines-task-lib/task';

export class AzureService
{
    /**
     * Retrieve the organisation name.
     */
    static getOrganizationName() : string {
        let teamFoundationServerUri:string = tl.getVariable("SYSTEM_TEAMFOUNDATIONCOLLECTIONURI");
        tl.debug("NpmArtifactApi.getOrganizationName - teamFoundationServerUri:"+teamFoundationServerUri);

        if(teamFoundationServerUri == null || teamFoundationServerUri.trim() == "")
            throw new Error ("SYSTEM_TEAMFOUNDATIONCOLLECTIONURI is not set");

        let regexGroup: RegExpMatchArray;

        if(teamFoundationServerUri.includes('dev.azure.com'))
            regexGroup = teamFoundationServerUri.match(/(?:http[s]*:\/\/)(?:.*)(?:\/)(.*)(?:\/)/);
        else if(teamFoundationServerUri.includes('visualstudio.com'))
            regexGroup = teamFoundationServerUri.match(/(?:http[s]*:\/\/)(.[^.]*)(?:.*)/);
        else
            throw new Error("On premise not supported.");

        if(regexGroup == null || regexGroup.length != 2)
            throw new Error("Organization name could not be found.");

        console.log(`AzureService.getOrganizationName - organisationName: ${regexGroup[1]}`);

        return regexGroup[1];
    }

    static expandPackageWildcardPatterns(packagePattern: string): string[] {
        const matchedSolutionFiles = tl.findMatch(
            null,
            packagePattern,
            {
                followSymbolicLinks: false,
                followSpecifiedSymbolicLink: false,
                allowBrokenSymbolicLinks : true
            });
        tl.debug(`AzureService.expandPackageWildcardPatterns - Found ${matchedSolutionFiles.length} solution files matching the pattern.`);

        if (matchedSolutionFiles.length > 0) return matchedSolutionFiles;
        else throw tl.loc('PackageDoesNotExist', packagePattern);
    }
}