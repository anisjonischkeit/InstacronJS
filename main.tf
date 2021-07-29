provider "aws" {
  region = "ap-southeast-2"
}

# IAM

resource "aws_iam_role" "instacron_exec_role" {
  name        = "instacron_exec"
  path        = "/"
  description = "Allows Lambda Function to call AWS services on your behalf."

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "iam_role_policy_attachment_lambda_basic_execution" {
  role       = aws_iam_role.instacron_exec_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda

resource "aws_lambda_function" "instacron" {
  filename = "instacronjs.zip"
  function_name = "instaCron"
  role = aws_iam_role.instacron_exec_role.arn
  handler = "lambda.handler"
  runtime = "nodejs14.x"
  timeout = 90
  source_code_hash = filebase64sha256("instacronjs.zip")
  memory_size = 512

  environment {
    variables = {
      DROPBOX_TOKEN = var.dropbox_token
      IG_USERNAME = var.ig_username
      IG_PASSWORD = var.ig_password
    }
  }

  depends_on = [
    # aws_iam_role_policy_attachment.lambda_logs,
    aws_cloudwatch_log_group.instacron,
  ]

}

# Cloudwatch 

resource "aws_cloudwatch_event_rule" "every_day" {
  name = "every-day"
  description = "Fires every day"
  schedule_expression = "rate(1 day)"
}

resource "aws_cloudwatch_event_target" "instacron_every_day" {
  rule = "${aws_cloudwatch_event_rule.every_day.name}"
  target_id = "instacron"
  arn = "${aws_lambda_function.instacron.arn}"
}

resource "aws_lambda_permission" "allow_cloudwatch_to_call_instacron" {
  statement_id = "AllowExecutionFromCloudWatch"
  action = "lambda:InvokeFunction"
  function_name = "${aws_lambda_function.instacron.function_name}"
  principal = "events.amazonaws.com"
  source_arn = "${aws_cloudwatch_event_rule.every_day.arn}"
}

resource "aws_cloudwatch_log_group" "instacron" {
  name              = "/aws/lambda/instaCron"
  retention_in_days = 14
}