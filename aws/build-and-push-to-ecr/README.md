# Build and Push to ECR

Build and push a docker image to ECR using cache from previous latest build.
It will skip pushing new tag version if the current build is equal to the :latest build on ECR.

See [action.yml](./action.yml) for the list of `inputs` and `outputs`.

## Example usage

```yaml
steps:
  - name: Checkout
    uses: actions/checkout@v2

  - name: Configure AWS credentials
    uses: aws-actions/configure-aws-credentials@v1
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: ${{ env.AWS_REGION }}

  - name: Login to Amazon ECR
    id: login-ecr
    uses: aws-actions/amazon-ecr-login@v1

  - name: Build and push nginx image to Amazon ECR
    id: app-image
    run: agendrix/actions/aws/build-and-push-to-ecr@master
    env:
      ecr_registry: ${{ steps.login-ecr.outputs.registry }}
      image: "namespace/my-image"
      tag: ${{ env.GITHUB_SHA }}
      path: "docker/my-image"

outputs:
  app_image: ${{ steps.app-image.outputs.image }}
  app_tag: ${{ steps.app-image.outputs.tag }}
```
