package pine

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func apiKey() string {
	return os.Getenv("TEST_PINECONE_API_KEY")
}

func TestPicone_CreateIndex(t *testing.T) {
	pi := &PineconeIndex{
		region:    "us-west-2",
		indexName: "test-index",
		dimension: 10,
		apiKey:    apiKey(),
	}
	indexName, _, _ := pi.CreateIndex(context.Background())
	assert.Equal(t, "test-index", indexName)
}

func TestPicone_DeleteIndex(t *testing.T) {
	pi := &PineconeIndex{
		region:    "us-west-2",
		indexName: "test-index",
		dimension: 10,
		apiKey:    apiKey(),
	}
	indexName, _, _ := pi.DeleteIndex(context.Background())
	assert.Equal(t, "test-index", indexName)
}
