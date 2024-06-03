import { CdkCustomResourceEvent, CdkCustomResourceResponse, Context } from "aws-lambda";
import { createIndex } from "./opensearch";

const response: CdkCustomResourceResponse = {};

export const handler = async (event: CdkCustomResourceEvent, context: Context): Promise<CdkCustomResourceResponse> => {
  console.info("event: ", event);

  const requestType = event.RequestType;
  const requestProperties = event.ResourceProperties;

  switch (requestType) {
    case "Create":
      console.log("Create");
      await createIndex({
        collectionEndpoint: requestProperties.collectionEndpoint as string,
        indexName: requestProperties.indexName as string,
      });
      response.Status = "SUCCESS";
      response.Reason = "Successfully created the resource";
      break;
    case "Update":
      console.log("Update the resource");
      response.Status = "SUCCESS";
      response.Reason = "Successfully updated the resource";
      break;
    case "Delete":
      console.log("Delete the resource");
      response.Status = "SUCCESS";
      response.Reason = "Successfully deleted the resource";
      break;
    default:
      console.log("Unknown request type");
      response.Status = "FAILED";
      response.Reason = "Unknown request type";
      break;
  }

  response.StackId = event.StackId;
  response.RequestId = event.RequestId;
  response.LogicalResourceId = event.LogicalResourceId;
  response.PhysicalResourceId = context.logGroupName;

  console.log(`Response: ${JSON.stringify(response)}`);
  return response;
};
