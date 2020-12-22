interface ECRImageDetails {
  registryId: string;
  repositoryName: string;
  imageDigest: string;
  imageTags: string[];
  imageSizeInBytes: number;
  imagePushedAt: string;
  imageManifestMediaType: string;
  artifactMediaType: string;
}

export type ECRImagesDetails = {
  imageDetails: ECRImageDetails[];
};
