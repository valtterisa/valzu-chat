import Chat from "@/components/chat";

export default function Home() {
  return (
    <div className="flex h-screen w-full justify-center overflow-hidden bg-zinc-50 font-sans dark:bg-black">
      <main className="flex h-full w-full max-w-3xl flex-col overflow-hidden bg-white dark:bg-zinc-950">
        <Chat />
      </main>
    </div>
  );
}
