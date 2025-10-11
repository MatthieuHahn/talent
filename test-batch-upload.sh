#!/bin/bash

# Create ZIP file with resumes
cd /Users/matthieuhahn/dev/perso/talent/test-uploads
zip candidate_resumes.zip resume1.txt resume2.txt resume3.txt

echo "📦 Created ZIP file with 3 resumes"
echo "🚀 Testing batch upload API..."

# Test the batch upload endpoint
response=$(curl -s -X POST http://localhost:3001/batch-upload/candidates/resumes \
  -F "file=@candidate_resumes.zip" \
  -F "chunkSize=2" \
  -F "enableAiProcessing=true")

echo "📋 API Response:"
echo "$response" | jq '.' 2>/dev/null || echo "$response"

# Extract upload ID for monitoring
upload_id=$(echo "$response" | jq -r '.id' 2>/dev/null)

if [ "$upload_id" != "null" ] && [ -n "$upload_id" ]; then
    echo ""
    echo "🔍 Monitoring upload progress (ID: $upload_id)..."
    
    # Monitor progress for 30 seconds
    for i in {1..6}; do
        sleep 5
        progress=$(curl -s "http://localhost:3001/batch-upload/$upload_id" | jq '.')
        echo "⏱️  Progress check $i:"
        echo "$progress" | jq '.status, .progress, .processedFiles, .totalFiles' 2>/dev/null || echo "$progress"
        echo ""
    done
else
    echo "❌ Failed to get upload ID"
fi