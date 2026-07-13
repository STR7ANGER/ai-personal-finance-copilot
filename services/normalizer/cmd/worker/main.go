package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/STR7ANGER/ai-personal-finance-copilot/services/normalizer/internal/normalize"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"github.com/redis/go-redis/v9"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

type job struct {
	ImportID  string `json:"importId"`
	UserID    string `json:"userId"`
	ObjectKey string `json:"objectKey"`
}

func main() {
	if err := run(context.Background()); err != nil {
		log.Fatal(err)
	}
}

func run(ctx context.Context) error {
	required := []string{"DATABASE_URL", "MONGODB_URI", "REDIS_URL", "S3_ENDPOINT", "S3_BUCKET", "S3_ACCESS_KEY", "S3_SECRET_KEY"}
	for _, key := range required {
		if os.Getenv(key) == "" {
			return fmt.Errorf("missing %s", key)
		}
	}
	redisClient := redis.NewClient(&redis.Options{Addr: os.Getenv("REDIS_URL")})
	defer redisClient.Close()
	postgres, err := pgxpool.New(ctx, os.Getenv("DATABASE_URL"))
	if err != nil {
		return err
	}
	defer postgres.Close()
	mongoClient, err := mongo.Connect(ctx, options.Client().ApplyURI(os.Getenv("MONGODB_URI")))
	if err != nil {
		return err
	}
	defer mongoClient.Disconnect(ctx)
	minioClient, err := minio.New(os.Getenv("S3_ENDPOINT"), &minio.Options{Creds: credentials.NewStaticV4(os.Getenv("S3_ACCESS_KEY"), os.Getenv("S3_SECRET_KEY"), ""), Secure: os.Getenv("S3_SECURE") == "true"})
	if err != nil {
		return err
	}
	for {
		result, popErr := redisClient.BRPop(ctx, 5*time.Second, "finance:imports").Result()
		if popErr == redis.Nil {
			if os.Getenv("RUN_ONCE") == "true" {
				return nil
			}
			continue
		}
		if popErr != nil {
			return popErr
		}
		var next job
		if err := json.Unmarshal([]byte(result[1]), &next); err != nil {
			log.Printf("invalid job: %v", err)
			continue
		}
		if err := process(ctx, next, minioClient, mongoClient, postgres); err != nil {
			log.Printf("import %s failed: %v", next.ImportID, err)
		}
		if os.Getenv("RUN_ONCE") == "true" {
			return nil
		}
	}
}

func process(ctx context.Context, next job, storage *minio.Client, documents *mongo.Client, postgres *pgxpool.Pool) error {
	_, _ = postgres.Exec(ctx, `UPDATE "StatementImport" SET status='PROCESSING', "startedAt"=NOW() WHERE id=$1 AND status='QUEUED'`, next.ImportID)
	object, err := storage.GetObject(ctx, os.Getenv("S3_BUCKET"), next.ObjectKey, minio.GetObjectOptions{})
	if err != nil {
		return fail(ctx, postgres, next.ImportID, err)
	}
	defer object.Close()
	rows, err := normalize.CSV(object)
	if err != nil {
		return fail(ctx, postgres, next.ImportID, err)
	}
	collection := documents.Database("finance_copilot").Collection("raw_transactions")
	payload := make([]interface{}, 0, len(rows))
	for _, row := range rows {
		payload = append(payload, bson.M{"importId": next.ImportID, "userId": next.UserID, "row": row, "ingestedAt": time.Now().UTC()})
	}
	if len(payload) > 0 {
		if _, err = collection.InsertMany(ctx, payload); err != nil {
			return fail(ctx, postgres, next.ImportID, err)
		}
	}
	_, err = postgres.Exec(ctx, `UPDATE "StatementImport" SET status='COMPLETED', "rowCount"=$2, "completedAt"=NOW() WHERE id=$1`, next.ImportID, len(rows))
	return err
}

func fail(ctx context.Context, postgres *pgxpool.Pool, id string, cause error) error {
	_, _ = postgres.Exec(ctx, `UPDATE "StatementImport" SET status='FAILED', "failureReason"=$2, "completedAt"=NOW() WHERE id=$1`, id, cause.Error())
	return cause
}
