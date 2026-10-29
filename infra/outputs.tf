output "dynamodb_table_name" {
  description = "Name of the DynamoDB findings table"
  value       = aws_dynamodb_table.findings.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB findings table"
  value       = aws_dynamodb_table.findings.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS encryption key"
  value       = aws_kms_key.dynamodb_key.arn
}

