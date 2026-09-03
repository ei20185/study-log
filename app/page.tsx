import { StudyLogApp } from "@/app/components/StudyLogApp";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="border-b border-neutral-200 pb-6">
        <p className="text-xs font-medium tracking-[0.2em] text-neutral-500">STUDY LOG</p>
        <h1 className="mt-2 text-3xl font-bold text-neutral-900">学習記録</h1>
        <p className="mt-2 text-sm text-neutral-600">今日やった勉強を書きためるアプリ。</p>
      </header>

      <StudyLogApp />
    </main>
  );
}
