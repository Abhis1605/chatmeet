import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { email, name, image } = await req.json();

  await prisma.user.update({
    where: { email },
    data: {
      name,
      image,
    },
  });

  return Response.json({ success: true });
}