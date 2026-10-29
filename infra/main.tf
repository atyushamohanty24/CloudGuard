resource "aws_kms_key" "dynamodb_key" {
  description             = "KMS Key for CloudGuard DynamoDB findings table"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Environment = var.environment
    Project     = "CloudGuard"
  }
}

resource "aws_dynamodb_table" "findings" {
  name         = "cloudguard_findings"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_key.arn
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "category"
    type = "S"
  }

  attribute {
    name = "severity"
    type = "S"
  }

  global_secondary_index {
    name            = "CategoryIndex"
    hash_key        = "category"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "SeverityIndex"
    hash_key        = "severity"
    projection_type = "ALL"
  }

  tags = {
    Environment = var.environment
    Project     = "CloudGuard"
  }
}

