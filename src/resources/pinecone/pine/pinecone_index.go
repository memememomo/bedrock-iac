package pine

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/secretsmanager"

	"github.com/aws/aws-lambda-go/cfn"
	"github.com/pinecone-io/go-pinecone/pinecone"
	"github.com/pkg/errors"
)

const (
	Region                 = "region"
	IndexName              = "indexName"
	Dimension              = "dimension"
	ApiKeySecretKey        = "apiKeySecretName"
	IndexEndpointSecretKey = "indexEndpointSecretName"
)

func regionParam(event cfn.Event) (string, error) {
	return cfnEventProperty(event, Region)
}

func indexNameParam(event cfn.Event) (string, error) {
	return cfnEventProperty(event, IndexName)
}

func dimensionParam(event cfn.Event) (int32, error) {
	d, err := cfnEventProperty(event, Dimension)
	if err != nil {
		return 0, errors.WithStack(err)
	}

	df, err := strconv.Atoi(d)
	if err != nil {
		return 0, errors.WithStack(err)
	}

	return int32(df), nil
}

func apiKeySecretKeyParam(event cfn.Event) (string, error) {
	return cfnEventProperty(event, ApiKeySecretKey)
}

func indexEndpointSecretKeyParam(event cfn.Event) (string, error) {
	return cfnEventProperty(event, IndexEndpointSecretKey)
}

func newSecretsManagerClient(ctx context.Context, region string) (*secretsmanager.Client, error) {
	cfg, err := config.LoadDefaultConfig(ctx, config.WithRegion(region))
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return secretsmanager.NewFromConfig(cfg), nil
}

func getApiKey(ctx context.Context, region, apiKeySecretName string) (string, error) {
	svc, err := newSecretsManagerClient(ctx, region)
	if err != nil {
		return "", errors.WithStack(err)
	}

	result, err := svc.GetSecretValue(ctx, &secretsmanager.GetSecretValueInput{
		SecretId:     aws.String(apiKeySecretName),
		VersionStage: aws.String("AWSCURRENT"),
	})
	if err != nil {
		return "", errors.WithStack(err)
	}

	var v map[string]string
	err = json.Unmarshal([]byte(*result.SecretString), &v)
	if err != nil {
		return "", errors.WithStack(err)
	}

	return v["apiKey"], nil
}

func cfnEventProperty(event cfn.Event, propertyName string) (string, error) {
	if val, ok := event.ResourceProperties[propertyName]; ok {
		return val.(string), nil
	}
	return "", fmt.Errorf("missing property %s", propertyName)
}

type PineconeIndex struct {
	region                 string
	indexName              string
	dimension              int32
	apiKey                 string
	indexEndpointSecretKey string
}

func NewPiconeIndex(ctx context.Context, event cfn.Event) (*PineconeIndex, error) {
	region, err := regionParam(event)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	indexName, err := indexNameParam(event)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	dimension, err := dimensionParam(event)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	apiKeySecretName, err := apiKeySecretKeyParam(event)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	apiKey, err := getApiKey(ctx, region, apiKeySecretName)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	indexEndpointSecretKey, err := indexEndpointSecretKeyParam(event)
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return &PineconeIndex{
		region:                 region,
		indexName:              indexName,
		dimension:              dimension,
		apiKey:                 apiKey,
		indexEndpointSecretKey: indexEndpointSecretKey,
	}, nil
}

func (p *PineconeIndex) newClient() (*pinecone.Client, error) {
	client, err := pinecone.NewClient(pinecone.NewClientParams{
		ApiKey: p.apiKey,
	})
	if err != nil {
		return nil, errors.WithStack(err)
	}

	return client, nil
}

func (p *PineconeIndex) DeleteIndex(ctx context.Context) (string, map[string]interface{}, error) {
	client, err := p.newClient()
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	err = client.DeleteIndex(ctx, p.indexName)
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	err = p.deleteIndexEndpoint(ctx)
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	return "PineconeIndex", nil, nil
}

func (p *PineconeIndex) CreateIndex(ctx context.Context) (string, map[string]interface{}, error) {
	client, err := p.newClient()
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	idx, err := client.CreateServerlessIndex(ctx, &pinecone.CreateServerlessIndexRequest{
		Name:      p.indexName,
		Dimension: p.dimension,
		Metric:    pinecone.Cosine,
		Cloud:     pinecone.Aws,
		Region:    p.region,
	})
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	err = p.saveIndexEndpoint(ctx, idx.Host)
	if err != nil {
		return "", nil, errors.WithStack(err)
	}

	return "PineconeIndex", nil, nil
}

func (p *PineconeIndex) saveIndexEndpoint(ctx context.Context, indexEndpoint string) error {
	svc, err := newSecretsManagerClient(ctx, p.region)
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = svc.CreateSecret(ctx, &secretsmanager.CreateSecretInput{
		Name:         aws.String(p.indexEndpointSecretKey),
		SecretString: aws.String(indexEndpoint),
	})
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}

func (p *PineconeIndex) deleteIndexEndpoint(ctx context.Context) error {
	svc, err := newSecretsManagerClient(ctx, p.region)
	if err != nil {
		return errors.WithStack(err)
	}

	_, err = svc.DeleteSecret(ctx, &secretsmanager.DeleteSecretInput{
		SecretId:                   aws.String(p.indexEndpointSecretKey),
		ForceDeleteWithoutRecovery: aws.Bool(true),
	})
	if err != nil {
		return errors.WithStack(err)
	}

	return nil
}
