import { redirect } from "next/navigation";
import { createChat } from "@/lib/chat-repo";

export default async function Home() {
  const chatId = await createChat();
  redirect(`/c/${chatId}`);
}
