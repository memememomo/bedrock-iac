package main

import (
	"context"
	"fmt"
	"pine/pine"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/pkg/errors"
)

func handler(ctx context.Context, event cfn.Event) (physicalID string, data map[string]interface{}, err error) {
	p, err := pine.NewPiconeIndex(ctx, event)
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	switch event.RequestType {
	case "Create":
		return p.CreateIndex(ctx)
	case "Delete":
		return p.DeleteIndex(ctx)
	default:
		err = fmt.Errorf("unknown request type %s", event.RequestType)
	}
	return
}

func main() {
	lambda.Start(cfn.LambdaWrap(handler))
}
