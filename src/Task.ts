import * as tl from 'azure-pipelines-task-lib/task';
import {PackageService} from "./Services/PackageService";
import {AzureService} from "./Services/AzureService";
async function run() {
    try {
        let feedId: string = tl.getInput(
            "feed",
            true);
        tl.debug("Task.run - Feed id:" + feedId);

        let viewId: string = tl.getInput(
            "view",
            true);
        tl.debug("Task.run - View id:" + viewId);

        let packagePath: string = tl.getPathInput(
            "package",
            true,
            false);
        tl.debug("Task.run - Package path:" + packagePath);

        let packageService = new PackageService();
        let feedType = await packageService.getPackageProtocolType(feedId);

        if(!PackageService.isFeedTypeSupported(feedType))
            throw new Error("Feed type:" +feedType+" is not supported");

        const foundPackagePaths: string[] = AzureService.expandPackageWildcardPatterns(packagePath);

        for (let i = 0; i < foundPackagePaths.length; i++) {
            try {
                tl.debug("Task.run - Found package path:" + foundPackagePaths[i] + " " + i + "/" + foundPackagePaths.length+ " packages to promote");

                let packageDetails = packageService.getPackageDetailsFromPath(
                    foundPackagePaths[i],
                    feedType);
                tl.debug("Task.run - Details for:"+foundPackagePaths[i] + JSON.stringify(packageDetails));

                await packageService.promote(
                    feedId,
                    viewId,
                    packageDetails,
                    feedType);
                console.log("Task.run - Successfully promoted packaged: " + packageDetails.name);
            }
            catch (error)
            {
                tl.error("Error occurred while promoting '"+ foundPackagePaths[i] +"' error message:"+error.message)
            }
        }
    }
    catch (error)
    {
        tl.setResult(
            tl.TaskResult.Failed,
            error.message);
    }
}

run();