import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const uploadRouter = {
  messageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 10,
    },

    video: {
      maxFileSize: '16MB',
      maxFileCount: 5,
    },

    pdf: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },

    text: {
      maxFileSize: "4MB",
      maxFileCount: 5,
    },

    blob: {
      maxFileSize: '4MB',
      maxFileCount: 10,
    },
  }).onUploadComplete(async ({ file }) => {
    console.log("Uploaded:", file.name);

    return {
      url: file.ufsUrl,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }),
} satisfies FileRouter;

export type UploadRouter = typeof uploadRouter;