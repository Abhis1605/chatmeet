import { createUploadthing, type FileRouter } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const f = createUploadthing();

export const uploadRouter = {
  avatarUploader: f({
    image: {
      maxFileSize: "2MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        throw new Error("Unauthorized");
      }
      return { userId: session.user.id };
    })
    .onUploadComplete(async ({ file }) => {
      return {
        url: file.ufsUrl,
        name: file.name,
        size: file.size,
        type: file.type,
      };
    }),

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